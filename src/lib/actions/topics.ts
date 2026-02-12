'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  createTopicSchema,
  updateTopicSchema,
  type CreateTopicInput,
  type UpdateTopicInput,
} from '@/lib/validations/topics';
import { generateSessions } from './sessions';
import { sendNotification } from './notifications';

export async function getTopicsBySubject(subjectId: string) {
  const supabase = await createClient();

  const { data: topics, error } = await supabase
    .from('topics')
    .select('*')
    .eq('subject_id', subjectId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching topics:', error);
    return [];
  }

  return topics;
}

export async function getTopic(id: string) {
  const supabase = await createClient();

  const { data: topic, error } = await supabase.from('topics').select('*').eq('id', id).single();

  if (error) {
    console.error('Error fetching topic:', error);
    return null;
  }

  return topic;
}

export async function createTopic(input: CreateTopicInput) {
  const supabase = await createClient();

  // Validar input
  const validationResult = createTopicSchema.safeParse(input);
  if (!validationResult.success) {
    return {
      error: validationResult.error.errors[0].message,
    };
  }

  // Obtener usuario actual
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: 'No autenticado',
    };
  }

  // Verificar que el subject pertenece al usuario
  const { data: subject } = await supabase
    .from('subjects')
    .select('id')
    .eq('id', validationResult.data.subject_id)
    .eq('user_id', user.id)
    .single();

  if (!subject) {
    return {
      error: 'Materia no encontrada o no autorizado',
    };
  }

  // Si se proporciona exam_id, verificar que pertenece al subject
  if (validationResult.data.exam_id) {
    const { data: exam } = await supabase
      .from('exams')
      .select('id')
      .eq('id', validationResult.data.exam_id)
      .eq('subject_id', validationResult.data.subject_id)
      .single();

    if (!exam) {
      return {
        error: 'Examen no encontrado o no pertenece a esta materia',
      };
    }
  }

  // Crear topic
  const { data, error } = await supabase
    .from('topics')
    .insert({
      subject_id: validationResult.data.subject_id,
      exam_id: validationResult.data.exam_id || null,
      name: validationResult.data.name,
      description: validationResult.data.description,
      difficulty: validationResult.data.difficulty,
      hours: validationResult.data.hours,
      source: validationResult.data.source,
      source_date: validationResult.data.source_date || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating topic:', error);
    return {
      error: 'Error al crear el tema',
    };
  }

  // Generar sesiones automáticamente si el topic tiene source_date
  if (data.source_date) {
    const sessionsResult = await generateSessions(data.id);
    if (sessionsResult.error) {
      console.warn('Warning: Could not generate sessions:', sessionsResult.error);
      // No retornamos error, el topic ya fue creado exitosamente
    } else if (sessionsResult.success && sessionsResult.count) {
      // Enviar notificación sobre las sesiones generadas
      await sendNotification({
        userId: user.id,
        type: 'SESSION_REMINDER',
        title: 'Nuevas sesiones generadas',
        message: `Se crearon ${sessionsResult.count} sesiones de repaso para "${data.name}"`,
        metadata: {
          topic_id: data.id,
          subject_id: data.subject_id,
          sessions_count: sessionsResult.count,
        },
      });

      // Auto-sincronizar a Google Calendar si está conectado
      try {
        const { syncSessionsToGoogleCalendar } = await import('./google-calendar');
        await syncSessionsToGoogleCalendar();
      } catch (err) {
        console.warn('Could not sync to Google Calendar:', err);
        // No retornar error, las sesiones ya se crearon
      }
    }
  }

  revalidatePath('/dashboard/subjects');
  revalidatePath(`/dashboard/subjects/${validationResult.data.subject_id}`);
  return { data };
}

export async function updateTopic(id: string, input: UpdateTopicInput) {
  const supabase = await createClient();

  // Validar input
  const validationResult = updateTopicSchema.safeParse(input);
  if (!validationResult.success) {
    return {
      error: validationResult.error.errors[0].message,
    };
  }

  // Obtener el topic para verificar permisos
  const { data: topic } = await supabase
    .from('topics')
    .select('subject_id, subjects!inner(user_id)')
    .eq('id', id)
    .single();

  if (!topic) {
    return {
      error: 'Tema no encontrado',
    };
  }

  // Verificar que el usuario es dueño
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || (topic.subjects as { user_id: string }).user_id !== user.id) {
    return {
      error: 'No autorizado',
    };
  }

  // Limpiar exam_id si es string vacío
  const updateData = {
    ...validationResult.data,
    exam_id:
      validationResult.data.exam_id === '' ? null : validationResult.data.exam_id || undefined,
  };

  // Actualizar topic
  const { data, error } = await supabase
    .from('topics')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating topic:', error);
    return {
      error: 'Error al actualizar el tema',
    };
  }

  revalidatePath('/dashboard/subjects');
  revalidatePath(`/dashboard/subjects/${topic.subject_id}`);
  return { data };
}

export async function deleteTopic(id: string) {
  const supabase = await createClient();

  // Obtener el topic para verificar permisos y subject_id
  const { data: topic } = await supabase
    .from('topics')
    .select('subject_id, subjects!inner(user_id)')
    .eq('id', id)
    .single();

  if (!topic) {
    return {
      error: 'Tema no encontrado',
    };
  }

  // Verificar que el usuario es dueño
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || (topic.subjects as { user_id: string }).user_id !== user.id) {
    return {
      error: 'No autorizado',
    };
  }

  // Eliminar topic (hard delete)
  const { error } = await supabase.from('topics').delete().eq('id', id);

  if (error) {
    console.error('Error deleting topic:', error);
    return {
      error: 'Error al eliminar el tema',
    };
  }

  revalidatePath('/dashboard/subjects');
  revalidatePath(`/dashboard/subjects/${topic.subject_id}`);
  return { success: true };
}
