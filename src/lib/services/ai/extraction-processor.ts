// ---------------------------------------------------------------------------
// Extraction Post-Processor — Valida, normaliza y enriquece los resultados
// crudos de la IA. Convierte RawExtraction → ProcessedExtraction con campos
// calculados (dificultad, horas estimadas, confianza, schedule normalizado).
// ---------------------------------------------------------------------------

import { z } from 'zod';
import { logger } from '@/lib/utils/logger';
import type {
  RawExtraction,
  SubjectMetadata,
  ExtractedUnit,
  ScheduleEntry,
  ExtractedExam,
} from './types';
import type { Difficulty } from '@/lib/validations/topics';

// ---------------------------------------------------------------------------
// Exported Types
// ---------------------------------------------------------------------------

export interface NormalizedScheduleEntry {
  date: string;
  topics: string[];
  type: 'CLASS' | 'EXAM' | 'RECOVERY' | 'HOLIDAY';
  unitNumbers: number[];
}

export interface ProcessedExtraction extends RawExtraction {
  normalizedSchedule?: NormalizedScheduleEntry[];
  estimatedDifficulty: Map<number, Difficulty>;
  totalEstimatedHours: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

// ---------------------------------------------------------------------------
// Zod Schemas — Validación estructural + item-level
// ---------------------------------------------------------------------------

const structuralSchema = z.object({
  documentType: z.string().catch('UNKNOWN'),
  subjectMetadata: z.unknown(),
  units: z.array(z.unknown()).catch([]),
  schedule: z.array(z.unknown()).optional(),
  exams: z.array(z.unknown()).optional(),
});

const metadataSchema = z.object({
  name: z.string().nullish(),
  year: z.coerce.number().nullish(),
  semester: z.string().nullish(),
  totalHours: z.coerce.number().nullish(),
  weeklyHours: z.coerce.number().nullish(),
  description: z.string().nullish(),
  professors: z.array(z.string()).nullish(),
  bibliography: z.array(z.string()).nullish(),
  evaluationCriteria: z.string().nullish(),
});

const unitSchema = z.object({
  number: z.coerce.number().int(),
  name: z.string().min(1),
  subtopics: z.array(z.string()).catch([]),
  hoursTheory: z.coerce.number().nullish(),
  hoursPractice: z.coerce.number().nullish(),
  hoursTotal: z.coerce.number().nullish(),
});

const scheduleEntrySchema = z.object({
  date: z.string().nullish(),
  weekRange: z.string().nullish(),
  topic: z.string(),
  type: z.string().catch('CLASS'),
});

const examSchema = z.object({
  name: z.string(),
  date: z.string().nullish(),
  unitsIncluded: z.array(z.coerce.number()).catch([]),
  type: z.string().catch('PARCIAL'),
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SPANISH_MONTHS: Record<string, string> = {
  enero: '01',
  febrero: '02',
  marzo: '03',
  abril: '04',
  mayo: '05',
  junio: '06',
  julio: '07',
  agosto: '08',
  septiembre: '09',
  setiembre: '09',
  octubre: '10',
  noviembre: '11',
  diciembre: '12',
};

const SCHEDULE_TYPE_MAP: Record<string, ScheduleEntry['type']> = {
  CLASS: 'CLASS',
  CLASE: 'CLASS',
  TEORICO: 'CLASS',
  TEÓRICO: 'CLASS',
  PRACTICO: 'CLASS',
  PRÁCTICO: 'CLASS',
  EXAM: 'EXAM',
  EXAMEN: 'EXAM',
  RECOVERY: 'RECOVERY',
  RECUPERATORIO: 'RECOVERY',
  HOLIDAY: 'HOLIDAY',
  FERIADO: 'HOLIDAY',
  RECESO: 'HOLIDAY',
  ASUETO: 'HOLIDAY',
};

const EXAM_TYPE_MAP: Record<string, ExtractedExam['type']> = {
  PARCIAL: 'PARCIAL',
  EXAMEN_PARCIAL: 'PARCIAL',
  RECUPERATORIO: 'RECUPERATORIO',
  FINAL: 'FINAL',
  EXAMEN_FINAL: 'FINAL',
};

const DEFAULT_CLASS_HOURS = 2;
const HOURS_PER_SUBTOPIC = 1.5;

function hoursPerSubtopicFallback(subtopicCount: number): number {
  const n = Math.max(1, subtopicCount);
  if (n > 40) return 0.35;
  if (n > 24) return 0.45;
  if (n > 12) return 0.65;
  return HOURS_PER_SUBTOPIC;
}

// ---------------------------------------------------------------------------
// Main Export
// ---------------------------------------------------------------------------

/**
 * Valida, normaliza y enriquece el resultado crudo de la IA.
 * Acepta string JSON, objeto parseado o cualquier input inesperado.
 * Siempre retorna un ProcessedExtraction válido (degrada a confidence LOW).
 */
export function processExtractionResult(raw: unknown): ProcessedExtraction {
  const parsed = parseRawInput(raw);
  const structural = structuralSchema.safeParse(parsed);

  if (!structural.success) {
    logger.warn(
      '[ExtractionProcessor] Estructura base inválida:',
      structural.error.flatten(),
    );
    return buildMinimalResult();
  }

  const data = structural.data;

  const documentType = toDocumentType(data.documentType);
  const subjectMetadata = toSubjectMetadata(data.subjectMetadata);
  const units = parseItemsLeniently(data.units, unitSchema, 'unidad').map(
    toExtractedUnit,
  );

  const schedule = data.schedule
    ? parseItemsLeniently(data.schedule, scheduleEntrySchema, 'schedule').map(
        toScheduleEntry,
      )
    : undefined;

  const exams = data.exams
    ? parseItemsLeniently(data.exams, examSchema, 'examen').map(toExtractedExam)
    : undefined;

  const estimatedDifficulty = new Map<number, Difficulty>();
  let totalEstimatedHours = 0;

  for (const unit of units) {
    const hours = resolveUnitHours(unit, schedule);
    estimatedDifficulty.set(unit.number, estimateUnitDifficulty(unit, hours));
    totalEstimatedHours += hours;
  }

  if (
    subjectMetadata.totalHours &&
    subjectMetadata.totalHours > totalEstimatedHours
  ) {
    totalEstimatedHours = subjectMetadata.totalHours;
  }

  const normalizedSchedule = schedule?.length
    ? buildNormalizedSchedule(schedule, units)
    : undefined;

  const mergedExams = mergeExamsWithScheduleDates(exams, normalizedSchedule);

  const extraction: RawExtraction = {
    documentType,
    subjectMetadata,
    units,
    ...(schedule?.length ? { schedule } : {}),
    ...(mergedExams?.length ? { exams: mergedExams } : {}),
  };

  const confidence = calculateConfidence(extraction);

  return {
    ...extraction,
    normalizedSchedule,
    estimatedDifficulty,
    totalEstimatedHours,
    confidence,
  };
}

// ---------------------------------------------------------------------------
// Input Parsing
// ---------------------------------------------------------------------------

function parseRawInput(raw: unknown): Record<string, unknown> {
  if (typeof raw === 'string') {
    try {
      const cleaned = raw
        .replace(/^```(?:json)?\s*\n?/i, '')
        .replace(/\n?```\s*$/i, '')
        .trim();
      return JSON.parse(cleaned) as Record<string, unknown>;
    } catch {
      logger.error('[ExtractionProcessor] JSON inválido en string de entrada');
      return {};
    }
  }

  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const obj = raw as Record<string, unknown>;
    for (const key of ['result', 'extraction', 'data', 'response']) {
      const inner = obj[key];
      if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
        const record = inner as Record<string, unknown>;
        if ('documentType' in record || 'units' in record) return record;
      }
    }
    return obj;
  }

  logger.error(
    '[ExtractionProcessor] Input inesperado, tipo:',
    typeof raw,
  );
  return {};
}

// ---------------------------------------------------------------------------
// Lenient Array Parsing — valida cada ítem por separado, descarta inválidos
// ---------------------------------------------------------------------------

function parseItemsLeniently<S extends z.ZodTypeAny>(
  items: unknown[],
  schema: S,
  label: string,
): z.output<S>[] {
  return items.flatMap((item, i) => {
    const result = schema.safeParse(item);
    if (result.success) return [result.data as z.output<S>];
    logger.debug(
      `[ExtractionProcessor] ${label}[${i}] inválido, omitiendo`,
    );
    return [];
  });
}

// ---------------------------------------------------------------------------
// Type Normalization — Zod output → interface types
// ---------------------------------------------------------------------------

function toDocumentType(raw: string): RawExtraction['documentType'] {
  const upper = raw.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (upper === 'PLANIFICACION') return 'PLANIFICACION';
  if (upper === 'PROGRAMA') return 'PROGRAMA';
  return 'UNKNOWN';
}

function toSubjectMetadata(raw: unknown): SubjectMetadata {
  const result = metadataSchema.safeParse(raw ?? {});
  if (!result.success) return {};

  const d = result.data;
  const m: SubjectMetadata = {};
  if (d.name) m.name = d.name;
  if (d.year != null && !isNaN(d.year) && d.year > 0) m.year = d.year;
  if (d.semester) m.semester = d.semester;
  if (d.totalHours != null && d.totalHours > 0) m.totalHours = d.totalHours;
  if (d.weeklyHours != null && d.weeklyHours > 0) m.weeklyHours = d.weeklyHours;
  if (d.description) m.description = d.description;
  if (d.professors?.length) m.professors = d.professors;
  if (d.bibliography?.length) m.bibliography = d.bibliography;
  if (d.evaluationCriteria) m.evaluationCriteria = d.evaluationCriteria;
  return m;
}

function toExtractedUnit(raw: z.infer<typeof unitSchema>): ExtractedUnit {
  const unit: ExtractedUnit = {
    number: raw.number,
    name: raw.name,
    subtopics: raw.subtopics,
  };
  if (raw.hoursTheory != null && raw.hoursTheory > 0)
    unit.hoursTheory = raw.hoursTheory;
  if (raw.hoursPractice != null && raw.hoursPractice > 0)
    unit.hoursPractice = raw.hoursPractice;
  if (raw.hoursTotal != null && raw.hoursTotal > 0)
    unit.hoursTotal = raw.hoursTotal;
  return unit;
}

function toScheduleEntry(
  raw: z.infer<typeof scheduleEntrySchema>,
): ScheduleEntry {
  const entry: ScheduleEntry = {
    topic: raw.topic,
    type: SCHEDULE_TYPE_MAP[raw.type.toUpperCase()] ?? 'CLASS',
  };
  if (raw.date) entry.date = raw.date;
  if (raw.weekRange) entry.weekRange = raw.weekRange;
  return entry;
}

function toExtractedExam(raw: z.infer<typeof examSchema>): ExtractedExam {
  const exam: ExtractedExam = {
    name: raw.name,
    unitsIncluded: raw.unitsIncluded,
    type: EXAM_TYPE_MAP[raw.type.toUpperCase()] ?? 'PARCIAL',
  };
  if (raw.date) {
    const trimmed = raw.date.trim();
    if (trimmed) {
      const iso = normalizeDate(raw.date);
      exam.date = iso ?? trimmed;
    }
  }
  return exam;
}

// ---------------------------------------------------------------------------
// Date Normalization — formatos argentinos → ISO (YYYY-MM-DD)
// ---------------------------------------------------------------------------

function normalizeDate(dateStr: string): string | null {
  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);

