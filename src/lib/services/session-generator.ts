import { calculatePriority, daysBetween } from './priority-calculator';
import type { Difficulty } from '@/lib/validations/topics';
import type { Priority } from './priority-calculator';
import { getGoogleCalendarService } from './google-calendar.service';
import { createClient } from '@/lib/supabase/server';

// Intervalos de repetición espaciada UNIVERSAL (Anki Standard)
// Siempre 4 sesiones para TODOS los temas, independiente de dificultad
const SPACED_REPETITION_INTERVALS = [1, 3, 7, 14]; // días

// Multiplicadores de duración por DIFICULTAD
// La dificultad afecta el TIEMPO de estudio, no la cantidad de sesiones
const DIFFICULTY_MULTIPLIERS: Record<Difficulty, number> = {
  EASY: 0.7,    // Temas fáciles requieren menos tiempo
  MEDIUM: 1.0,  // Duración estándar
  HARD: 1.3,    // Temas difíciles requieren más tiempo
};

// Factores de reducción de duración por número de sesión
// Reducción progresiva: R1 más largo, R4 más corto
const DURATION_FACTORS = [0.60, 0.35, 0.30, 0.25];

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
  type: string; // FINAL_THEORY, FINAL_PRACTICE, PARCIAL_*, etc.
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
  adjusted_for_conflict?: boolean;
  original_scheduled_at?: string | null;
}

/**
 * Determina el modo de generación
 * - PARCIAL: Para clases de parciales (desde source_date)
 * - FREE_STUDY: Para finales y estudio libre (desde HOY)
 */
function determineMode(exam: Exam | null, source: string): 'PARCIAL' | 'FREE_STUDY' {
  // Si es estudio libre o examen final, empezar desde hoy
  if (source === 'FREE_STUDY' || (exam && exam.type.startsWith('FINAL_'))) {
    return 'FREE_STUDY';
  }
  
  // Para clases de parciales, usar source_date
  return 'PARCIAL';
}

interface GoogleSettings {
  google_access_token: string | null;
  google_refresh_token: string | null;
  google_token_expiry: string | null;
}

/**
 * Busca un slot sin conflictos en Google Calendar
 * Si hay conflicto, busca el siguiente slot disponible (hasta 14 intentos)
 */
async function findConflictFreeSlot(
  userId: string,
  preferredDate: Date,
  duration: number,
  maxAttempts: number = 14
): Promise<{ date: Date; adjusted: boolean; originalDate: Date | null }> {
  const googleService = getGoogleCalendarService();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;

  // Obtener tokens de Google Calendar
  const { data: settings } = await supabase
    .from('user_settings')
    .select('google_access_token, google_refresh_token, google_token_expiry')
    .eq('user_id', userId)
    .single() as { data: GoogleSettings | null };

  if (!settings?.google_access_token) {
    // Si no hay tokens, devolver fecha preferida sin ajustes
    return { date: preferredDate, adjusted: false, originalDate: null };
  }

  const tokens = {
    access_token: settings.google_access_token,
    refresh_token: settings.google_refresh_token || undefined,
    expiry_date: settings.google_token_expiry
      ? new Date(settings.google_token_expiry).getTime()
      : undefined,
  };

  let currentDate = new Date(preferredDate);
  let attempts = 0;

  while (attempts < maxAttempts) {
    // Calcular hora de fin
    const endDate = new Date(currentDate.getTime() + duration * 60 * 1000);

    // Verificar conflictos en Google Calendar
    const hasConflict = await googleService.checkConflicts(tokens, currentDate, endDate);

    if (!hasConflict) {
      // No hay conflicto, usar este slot
      return { 
        date: currentDate, 
        adjusted: attempts > 0,
        originalDate: attempts > 0 ? preferredDate : null
      };
    }

    // Hay conflicto, buscar siguiente slot (al día siguiente a la misma hora)
    currentDate = new Date(currentDate);
    currentDate.setDate(currentDate.getDate() + 1);
    attempts++;
  }

  // Si no encuentra slot sin conflictos después de maxAttempts, usar el preferido
  console.warn(`[SessionGenerator] No conflict-free slot found after ${maxAttempts} attempts, using preferred date`);
  return { date: preferredDate, adjusted: false, originalDate: null };
}

