// ---------------------------------------------------------------------------
// Topic Grouper — Agrupa unidades extraídas en topics de estudio de 45-120 min
// Dos estrategias: determinista local (groupTopics) y asistida por IA (groupTopicsWithAI)
// ---------------------------------------------------------------------------

import { logger } from '@/lib/utils/logger';
import type { ExtractedUnit, AIProvider } from './types';
import type { Difficulty } from '@/lib/validations/topics';

// ---------------------------------------------------------------------------
// Exported Types
// ---------------------------------------------------------------------------

export interface TopicGroupingInput {
  units: ExtractedUnit[];
  estimatedDifficulty: Map<number, Difficulty>;
  totalEstimatedHours: number;
}

export interface GroupedTopic {
  name: string;
  unitNumber: number;
  subtopics: string[];
  estimatedMinutes: number;
  difficulty: Difficulty;
  order: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Rango por tema de estudio (minutos); sesiones R1..R4 se derivan con factores aparte. */
const MIN_MINUTES = 30;
const MAX_MINUTES = 150;
const TARGET_MINUTES = 105;
const HOURS_PER_SUBTOPIC_FALLBACK = 1.5;
const MAX_NAME_LENGTH = 80;

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
    const unitTopics = groupSingleUnit(unit, difficulty, order);
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
): Promise<GroupedTopic[]> {
  try {
    logger.info(
      `[TopicGrouper] Intentando agrupación con IA (${provider.name})`,
    );

    const allGrouped: GroupedTopic[] = [];
    let order = 1;

    for (const unit of input.units) {
      const difficulty =
        input.estimatedDifficulty.get(unit.number) ?? 'MEDIUM';

      if (unit.subtopics.length <= 2) {
        const topics = groupSingleUnit(unit, difficulty, order);
        allGrouped.push(...topics);
        order += topics.length;
        continue;
      }

      const aiTopics = await tryAIGroupUnit(
        unit,
        difficulty,
        provider,
        order,
        input.totalEstimatedHours,
      );

      if (aiTopics.length > 0) {
        allGrouped.push(...aiTopics);
        order += aiTopics.length;
      } else {
        const topics = groupSingleUnit(unit, difficulty, order);
        allGrouped.push(...topics);
        order += topics.length;
      }
    }

    logger.info(`[TopicGrouper] IA generó ${allGrouped.length} topics`);
    return consolidateTopics(allGrouped);
  } catch (error) {
    logger.error(
      '[TopicGrouper] Error en agrupación IA, fallback determinista:',
      error,
    );
    return groupTopics(input);
  }
}

// ---------------------------------------------------------------------------
// Internal — Per-unit deterministic grouping
// ---------------------------------------------------------------------------

function groupSingleUnit(
  unit: ExtractedUnit,
  difficulty: Difficulty,
  startOrder: number,
): GroupedTopic[] {
  const totalMinutes = resolveUnitMinutes(unit);
  const subtopics =
    unit.subtopics.length > 0 ? unit.subtopics : [unit.name];

  let topicCount = calculateTopicCount(totalMinutes);
  let chunks = distributeSubtopics(subtopics, topicCount);
  let perTopic = totalMinutes / chunks.length;

  while (perTopic > MAX_MINUTES && chunks.length < subtopics.length) {
    topicCount = chunks.length + 1;
    chunks = distributeSubtopics(subtopics, topicCount);
    perTopic = totalMinutes / chunks.length;
  }

  return chunks.map((chunk, i) => ({
    name: buildTopicName(unit.number, chunk),
    unitNumber: unit.number,
    subtopics: chunk,
    estimatedMinutes: Math.round(perTopic),
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

  return truncate(
    `${prefix} — ${subtopics[0]} a ${subtopics[subtopics.length - 1]}`,
    MAX_NAME_LENGTH,
  );
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
): Promise<GroupedTopic[]> {
  try {
    const totalMinutes = resolveUnitMinutes(unit);

    const systemPrompt = [
      'Sos un asistente que agrupa subtopics universitarios en sesiones de estudio.',
      'Respondé SOLO con JSON válido, sin texto adicional.',
      'El JSON debe ser un array de objetos con: { "name": string, "subtopics": string[], "estimatedMinutes": number }.',
      'Cada sesión debe durar entre 30 y 150 minutos.',
      'Agrupá por coherencia conceptual: temas relacionados van juntos.',
    ].join('\n');

    const userPrompt = [
      `Agrupá estos subtopics de la unidad "${unit.name}" en sesiones de estudio de 30-150 minutos,`,
      'agrupando por coherencia conceptual.',
      '',
      `Subtopics: ${JSON.stringify(unit.subtopics)}`,
      `Tiempo total estimado de la unidad: ${Math.round(totalMinutes)} minutos`,
      `Horas totales de la materia: ${totalHours}`,
      '',
      'Respondé con un JSON array. Ejemplo:',
      '[{"name": "Nombre descriptivo", "subtopics": ["sub1", "sub2"], "estimatedMinutes": 90}]',
    ].join('\n');

    const inputBuffer = Buffer.from(
      JSON.stringify({ unit }),
      'utf-8',
    );

    const result = await provider.extractFromPDF(
      inputBuffer,
      'application/json',
      systemPrompt,
      userPrompt,
    );

    if (!result.success || !result.data) {
      logger.warn(
        `[TopicGrouper] IA no retornó datos para unidad ${unit.number}`,
      );
      return [];
    }

    return parseAIResponse(
      result.data,
      unit.number,
      difficulty,
      startOrder,
    );
  } catch (error) {
    logger.warn(
      `[TopicGrouper] Error IA para unidad ${unit.number}:`,
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

function parseAIResponse(
  data: unknown,
  unitNumber: number,
  difficulty: Difficulty,
  startOrder: number,
): GroupedTopic[] {
  try {
    let items: AIGroupItem[];

    if (Array.isArray(data)) {
      items = data;
    } else if (typeof data === 'string') {
      const cleaned = data
        .replace(/^```(?:json)?\s*\n?/i, '')
        .replace(/\n?```\s*$/i, '')
        .trim();
      items = JSON.parse(cleaned) as AIGroupItem[];
    } else if (data !== null && typeof data === 'object') {
      const arr = Object.values(data).find(Array.isArray);
      if (!arr) return [];
      items = arr;
    } else {
      return [];
    }

    if (!Array.isArray(items) || items.length === 0) return [];

    return items
      .filter(
        (
          item,
        ): item is AIGroupItem & { subtopics: string[] } =>
          Array.isArray(item.subtopics) &&
          item.subtopics.length > 0,
      )
      .map((item, i) => ({
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
  } catch (error) {
    logger.warn('[TopicGrouper] Error parseando respuesta IA:', error);
    return [];
  }
}
