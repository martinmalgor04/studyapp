'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { generateSessionsForTopic } from '@/lib/services/session-generator';
import { logger } from '@/lib/utils/logger';
import { findAvailabilityByUserId } from '@/lib/repositories/availability.repository';
import { findUserSettings } from '@/lib/repositories/user-settings.repository';
import {
  findUpcomingSessions,
  findTodaySessions,
  findSessionsBySubjectId,
  findSessionsByDateRange,
  findSessionForStatusUpdate,
  updateSessionStatus as repoUpdateSessionStatus,
  updateSessionStarted,
  findSessionForCompletion,
  updateSessionCompleted,
  updateSessionIncomplete,
  findSessionForReschedule,
  updateSessionRescheduled,
  abandonSession,
  findSessionGoogleEventId,
  deleteSessionById,
  findTopicWithFullInfo,
  findExamByIdForGeneration,
  insertSessions,
  findOverduePendingSessions,
  findSessionForPartial,
} from '@/lib/repositories/sessions.repository';

export async function getUpcomingSessions(days = 7) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  return findUpcomingSessions(user.id, days);
}

export async function getTodaySessions() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  return findTodaySessions(user.id);
}

export async function getSessionsBySubject(subjectId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  return findSessionsBySubjectId(user.id, subjectId);
}

export async function updateSessionStatus(
  id: string,
  status: 'PENDING' | 'COMPLETED' | 'RESCHEDULED' | 'ABANDONED' | 'INCOMPLETE'
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'No autenticado' };
  }

  let sessionData: { topic_id: string; scheduled_at: string } | null = null;
  if (status === 'ABANDONED') {
    sessionData = await findSessionForStatusUpdate(id, user.id);
  }

  const { error } = await repoUpdateSessionStatus(id, user.id, status);

  if (error) {
    return { error };
  }

  if (status === 'ABANDONED' && sessionData?.topic_id) {
    const { SessionEventRegistry } = await import('@/lib/services/session-events');
    await SessionEventRegistry.emitAbandoned({
      sessionId: id,
      userId: user.id,
      topicId: sessionData.topic_id,
      reason: 'MANUAL',
      scheduledAt: new Date(sessionData.scheduled_at)
    });
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/sessions');
  return { success: true };
}

export async function startSession(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'No autenticado' };
  }

  const { error } = await updateSessionStarted(id, user.id);

  if (error) {
    return { error };
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/sessions');
  return { success: true };
}

export async function completeSessionWithRating(
  id: string,
  rating: 'EASY' | 'NORMAL' | 'HARD'
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'No autenticado' };
  }

  const session = await findSessionForCompletion(id, user.id);

  let actualDuration: number | null = null;
  if (session?.started_at) {
    const startTime = new Date(session.started_at).getTime();
    const endTime = Date.now();
    actualDuration = Math.round((endTime - startTime) / 60000);
  }

  const { error } = await updateSessionCompleted(id, user.id, {
    rating,
    actualDuration,
  });

  if (error) {
    return { error };
  }

  if (session?.topic_id) {
    const { SessionEventRegistry } = await import('@/lib/services/session-events');
    await SessionEventRegistry.emitCompleted({
      sessionId: id,
      userId: user.id,
      topicId: session.topic_id,
      rating,
      actualDuration,
      plannedDuration: session.duration,
      completedAt: new Date()
    });
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/sessions');
  return { success: true };
}

export async function markSessionIncomplete(
  id: string,
  actualDuration: number
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'No autenticado' };
  }

  const { error } = await updateSessionIncomplete(id, user.id, actualDuration);

  if (error) {
    return { error };
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/sessions');
  return { success: true };
}

const MIN_REMAINING_MINUTES = 10;

