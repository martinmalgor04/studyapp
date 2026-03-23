'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import {
  createSubjectSchema,
  updateSubjectSchema,
  type CreateSubjectInput,
  type UpdateSubjectInput,
} from '@/lib/validations/subjects';

interface SubjectRow {
  id: string;
  name: string;
  description: string | null;
  year: number | null;
  semester: number | null;
  status: string;
  professors: string[] | null;
  schedule: unknown;
  user_id: string;
  is_active: boolean;
  created_at: string;
  sessions?: Array<{ id: string; status: string }>;
}

export async function getSubjects(includeAprobadas: boolean = false) {
  const supabase = await createClient();

  let query = supabase
    .from('subjects')
    .select(`
      *,
      sessions(id, status)
    `)
    .eq('is_active', true);

  // Por defecto, ocultar materias aprobadas
  if (!includeAprobadas) {
    query = query.neq('status', 'APROBADA');
  }

  const { data: subjects, error } = await query.order('created_at', { ascending: false }) as { data: SubjectRow[] | null; error: unknown };

  if (error) {
    logger.error('Error fetching subjects:', error);
    return [];
  }

  // Progreso de la materia (caso de uso actual).
  // Hoy: % = (sesiones COMPLETED / total sesiones de la materia). Las sesiones vienen de topics
  // vinculados a la materia. Sirve para ver avance en repasos generados.
  // Futuro: se va a virar esto hacia el programa de la materia (temas del programa vs. completados),
  // para que el progreso refleje cobertura del programa en lugar de solo sesiones completadas.
  const subjectsWithProgress = subjects?.map((subject: SubjectRow) => {
    const sessions = subject.sessions || [];
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter((s) => s.status === 'COMPLETED').length;
    const progressPercentage = totalSessions > 0
      ? Math.round((completedSessions / totalSessions) * 100)
      : 0;

    return {
      ...subject,
      total_sessions: totalSessions,
      completed_sessions: completedSessions,
      progress_percentage: progressPercentage,
      sessions: undefined, // Remover para no incluir en el resultado final
    };
  }) || [];

  return subjectsWithProgress;
}

export async function getSubject(id: string) {
  const supabase = await createClient();

  const { data: subject, error } = await supabase
    .from('subjects')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    logger.error('Error fetching subject:', error);
    return null;
  }

  return subject;
}

export async function createSubject(input: CreateSubjectInput): Promise<{ error?: string; data?: { id: string; name: string } }> {
  const supabase = await createClient();

  // Validar input
  const validationResult = createSubjectSchema.safeParse(input);
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

  // Crear subject
  const { data, error } = await supabase
    .from('subjects')
    .insert({
      name: validationResult.data.name,
      description: validationResult.data.description,
      year: validationResult.data.year,
      semester: validationResult.data.semester,
      status: validationResult.data.status || 'CURSANDO',
      professors: validationResult.data.professors,
      schedule: validationResult.data.schedule,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) {
    logger.error('Error creating subject:', error);
    return {
      error: 'Error al crear la materia',
    };
  }

  revalidatePath('/dashboard/subjects');
  return { data: data as { id: string; name: string } };
}

export async function updateSubject(id: string, input: UpdateSubjectInput) {
  const supabase = await createClient();

  // Validar input
  const validationResult = updateSubjectSchema.safeParse(input);
  if (!validationResult.success) {
    return {
      error: validationResult.error.errors[0].message,
    };
  }

  // Si se está cambiando a LIBRE, usar la función especial
  if (validationResult.data.status === 'LIBRE') {
    return setSubjectLibre(id);
  }

  // Actualizar subject
  const { data, error } = await supabase
    .from('subjects')
    .update(validationResult.data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    logger.error('Error updating subject:', error);
    return {
      error: 'Error al actualizar la materia',
    };
  }

  revalidatePath('/dashboard/subjects');
  revalidatePath(`/dashboard/subjects/${id}`);
  return { data };
}

export async function deleteSubject(id: string) {
  const supabase = await createClient();

  // Soft delete (marcar como inactivo)
  const { error } = await supabase.from('subjects').update({ is_active: false }).eq('id', id);

  if (error) {
    logger.error('Error deleting subject:', error);
    return {
      error: 'Error al eliminar la materia',
    };
  }

  revalidatePath('/dashboard/subjects');
  return { success: true };
}

/**
 * Cambia el estado de una materia a LIBRE
 * Marca todas las sesiones PENDING como ABANDONED
 */
export async function setSubjectLibre(subjectId: string) {
  const supabase = await createClient();

  // 1. Marcar sesiones PENDING como ABANDONED
  const { error: sessionsError } = await supabase
    .from('sessions')
    .update({ status: 'ABANDONED' })
    .eq('subject_id', subjectId)
    .eq('status', 'PENDING');

  if (sessionsError) {
    logger.error('Error updating sessions:', sessionsError);
    return {
      error: 'Error al marcar sesiones como abandonadas',
    };
  }

  // 2. Actualizar status de la materia
  const { error: subjectError } = await supabase
    .from('subjects')
    .update({ status: 'LIBRE' })
    .eq('id', subjectId);

  if (subjectError) {
    logger.error('Error updating subject status:', subjectError);
    return {
      error: 'Error al cambiar estado de la materia',
    };
  }

  revalidatePath('/dashboard/subjects');
  revalidatePath(`/dashboard/subjects/${subjectId}`);
  return { success: true };
}
