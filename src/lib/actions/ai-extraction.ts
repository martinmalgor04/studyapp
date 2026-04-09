'use server';

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { getAIProvider } from '@/lib/services/ai/factory';
import {
  getExtractionSystemPrompt,
  getExtractionUserPrompt,
} from '@/lib/services/ai/extraction-prompt';
import { processExtractionResult } from '@/lib/services/ai/extraction-processor';
import type {
  ProcessedExtraction,
  NormalizedScheduleEntry,
} from '@/lib/services/ai/extraction-processor';
import {
  groupTopics,
  groupTopicsWithAI,
} from '@/lib/services/ai/topic-grouper';
import type {
  GroupedTopic,
  GroupTopicsWithAIResult,
  TopicGroupingInput,
} from '@/lib/services/ai/topic-grouper';
import {
  countClassSessionsBetween,
  allocateTopicCountPerUnit,
} from '@/lib/services/cursada-class-budget';
import { normalizeExamDateToIso } from '@/lib/utils/exam-date-normalize';
import type { SubjectMetadata, ExtractedExam } from '@/lib/services/ai/types';
import type { Json } from '@/types/database.types';

export type ProcessPDFCursadaContext = {
  studyPath: 'CURSANDO' | 'LIBRE';
  schedule?: Array<{ day: string; startTime: string; endTime: string }>;
  parciales?: Array<{ date: string }>;
};

function buildTopicGroupingInput(
  processed: ProcessedExtraction,
  cursadaContext?: ProcessPDFCursadaContext,
): TopicGroupingInput {
  const base: TopicGroupingInput = {
    units: processed.units,
    estimatedDifficulty: processed.estimatedDifficulty,
    totalEstimatedHours: processed.totalEstimatedHours,
  };

  if (!cursadaContext) {
    return base;
  }

  if (cursadaContext.studyPath === 'LIBRE') {
    base.freeStudyMaxTopicsPerUnit = 5;
    return base;
  }

  const { schedule, parciales } = cursadaContext;
  if (!schedule?.length || !parciales?.length) {
    return base;
  }

  const isoDates = parciales
    .map((p) => normalizeExamDateToIso(p.date.trim()))
    .filter((x): x is string => x != null)
    .sort();

  if (isoDates.length === 0) {
    return base;
  }

  const firstParcialDay = isoDates[0]!;
  const rangeStart = new Date();
  rangeStart.setUTCHours(0, 0, 0, 0);
  const rangeEndExclusive = new Date(`${firstParcialDay}T00:00:00.000Z`);

  const K = countClassSessionsBetween(schedule, rangeStart, rangeEndExclusive);
  if (K <= 0) {
    return base;
  }

  const parcialExams = (processed.exams ?? []).filter(
    (e) => e.type === 'PARCIAL' || e.type === 'RECUPERATORIO',
  );
  const byDate = [...parcialExams].sort((a, b) => {
    const da = normalizeExamDateToIso(a.date?.trim() ?? '') ?? '9999-12-31';
    const db = normalizeExamDateToIso(b.date?.trim() ?? '') ?? '9999-12-31';
    return da.localeCompare(db);
  });
  const anchorExam = byDate.find((e) => e.type === 'PARCIAL') ?? byDate[0];

  const scoped = new Set<number>();
  if (anchorExam?.unitsIncluded?.length) {
    anchorExam.unitsIncluded.forEach((u) => scoped.add(u));
  } else {
    processed.units.forEach((u) => scoped.add(u.number));
  }

  const unitsInScope = processed.units.filter((u) => scoped.has(u.number));
  if (unitsInScope.length === 0) {
    base.freeStudyMaxTopicsPerUnit = 5;
    return base;
  }

  const weights = new Map(
    unitsInScope.map((u) => [u.number, Math.max(1, u.subtopics.length)]),
  );
  const subCounts = new Map(
    unitsInScope.map((u) => [u.number, Math.max(1, u.subtopics.length)]),
  );

  base.targetTopicsPerUnit = allocateTopicCountPerUnit(
    unitsInScope.map((u) => u.number).sort((a, b) => a - b),
    weights,
    subCounts,
    K,
  );
  base.firstParcialScopedUnits = scoped;
  base.outOfScopeMaxTopicsPerUnit = 4;
  return base;
}