export async function createPartialSession(
  sessionId: string,
  actualMinutes: number
): Promise<{ error?: string; success?: boolean; remainingSessionCreated?: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'No autenticado' };
  }

  if (actualMinutes <= 0) {
    return { error: 'La duración real debe ser mayor a 0' };
  }

  const session = await findSessionForPartial(sessionId, user.id);

  if (!session) {
    return { error: 'Sesión no encontrada' };
  }

  if (actualMinutes > session.duration) {
    return { error: 'La duración real no puede superar la duración planificada' };
  }

  const { error: incompleteError } = await updateSessionIncomplete(
    sessionId,
    user.id,
    actualMinutes,
  );

  if (incompleteError) {
    return { error: incompleteError };
  }

  const remaining = session.duration - actualMinutes;

  if (remaining < MIN_REMAINING_MINUTES) {
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/sessions');
    return { success: true, remainingSessionCreated: false };
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);

  const { error: insertError } = await insertSessions([{
    topic_id: session.topic_id,
    subject_id: session.subject_id,
    exam_id: session.exam_id,
    user_id: user.id,
    number: session.number,
    duration: remaining,
    priority: session.priority,
    scheduled_at: tomorrow.toISOString(),
    status: 'PENDING',
  }]);

  if (insertError) {
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/sessions');
    return { error: `Sesión marcada como incompleta, pero falló al crear sesión restante: ${insertError}` };
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/sessions');
  return { success: true, remainingSessionCreated: true };
}

export async function rescheduleSession(id: string, newDate: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'No autenticado' };
  }

  const scheduledDate = new Date(newDate);
  if (scheduledDate <= new Date()) {
    return { error: 'La fecha debe ser en el futuro' };
  }

  const session = await findSessionForReschedule(id, user.id);

  if (!session) {
    return { error: 'Sesión no encontrada' };
  }

  const newAttempts = (session.attempts || 0) + 1;

  if (newAttempts > 3) {
    const { error: abandonError } = await abandonSession(id, user.id);

    if (abandonError) {
      return { error: abandonError };
    }

    if (session.topic_id) {
      const { SessionEventRegistry } = await import('@/lib/services/session-events');
      await SessionEventRegistry.emitAbandoned({
        sessionId: id,
        userId: user.id,
        topicId: session.topic_id,
        reason: 'AUTO',
        scheduledAt: new Date(session.scheduled_at)
      });
    }

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/sessions');
    return { success: true, abandoned: true };
  }

  const { error } = await updateSessionRescheduled(id, user.id, newDate, newAttempts);

  if (error) {
    return { error };
  }

  const topicName = session.topic?.name || 'Tema';
  const formattedDate = scheduledDate.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });

  try {
    logger.debug('[rescheduleSession] Sending notification for user:', user.id);
    const { sendNotification } = await import('./notifications');
    await sendNotification({
      userId: user.id,
      type: 'SESSION_RESCHEDULED',
      title: 'Sesión reagendada',
      message: `"${topicName}" se movió al ${formattedDate}`,
      metadata: { session_id: id, new_date: newDate, attempts: newAttempts }
    });
    logger.debug('[rescheduleSession] Notification sent successfully');
  } catch (notifError) {
    logger.error('[rescheduleSession] Failed to send notification:', notifError);
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/sessions');
  return { success: true };
}

export async function deleteSession(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'No autenticado' };
  }

  const sessionData = await findSessionGoogleEventId(id, user.id);

  const { error } = await deleteSessionById(id, user.id);

  if (error) {
    return { error };
  }

  if (sessionData?.google_event_id) {
    try {
      const { getGoogleCalendarService } = await import('@/lib/services/google-calendar.service');
      const { getGoogleTokens } = await import('@/lib/services/google-tokens.helper');
      const tokens = await getGoogleTokens(user.id);
      if (tokens) {
        const service = getGoogleCalendarService();
        await service.deleteEvent(tokens, sessionData.google_event_id);
        logger.debug(`[deleteSession] Google Calendar event ${sessionData.google_event_id} deleted`);
      }
    } catch (gcalError) {
      logger.warn('[deleteSession] Could not delete Google Calendar event:', gcalError);
    }
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/sessions');
  return { success: true };
}

export async function getSessionsByDateRange(startDate: string, endDate: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  return findSessionsByDateRange(user.id, startDate, endDate);
}

