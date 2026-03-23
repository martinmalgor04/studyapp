'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import {
  createExamSchema,
  updateExamSchema,
  type CreateExamInput,
  type UpdateExamInput,
} from '@/lib/validations/exams';
import { generateSessions } from './sessions';
import {
  findExamsBySubjectId,
  findExamById,
  insertExam,
  findExamWithOwner,
  updateExamById,
  deleteExamById,
  findTopicsBySubjectIdForConversion,
  deleteSessionsByTopicId,
  updateTopicForFinalConversion,
  updateSubjectStatusById,
} from '@/lib/repositories/exams.repository';
import { findSubjectByIdAndUserId } from '@/lib/repositories/subjects.repository';

export async function getExamsBySubject(subjectId: string) {
  return findExamsBySubjectId(subjectId);
}

export async function getExam(id: string) {
  return findExamById(id);
}

export async function createExam(input: CreateExamInput) {
  const validationResult = createExamSchema.safeParse(input);
  if (!validationResult.success) {
    return {
      error: validationResult.error.errors[0].message,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: 'No autenticado',
    };
  }

  const subject = await findSubjectByIdAndUserId(
    validationResult.data.subject_id,
    user.id,
  );

  if (!subject) {
    return {
      error: 'Materia no encontrada o no autorizado',
    };
  }

  const result = await insertExam({
    subject_id: validationResult.data.subject_id,
    type: validationResult.data.type,
    number: validationResult.data.number,
    date: validationResult.data.date,
    description: validationResult.data.description,
  });

  if (result.error) {
    return { error: result.error };
  }

  const data = result.data!;

  if (data.type.startsWith('FINAL_')) {
    await convertTopicsToFinal(data.id, data.subject_id);
    await updateSubjectStatusById(data.subject_id, 'REGULAR');
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
  const topics = await findTopicsBySubjectIdForConversion(subjectId);

  if (!topics || topics.length === 0) {
    logger.warn('No topics found to convert for subject:', subjectId);
    return;
  }

  for (const topic of topics) {
    if (topic.exam_id !== finalExamId) {
      try {
        await deleteSessionsByTopicId(topic.id);
        await updateTopicForFinalConversion(topic.id, finalExamId);
        await generateSessions(topic.id);
      } catch (err) {
        logger.error(`Error converting topic ${topic.id} to final:`, err);
      }
    }
  }
}

export async function updateExam(id: string, input: UpdateExamInput) {
  const validationResult = updateExamSchema.safeParse(input);
  if (!validationResult.success) {
    return {
      error: validationResult.error.errors[0].message,
    };
  }

  const exam = await findExamWithOwner(id);

  if (!exam) {
    return {
      error: 'Examen no encontrado',
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || exam.subjects.user_id !== user.id) {
    return {
      error: 'No autorizado',
    };
  }

  const result = await updateExamById(id, validationResult.data);

  if (result.error) {
    return { error: result.error };
  }

  revalidatePath('/dashboard/subjects');
  revalidatePath(`/dashboard/subjects/${exam.subject_id}`);
  return { data: result.data };
}

export async function deleteExam(id: string) {
  const exam = await findExamWithOwner(id);

  if (!exam) {
    return {
      error: 'Examen no encontrado',
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || exam.subjects.user_id !== user.id) {
    return {
      error: 'No autorizado',
    };
  }

  const result = await deleteExamById(id);

  if (result.error) {
    return { error: result.error };
  }

  revalidatePath('/dashboard/subjects');
  revalidatePath(`/dashboard/subjects/${exam.subject_id}`);
  return { success: true };
}