  // "15 de marzo de 2026" | "15 de marzo"
  const writtenMatch = trimmed.match(
    /(\d{1,2})\s+de\s+(\w+)(?:\s+de\s+(\d{4}))?/i,
  );
  if (writtenMatch) {
    const day = writtenMatch[1].padStart(2, '0');
    const month = SPANISH_MONTHS[writtenMatch[2].toLowerCase()];
    if (month) {
      const year = writtenMatch[3] ?? String(new Date().getFullYear());
      return `${year}-${month}-${day}`;
    }
  }

  // Range → take first date: "09/08 – 13/08", "09/08-13/08"
  const rangeMatch = trimmed.match(/^(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/);
  if (rangeMatch) return parseDDMM(rangeMatch[1]);

  if (/^\d{1,2}\/\d{1,2}/.test(trimmed)) return parseDDMM(trimmed);

  return null;
}

function parseDDMM(dateStr: string): string | null {
  const parts = dateStr.split('/');
  if (parts.length < 2) return null;

  const day = parts[0].padStart(2, '0');
  const month = parts[1].padStart(2, '0');
  const year =
    parts.length >= 3
      ? parts[2].length === 2
        ? `20${parts[2]}`
        : parts[2]
      : String(new Date().getFullYear());

  const d = parseInt(day, 10);
  const m = parseInt(month, 10);
  if (d < 1 || d > 31 || m < 1 || m > 12) return null;

  return `${year}-${month}-${day}`;
}

// ---------------------------------------------------------------------------
// Hours & Difficulty Estimation
// ---------------------------------------------------------------------------

function resolveUnitHours(
  unit: ExtractedUnit,
  schedule?: ScheduleEntry[],
): number {
  if (unit.hoursTotal && unit.hoursTotal > 0) return unit.hoursTotal;

  const theoryPractice = (unit.hoursTheory ?? 0) + (unit.hoursPractice ?? 0);
  if (theoryPractice > 0) return theoryPractice;

  if (schedule?.length) {
    const classCount = schedule.filter(
      (e) => e.type === 'CLASS' && topicReferencesUnit(e.topic, unit),
    ).length;
    if (classCount > 0) return classCount * DEFAULT_CLASS_HOURS;
  }

  return Math.max(
    unit.subtopics.length * hoursPerSubtopicFallback(unit.subtopics.length),
    1,
  );
}

function estimateUnitDifficulty(
  unit: ExtractedUnit,
  hours: number,
): Difficulty {
  const hasExplicitHours =
    (unit.hoursTotal && unit.hoursTotal > 0) ||
    (unit.hoursTheory && unit.hoursTheory > 0) ||
    (unit.hoursPractice && unit.hoursPractice > 0);

  if (hasExplicitHours) {
    if (hours <= 2) return 'EASY';
    if (hours <= 6) return 'MEDIUM';
    return 'HARD';
  }

  const count = unit.subtopics.length;
  if (count <= 3) return 'EASY';
  if (count <= 8) return 'MEDIUM';
  return 'HARD';
}

// ---------------------------------------------------------------------------
// Confidence Calculation
// ---------------------------------------------------------------------------

function calculateConfidence(
  extraction: RawExtraction,
): ProcessedExtraction['confidence'] {
  if (extraction.documentType === 'UNKNOWN') return 'LOW';
  if (extraction.units.length === 0) return 'LOW';

  const hasScheduleWithDates =
    extraction.schedule?.some((e) => e.date) ?? false;

  if (hasScheduleWithDates && extraction.units.length > 0) return 'HIGH';
  if (extraction.units.length > 0) return 'MEDIUM';

  return 'LOW';
}

// ---------------------------------------------------------------------------
// Schedule Normalization
// ---------------------------------------------------------------------------

function buildNormalizedSchedule(
  schedule: ScheduleEntry[],
  units: ExtractedUnit[],
): NormalizedScheduleEntry[] {
  const entries: NormalizedScheduleEntry[] = [];

  for (const entry of schedule) {
    const dateSource = entry.date ?? entry.weekRange;
    if (!dateSource) continue;

    const isoDate = normalizeDate(dateSource);
    if (!isoDate) continue;

    entries.push({
      date: isoDate,
      topics: [entry.topic],
      type: entry.type,
      unitNumbers: matchUnitNumbers(entry.topic, units),
    });
  }

  return entries;
}

// ---------------------------------------------------------------------------
// Exams ↔ Normalized schedule (fechas del cronograma → exams[])
// ---------------------------------------------------------------------------

const MIN_EXAM_SCHEDULE_MATCH_SCORE = 10;
const SCORE_UNIT_OVERLAP = 22;
const SCORE_TYPE_ALIGN = 14;
const SCORE_SUBSTRING_MATCH = 12;
const SCORE_WORD_MATCH = 4;
const SCORE_KEYWORD_PARCIAL = 6;
const SCORE_KEYWORD_RECUP = 6;

function examDateMissing(exam: ExtractedExam): boolean {
  const d = exam.date;
  if (d == null) return true;
  return d.trim() === '';
}

function inferFinalFromTopicText(text: string): boolean {
  const t = text.toLowerCase();
  return (
    /\bfinal(es)?\b/.test(t) ||
    /\bexamen\s+final\b/.test(t) ||
    /\bcoloquio\b/.test(t)
  );
}

function syntheticExamFromScheduleEntry(
  entry: NormalizedScheduleEntry,
): ExtractedExam {
  const topicText = entry.topics[0] ?? '';
  const trimmed = topicText.trim();
  const name =
    trimmed ||
    (entry.type === 'RECOVERY' ? 'Recuperatorio' : 'Parcial');
  const type: ExtractedExam['type'] =
    entry.type === 'RECOVERY'
      ? 'RECUPERATORIO'
      : inferFinalFromTopicText(topicText)
        ? 'FINAL'
        : 'PARCIAL';
  return {
    name,
    date: entry.date,
    unitsIncluded: [...entry.unitNumbers],
    type,
  };
}

function scheduleTypeAlignsExam(
  examType: ExtractedExam['type'],
  scheduleType: NormalizedScheduleEntry['type'],
): boolean {
  if (scheduleType === 'RECOVERY') return examType === 'RECUPERATORIO';
  if (scheduleType === 'EXAM')
    return examType === 'PARCIAL' || examType === 'FINAL';
  return false;
}

function unitSetsOverlap(a: number[], b: number[]): boolean {
  if (a.length === 0 || b.length === 0) return false;
  const setB = new Set(b);
  return a.some((u) => setB.has(u));
}

/**
 * No duplicar al append si ya hay un examen con fecha que cubre las mismas unidades,
 * o ambos sin unidades pero tipo alineado.
 */
function scheduleCandidateCoveredByExisting(
  existing: ExtractedExam[],
  candidate: NormalizedScheduleEntry,
): boolean {
  for (const e of existing) {
    if (examDateMissing(e)) continue;
    const eu = e.unitsIncluded;
    const cu = candidate.unitNumbers;
    if (unitSetsOverlap(eu, cu)) return true;
    if (
      eu.length === 0 &&
      cu.length === 0 &&
      scheduleTypeAlignsExam(e.type, candidate.type)
    ) {
      return true;
    }
  }
  return false;
}

function topicBlob(entry: NormalizedScheduleEntry): string {
  return entry.topics.join(' ').toLowerCase();
}

function scoreExamToScheduleCandidate(
  exam: ExtractedExam,
  candidate: NormalizedScheduleEntry,
): number {
  let score = 0;
  const examUnits = exam.unitsIncluded;
  const candUnits = candidate.unitNumbers;
  const overlapCount = examUnits.filter((u) => candUnits.includes(u)).length;
  score += overlapCount * SCORE_UNIT_OVERLAP;

  if (exam.type === 'RECUPERATORIO' && candidate.type === 'RECOVERY') {
    score += SCORE_TYPE_ALIGN;
  } else if (
    (exam.type === 'PARCIAL' || exam.type === 'FINAL') &&
    candidate.type === 'EXAM'
  ) {
    score += SCORE_TYPE_ALIGN;
    if (exam.type === 'FINAL' && inferFinalFromTopicText(topicBlob(candidate))) {
      score += 4;
    } else if (exam.type === 'PARCIAL' && !inferFinalFromTopicText(topicBlob(candidate))) {
      score += 2;
    }
  }

  const name = exam.name.toLowerCase().trim();
  const topic = topicBlob(candidate);
  if (name && topic && (topic.includes(name) || name.includes(topic))) {
    score += SCORE_SUBSTRING_MATCH;
  } else if (name && topic) {
    for (const w of name.split(/\s+/)) {
      if (w.length > 2 && topic.includes(w)) score += SCORE_WORD_MATCH;
    }
  }

  if (exam.type === 'PARCIAL' && /\bparcial\b/.test(topic)) {
    score += SCORE_KEYWORD_PARCIAL;
  }
  if (exam.type === 'RECUPERATORIO' && /\brecup/.test(topic)) {
    score += SCORE_KEYWORD_RECUP;
  }

  return score;
}

/**
 * Enriquece `exams` con fechas ISO del cronograma normalizado (EXAM / RECOVERY).
 * Si el modelo no devolvió exams pero el schedule sí, sintetiza entradas.
 */
export function mergeExamsWithScheduleDates(
  exams: ExtractedExam[] | undefined,
  normalizedSchedule: NormalizedScheduleEntry[] | undefined,
): ExtractedExam[] | undefined {
  if (!normalizedSchedule?.length) return exams;

  const candidates = normalizedSchedule.filter(
    (e) =>
      (e.type === 'EXAM' || e.type === 'RECOVERY') &&
      typeof e.date === 'string' &&
      e.date.trim() !== '',
  );
  if (candidates.length === 0) return exams;

  if (!exams?.length) {
    return candidates.map(syntheticExamFromScheduleEntry);
  }

  const result = exams.map((e) => ({ ...e }));
  const used = new Set<number>();

  for (let i = 0; i < result.length; i++) {
    if (!examDateMissing(result[i])) continue;

    let bestJ = -1;
    let bestScore = -1;
    for (let j = 0; j < candidates.length; j++) {
      if (used.has(j)) continue;
      const s = scoreExamToScheduleCandidate(result[i], candidates[j]);
      if (s > bestScore) {
        bestScore = s;
        bestJ = j;
      }
    }

    if (bestJ >= 0 && bestScore >= MIN_EXAM_SCHEDULE_MATCH_SCORE) {
      const chosen = candidates[bestJ];
      result[i] = { ...result[i], date: chosen.date };
      used.add(bestJ);
    }
  }

  for (let j = 0; j < candidates.length; j++) {
    if (used.has(j)) continue;
    if (scheduleCandidateCoveredByExisting(result, candidates[j])) continue;
    result.push(syntheticExamFromScheduleEntry(candidates[j]));
  }

  return result;
}

// ---------------------------------------------------------------------------
// Unit ↔ Topic Matching
// ---------------------------------------------------------------------------

function matchUnitNumbers(
  topic: string,
  units: ExtractedUnit[],
): number[] {
  const matched: number[] = [];
  const lower = topic.toLowerCase();

  for (const m of lower.matchAll(/(?:unidad|tema|u\.?)\s*(\d+)/g)) {
    const num = parseInt(m[1], 10);
    if (units.some((u) => u.number === num)) matched.push(num);
  }
  if (matched.length > 0) return [...new Set(matched)];

  for (const unit of units) {
    const name = unit.name.toLowerCase();
    if (lower.includes(name) || name.includes(lower)) {
      matched.push(unit.number);
    }
  }

  return [...new Set(matched)];
}

function topicReferencesUnit(topic: string, unit: ExtractedUnit): boolean {
  const unitNumPattern = new RegExp(
    `(?:unidad|tema|u\\.?)\\s*${unit.number}\\b`,
    'i',
  );
  if (unitNumPattern.test(topic)) return true;

  const topicLower = topic.toLowerCase();
  const nameLower = unit.name.toLowerCase();
  return topicLower.includes(nameLower) || nameLower.includes(topicLower);
}

// ---------------------------------------------------------------------------
// Fallback — degradación segura cuando la validación falla completamente
// ---------------------------------------------------------------------------

function buildMinimalResult(): ProcessedExtraction {
  return {
    documentType: 'UNKNOWN',
    subjectMetadata: {},
    units: [],
    estimatedDifficulty: new Map(),
    totalEstimatedHours: 0,
    confidence: 'LOW',
  };
}