/**
 * Genera sesiones automáticamente para un topic
 * Llama al service session-generator y las inserta en DB
 */
export async function generateSessions(topicId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'No autenticado' };
  }

  const topic = await findTopicWithFullInfo(topicId, user.id);

  if (!topic) {
    return { error: 'Topic no encontrado o no pertenece al usuario' };
  }

  // PARCIAL mode necesita source_date; FREE_STUDY usa today.
  // La validación real ocurre dentro de generateSessionsForTopic.
  if (!topic.source_date && topic.source !== 'FREE_STUDY') {
    return { error: 'El topic debe tener una fecha de clase (source_date) cuando la fuente es Clase o Programa' };
  }

  let exam = null;
  if (topic.exam_id) {
    exam = await findExamByIdForGeneration(topic.exam_id);
  }

  try {
    const [availabilitySlots, userSettings] = await Promise.all([
      findAvailabilityByUserId(user.id),
      findUserSettings(user.id),
    ]);

    const studyHours = {
      startHour: userSettings?.study_start_hour?.substring(0, 5) ?? '08:00',
      endHour: userSettings?.study_end_hour?.substring(0, 5) ?? '23:00',
    };

    const sessionsToCreate = await generateSessionsForTopic(topic, exam, user.id, {
      availabilitySlots,
      studyHours,
    });

    const { error: insertError } = await insertSessions(sessionsToCreate);

    if (insertError) {
      return { error: insertError };
    }

    try {
      const { getGoogleCalendarService } = await import('@/lib/services/google-calendar.service');
      const { getGoogleTokens } = await import('@/lib/services/google-tokens.helper');
      const tokens = await getGoogleTokens(user.id);
      if (tokens) {
        const service = getGoogleCalendarService();
        await service.syncSessions(user.id);
        logger.debug(`[generateSessions] Google Calendar synced for topic ${topicId}`);
      }
    } catch (gcalError) {
      logger.warn('[generateSessions] Could not sync to Google Calendar:', gcalError);
    }

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/sessions');

    return { success: true, count: sessionsToCreate.length };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Error generando sesiones' };
  }
}

/**
 * Procesa sesiones vencidas (auto-abandono)
 * Llamar desde DashboardLayout al renderizar
 */
export async function processOverdueSessions() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { processed: 0 };

  const now = new Date();

  const overdueSessions = await findOverduePendingSessions(user.id);

  if (overdueSessions.length === 0) {
    return { processed: 0 };
  }

  let notified = 0;
  let abandoned = 0;

  for (const session of overdueSessions) {
    const scheduledDate = new Date(session.scheduled_at);
    const hoursOverdue = (now.getTime() - scheduledDate.getTime()) / (1000 * 60 * 60);

    if (hoursOverdue > 48) {
      await repoUpdateSessionStatus(session.id, user.id, 'ABANDONED');

      if (session.topic_id) {
        const { SessionEventRegistry } = await import('@/lib/services/session-events');
        await SessionEventRegistry.emitAbandoned({
          sessionId: session.id,
          userId: user.id,
          topicId: session.topic_id,
          reason: 'AUTO',
          scheduledAt: scheduledDate
        });
      }

      abandoned++;
    } else if (hoursOverdue > 24) {
      try {
        logger.debug('[processOverdueSessions] Sending notification for session:', session.id);
        const { sendNotification } = await import('./notifications');
        await sendNotification({
          userId: user.id,
          type: 'SESSION_REMINDER',
          title: 'Sesión pendiente',
          message: `La sesión "${session.topic?.name || 'Sin tema'}" está vencida. ¿La completaste?`,
          metadata: { session_id: session.id }
        });
        logger.debug('[processOverdueSessions] Notification sent successfully');
        notified++;
      } catch (notifError) {
        logger.error('[processOverdueSessions] Failed to send notification:', notifError);
      }
    }
  }

  if (abandoned > 0 || notified > 0) {
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/sessions');
  }

  return { notified, abandoned, processed: notified + abandoned };
}
