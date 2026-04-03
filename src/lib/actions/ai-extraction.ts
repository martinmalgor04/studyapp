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
import { groupTopics } from '@/lib/services/ai/topic-grouper';
import type { GroupedTopic } from '@/lib/services/ai/topic-grouper';
import type { SubjectMetadata, ExtractedExam } from '@/lib/services/ai/types';
import type { Json } from '@/types/database.types';

const BUCKET_NAME = 'program-pdfs';
const PROCESSING_TIMEOUT_MS = 60_000;

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
      await markFailed(supabase, extractionId, user.id, 'Error descargando archivo');
      return { error: 'Error al descargar el archivo. Intentá subirlo de nuevo.' };
    }

    const buffer = Buffer.from(await fileData.arrayBuffer());

    let provider;
    try {
      provider = getAIProvider();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Provider IA no disponible';
      logger.error('processPDF: error obteniendo AI provider', msg);
      await markFailed(supabase, extractionId, user.id, msg);
      return { error: 'Servicio de IA no disponible. Contactá al administrador.' };
    }

    const systemPrompt = getExtractionSystemPrompt();
    const userPrompt = getExtractionUserPrompt();

    const rawResult = await Promise.race([
      provider.extractFromPDF(buffer, 'application/pdf', systemPrompt, userPrompt),
      rejectAfterTimeout(PROCESSING_TIMEOUT_MS),
    ]);

    if (!rawResult.success || !rawResult.data) {
      const errorMsg = rawResult.error ?? 'La IA no devolvió resultados';
      logger.error('processPDF: extracción IA fallida', errorMsg);
      await markFailed(supabase, extractionId, user.id, errorMsg);
      return { error: FRIENDLY_ERROR };
    }

    const processedResult = processExtractionResult(rawResult.data);

    const groupedTopics = groupTopics({
      units: processedResult.units,
      estimatedDifficulty: processedResult.estimatedDifficulty,
      totalEstimatedHours: processedResult.totalEstimatedHours,
    });

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
    await markFailed(supabase, extractionId, user.id, errorMsg);

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
): Promise<void> {
  const { error } = await supabase
    .from('ai_extractions')
    .update({ status: 'FAILED', error_message: errorMessage })
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
