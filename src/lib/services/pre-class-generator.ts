import type { SessionToCreate, GenerateSessionsOptions } from './session-generator';
import { dateToLocalArgentinaMinutes } from './session-generator';
import type { Priority } from './priority-calculator';
import {
  resolveSessionTime,
  type OccupiedRange,
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
  /** Instante de generación; evita pre-clases con scheduled_at en el pasado (p. ej. mismo día UTC que la clase). */
  generatedAt?: Date;
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

/** Día civil en Argentina (alineado con horarios de cursada / slots locales). */
function isSameCalendarDayArgentina(a: Date, b: Date): boolean {
  const key = (d: Date) =>
    d.toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
  return key(a) === key(b);
}

/**
 * El slot cae en el "día de clase" esperado: mismo día UTC (fechas a medianoche UTC del wizard)
 * o mismo día civil AR (evita falsos negativos cuando el slot local cae en otro día UTC).
 */
function isSlotOnClassDay(slot: Date, classDate: Date): boolean {
  if (isSameDay(slot, classDate)) return true;
  return isSameCalendarDayArgentina(slot, classDate);
}

function utcMidnight(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
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

/**
 * Día UTC de preparación: idealmente el día anterior a la clase (sin caer en parcial).
 * Si ese día es anterior al día UTC de `generatedAt`, se usa el mismo día UTC que la clase
 * y la hora queda acotada por `generatedAt` y el inicio del bloque de cursada.
 */
export function findPreClassSchedulingDate(
  classDate: Date,
  examDates: Date[],
  generatedAt: Date,
): Date | null {
  const ideal = findPreClassDate(classDate, examDates);
  if (!ideal) return null;

  const idealMid = utcMidnight(ideal);
  const genMid = utcMidnight(generatedAt);

  if (idealMid.getTime() >= genMid.getTime()) {
    return idealMid;
  }

  return utcMidnight(classDate);
}

function getClassBlockStartMinutes(classDate: Date, schedule: ClassScheduleBlock[]): number | null {
  const dayOfWeek = classDate.getUTCDay();

  for (const block of schedule) {
    const blockDay = DAY_MAP[block.day];
    if (blockDay === undefined) continue;

    if (blockDay === dayOfWeek) {
      return parseTimeToMinutes(block.startTime);
    }
  }

  return null;
}

function buildPreClassOccupiedRanges(params: {
  schedulingDate: Date;
  classDate: Date;
  generatedAt: Date;
  duration: number;
  schedule: ClassScheduleBlock[];
}): OccupiedRange[] {
  const { schedulingDate, classDate, generatedAt, duration, schedule } = params;
  const extra: OccupiedRange[] = [];

  if (isSameDay(schedulingDate, generatedAt)) {
    const m = dateToLocalArgentinaMinutes(generatedAt);
    if (m > 0) {
      extra.push({ startMinutes: 0, endMinutes: m });
    }
  }

  if (isSameDay(schedulingDate, classDate)) {
    const classStart = getClassBlockStartMinutes(classDate, schedule);
    if (classStart !== null) {
      const latestStart = classStart - duration;
      if (latestStart >= 0) {
        extra.push({ startMinutes: latestStart + 1, endMinutes: 24 * 60 });
      }
    }
  }

  return extra;
}

function resolveHour(
  candidateDate: Date,
  durationMinutes: number,
  options?: GenerateSessionsOptions,
  occupiedExtra?: OccupiedRange[],
): { date: Date; adjusted: boolean; originalDate: Date | null } {
  const studyHours = options?.studyHours ?? DEFAULT_STUDY_HOURS;
  const slots = options?.availabilitySlots ?? [];
  const occupied: OccupiedRange[] = [
    ...(options?.occupiedRanges ?? []),
    ...(occupiedExtra ?? []),
  ];

  return resolveSessionTime(
    candidateDate,
    durationMinutes,
    slots,
    studyHours,
    occupied,
  );
}

/**
 * Genera sesiones de pre-clase (preparación antes de cada clase).
 * Función pura: no accede a DB, solo genera el array de SessionToCreate.
 */
export function generatePreClassSessions(
  input: PreClassGeneratorInput,
): SessionToCreate[] {
  const { userId, subjectId, schedule, topicsWithDates, examDates, options } = input;
  const generatedAt = input.generatedAt ?? new Date();
  const sessions: SessionToCreate[] = [];

  for (const topic of topicsWithDates) {
    const schedulingDate = findPreClassSchedulingDate(
      topic.classDate,
      examDates,
      generatedAt,
    );

    if (!schedulingDate) {
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

    const classStart = getClassBlockStartMinutes(topic.classDate, schedule);
    if (isSameDay(schedulingDate, topic.classDate) && classStart !== null) {
      const latestStart = classStart - duration;
      if (latestStart < 0) {
        logger.warn(
          `[PreClassGenerator] Sin hueco antes del inicio de cursada para pre-clase de "${topic.name}" (clase: ${topic.classDate.toISOString()})`,
        );
        continue;
      }
    }

    const occupiedExtra = buildPreClassOccupiedRanges({
      schedulingDate,
      classDate: topic.classDate,
      generatedAt,
      duration,
      schedule,
    });

    const slotResult = resolveHour(schedulingDate, duration, options, occupiedExtra);

    const mustStayOnClassUtcDay = isSameDay(schedulingDate, topic.classDate);
    if (mustStayOnClassUtcDay && !isSlotOnClassDay(slotResult.date, topic.classDate)) {
      logger.warn(
        `[PreClassGenerator] No hubo slot el mismo día que la clase (UTC o AR) para "${topic.name}"; se omite pre-clase.`,
      );
      continue;
    }

    if (slotResult.date.getTime() < generatedAt.getTime()) {
      logger.warn(
        `[PreClassGenerator] Slot anterior a generatedAt para "${topic.name}"; se omite pre-clase.`,
      );
      continue;
    }

    if (isSlotOnClassDay(slotResult.date, topic.classDate) && classStart !== null) {
      const endMin = dateToLocalArgentinaMinutes(slotResult.date) + duration;
      if (endMin > classStart) {
        logger.warn(
          `[PreClassGenerator] Pre-clase solaparía inicio de cursada para "${topic.name}"; se omite.`,
        );
        continue;
      }
    }

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