/**
 * Genera sesiones en modo PARCIAL (hacia adelante desde la clase)
 * Para parciales, recuperatorios, y temas con clase previa
 */
async function generateParcialSessions(
  topic: Topic,
  exam: Exam | null,
  userId: string
): Promise<SessionToCreate[]> {
  const sessions: SessionToCreate[] = [];
  const sourceDate = new Date(topic.source_date!);
  sourceDate.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calcular días hasta el examen (si existe)
  let daysToExam: number | null = null;
  if (exam) {
    const examDate = new Date(exam.date);
    examDate.setHours(0, 0, 0, 0);
    daysToExam = daysBetween(today, examDate);
  }

  // Calcular duración base con multiplicador de dificultad
  const baseDuration = topic.hours * DIFFICULTY_MULTIPLIERS[topic.difficulty];

  // Verificar si Google Calendar está conectado
  const googleService = getGoogleCalendarService();
  const hasGoogleCalendar = await googleService.isConnected(userId);

  // Generar 4 sesiones con intervalos fijos
  for (let i = 0; i < SPACED_REPETITION_INTERVALS.length; i++) {
    const intervalDays = SPACED_REPETITION_INTERVALS[i];
    const sessionNumber = i + 1;

    // Calcular fecha de la sesión (source_date + intervalo)
    let scheduledDate = new Date(sourceDate);
    scheduledDate.setDate(scheduledDate.getDate() + intervalDays);
    scheduledDate.setHours(9, 0, 0, 0); // Default: 9:00 AM

    // VALIDACIÓN: Garantizar que la sesión sea al menos 1 día después de hoy
    // Si scheduledDate <= today, ajustar al día siguiente de hoy
    if (scheduledDate <= today) {
      scheduledDate.setTime(today.getTime());
      scheduledDate.setDate(scheduledDate.getDate() + 1);
    }

    // Calcular duración (base × factor de reducción, mínimo 15 minutos)
    const duration = Math.max(15, Math.round(baseDuration * DURATION_FACTORS[i]));

    // NUEVO: Verificar conflictos con Google Calendar si está conectado
    let conflictResult = null;
    if (hasGoogleCalendar) {
      conflictResult = await findConflictFreeSlot(userId, scheduledDate, duration);
      scheduledDate = conflictResult.date;
      
      if (conflictResult.adjusted) {
        console.log(`[SessionGenerator] Session ${sessionNumber} adjusted to avoid conflict: ${scheduledDate.toISOString()}`);
      }
    }

    // Calcular días hasta esta sesión (desde hoy)
    const daysToSession = daysBetween(today, scheduledDate);

    // Calcular prioridad
    const priority = calculatePriority({
      daysToExam,
      difficulty: topic.difficulty,
      sessionNumber,
      daysToSession,
      isFinal: false,
    });

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
      adjusted_for_conflict: conflictResult?.adjusted || false,
      original_scheduled_at: conflictResult?.originalDate?.toISOString() || null,
    });
  }

  return sessions;
}

/**
 * Genera sesiones en modo FREE_STUDY (desde HOY hacia adelante)
 * Para finales y estudio libre - Primera sesión HOY/MAÑANA
 */
