'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  createExamSchema,
  updateExamSchema,
  type CreateExamInput,
  type UpdateExamInput,
} from '@/lib/validations/exams';
import { generateSessions } from './sessions';

export async function getExamsBySubject(subjectId: string) {
  const supabase = await createClient();

  const { data: exams, error } = await supabase
    .from('exams')
    .select('*')
    .eq('subject_id', subjectId)
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching exams:', error);
    return [];
  }

  return exams;
}

export async function getExam(id: string) {
  const supabase = await createClient();

  const { data: exam, error } = await supabase.from('exams').select('*').eq('id', id).single();

  if (error) {
    console.error('Error fetching exam:', error);
    return null;
  }

  return exam;
}

export async function createExam(input: CreateExamInput) {
  const supabase = await createClient();

  // Validar input
  const validationResult = createExamSchema.safeParse(input);
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

  // Crear exam
  const { data, error } = await supabase
    .from('exams')
    .insert({
      subject_id: validationResult.data.subject_id,
      type: validationResult.data.type,
      number: validationResult.data.number,
      date: validationResult.data.date,
      description: validationResult.data.description,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating exam:', error);
    return {
      error: 'Error al crear el examen',
    };
  }

  // Si es un examen FINAL, convertir topics automáticamente a modo countdown
  // y cambiar el estado de la materia a REGULAR
  if (data.type.startsWith('FINAL_')) {
    await convertTopicsToFinal(data.id, data.subject_id);
    
    // Cambiar estado de materia a REGULAR automáticamente
    await supabase
      .from('subjects')
      .update({ status: 'REGULAR' })
      .eq('id', data.subject_id);
  }

  revalidatePath('/dashboard/subjects');
  revalidatePath(`/dashboard/subjects/${validationResult.data.subject_id}`);
  return { data };
}

/**
 * Convierte automáticamente todos los topics de una materia a modo final
 * cuando se crea un examen tipo FINAL
 * - Elimina sesiones viejas
 * - Actualiza metadata del topic (exam_id, source, source_date)
 * - Regenera sesiones en modo countdown
 */
async function convertTopicsToFinal(finalExamId: string, subjectId: string) {
  const supabase = await createClient();

  // 1. Obtener todos los topics de la materia
  const { data: topics, error: topicsError } = await supabase
    .from('topics')
    .select('id, exam_id')
    .eq('subject_id', subjectId);

  if (topicsError || !topics || topics.length === 0) {
    console.warn('No topics found to convert or error:', topicsError);
    return;
  }

  // 2. Para cada topic, convertir a modo final
  for (const topic of topics) {
    // Solo convertir si no es ya del final
    if (topic.exam_id !== finalExamId) {
      try {
        // Eliminar sesiones viejas
        await supabase.from('sessions').delete().eq('topic_id', topic.id);

        // Actualizar topic
        await supabase
          .from('topics')
          .update({
            exam_id: finalExamId,
            source: 'FREE_STUDY',
            source_date: new Date().toISOString(),
          })
          .eq('id', topic.id);

        // Regenerar sesiones en modo countdown
        await generateSessions(topic.id);
      } catch (err) {
        console.error(`Error converting topic ${topic.id} to final:`, err);
        // Continuar con los demás topics aunque uno falle
      }
    }
  }
}

export async function updateExam(id: string, input: UpdateExamInput) {
  const supabase = await createClient();

  // Validar input
  const validationResult = updateExamSchema.safeParse(input);
  if (!validationResult.success) {
    return {
      error: validationResult.error.errors[0].message,
    };
  }

  // Obtener el exam para verificar permisos
  const { data: exam } = await supabase
    .from('exams')
    .select('subject_id, subjects!inner(user_id)')
    .eq('id', id)
    .single();

  if (!exam) {
    return {
      error: 'Examen no encontrado',
    };
  }

  // Verificar que el usuario es dueño
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || (exam.subjects as any).user_id !== user.id) {
    return {
      error: 'No autorizado',
    };
  }

  // Actualizar exam
  const { data, error } = await supabase
    .from('exams')
    .update(validationResult.data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating exam:', error);
    return {
      error: 'Error al actualizar el examen',
    };
  }

  revalidatePath('/dashboard/subjects');
  revalidatePath(`/dashboard/subjects/${exam.subject_id}`);
  return { data };
}

export async function deleteExam(id: string) {
  const supabase = await createClient();

  // Obtener el exam para verificar permisos y subject_id
  const { data: exam } = await supabase
    .from('exams')
    .select('subject_id, subjects!inner(user_id)')
    .eq('id', id)
    .single();

  if (!exam) {
    return {
      error: 'Examen no encontrado',
    };
  }

  // Verificar que el usuario es dueño
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || (exam.subjects as any).user_id !== user.id) {
    return {
      error: 'No autorizado',
    };
  }

  // Eliminar exam (hard delete)
  const { error } = await supabase.from('exams').delete().eq('id', id);

  if (error) {
    console.error('Error deleting exam:', error);
    return {
      error: 'Error al eliminar el examen',
    };
  }

  revalidatePath('/dashboard/subjects');
  revalidatePath(`/dashboard/subjects/${exam.subject_id}`);
  return { success: true };
}
