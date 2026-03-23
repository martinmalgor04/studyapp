'use server';

import { revalidatePath } from 'next/cache';
import { logger } from '@/lib/utils/logger';
import {
  createTopicSchema,
  updateTopicSchema,
  type CreateTopicInput,
  type UpdateTopicInput,
} from '@/lib/validations/topics';
import { generateSessions } from './sessions';
import { sendNotification } from './notifications';
import { getAuthenticatedUser } from '@/lib/utils/auth';
import {
  findTopicsBySubjectId,
  findTopicById,
  insertTopic,
  findTopicWithOwner,
  updateTopicById,
  deleteTopicById,
  findExamByIdAndSubjectId,
} from '@/lib/repositories/topics.repository';
import { findSubjectByIdAndUserId } from '@/lib/repositories/subjects.repository';

export async function getTopicsBySubject(subjectId: string) {
  return findTopicsBySubjectId(subjectId);
}

export async function getTopic(id: string) {
  return findTopicById(id);
}

export async function createTopic(input: CreateTopicInput) {
  const validationResult = createTopicSchema.safeParse(input);
  if (!validationResult.success) {
    return {
      error: validationResult.error.errors[0].message,
    };
  }

  const user = await getAuthenticatedUser();
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

  if (validationResult.data.exam_id) {
    const exam = await findExamByIdAndSubjectId(
      validationResult.data.exam_id,
      validationResult.data.subject_id,
    );
    if (!exam) {
      return {
        error: 'Examen no encontrado o no pertenece a esta materia',
      };
    }
  }

  const { data, error } = await insertTopic({
    subject_id: validationResult.data.subject_id,
    exam_id: validationResult.data.exam_id || null,
    name: validationResult.data.name,
    description: validationResult.data.description,
    difficulty: validationResult.data.difficulty,
    hours: validationResult.data.hours,
    source: validationResult.data.source,
    source_date: validationResult.data.source_date || null,
  });

  if (error) {
    return { error };
  }

  if (data?.source_date) {
    const sessionsResult = await generateSessions(data.id);
    if (sessionsResult.error) {
      logger.warn('Warning: Could not generate sessions:', sessionsResult.error);
    } else if (sessionsResult.success && sessionsResult.count) {
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
    }
  }

  revalidatePath('/dashboard/subjects');
  revalidatePath(`/dashboard/subjects/${validationResult.data.subject_id}`);
  return { data };
}

export async function updateTopic(id: string, input: UpdateTopicInput) {
  const validationResult = updateTopicSchema.safeParse(input);
  if (!validationResult.success) {
    return {
      error: validationResult.error.errors[0].message,
    };
  }

  const topic = await findTopicWithOwner(id);
  if (!topic) {
    return {
      error: 'Tema no encontrado',
    };
  }

  const user = await getAuthenticatedUser();
  if (!user || topic.subjects.user_id !== user.id) {
    return {
      error: 'No autorizado',
    };
  }

  const updateData = {
    ...validationResult.data,
    exam_id:
      validationResult.data.exam_id === '' ? null : validationResult.data.exam_id || undefined,
  };

  const { data, error } = await updateTopicById(id, updateData);

  if (error) {
    return { error };
  }

  revalidatePath('/dashboard/subjects');
  revalidatePath(`/dashboard/subjects/${topic.subject_id}`);
  return { data };
}

export async function deleteTopic(id: string) {
  const topic = await findTopicWithOwner(id);
  if (!topic) {
    return {
      error: 'Tema no encontrado',
    };
  }

  const user = await getAuthenticatedUser();
  if (!user || topic.subjects.user_id !== user.id) {
    return {
      error: 'No autorizado',
    };
  }

  const { error } = await deleteTopicById(id);

  if (error) {
    return { error };
  }

  revalidatePath('/dashboard/subjects');
  revalidatePath(`/dashboard/subjects/${topic.subject_id}`);
  return { success: true };
}