async function generateFreeStudySessions(
  topic: Topic,
  exam: Exam | null,
  userId: string
): Promise<SessionToCreate[]> {
  const sessions: SessionToCreate[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Calcular días al examen (si existe)
  let daysToExam: number | null = null;
  if (exam) {
    const examDate = new Date(exam.date);
    examDate.setHours(0, 0, 0, 0);
    daysToExam = daysBetween(today, examDate);
  }

  // Generar 4 sesiones con intervalos Anki DESDE HOY
  // Intervalos: [1, 3, 7, 14] días desde hoy
  const baseDuration = topic.hours * DIFFICULTY_MULTIPLIERS[topic.difficulty];

  // Verificar si Google Calendar está conectado
  const googleService = getGoogleCalendarService();
  const hasGoogleCalendar = await googleService.isConnected(userId);

  for (let i = 0; i < SPACED_REPETITION_INTERVALS.length; i++) {
    const intervalDays = SPACED_REPETITION_INTERVALS[i];
    const sessionNumber = i + 1;

    // Calcular fecha (today + intervalo)
    // Garantiza que intervalDays es al menos 1 (ya definido como [1, 3, 7, 14])
    let scheduledDate = new Date(today);
    scheduledDate.setDate(scheduledDate.getDate() + intervalDays);
    scheduledDate.setHours(9, 0, 0, 0); // 9:00 AM

    // VALIDACIÓN EXPLÍCITA: Verificar que la sesión sea al menos mañana
    if (intervalDays < 1) {
      throw new Error('Los intervalos deben ser al menos 1 día');
    }

    // Calcular duración con multiplicador de dificultad
    const duration = Math.max(15, Math.round(baseDuration * DURATION_FACTORS[i]));

    let conflictResult = null;
        // NUEVO: Verificar conflictos con Google Calendar si está conectado
    if (hasGoogleCalendar) {
      let conflictResult = await findConflictFreeSlot(userId, scheduledDate, duration);
      scheduledDate = conflictResult.date;
      
      if (conflictResult.adjusted) {
        console.log(`[SessionGenerator] Session ${sessionNumber} adjusted to avoid conflict: ${scheduledDate.toISOString()}`);
      }
    }

    // Calcular días hasta esta sesión
    const daysToSession = daysBetween(today, scheduledDate);

    // Calcular prioridad (con bonus para finales)
    const priority = calculatePriority({
      daysToExam,
      difficulty: topic.difficulty,
      sessionNumber,
      daysToSession,
      isFinal: exam?.type.startsWith('FINAL_') || false,
    });

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
      adjusted_for_conflict: conflictResult?.adjusted || false,
      original_scheduled_at: conflictResult?.originalDate?.toISOString() || null,
    });
  }

  return sessions;
}

/**
 * Genera las sesiones de repaso para un topic
 * Detecta automáticamente el modo (PARCIAL o COUNTDOWN) según el tipo de examen
 * @param topic - El tema a partir del cual generar sesiones
 * @param exam - El examen asociado (opcional)
 * @param userId - ID del usuario
 * @returns Array de sesiones a crear
 */
export async function generateSessionsForTopic(
  topic: Topic,
  exam: Exam | null,
  userId: string
): Promise<SessionToCreate[]> {
  // Validar que tengamos una fecha de referencia
  if (!topic.source_date) {
    throw new Error('Topic must have a source_date to generate sessions');
  }

  // Validar que los intervalos cumplan el mínimo de 1 día
  const minInterval = Math.min(...SPACED_REPETITION_INTERVALS);
  if (minInterval < 1) {
    throw new Error('Session intervals must be at least 1 day');
  }

  const mode = determineMode(exam, topic.source);

  let sessions: SessionToCreate[];
  if (mode === 'FREE_STUDY') {
    // Para finales y estudio libre: desde HOY hacia adelante
    sessions = await generateFreeStudySessions(topic, exam, userId);
  } else {
    // Para clases de parciales: desde source_date hacia adelante
    sessions = await generateParcialSessions(topic, exam, userId);
  }

  // VALIDACIÓN FINAL: Verificar que todas las sesiones sean futuras
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  sessions.forEach((session, index) => {
    const sessionDate = new Date(session.scheduled_at);
    sessionDate.setHours(0, 0, 0, 0);
    
    if (sessionDate <= today) {
      console.warn(`Session ${index + 1} scheduled for ${session.scheduled_at} is not in the future, adjusting...`);
      // Ajustar al menos 1 día después de hoy
      const adjustedDate = new Date(today);
      adjustedDate.setDate(adjustedDate.getDate() + (index + 1));
      adjustedDate.setHours(9, 0, 0, 0);
      session.scheduled_at = adjustedDate.toISOString();
    }
  });

  return sessions;
}

/**
 * Valida si ya existen sesiones para un topic
 * @param existingSessions - Sesiones existentes del usuario
 * @param topicId - ID del topic a verificar
 * @returns true si ya existen sesiones para este topic
 */
export function hasExistingSessions(
  existingSessions: Array<{ topic_id: string }>,
  topicId: string
): boolean {
  return existingSessions.some((session) => session.topic_id === topicId);
}
