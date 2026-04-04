import type { SessionToCreate, GenerateSessionsOptions } from './session-generator';
import type { Priority } from './priority-calculator';
import type { AvailabilitySlotRow } from '@/lib/repositories/availability.repository';
import {
  resolveSessionTime,
  setDateToLocalArgentinaHour,
  type StudyHoursRange,
} from './slot-resolver';
import { logger } from '@/lib/utils/logger';

const DAY_MAP: Record<string, number> = {
  Domingo: 0,
  Lunes: 1,
  Martes: 2,
  Miércoles: 3,
  Jueves: 4,
  Viernes: 5,
  Sábado: 6,
};

const DEFAULT_PRE_CLASS_DURATION = 45;
const DEFAULT_FALLBACK_HOUR = '10:00';
const PRE_CLASS_PRIORITY: Priority = 'IMPORTANT';

const DEFAULT_STUDY_HOURS: StudyHoursRange = {
  startHour: '09:00',
  endHour: '23:00',
};

export interface ClassScheduleBlock {
  day: string;
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
}

/**
 * Días UTC en [rangeStart, rangeEnd) (igual que topic-distributor) que caen en un día
 * de clase según `schedule`; hasta `count` fechas a medianoche UTC, en orden cronológico.
 */
export function getSequentialClassDatesForTopics(
  schedule: ClassScheduleBlock[],
  count: number,
  rangeStart: Date,
  rangeEnd: Date,
): Date[] {
  const allowedDays = new Set<number>();
  for (const block of schedule) {
    const d = DAY_MAP[block.day];
    if (d !== undefined) {
      allowedDays.add(d);
    }
  }

  if (allowedDays.size === 0 || count <= 0) {
    return [];
  }

  const results: Date[] = [];
  const cursor = new Date(rangeStart);
  cursor.setUTCHours(0, 0, 0, 0);
  const limit = new Date(rangeEnd);
  limit.setUTCHours(0, 0, 0, 0);

  while (cursor < limit && results.length < count) {
    if (allowedDays.has(cursor.getUTCDay())) {
      results.push(new Date(cursor));
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return results;
}

export interface TopicWithClassDate {
  id: string;
  subject_id: string;
  exam_id: string | null;
  name: string;
  hours: number;
  classDate: Date;
}

export interface PreClassGeneratorInput {
  userId: string;
  subjectId: string;
  schedule: ClassScheduleBlock[];
  topicsWithDates: TopicWithClassDate[];
  examDates: Date[];
  options?: GenerateSessionsOptions;
}

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function getClassDurationMinutes(
  classDate: Date,
  schedule: ClassScheduleBlock[],
): number | null {
  const dayOfWeek = classDate.getUTCDay();

  for (const block of schedule) {
    const blockDay = DAY_MAP[block.day];
    if (blockDay === undefined) continue;

    if (blockDay === dayOfWeek) {
      const start = parseTimeToMinutes(block.startTime);
      const end = parseTimeToMinutes(block.endTime);
      if (end > start) return end - start;
    }
  }

  return null;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

function isExamDay(date: Date, examDates: Date[]): boolean {
  return examDates.some((ed) => isSameDay(date, ed));
}

function subtractDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() - days);
  return result;
}

/**
 * Busca la fecha de pre-clase: 1 día antes de classDate.
 * Si cae en un día de examen, retrocede hasta encontrar un día libre.
 * Retorna null si no se encuentra un día apto en los 7 días previos.
 */
function findPreClassDate(classDate: Date, examDates: Date[]): Date | null {
  const MAX_LOOKBACK = 7;

  for (let offset = 1; offset <= MAX_LOOKBACK; offset++) {
    const candidate = subtractDays(classDate, offset);
    if (!isExamDay(candidate, examDates)) {
      return candidate;
    }
  }

  return null;
}

function resolveHour(
  candidateDate: Date,
  durationMinutes: number,
  options?: GenerateSessionsOptions,
): { date: Date; adjusted: boolean; originalDate: Date | null } {
  const studyHours = options?.studyHours ?? DEFAULT_STUDY_HOURS;
  const slots = options?.availabilitySlots;

  if (slots && slots.length > 0) {
    return resolveSessionTime(
      candidateDate,
      durationMinutes,
      slots,
      studyHours,
      options?.occupiedRanges,
    );
  }

  return {
    date: setDateToLocalArgentinaHour(candidateDate, DEFAULT_FALLBACK_HOUR),
    adjusted: false,
    originalDate: null,
  };
}

/**
 * Genera sesiones de pre-clase (preparación antes de cada clase).
 * Función pura: no accede a DB, solo genera el array de SessionToCreate.
 */
export function generatePreClassSessions(
  input: PreClassGeneratorInput,
): SessionToCreate[] {
  const { userId, subjectId, schedule, topicsWithDates, examDates, options } = input;
  const sessions: SessionToCreate[] = [];

  for (const topic of topicsWithDates) {
    const preClassDate = findPreClassDate(topic.classDate, examDates);

    if (!preClassDate) {
      logger.warn(
        `[PreClassGenerator] No se encontró fecha para pre-clase de "${topic.name}" (clase: ${topic.classDate.toISOString()})`,
      );
      continue;
    }

    const classDuration = getClassDurationMinutes(topic.classDate, schedule);
    const duration =
      classDuration !== null
        ? Math.min(60, Math.round(classDuration * 0.3))
        : DEFAULT_PRE_CLASS_DURATION;

    const slotResult = resolveHour(preClassDate, duration, options);

    sessions.push({
      user_id: userId,
      subject_id: subjectId,
      topic_id: topic.id,
      exam_id: topic.exam_id,
      number: 0,
      scheduled_at: slotResult.date.toISOString(),
      duration,
      priority: PRE_CLASS_PRIORITY,
      status: 'PENDING',
      attempts: 0,
      session_type: 'PRE_CLASS',
      adjusted_for_conflict: slotResult.adjusted,
      original_scheduled_at: slotResult.originalDate?.toISOString() ?? null,
    });
  }

  logger.info(
    `[PreClassGenerator] Generadas ${sessions.length} sesiones de pre-clase para subject ${subjectId}`,
  );

  return sessions;
}
