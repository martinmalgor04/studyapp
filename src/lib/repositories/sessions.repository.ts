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
  topic_id: string;
  scheduled_at: string;
  number: number;
  duration: number;
  priority: SessionRow['priority'];
  status: SessionStatus | null;
  adjusted_for_conflict: boolean | null;
  original_scheduled_at: string | null;
  topic: { id: string; name: string } | null;
  subject: { id: string; name: string } | null;
  exam: { id: string; type: string; date: string } | null;
}

export interface SessionWithTopicSubject extends SessionRow {
  topic: { id: string; name: string } | null;
  subject: { id: string; name: string } | null;
}

export interface SessionWithFullJoins extends SessionRow {
  topic: { id: string; name: string } | null;
  subject: { id: string; name: string } | null;
  exam: { id: string; type: string; date: string } | null;
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
    .select(`
      id,
      topic_id,
      scheduled_at,
      number,
      duration,
      priority,
      status,
      adjusted_for_conflict,
      original_scheduled_at,
      topic:topics(id, name),
      subject:subjects(id, name),
      exam:exams(id, type, date)
    `)
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
      topic:topics(id, name),
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
      topic:topics(id, name),
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
      topic:topics(id, name),
      subject:subjects(id, name),
      exam:exams(id, type, date)
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
): Promise<{ topic_id: string; scheduled_at: string } | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('sessions')
    .select('topic_id, scheduled_at')
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
): Promise<{ id: string; type: string; date: string } | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('exams')
    .select('id, type, date')
    .eq('id', examId)
    .single();

  if (error) {
    logger.error('Error fetching exam for generation:', error);
    return null;
  }

  return data;
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
