import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import type { Database } from '@/types/database.types';
import type { Difficulty } from '@/lib/validations/topics';

type Tables = Database['public']['Tables'];
type SessionRow = Tables['sessions']['Row'];
type SessionInsert = Tables['sessions']['Insert'];
type SessionStatus = Database['public']['Enums']['session_status'];

// ---------------------------------------------------------------------------
// Return types for joined queries
// ---------------------------------------------------------------------------

export interface UpcomingSession {
  id: string;
  subject_id: string;
  topic_id: string;
  scheduled_at: string;
  number: number;
  duration: number;
  priority: SessionRow['priority'];
  session_type: SessionRow['session_type'];
  status: SessionStatus | null;
  adjusted_for_conflict: boolean | null;
  original_scheduled_at: string | null;
  topic: {
    id: string;
    name: string;
    difficulty: string | null;
    source_date: string | null;
  } | null;
  subject: { id: string; name: string } | null;
  exam: { id: string; category: string; modality: string; date: string } | null;
}

export interface SessionWithTopicSubject extends SessionRow {
  topic: {
    id: string;
    name: string;
    difficulty: string | null;
    source_date: string | null;
  } | null;
  subject: { id: string; name: string } | null;
}

export interface SessionWithFullJoins extends SessionRow {
  topic: {
    id: string;
    name: string;
    difficulty: string | null;
    source_date: string | null;
  } | null;
  subject: { id: string; name: string } | null;
  exam: { id: string; category: string; modality: string; date: string } | null;
}

export interface SessionForReschedule {
  attempts: number | null;
  topic_id: string;
  scheduled_at: string;
  topic: { name: string } | null;
  subject: { name: string } | null;
}

export interface TopicWithFullInfo {
  id: string;
  subject_id: string;
  exam_id: string | null;
  name: string;
  difficulty: Difficulty;
  hours: number;
  source: string;
  source_date: string | null;
  subject: { user_id: string };
}

export interface PendingSessionForSync {
  id: string;
  scheduled_at: string;
  duration: number;
  number: number;
  topic: { name: string } | null;
  subject: { name: string } | null;
}

export interface OverdueSession {
  id: string;
  scheduled_at: string;
  topic_id: string;
  topic: { name: string } | null;
  user_id: string;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** Mismo shape que `findUpcomingSessions` / ventana calendario (lista en UI de sesiones). */
const UPCOMING_SESSIONS_LIST_SELECT = `
      id,
      subject_id,
      topic_id,
      scheduled_at,
      number,
      duration,
      priority,
      session_type,
      status,
      adjusted_for_conflict,
      original_scheduled_at,
      topic:topics(id, name, difficulty, source_date),
      subject:subjects(id, name),
      exam:exams(id, category, modality, date)
    `;

/** Por defecto: ~6 meses de historial + 30 días futuros (navegación calendario semanal/mensual). */
export const SESSIONS_PAGE_DEFAULT_PAST_DAYS = 183;
export const SESSIONS_PAGE_DEFAULT_FUTURE_DAYS = 30;

export async function findUpcomingSessions(
  userId: string,
  days: number,
): Promise<UpcomingSession[]> {
  const supabase = await createClient();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + days);

  const { data, error } = await supabase
    .from('sessions')
    .select(UPCOMING_SESSIONS_LIST_SELECT)
    .eq('user_id', userId)
    .gte('scheduled_at', today.toISOString())
    .lt('scheduled_at', endDate.toISOString())
    .order('scheduled_at', { ascending: true });

  if (error) {
    logger.error('Error fetching upcoming sessions:', error);
    return [];
  }

  return (data ?? []) as unknown as UpcomingSession[];
}

/**
 * Sesiones en rango local [medianoche hoy − pastDays, medianoche hoy + futureDays),
 * mismo select que `findUpcomingSessions` (incluye pasadas dentro de la ventana).
 */
export async function findSessionsCalendarWindow(
  userId: string,
  pastDays: number,
  futureDays: number,
): Promise<UpcomingSession[]> {
  const supabase = await createClient();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - pastDays);

  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + futureDays);

  const { data, error } = await supabase
    .from('sessions')
    .select(UPCOMING_SESSIONS_LIST_SELECT)
    .eq('user_id', userId)
    .gte('scheduled_at', startDate.toISOString())
    .lt('scheduled_at', endDate.toISOString())
    .order('scheduled_at', { ascending: true });

  if (error) {
    logger.error('Error fetching sessions calendar window:', error);
    return [];
  }

  return (data ?? []) as unknown as UpcomingSession[];
}

export async function findTodaySessions(
  userId: string,
): Promise<SessionWithTopicSubject[]> {
  const supabase = await createClient();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStart = today.toISOString();

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const todayEnd = tomorrow.toISOString();

  const { data, error } = await supabase
    .from('sessions')
    .select(`
      *,
      topic:topics(id, name, difficulty, source_date),
      subject:subjects(id, name)
    `)
    .eq('user_id', userId)
    .gte('scheduled_at', todayStart)
    .lt('scheduled_at', todayEnd)
    .order('priority', { ascending: false })
    .order('scheduled_at', { ascending: true });

  if (error) {
    logger.error('Error fetching today sessions:', error);
    return [];
  }

  return (data ?? []) as unknown as SessionWithTopicSubject[];
}

