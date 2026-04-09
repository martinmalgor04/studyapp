// ---------------------------------------------------------------------------
// Topic Grouper — Agrupa unidades extraídas en topics de estudio de 45-120 min
// Dos estrategias: determinista local (groupTopics) y asistida por IA (groupTopicsWithAI)
// ---------------------------------------------------------------------------

import { logger } from '@/lib/utils/logger';
import type {
  AIExtractionErrorDetail,
  ExtractedUnit,
  AIProvider,
} from './types';
import type { Difficulty } from '@/lib/validations/topics';

const ERROR_DETAIL_LOG_MAX = 200;
const DEBUG_PROMPT_PREVIEW = 300;

function truncateForLog(text: string | undefined, maxLen: number): string {
  if (text === undefined || text === '') return '';
  return text.length <= maxLen ? text : `${text.slice(0, maxLen)}…`;
}

function summarizeErrorDetail(
  detail: AIExtractionErrorDetail | undefined,
): string {
  if (!detail) return '';
  try {
    const s = JSON.stringify(detail);
    return truncateForLog(s, ERROR_DETAIL_LOG_MAX);
  } catch {
    return '(detail no serializable)';
  }
}

/** Motivo cuando no hay topics tras parsear la respuesta del modelo (para logs). */
type ParseEmptyReason =
  | 'json_parse_error'
  | 'empty_array'
  | 'no_array_in_payload'
  | 'unsupported_payload_shape'
  | 'all_items_filtered_invalid';

const isTopicGrouperDebug =
  process.env.AI_TOPIC_GROUPER_DEBUG === 'true';

// ---------------------------------------------------------------------------
// Exported Types
// ---------------------------------------------------------------------------

export interface TopicGroupingInput {
  units: ExtractedUnit[];
  estimatedDifficulty: Map<number, Difficulty>;
  totalEstimatedHours: number;
  /**
   * Cursada: cantidad objetivo de temas por unidad (p. ej. alineada a clases hasta el 1er parcial).
   */
  targetTopicsPerUnit?: Map<number, number>;
  /** Unidades no incluidas en el 1er parcial: tope de temas por unidad (merge más agresivo). */
  outOfScopeMaxTopicsPerUnit?: number;
  /** Estudio libre: tope duro de temas por unidad. */
  freeStudyMaxTopicsPerUnit?: number;
  /** Unidades del 1er parcial (re-examen del PDF). Fuera de este set → outOfScopeMaxTopicsPerUnit. */
  firstParcialScopedUnits?: Set<number>;
}

export interface GroupedTopic {
  name: string;
  unitNumber: number;
  subtopics: string[];
  estimatedMinutes: number;
  difficulty: Difficulty;
  order: number;
}

