import { calculatePriority, daysBetween } from './priority-calculator';
import type { Difficulty } from '@/lib/validations/topics';
import type { Priority } from './priority-calculator';
import { logger } from '@/lib/utils/logger';
import type { AvailabilitySlotRow } from '@/lib/repositories/availability.repository';
import {
  resolveSessionTime,
  setDateToLocalArgentinaHour,
  type StudyHoursRange,
  type OccupiedRange,
} from './slot-resolver';

const SPACED_REPETITION_INTERVALS = [1, 3, 7, 14]; // días

const DIFFICULTY_MULTIPLIERS: Record<Difficulty, number> = {
  EASY: 0.7,
  MEDIUM: 1.0,
  HARD: 1.3,
};

const DURATION_FACTORS = [0.60, 0.35, 0.30, 0.25];

const DEFAULT_STUDY_HOURS: StudyHoursRange = {
  startHour: '09:00',
  endHour: '23:00',
};

interface Topic {
  id: string;
  subject_id: string;
  exam_id: string | null;
  difficulty: Difficulty;
  hours: number;
  source: string;
  source_date: string | null;
}

interface Exam {
  id: string;
  date: string;
  category: string;
  modality?: string;
}

export interface SessionToCreate {
  user_id: string;
  subject_id: string;
  topic_id: string;
  exam_id: string | null;
  number: number;
  scheduled_at: string;
  duration: number;
  priority: Priority;
  status: 'PENDING';
  attempts: number;
  session_type: 'REVIEW' | 'PRE_CLASS';
  adjusted_for_conflict?: boolean;
  original_scheduled_at?: string | null;
}

type ConflictChecker = (
  date: Date,
  duration: number,
) => Promise<{ date: Date; adjusted: boolean; originalDate: Date | null }>;

export interface GenerateSessionsOptions {
  conflictChecker?: ConflictChecker;
  availabilitySlots?: AvailabilitySlotRow[];
  studyHours?: StudyHoursRange;
  occupiedRanges?: OccupiedRange[];
}

function determineMode(exam: Exam | null, source: string): 'PARCIAL' | 'FREE_STUDY' {
  if (source === 'FREE_STUDY' || (exam && exam.category === 'FINAL')) {
    return 'FREE_STUDY';
  }
  return 'PARCIAL';
}

/**
 * Converts a UTC Date to local Argentina minutes-of-day (UTC-3).
 * E.g. a Date at 15:30 UTC → 12:30 ARG → 750 minutes.
 */
export function dateToLocalArgentinaMinutes(date: Date): number {
  const utcTotalMinutes = date.getUTCHours() * 60 + date.getUTCMinutes();
  return utcTotalMinutes - 180; // UTC-3
}

function resolveHour(
  candidateDate: Date,
  durationMinutes: number,
  options?: GenerateSessionsOptions,
): { date: Date; adjusted: boolean; originalDate: Date | null } {
  const studyHours = options?.studyHours ?? DEFAULT_STUDY_HOURS;
  const slots = options?.availabilitySlots ?? [];
  const occupied = options?.occupiedRanges ?? [];

  return resolveSessionTime(candidateDate, durationMinutes, slots, studyHours, occupied);
}

async function generateParcialSessions(
  topic: Topic,
  exam: Exam | null,
  userId: string,
  options?: GenerateSessionsOptions,
): Promise<SessionToCreate[]> {
  const sessions: SessionToCreate[] = [];
  const sourceDate = new Date(topic.source_date!);
  sourceDate.setUTCHours(0, 0, 0, 0);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  let daysToExam: number | null = null;
  if (exam) {
    const examDate = new Date(exam.date);
    examDate.setUTCHours(0, 0, 0, 0);
    daysToExam = daysBetween(today, examDate);
  }

  const baseDuration = topic.hours * DIFFICULTY_MULTIPLIERS[topic.difficulty];
  const accumulatedOccupied: OccupiedRange[] = [...(options?.occupiedRanges ?? [])];

  for (let i = 0; i < SPACED_REPETITION_INTERVALS.length; i++) {
    const intervalDays = SPACED_REPETITION_INTERVALS[i];
    const sessionNumber = i + 1;

    let scheduledDate = new Date(sourceDate);
    scheduledDate.setUTCDate(scheduledDate.getUTCDate() + intervalDays);

    if (scheduledDate <= today) {
      scheduledDate = new Date(today);
      scheduledDate.setUTCDate(scheduledDate.getUTCDate() + 1);
    }

    const duration = Math.max(15, Math.round(baseDuration * DURATION_FACTORS[i]));

    const slotResult = resolveHour(scheduledDate, duration, {
      ...options,
      occupiedRanges: accumulatedOccupied,
    });
    scheduledDate = slotResult.date;

    let conflictResult = null;
    if (options?.conflictChecker) {
      conflictResult = await options.conflictChecker(scheduledDate, duration);
      scheduledDate = conflictResult.date;

      if (conflictResult.adjusted) {
        logger.debug(`[SessionGenerator] Session ${sessionNumber} adjusted to avoid conflict: ${scheduledDate.toISOString()}`);
      }
    }

    accumulatedOccupied.push({
      startMinutes: dateToLocalArgentinaMinutes(scheduledDate),
      endMinutes: dateToLocalArgentinaMinutes(scheduledDate) + duration,
    });

    const daysToSession = daysBetween(today, scheduledDate);

    const priority = calculatePriority({
      daysToExam,
      difficulty: topic.difficulty,
      sessionNumber,
      daysToSession,
      isFinal: false,
    });

    const adjusted = slotResult.adjusted || conflictResult?.adjusted || false;
    const originalAt = slotResult.originalDate ?? conflictResult?.originalDate ?? null;

    sessions.push({
      user_id: userId,
      subject_id: topic.subject_id,
      topic_id: topic.id,
      exam_id: topic.exam_id,
      number: sessionNumber,
      scheduled_at: scheduledDate.toISOString(),
      duration,
      priority,
      status: 'PENDING',
      attempts: 0,
      session_type: 'REVIEW',
      adjusted_for_conflict: adjusted,
      original_scheduled_at: originalAt?.toISOString() || null,
    });
  }

  return sessions;
}