export async function findSessionsBySubjectId(
  userId: string,
  subjectId: string,
): Promise<SessionWithTopicSubject[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('sessions')
    .select(`
      *,
      topic:topics(id, name, difficulty, source_date),
      subject:subjects(id, name)
    `)
    .eq('user_id', userId)
    .eq('subject_id', subjectId)
    .order('scheduled_at', { ascending: true });

  if (error) {
    logger.error('Error fetching sessions by subject:', error);
    return [];
  }

  return (data ?? []) as unknown as SessionWithTopicSubject[];
}

export async function findSessionsByDateRange(
  userId: string,
  startDate: string,
  endDate: string,
): Promise<SessionWithFullJoins[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('sessions')
    .select(`
      *,
      topic:topics(id, name, difficulty, source_date),
      subject:subjects(id, name),
      exam:exams(id, category, modality, date)
    `)
    .eq('user_id', userId)
    .gte('scheduled_at', startDate)
    .lte('scheduled_at', endDate)
    .order('scheduled_at', { ascending: true });

  if (error) {
    logger.error('Error fetching sessions by date range:', error);
    return [];
  }

  return (data ?? []) as unknown as SessionWithFullJoins[];
}

export async function findSessionForStatusUpdate(
  id: string,
  userId: string,
): Promise<{ topic_id: string; scheduled_at: string; duration: number } | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('sessions')
    .select('topic_id, scheduled_at, duration')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error) {
    logger.error('Error fetching session for status update:', error);
    return null;
  }

  return data;
}

export async function updateSessionStatus(
  id: string,
  userId: string,
  status: SessionStatus,
  extra?: Record<string, unknown>,
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('sessions')
    .update({ status, updated_at: new Date().toISOString(), ...extra })
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    logger.error('Error updating session status:', error);
    return { error: error.message };
  }

  return { error: null };
}

export async function updateSessionStarted(
  id: string,
  userId: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('sessions')
    .update({
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    logger.error('Error starting session:', error);
    return { error: error.message };
  }

  return { error: null };
}

export async function findSessionForCompletion(
  id: string,
  userId: string,
): Promise<{ started_at: string | null; duration: number; topic_id: string } | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('sessions')
    .select('started_at, duration, topic_id')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error) {
    logger.error('Error fetching session for completion:', error);
    return null;
  }

  return data;
}

export async function updateSessionCompleted(
  id: string,
  userId: string,
  data: { rating: string; actualDuration: number | null },
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('sessions')
    .update({
      status: 'COMPLETED' as SessionStatus,
      completed_at: new Date().toISOString(),
      completion_rating: data.rating,
      actual_duration: data.actualDuration,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    logger.error('Error completing session:', error);
    return { error: error.message };
  }

  return { error: null };
}

export async function updateSessionIncomplete(
  id: string,
  userId: string,
  actualDuration: number,
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('sessions')
    .update({
      status: 'INCOMPLETE' as SessionStatus,
      actual_duration: actualDuration,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    logger.error('Error marking session incomplete:', error);
    return { error: error.message };
  }

  return { error: null };
}

export async function findSessionForReschedule(
  id: string,
  userId: string,
): Promise<SessionForReschedule | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('sessions')
    .select('attempts, topic_id, scheduled_at, topic:topics(name), subject:subjects(name)')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error) {
    logger.error('Error fetching session for reschedule:', error);
    return null;
  }

  return data as unknown as SessionForReschedule;
}

export async function updateSessionRescheduled(
  id: string,
  userId: string,
  newDate: string,
  attempts: number,
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('sessions')
    .update({
      scheduled_at: newDate,
      status: 'RESCHEDULED' as SessionStatus,
      attempts,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    logger.error('Error rescheduling session:', error);
    return { error: error.message };
  }

  return { error: null };
}

export async function abandonSession(
  id: string,
  userId: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('sessions')
    .update({
      status: 'ABANDONED' as SessionStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    logger.error('Error abandoning session:', error);
    return { error: error.message };
  }

  return { error: null };
}

export async function findSessionGoogleEventId(
  id: string,
  userId: string,
): Promise<{ google_event_id: string | null } | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('sessions')
    .select('google_event_id')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error) {
    logger.error('Error fetching session google event id:', error);
    return null;
  }

  return data;
}

export async function deleteSessionById(
  id: string,
  userId: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    logger.error('Error deleting session:', error);
    return { error: error.message };
  }

  return { error: null };
}

// ---------------------------------------------------------------------------
// Queries for session generation
// ---------------------------------------------------------------------------

export async function findTopicWithFullInfo(
  topicId: string,
  userId: string,
): Promise<TopicWithFullInfo | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('topics')
    .select(`
      id,
      subject_id,
      exam_id,
      name,
      difficulty,
      hours,
      source,
      source_date,
      subject:subjects!inner(user_id)
    `)
    .eq('id', topicId)
    .eq('subject.user_id', userId)
    .single();

  if (error) {
    logger.error('Error fetching topic with full info:', error);
    return null;
  }

  return data as unknown as TopicWithFullInfo;
}

