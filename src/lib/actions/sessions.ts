'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { generateSessionsForTopic } from '@/lib/services/session-generator';

export async function getUpcomingSessions(days = 7) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + days);

  const { data, error } = await supabase
    .from('sessions')
    .select(`
      *,
      topic:topics(id, name),
      subject:subjects(id, name),
      exam:exams(id, type, date)
    `)
    .eq('user_id', user.id)
    .gte('scheduled_at', today.toISOString())
    .lt('scheduled_at', endDate.toISOString())
    .order('scheduled_at', { ascending: true });

  if (error) {
    console.error('Error fetching upcoming sessions:', error);
    return [];
  }

  return data || [];
}

export async function getTodaySessions() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

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
    .eq('user_id', user.id)
    .gte('scheduled_at', todayStart)
    .lt('scheduled_at', todayEnd)
    .order('priority', { ascending: false })
    .order('scheduled_at', { ascending: true });

  if (error) {
    console.error('Error fetching today sessions:', error);
    return [];
  }

  return data || [];
}

export async function getSessionsBySubject(subjectId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('sessions')
    .select(`
      *,
      topic:topics(id, name),
      subject:subjects(id, name)
    `)
    .eq('user_id', user.id)
    .eq('subject_id', subjectId)
    .order('scheduled_at', { ascending: true });

  if (error) {
    console.error('Error fetching sessions by subject:', error);
    return [];
  }

  return data || [];
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

  const { error } = await supabase
    .from('sessions')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return { error: error.message };
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

  const { error } = await supabase
    .from('sessions')
    .update({ 
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return { error: error.message };
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

  // Obtener sesión para calcular duración si tiene started_at
  const { data: session } = await supabase
    .from('sessions')
    .select('started_at, duration')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  let actualDuration = null;
  if (session?.started_at) {
    const startTime = new Date(session.started_at).getTime();
    const endTime = Date.now();
    actualDuration = Math.round((endTime - startTime) / 60000); // Minutos
  }

  const { error } = await supabase
    .from('sessions')
    .update({ 
      status: 'COMPLETED',
      completed_at: new Date().toISOString(),
      completion_rating: rating,
      actual_duration: actualDuration,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return { error: error.message };
  }

  // Emitir evento para extensiones futuras (gamificación, analytics)
  // Para activar: importar SessionEventRegistry y descomentar
  // const { SessionEventRegistry } = await import('@/lib/services/session-events');
  // await SessionEventRegistry.emitCompleted({
  //   sessionId: id,
  //   userId: user.id,
  //   topicId: session.topic_id,
  //   rating,
  //   actualDuration,
  //   plannedDuration: session.duration,
  //   completedAt: new Date()
  // });

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

  const { error } = await supabase
    .from('sessions')
    .update({
      status: 'INCOMPLETE',
      actual_duration: actualDuration,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/sessions');
  return { success: true };
}

export async function rescheduleSession(id: string, newDate: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'No autenticado' };
  }

  // Validar que la fecha sea futura
  const scheduledDate = new Date(newDate);
  if (scheduledDate <= new Date()) {
    return { error: 'La fecha debe ser en el futuro' };
  }

  // Obtener sesión actual para incrementar attempts
  const { data: session, error: fetchError } = await supabase
    .from('sessions')
    .select('attempts, topic:topics(name), subject:subjects(name)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (fetchError) {
    return { error: fetchError.message };
  }

  const newAttempts = (session.attempts || 0) + 1;

  // Si ya tiene 3+ intentos, auto-abandonar en vez de reagendar
  if (newAttempts > 3) {
    const { error: abandonError } = await supabase
      .from('sessions')
      .update({ status: 'ABANDONED', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id);

    if (abandonError) {
      return { error: abandonError.message };
    }

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/sessions');
    return { success: true, abandoned: true };
  }

  const { error } = await supabase
    .from('sessions')
    .update({
      scheduled_at: newDate,
      status: 'RESCHEDULED',
      attempts: newAttempts,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return { error: error.message };
  }

  // Enviar notificación de reagendado
  const topicName = (session as any).topic?.name || 'Tema';
  const formattedDate = scheduledDate.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  
  const { sendNotification } = await import('./notifications');
  await sendNotification({
    userId: user.id,
    type: 'SESSION_RESCHEDULED',
    title: 'Sesion reagendada',
    message: `"${topicName}" se movio al ${formattedDate}`,
    metadata: { session_id: id, new_date: newDate, attempts: newAttempts }
  });

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

  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return { error: error.message };
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

  const { data, error } = await supabase
    .from('sessions')
    .select(`
      *,
      topic:topics(id, name),
      subject:subjects(id, name),
      exam:exams(id, type, date)
    `)
    .eq('user_id', user.id)
    .gte('scheduled_at', startDate)
    .lte('scheduled_at', endDate)
    .order('scheduled_at', { ascending: true });

  if (error) {
    console.error('Error fetching sessions by date range:', error);
    return [];
  }

  return data || [];
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

  // Obtener el topic con su información completa
  // Validar que pertenece al usuario a través de subject
  const { data: topic, error: topicError } = await supabase
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
    .eq('subject.user_id', user.id)
    .single();

  if (topicError) {
    return { error: topicError.message };
  }

  if (!topic.source_date) {
    return { error: 'El topic debe tener una fecha de origen (source_date)' };
  }

  // Obtener el examen si existe
  let exam = null;
  if (topic.exam_id) {
    const { data: examData } = await supabase
      .from('exams')
      .select('id, type, date')
      .eq('id', topic.exam_id)
      .single();
    
    exam = examData;
  }

  try {
    // Generar las sesiones usando el service
    const sessionsToCreate = await generateSessionsForTopic(topic, exam, user.id);

    // Insertar todas las sesiones en batch
    const { error: insertError } = await supabase
      .from('sessions')
      .insert(sessionsToCreate);

    if (insertError) {
      return { error: insertError.message };
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

  // Obtener sesiones vencidas y PENDING
  const { data: overdueSessions } = await supabase
    .from('sessions')
    .select('id, scheduled_at, topic:topics(name), user_id')
    .eq('user_id', user.id)
    .eq('status', 'PENDING')
    .lt('scheduled_at', now.toISOString());

  if (!overdueSessions || overdueSessions.length === 0) {
    return { processed: 0 };
  }

  let notified = 0;
  let abandoned = 0;

  for (const session of overdueSessions) {
    const scheduledDate = new Date(session.scheduled_at);
    const hoursOverdue = (now.getTime() - scheduledDate.getTime()) / (1000 * 60 * 60);

    if (hoursOverdue > 48) {
      // Más de 2 días: auto-abandonar
      await supabase
        .from('sessions')
        .update({ status: 'ABANDONED', updated_at: now.toISOString() })
        .eq('id', session.id);
      
      abandoned++;
    } else if (hoursOverdue > 24) {
      // 1-2 días: notificar
      const { sendNotification } = await import('./notifications');
      await sendNotification({
        userId: user.id,
        type: 'SESSION_REMINDER',
        title: 'Sesión pendiente',
        message: `La sesión "${(session as any).topic.name}" está vencida. ¿La completaste?`,
        metadata: { session_id: session.id }
      });
      
      notified++;
    }
  }

  if (abandoned > 0 || notified > 0) {
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/sessions');
  }

  return { notified, abandoned, processed: notified + abandoned };
}
