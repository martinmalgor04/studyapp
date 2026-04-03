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
import {
  findAllSubjects,
  findSubjectById,
  insertSubject,
  updateSubjectById,
  softDeleteSubject,
  abandonSessionsBySubjectId,
  updateSubjectStatus,
} from '@/lib/repositories/subjects.repository';

export async function getSubjects(includeAprobadas: boolean = false) {
  return findAllSubjects({ includeAprobadas });
}

export async function getSubject(id: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    logger.warn('getSubject: unauthenticated request');
    return null;
  }

  return findSubjectById(id);
}

export async function createSubject(input: CreateSubjectInput): Promise<{ error?: string; data?: { id: string; name: string } }> {
  const validationResult = createSubjectSchema.safeParse(input);
  if (!validationResult.success) {
    return { error: validationResult.error.errors[0].message };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'No autenticado' };
  }

  const {
    name,
    description,
    year,
    semester,
    status,
    professors,
    schedule,
    total_hours,
    weekly_hours,
    bibliography,
    evaluation_criteria,
    ai_extraction_id,
  } = validationResult.data;

  const result = await insertSubject({
    name,
    description: description ?? null,
    year: year ?? null,
    semester: semester ?? null,
    status: status ?? 'CURSANDO',
    professors: professors ?? null,
    schedule: schedule as Parameters<typeof insertSubject>[0]['schedule'],
    user_id: user.id,
    total_hours: total_hours ?? null,
    weekly_hours: weekly_hours ?? null,
    bibliography: bibliography ?? null,
    evaluation_criteria: evaluation_criteria ?? null,
    ai_extraction_id: ai_extraction_id ?? null,
  });

  if (result.error) {
    return { error: result.error };
  }

  revalidatePath('/dashboard/subjects');
  return { data: result.data as { id: string; name: string } };
}

export async function updateSubject(id: string, input: UpdateSubjectInput) {
  const validationResult = updateSubjectSchema.safeParse(input);
  if (!validationResult.success) {
    return { error: validationResult.error.errors[0].message };
  }

  if (validationResult.data.status === 'LIBRE') {
    return setSubjectLibre(id);
  }

  const {
    name,
    description,
    year,
    semester,
    status,
    professors,
    schedule,
    total_hours,
    weekly_hours,
    bibliography,
    evaluation_criteria,
    ai_extraction_id,
  } = validationResult.data;

  const result = await updateSubjectById(id, {
    ...(name !== undefined && { name }),
    ...(description !== undefined && { description }),
    ...(year !== undefined && { year }),
    ...(semester !== undefined && { semester }),
    ...(status !== undefined && { status }),
    ...(professors !== undefined && { professors }),
    ...(schedule !== undefined && { schedule: schedule as Parameters<typeof updateSubjectById>[1]['schedule'] }),
    ...(total_hours !== undefined && { total_hours }),
    ...(weekly_hours !== undefined && { weekly_hours }),
    ...(bibliography !== undefined && { bibliography }),
    ...(evaluation_criteria !== undefined && { evaluation_criteria }),
    ...(ai_extraction_id !== undefined && { ai_extraction_id }),
  });

  if (result.error) {
    return { error: result.error };
  }

  revalidatePath('/dashboard/subjects');
  revalidatePath(`/dashboard/subjects/${id}`);
  return { data: result.data };
}

export async function deleteSubject(id: string) {
  const result = await softDeleteSubject(id);

  if (result.error) {
    return { error: result.error };
  }

  revalidatePath('/dashboard/subjects');
  return { success: true };
}

/**
 * Cambia el estado de una materia a LIBRE
 * Marca todas las sesiones PENDING como ABANDONED
 */
export async function setSubjectLibre(subjectId: string) {
  const sessionsResult = await abandonSessionsBySubjectId(subjectId);
  if (sessionsResult.error) {
    return { error: sessionsResult.error };
  }

  const statusResult = await updateSubjectStatus(subjectId, 'LIBRE');
  if (statusResult.error) {
    return { error: statusResult.error };
  }

  revalidatePath('/dashboard/subjects');
  revalidatePath(`/dashboard/subjects/${subjectId}`);
  return { success: true };
}