const BUCKET_NAME = 'program-pdfs';

/** Alineado con `DEFAULT_TIMEOUT_MS` en proveedores OpenAI/Google. */
const DEFAULT_AI_TIMEOUT_MS = 60_000;

const FRIENDLY_ERROR =
  'No pudimos procesar el PDF. ¿Es un documento escaneado? Intentá con otro archivo o ingresá los datos manualmente.';

type ProcessPDFResult = {
  error?: string;
  data?: {
    metadata: SubjectMetadata;
    groupedTopics: GroupedTopic[];
    schedule?: NormalizedScheduleEntry[];
    exams?: ExtractedExam[];
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    documentType: string;
    tokensUsed?: number;
    processingTimeMs: number;
  };
};

export async function processPDF(
  extractionId: string,
  cursadaContext?: ProcessPDFCursadaContext,
): Promise<ProcessPDFResult> {
  if (!extractionId) {
    return { error: 'ID de extracción no proporcionado' };
  }

  const startTime = performance.now();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'No autenticado' };
  }

  const { data: extraction, error: fetchError } = await supabase
    .from('ai_extractions')
    .select('id, file_url, file_name, status, user_id')
    .eq('id', extractionId)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !extraction) {
    logger.error(
      'processPDF: extracción no encontrada o sin permisos',
      fetchError?.message,
    );
    return { error: 'Extracción no encontrada' };
  }

  if (extraction.status !== 'PENDING') {
    return { error: 'Esta extracción ya fue procesada o está en proceso' };
  }

  await supabase
    .from('ai_extractions')
    .update({ status: 'PROCESSING' })
    .eq('id', extractionId)
    .eq('user_id', user.id);

  try {
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(BUCKET_NAME)
      .download(extraction.file_url);

    if (downloadError || !fileData) {
      logger.error(
        'processPDF: error descargando PDF de Storage',
        downloadError?.message,
      );
      await markFailed(supabase, extractionId, user.id, 'Error descargando archivo', {
        phase: 'extraction',
        provider: 'supabase_storage',
        category: 'unknown',
      });
      return { error: 'Error al descargar el archivo. Intentá subirlo de nuevo.' };
    }

    const buffer = Buffer.from(await fileData.arrayBuffer());

    let provider;
    try {
      provider = getAIProvider();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Provider IA no disponible';
      logger.error('processPDF: error obteniendo AI provider', msg);
      await markFailed(supabase, extractionId, user.id, msg, {
        phase: 'extraction',
        provider: 'config',
        category: 'unknown',
      });
      return { error: 'Servicio de IA no disponible. Contactá al administrador.' };
    }

    const systemPrompt = getExtractionSystemPrompt();
    const userPrompt = getExtractionUserPrompt();

    const extractionRaceMs = getPdfExtractionRaceTimeoutMs(provider.name);

    const rawResult = await Promise.race([
      provider.extractFromPDF(buffer, 'application/pdf', systemPrompt, userPrompt),
      rejectAfterTimeout(extractionRaceMs),
    ]);

    if (!rawResult.success || !rawResult.data) {
      const errorMsg = rawResult.error ?? 'La IA no devolvió resultados';
      logger.error('processPDF: extracción IA fallida', errorMsg);
      await markFailed(
        supabase,
        extractionId,
        user.id,
        errorMsg,
        rawResult.errorDetail ??
          {
            phase: 'extraction',
            provider: provider.name,
            category: 'unknown',
            model: rawResult.model,
          },
      );
      return { error: FRIENDLY_ERROR };
    }

    const processedResult = processExtractionResult(rawResult.data);

    const groupingInput = buildTopicGroupingInput(
      processedResult,
      cursadaContext,
    );

    let groupingResult: GroupTopicsWithAIResult;
    try {
      groupingResult = await groupTopicsWithAI(groupingInput, provider);
    } catch (err) {
      logger.warn(
        'processPDF: groupTopicsWithAI falló, usando groupTopics determinista',
        err,
      );
      groupingResult = {
        topics: groupTopics(groupingInput),
        usedAI: false,
      };
    }
    const { topics: groupedTopics, usedAI: groupingUsedAI } = groupingResult;

    const processingTimeMs = Math.round(performance.now() - startTime);

    await supabase
      .from('ai_extractions')
      .update({
        status: 'SUCCESS',
        raw_response: toJson(rawResult),
        processed_result: toJson(serializeProcessedResult(processedResult)),
        model_used: rawResult.model ?? null,
        provider: provider.name,
        tokens_used: rawResult.tokensUsed ?? null,
        processing_time_ms: processingTimeMs,
        grouping_used_ai: groupingUsedAI,
        error_detail: null,
      })
      .eq('id', extractionId)
      .eq('user_id', user.id);

    return {
      data: {
        metadata: processedResult.subjectMetadata,
        groupedTopics,
        schedule: processedResult.normalizedSchedule,
        exams: processedResult.exams,
        confidence: processedResult.confidence,
        documentType: processedResult.documentType,
        tokensUsed: rawResult.tokensUsed,
        processingTimeMs,
      },
    };
  } catch (err) {
    const isTimeout =
      err instanceof Error && err.message === 'PROCESSING_TIMEOUT';
    const errorMsg = isTimeout
      ? 'Timeout procesando el PDF'
      : err instanceof Error
        ? err.message
        : 'Error desconocido';

    logger.error('processPDF: error inesperado', errorMsg);
    await markFailed(supabase, extractionId, user.id, errorMsg, {
      phase: 'extraction',
      provider: 'app',
      category: isTimeout ? 'timeout' : 'unknown',
    });

    return {
      error: isTimeout
        ? 'El procesamiento tardó demasiado. Intentá con un archivo más pequeño.'
        : FRIENDLY_ERROR,
    };
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function markFailed(
  supabase: Awaited<ReturnType<typeof createClient>>,
  extractionId: string,
  userId: string,
  errorMessage: string,
  errorDetail?: unknown,
): Promise<void> {
  const { error } = await supabase
    .from('ai_extractions')
    .update({
      status: 'FAILED',
      error_message: errorMessage,
      error_detail: errorDetail != null ? toJson(errorDetail) : null,
    })
    .eq('id', extractionId)
    .eq('user_id', userId);

  if (error) {
    logger.error('processPDF/markFailed: error actualizando status', error.message);
  }
}

function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}