export interface GroupTopicsWithAIResult {
  topics: GroupedTopic[];
  /** true solo si todas las unidades “pesadas” (>2 subtemas) obtuvieron grupos vía IA. */
  usedAI: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Rango por tema de estudio (minutos); sesiones R1..R4 se derivan con factores aparte. */
const MIN_MINUTES = 30;
const MAX_MINUTES = 150;
const TARGET_MINUTES = 105;
const HOURS_PER_SUBTOPIC_FALLBACK = 1.5;
const MAX_NAME_LENGTH = 120;

// ---------------------------------------------------------------------------
// groupTopics — Agrupación determinista local
// ---------------------------------------------------------------------------

export function groupTopics(input: TopicGroupingInput): GroupedTopic[] {
  const { units, estimatedDifficulty } = input;

  if (units.length === 0) {
    logger.warn('[TopicGrouper] No hay unidades para agrupar');
    return [];
  }

  const rawTopics: GroupedTopic[] = [];
  let order = 1;

  for (const unit of units) {
    const difficulty = estimatedDifficulty.get(unit.number) ?? 'MEDIUM';
    const scoped = input.firstParcialScopedUnits;
    const inScope = !scoped || scoped.has(unit.number);
    const forced = inScope ? input.targetTopicsPerUnit?.get(unit.number) : undefined;
    let maxChunk: number | undefined;
    if (forced === undefined) {
      if (input.freeStudyMaxTopicsPerUnit !== undefined) {
        maxChunk = input.freeStudyMaxTopicsPerUnit;
      } else if (!inScope && input.outOfScopeMaxTopicsPerUnit !== undefined) {
        maxChunk = input.outOfScopeMaxTopicsPerUnit;
      }
    }
    const unitTopics = groupSingleUnit(unit, difficulty, order, {
      forcedChunkCount: forced,
      maxChunkCount: maxChunk,
    });
    rawTopics.push(...unitTopics);
    order += unitTopics.length;
  }

  return consolidateTopics(rawTopics);
}

// ---------------------------------------------------------------------------
// groupTopicsWithAI — Agrupación asistida por IA con fallback determinista
//
// Usa AIProvider.extractFromPDF como mecanismo provisional (buffer JSON).
// Cuando el interface se extienda con un método `complete`, se actualizará.
// Si la IA falla, hace fallback transparente a groupTopics.
// ---------------------------------------------------------------------------

export async function groupTopicsWithAI(
  input: TopicGroupingInput,
  provider: AIProvider,
): Promise<GroupTopicsWithAIResult> {
  try {
    logger.info(
      `[TopicGrouper] Intentando agrupación con IA (${provider.name})`,
    );

    const allGrouped: GroupedTopic[] = [];
    let order = 1;
    let anyHeavyUnit = false;
    let allHeavyUsedAI = true;

    const heavyUnitsTotal = input.units.filter(
      (u) => u.subtopics.length > 2,
    ).length;
    let heavyUnitIndex = 0;

    for (const unit of input.units) {
      const difficulty =
        input.estimatedDifficulty.get(unit.number) ?? 'MEDIUM';

      const scoped = input.firstParcialScopedUnits;
      const inScope = !scoped || scoped.has(unit.number);
      const forced = inScope ? input.targetTopicsPerUnit?.get(unit.number) : undefined;
      let maxChunk: number | undefined;
      if (forced === undefined) {
        if (input.freeStudyMaxTopicsPerUnit !== undefined) {
          maxChunk = input.freeStudyMaxTopicsPerUnit;
        } else if (!inScope && input.outOfScopeMaxTopicsPerUnit !== undefined) {
          maxChunk = input.outOfScopeMaxTopicsPerUnit;
        }
      }

      if (unit.subtopics.length <= 2) {
        const topics = groupSingleUnit(unit, difficulty, order, {
          forcedChunkCount: forced,
          maxChunkCount: maxChunk,
        });
        allGrouped.push(...topics);
        order += topics.length;
        continue;
      }

      anyHeavyUnit = true;
      heavyUnitIndex += 1;
      logger.info(
        `[TopicGrouper] Unidad pesada ${heavyUnitIndex}/${heavyUnitsTotal} — unidad ${unit.number} (${unit.subtopics.length} subtopics)`,
      );

      const aiTopics = await tryAIGroupUnit(
        unit,
        difficulty,
        provider,
        order,
        input.totalEstimatedHours,
        forced,
      );

      if (aiTopics.length > 0) {
        allGrouped.push(...aiTopics);
        order += aiTopics.length;
      } else {
        allHeavyUsedAI = false;
        logger.info(
          `[TopicGrouper] Fallback determinista para unidad ${unit.number} (IA sin grupos válidos)`,
        );
        const topics = groupSingleUnit(unit, difficulty, order, {
          forcedChunkCount: forced,
          maxChunkCount: maxChunk,
        });
        allGrouped.push(...topics);
        order += topics.length;
      }
    }

    const usedAI = anyHeavyUnit && allHeavyUsedAI;
    logger.info(
      `[TopicGrouper] IA generó ${allGrouped.length} topics (usedAI=${usedAI})`,
    );
    return {
      topics: consolidateTopics(allGrouped),
      usedAI,
    };
  } catch (error) {
    logger.error(
      '[TopicGrouper] Error en agrupación IA, fallback determinista:',
      error,
    );
    return { topics: groupTopics(input), usedAI: false };
  }
}

// ---------------------------------------------------------------------------
// Internal — Per-unit deterministic grouping
// ---------------------------------------------------------------------------

function groupSingleUnit(
  unit: ExtractedUnit,
  difficulty: Difficulty,
  startOrder: number,
  options?: { forcedChunkCount?: number; maxChunkCount?: number },
): GroupedTopic[] {
  const totalMinutes = resolveUnitMinutes(unit);
  const subtopics =
    unit.subtopics.length > 0 ? unit.subtopics : [unit.name];

  let topicCount: number;
  if (options?.forcedChunkCount !== undefined) {
    topicCount = Math.min(
      subtopics.length,
      Math.max(1, options.forcedChunkCount),
    );
  } else {
    topicCount = calculateTopicCount(totalMinutes);
    if (options?.maxChunkCount !== undefined) {
      topicCount = Math.min(topicCount, options.maxChunkCount);
    }
  }

  let chunks = distributeSubtopics(subtopics, topicCount);
  let perTopic = totalMinutes / chunks.length;

  if (options?.forcedChunkCount === undefined) {
    while (perTopic > MAX_MINUTES && chunks.length < subtopics.length) {
      topicCount = chunks.length + 1;
      if (options?.maxChunkCount !== undefined) {
        topicCount = Math.min(topicCount, options.maxChunkCount);
      }
      chunks = distributeSubtopics(subtopics, topicCount);
      perTopic = totalMinutes / chunks.length;
    }
  }

  return chunks.map((chunk, i) => ({
    name: buildTopicName(unit.number, chunk),
    unitNumber: unit.number,
    subtopics: chunk,
    estimatedMinutes: Math.round(clampMinutes(perTopic)),
    difficulty,
    order: startOrder + i,
  }));
}

// ---------------------------------------------------------------------------
// Internal — Minutes resolution (hours → minutes, con fallback)
// ---------------------------------------------------------------------------

function resolveUnitMinutes(unit: ExtractedUnit): number {
  if (unit.hoursTotal && unit.hoursTotal > 0) {
    return unit.hoursTotal * 60;
  }

  const theoryPractice =
    (unit.hoursTheory ?? 0) + (unit.hoursPractice ?? 0);
  if (theoryPractice > 0) {
    return theoryPractice * 60;
  }

  const n = Math.max(1, unit.subtopics.length);
  // Programas con muchos bullets: 1.5h × N infla horas y genera decenas de temas idénticos en duración.
  let perSubtopicHours = HOURS_PER_SUBTOPIC_FALLBACK;
  if (n > 40) perSubtopicHours = 0.35;
  else if (n > 24) perSubtopicHours = 0.45;
  else if (n > 12) perSubtopicHours = 0.65;

  return Math.max(n * perSubtopicHours * 60, MIN_MINUTES);
}

// ---------------------------------------------------------------------------
// Internal — Topic count based on total minutes
// ---------------------------------------------------------------------------

function calculateTopicCount(totalMinutes: number): number {
  if (totalMinutes <= MAX_MINUTES) return 1;
  if (totalMinutes <= 240) return 2;
  if (totalMinutes <= 360) return 3;
  return Math.ceil(totalMinutes / TARGET_MINUTES);
}

// ---------------------------------------------------------------------------
// Internal — Distribute subtopics into N sequential chunks
// ---------------------------------------------------------------------------

function distributeSubtopics(
  subtopics: string[],
  count: number,
): string[][] {
  const n = Math.max(count, 1);

  if (subtopics.length === 0) return [[]];
  if (subtopics.length <= n) return subtopics.map((s) => [s]);

  const chunks: string[][] = [];
  const baseSize = Math.floor(subtopics.length / n);
  const remainder = subtopics.length % n;
  let offset = 0;

  for (let i = 0; i < n; i++) {
    const size = baseSize + (i < remainder ? 1 : 0);
    chunks.push(subtopics.slice(offset, offset + size));
    offset += size;
  }

  return chunks;
}

// ---------------------------------------------------------------------------
// Internal — Post-process: merge small topics + clamp + re-number
// ---------------------------------------------------------------------------

function consolidateTopics(topics: GroupedTopic[]): GroupedTopic[] {
  if (topics.length <= 1) {
    return topics.map((t) => ({
      ...t,
      estimatedMinutes: Math.round(clampMinutes(t.estimatedMinutes)),
    }));
  }

  const merged: GroupedTopic[] = [];

  for (const topic of topics) {
    const prev = merged[merged.length - 1];

    const shouldMerge =
      topic.estimatedMinutes < MIN_MINUTES &&
      prev !== undefined &&
      prev.unitNumber === topic.unitNumber &&
      prev.estimatedMinutes + topic.estimatedMinutes <= MAX_MINUTES;

    if (shouldMerge) {
      prev.subtopics = [...prev.subtopics, ...topic.subtopics];
      prev.estimatedMinutes += topic.estimatedMinutes;
      prev.name = buildTopicName(prev.unitNumber, prev.subtopics);
    } else {
      merged.push({
        ...topic,
        estimatedMinutes: Math.round(clampMinutes(topic.estimatedMinutes)),
      });
    }
  }

  merged.forEach((t, i) => {
    t.order = i + 1;
  });

  return merged;
}

// ---------------------------------------------------------------------------
// Internal — Clamp minutes to valid range [45, 120]
// ---------------------------------------------------------------------------

function clampMinutes(minutes: number): number {
  return Math.min(Math.max(minutes, MIN_MINUTES), MAX_MINUTES);
}

// ---------------------------------------------------------------------------
// Internal — Topic naming
// ---------------------------------------------------------------------------

function buildTopicName(
  unitNumber: number,
  subtopics: string[],
): string {
  const prefix = `Unidad ${unitNumber}`;

  if (subtopics.length === 0) return prefix;

  if (subtopics.length === 1) {
    return truncate(`${prefix} — ${subtopics[0]}`, MAX_NAME_LENGTH);
  }

  const head = subtopics.slice(0, 3).join(' · ');
  const tail =
    subtopics.length > 3
      ? ` · … (+${subtopics.length - 3})`
      : '';
  return truncate(`${prefix} — ${head}${tail}`, MAX_NAME_LENGTH);
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 3) + '...';
}