export async function findExamByIdForGeneration(
  examId: string,
): Promise<{ id: string; category: string; modality: string; date: string } | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('exams')
    .select('id, category, modality, date')
    .eq('id', examId)
    .single();

  if (error) {
    logger.error('Error fetching exam for generation:', error);
    return null;
  }

  return data;
}

export interface ExistingSessionSlot {
  scheduled_at: string;
  duration: number;
}

export async function findPendingSessionSlots(
  userId: string,
  startDate: string,
  endDate: string,
): Promise<ExistingSessionSlot[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('sessions')
    .select('scheduled_at, duration')
    .eq('user_id', userId)
    .in('status', ['PENDING', 'RESCHEDULED'])
    .gte('scheduled_at', startDate)
    .lte('scheduled_at', endDate);

  if (error) {
    logger.error('Error fetching pending session slots:', error);
    return [];
  }

  return (data ?? []) as ExistingSessionSlot[];
}

export async function insertSessions(
  sessions: SessionInsert[],
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('sessions')
    .insert(sessions);

  if (error) {
    logger.error('Error inserting sessions:', error);
    return { error: error.message };
  }

  return { error: null };
}

// ---------------------------------------------------------------------------
// Partial session (remaining time)
// ---------------------------------------------------------------------------

export interface SessionForPartial {
  id: string;
  topic_id: string;
  subject_id: string;
  exam_id: string | null;
  user_id: string;
  number: number;
  duration: number;
  priority: SessionRow['priority'];
  scheduled_at: string;
}

export async function findSessionForPartial(
  id: string,
  userId: string,
): Promise<SessionForPartial | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('sessions')
    .select('id, topic_id, subject_id, exam_id, user_id, number, duration, priority, scheduled_at')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error) {
    logger.error('Error fetching session for partial:', error);
    return null;
  }

  return data as unknown as SessionForPartial;
}

// ---------------------------------------------------------------------------
// Overdue processing
// ---------------------------------------------------------------------------

export async function findOverduePendingSessions(
  userId: string,
): Promise<OverdueSession[]> {
  const supabase = await createClient();

  const now = new Date();

  const { data, error } = await supabase
    .from('sessions')
    .select('id, scheduled_at, topic_id, topic:topics(name), user_id')
    .eq('user_id', userId)
    .eq('status', 'PENDING')
    .lt('scheduled_at', now.toISOString());

  if (error) {
    logger.error('Error fetching overdue sessions:', error);
    return [];
  }

  return (data ?? []) as unknown as OverdueSession[];
}

// ---------------------------------------------------------------------------
// Google Calendar integration
// ---------------------------------------------------------------------------

export async function findPendingSessionsWithoutGoogleEvent(
  userId: string,
): Promise<PendingSessionForSync[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('sessions')
    .select(`
      id,
      scheduled_at,
      duration,
      number,
      topic:topics(name),
      subject:subjects(name)
    `)
    .eq('user_id', userId)
    .eq('status', 'PENDING')
    .gte('scheduled_at', new Date().toISOString())
    .is('google_event_id', null);

  if (error) {
    logger.error('Error fetching pending sessions without google event:', error);
    return [];
  }

  return (data ?? []) as unknown as PendingSessionForSync[];
}

export async function updateSessionGoogleEventId(
  sessionId: string,
  eventId: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('sessions')
    .update({
      google_event_id: eventId,
      google_calendar_synced_at: new Date().toISOString(),
    })
    .eq('id', sessionId);

  if (error) {
    logger.error('Error updating session google event id:', error);
    return { error: error.message };
  }

  return { error: null };
}

export async function findSessionGamificationContext(
  sessionId: string,
  userId: string,
): Promise<{
  subjectId: string;
  priority: SessionRow['priority'];
  topicDifficulty: Difficulty;
} | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('sessions')
    .select(
      `
      subject_id,
      priority,
      topic:topics ( difficulty )
    `,
    )
    .eq('id', sessionId)
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    logger.error('Error fetching session gamification context:', error);
    return null;
  }

  const topic = data.topic as { difficulty: Difficulty } | null;
  if (!topic?.difficulty || !data.subject_id) {
    return null;
  }

  return {
    subjectId: data.subject_id,
    priority: data.priority,
    topicDifficulty: topic.difficulty,
  };
}

/** Fechas UTC (YYYY-MM-DD) con al menos una sesión COMPLETED para rachas. */
export async function listCompletedSessionUtcDateKeys(userId: string): Promise<string[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('sessions')
    .select('completed_at')
    .eq('user_id', userId)
    .eq('status', 'COMPLETED')
    .not('completed_at', 'is', null);

  if (error) {
    logger.error('Error listing completed session dates:', error);
    return [];
  }

  const keys = new Set<string>();
  for (const row of data ?? []) {
    if (row.completed_at) {
      keys.add(new Date(row.completed_at).toISOString().slice(0, 10));
    }
  }
  return [...keys];
}