function rejectAfterTimeout(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('PROCESSING_TIMEOUT')), ms);
  });
}

/**
 * Tiempo máximo para `Promise.race` de la extracción PDF.
 * Si hay `AI_FALLBACK_MODEL` distinto del primario (misma lógica que OpenAI/Google),
 * el proveedor encadena dos intentos en serie → el presupuesto es 2× `AI_TIMEOUT_MS`.
 * Override opcional: `AI_EXTRACTION_RACE_MS` (ms, >0).
 */
function getPdfExtractionRaceTimeoutMs(providerName: string): number {
  const overrideRaw = process.env.AI_EXTRACTION_RACE_MS?.trim();
  if (overrideRaw) {
    const parsed = Number(overrideRaw);
    if (Number.isFinite(parsed) && parsed > 0) {
      return Math.floor(parsed);
    }
  }

  const perAttempt = Number(process.env.AI_TIMEOUT_MS) || DEFAULT_AI_TIMEOUT_MS;

  if (providerName !== 'openai' && providerName !== 'google') {
    return perAttempt;
  }

  const primaryModel =
    process.env.AI_MODEL ||
    (providerName === 'google' ? 'gemini-2.0-flash' : 'gpt-4o-mini');
  const fallbackRaw = process.env.AI_FALLBACK_MODEL?.trim();
  const hasDistinctFallback = Boolean(
    fallbackRaw && fallbackRaw !== primaryModel,
  );

  return perAttempt * (hasDistinctFallback ? 2 : 1);
}

/**
 * Serializa ProcessedExtraction para guardarlo en JSONB.
 * Convierte `estimatedDifficulty` (Map) → objeto plano.
 */
function serializeProcessedResult(
  result: ProcessedExtraction,
): Record<string, unknown> {
  const { estimatedDifficulty, ...rest } = result;

  return {
    ...rest,
    estimatedDifficulty: Object.fromEntries(estimatedDifficulty),
  };
}