// ---------------------------------------------------------------------------
// Internal — AI integration
// ---------------------------------------------------------------------------

async function tryAIGroupUnit(
  unit: ExtractedUnit,
  difficulty: Difficulty,
  provider: AIProvider,
  startOrder: number,
  totalHours: number,
  exactGroupCount?: number,
): Promise<GroupedTopic[]> {
  let extractStartMs = 0;
  try {
    const totalMinutes = resolveUnitMinutes(unit);

    const countRule =
      exactGroupCount !== undefined && exactGroupCount > 0
        ? `Debés devolver EXACTAMENTE ${exactGroupCount} objetos en el array (uno por bloque de estudio alineado a la cursada). Fusioná subtemas hasta cumplir eso.`
        : '';

    const systemPrompt = [
      'Sos un asistente que agrupa subtopics universitarios en sesiones de estudio.',
      'Respondé SOLO con JSON válido, sin texto adicional.',
      'El JSON debe ser un array de objetos con: { "name": string, "subtopics": string[], "estimatedMinutes": number }.',
      'Cada sesión debe durar entre 30 y 150 minutos.',
      'Agrupá por coherencia conceptual: temas relacionados van juntos.',
      countRule,
    ]
      .filter(Boolean)
      .join('\n');

    const userPrompt = [
      `Agrupá estos subtopics de la unidad "${unit.name}" en sesiones de estudio de 30-150 minutos,`,
      'agrupando por coherencia conceptual.',
      exactGroupCount !== undefined && exactGroupCount > 0
        ? `Cantidad obligatoria de grupos: ${exactGroupCount}.`
        : '',
      '',
      `Subtopics: ${JSON.stringify(unit.subtopics)}`,
      `Tiempo total estimado de la unidad: ${Math.round(totalMinutes)} minutos`,
      `Horas totales de la materia: ${totalHours}`,
      '',
      'Respondé con un JSON array. Ejemplo:',
      '[{"name": "Nombre descriptivo", "subtopics": ["sub1", "sub2"], "estimatedMinutes": 90}]',
    ]
      .filter(Boolean)
      .join('\n');

    if (isTopicGrouperDebug) {
      logger.info(
        `[TopicGrouper][debug] userPrompt (primeros ${DEBUG_PROMPT_PREVIEW} chars): ${truncateForLog(userPrompt, DEBUG_PROMPT_PREVIEW)}`,
      );
    }

    const inputBuffer = Buffer.from(
      JSON.stringify({ unit }),
      'utf-8',
    );

    extractStartMs = performance.now();
    const result = await provider.extractFromPDF(
      inputBuffer,
      'application/json',
      systemPrompt,
      userPrompt,
    );
    const durationMs = Math.round(performance.now() - extractStartMs);

    if (!result.success || !result.data) {
      logger.warn(
        `[TopicGrouper] extractFromPDF falló unidad ${unit.number} | durationMs=${durationMs} success=${result.success} error=${truncateForLog(result.error, ERROR_DETAIL_LOG_MAX)} model=${result.model ?? 'n/a'} errorDetail=${summarizeErrorDetail(result.errorDetail)}`,
      );
      return [];
    }

    const parsed = parseAIResponse(
      result.data,
      unit.number,
      difficulty,
      startOrder,
    );

    if (parsed.topics.length === 0) {
      logger.warn(
        `[TopicGrouper] Parse vacío o sin subtopics válidos — unidad ${unit.number} | durationMs=${durationMs} model=${result.model ?? 'n/a'} emptyReason=${parsed.emptyReason ?? 'unknown'}`,
      );
      return [];
    }

    if (
      exactGroupCount !== undefined &&
      exactGroupCount > 0 &&
      parsed.topics.length !== exactGroupCount
    ) {
      logger.warn(
        `[TopicGrouper] IA devolvió ${parsed.topics.length} grupos para unidad ${unit.number}, se esperaban ${exactGroupCount}; fallback determinista.`,
      );
      return [];
    }

    return parsed.topics;
  } catch (error) {
    const durationMs =
      extractStartMs > 0
        ? Math.round(performance.now() - extractStartMs)
        : undefined;
    logger.warn(
      `[TopicGrouper] Excepción IA unidad ${unit.number} | durationMs=${durationMs ?? 'n/a'}:`,
      error,
    );
    return [];
  }
}