async function generateFreeStudySessions(
  topic: Topic,
  exam: Exam | null,
  userId: string,
  options?: GenerateSessionsOptions,
): Promise<SessionToCreate[]> {
  const sessions: SessionToCreate[] = [];
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  let daysToExam: number | null = null;
  if (exam) {
    const examDate = new Date(exam.date);
    examDate.setUTCHours(0, 0, 0, 0);
    daysToExam = daysBetween(today, examDate);
  }

  const baseDuration = topic.hours * DIFFICULTY_MULTIPLIERS[topic.difficulty];
  const accumulatedOccupied: OccupiedRange[] = [...(options?.occupiedRanges ?? [])];

  for (let i = 0; i < SPACED_REPETITION_INTERVALS.length; i++) {
    const intervalDays = SPACED_REPETITION_INTERVALS[i];
    const sessionNumber = i + 1;

    if (intervalDays < 1) {
      throw new Error('Los intervalos deben ser al menos 1 día');
    }

    let scheduledDate = new Date(today);
    scheduledDate.setUTCDate(scheduledDate.getUTCDate() + intervalDays);

    const duration = Math.max(15, Math.round(baseDuration * DURATION_FACTORS[i]));

    const slotResult = resolveHour(scheduledDate, duration, {
      ...options,
      occupiedRanges: accumulatedOccupied,
    });
    scheduledDate = slotResult.date;

    let conflictResult = null;
    if (options?.conflictChecker) {
      conflictResult = await options.conflictChecker(scheduledDate, duration);
      scheduledDate = conflictResult.date;

      if (conflictResult.adjusted) {
        logger.debug(`[SessionGenerator] Session ${sessionNumber} adjusted to avoid conflict: ${scheduledDate.toISOString()}`);
      }
    }

    accumulatedOccupied.push({
      startMinutes: dateToLocalArgentinaMinutes(scheduledDate),
      endMinutes: dateToLocalArgentinaMinutes(scheduledDate) + duration,
    });

    const daysToSession = daysBetween(today, scheduledDate);

    const priority = calculatePriority({
      daysToExam,
      difficulty: topic.difficulty,
      sessionNumber,
      daysToSession,
      isFinal: exam?.category === 'FINAL' || false,
    });

    const adjusted = slotResult.adjusted || conflictResult?.adjusted || false;
    const originalAt = slotResult.originalDate ?? conflictResult?.originalDate ?? null;

    sessions.push({
      user_id: userId,
      subject_id: topic.subject_id,
      topic_id: topic.id,
      exam_id: topic.exam_id,
      number: sessionNumber,
      scheduled_at: scheduledDate.toISOString(),
      duration,
      priority,
      status: 'PENDING',
      attempts: 0,
      session_type: 'REVIEW',
      adjusted_for_conflict: adjusted,
      original_scheduled_at: originalAt?.toISOString() || null,
    });
  }

  return sessions;
}

/**
 * Genera las sesiones de repaso para un topic.
 * Detecta automáticamente el modo (PARCIAL o FREE_STUDY) según el tipo de examen.
 * Acepta options con availabilitySlots y studyHours para ubicar cada sesión
 * dentro del horario preferido del usuario.
 */
export async function generateSessionsForTopic(
  topic: Topic,
  exam: Exam | null,
  userId: string,
  options?: GenerateSessionsOptions,
): Promise<SessionToCreate[]> {
  const minInterval = Math.min(...SPACED_REPETITION_INTERVALS);
  if (minInterval < 1) {
    throw new Error('Session intervals must be at least 1 day');
  }

  const mode = determineMode(exam, topic.source);

  if (mode === 'PARCIAL' && !topic.source_date) {
    throw new Error('Topic must have a source_date to generate sessions in PARCIAL mode');
  }

  let sessions: SessionToCreate[];
  if (mode === 'FREE_STUDY') {
    sessions = await generateFreeStudySessions(topic, exam, userId, options);
  } else {
    sessions = await generateParcialSessions(topic, exam, userId, options);
  }

  // Validación final: asegurar que todas las sesiones sean futuras
  const studyHours = options?.studyHours ?? DEFAULT_STUDY_HOURS;
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);

  sessions.forEach((session, index) => {
    const sessionDate = new Date(session.scheduled_at);
    const sessionDay = new Date(sessionDate);
    sessionDay.setUTCHours(0, 0, 0, 0);

    if (sessionDay <= now) {
      logger.warn(`Session ${index + 1} scheduled for ${session.scheduled_at} is not in the future, adjusting...`);
      const adjustedDate = new Date(now);
      adjustedDate.setUTCDate(adjustedDate.getUTCDate() + (index + 1));
      const resolved = resolveHour(adjustedDate, session.duration, options);
      session.scheduled_at = resolved.date.toISOString();
    }
  });

  return sessions;
}

export function hasExistingSessions(
  existingSessions: Array<{ topic_id: string }>,
  topicId: string,
): boolean {
  return existingSessions.some((session) => session.topic_id === topicId);
}
