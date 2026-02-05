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
  status: 'PENDING' | 'COMPLETED' | 'RESCHEDULED' | 'ABANDONED'
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

export async function rescheduleSession(id: string, newDate: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'No autenticado' };
  }

  // Obtener sesión actual para incrementar attempts
  const { data: session, error: fetchError } = await supabase
    .from('sessions')
    .select('attempts')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (fetchError) {
    return { error: fetchError.message };
  }

  const { error } = await supabase
    .from('sessions')
    .update({
      scheduled_at: newDate,
      status: 'RESCHEDULED',
      attempts: (session.attempts || 0) + 1,
      updated_at: new Date().toISOString(),
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