interface AIGroupItem {
  name?: unknown;
  subtopics?: unknown;
  estimatedMinutes?: unknown;
}

interface ParseAIResponseResult {
  topics: GroupedTopic[];
  emptyReason?: ParseEmptyReason;
}

/**
 * Obtiene un array de ítems de agrupación desde la forma que devolvió el modelo.
 */
function extractGroupItemsFromPayload(
  data: unknown,
):
  | { ok: true; items: AIGroupItem[] }
  | { ok: false; reason: ParseEmptyReason } {
  if (Array.isArray(data)) {
    if (data.length === 0) {
      return { ok: false, reason: 'empty_array' };
    }
    return { ok: true, items: data };
  }

  if (typeof data === 'string') {
    try {
      const cleaned = data
        .replace(/^```(?:json)?\s*\n?/i, '')
        .replace(/\n?```\s*$/i, '')
        .trim();
      const parsed: unknown = JSON.parse(cleaned);
      return extractGroupItemsFromPayload(parsed);
    } catch {
      return { ok: false, reason: 'json_parse_error' };
    }
  }

  if (data !== null && typeof data === 'object') {
    const arr = Object.values(data).find(Array.isArray);
    if (!arr) {
      return { ok: false, reason: 'no_array_in_payload' };
    }
    if (arr.length === 0) {
      return { ok: false, reason: 'empty_array' };
    }
    return { ok: true, items: arr as AIGroupItem[] };
  }

  return { ok: false, reason: 'unsupported_payload_shape' };
}

function parseAIResponse(
  data: unknown,
  unitNumber: number,
  difficulty: Difficulty,
  startOrder: number,
): ParseAIResponseResult {
  try {
    const extracted = extractGroupItemsFromPayload(data);
    if (!extracted.ok) {
      return { topics: [], emptyReason: extracted.reason };
    }

    const filtered = extracted.items.filter(
      (
        item,
      ): item is AIGroupItem & { subtopics: string[] } =>
        Array.isArray(item.subtopics) && item.subtopics.length > 0,
    );

    if (filtered.length === 0) {
      return {
        topics: [],
        emptyReason: 'all_items_filtered_invalid',
      };
    }

    const topics = filtered.map((item, i) => ({
      name:
        typeof item.name === 'string'
          ? truncate(
              `Unidad ${unitNumber} — ${item.name}`,
              MAX_NAME_LENGTH,
            )
          : buildTopicName(unitNumber, item.subtopics),
      unitNumber,
      subtopics: item.subtopics.filter(
        (s): s is string => typeof s === 'string',
      ),
      estimatedMinutes: Math.round(
        clampMinutes(
          typeof item.estimatedMinutes === 'number'
            ? item.estimatedMinutes
            : TARGET_MINUTES,
        ),
      ),
      difficulty,
      order: startOrder + i,
    }));

    return { topics };
  } catch (error) {
    logger.warn('[TopicGrouper] Error parseando respuesta IA:', error);
    return { topics: [], emptyReason: 'json_parse_error' };
  }
}
