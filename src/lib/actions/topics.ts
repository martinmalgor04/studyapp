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
import { deleteSessionsByTopicId } from '@/lib/repositories/exams.repository';

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

  const {
    skip_sessions_created_notification: skipSessionsCreatedNotification,
    skip_google_calendar_sync: skipGoogleCalendarSync,
    ...topicPayload
  } = validationResult.data;

  const subject = await findSubjectByIdAndUserId(
    topicPayload.subject_id,
    user.id,
  );
  if (!subject) {
    return {
      error: 'Materia no encontrada o no autorizado',
    };
  }

  if (topicPayload.exam_id) {
    const exam = await findExamByIdAndSubjectId(
      topicPayload.exam_id,
      topicPayload.subject_id,
    );
    if (!exam) {
      return {
        error: 'Examen no encontrado o no pertenece a esta materia',
      };
    }
  }

  const { data, error } = await insertTopic({
    subject_id: topicPayload.subject_id,
    exam_id: topicPayload.exam_id || null,
    name: topicPayload.name,
    description: topicPayload.description,
    difficulty: topicPayload.difficulty,
    hours: topicPayload.hours,
    source: topicPayload.source,
    source_date: topicPayload.source_date || null,
  });

  if (error) {
    return { error };
  }

  // Generar sesiones si:
  // - source=CLASS o PROGRAM: necesita source_date (ya validado por Zod)
  // - source=FREE_STUDY: usa today como referencia, no necesita source_date
  const shouldGenerateSessions = data?.source_date || data?.source === 'FREE_STUDY';
  if (shouldGenerateSessions) {
    const sessionsResult = await generateSessions(data.id, {
      skipGoogleCalendarSync: skipGoogleCalendarSync === true,
    });
    if (sessionsResult.error) {
      logger.warn('Warning: Could not generate sessions:', sessionsResult.error);
    } else if (
      sessionsResult.success &&
      sessionsResult.count &&
      skipSessionsCreatedNotification !== true
    ) {
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
  revalidatePath(`/dashboard/subjects/${topicPayload.subject_id}`);
  return { data };
}

export async function updateTopic(id: string, input: UpdateTopicInput) {
  const validationResult = updateTopicSchema.safeParse(input);
  if (!validationResult.success) {
    return {
      error: validationResult.error.errors[0].message,
    };
  }

  const topicWithOwner = await findTopicWithOwner(id);
  if (!topicWithOwner) {
    return {
      error: 'Tema no encontrado',
    };
  }

  const user = await getAuthenticatedUser();
  if (!user || topicWithOwner.subjects.user_id !== user.id) {
    return {
      error: 'No autorizado',
    };
  }

  // Leer estado actual antes de actualizar (para detectar cambio de exam_id)
  const currentTopic = await findTopicById(id);

  const newExamId =
    validationResult.data.exam_id === '' ? null : validationResult.data.exam_id || undefined;

  const updateData = {
    ...validationResult.data,
    exam_id: newExamId,
  };

  const { data, error } = await updateTopicById(id, updateData);

  if (error) {
    return { error };
  }

  // Si se asignó (o cambió) el exam_id, regenerar sesiones desde cero
  const examIdChanged =
    newExamId &&
    newExamId !== currentTopic?.exam_id;

  if (examIdChanged && data) {
    logger.debug(`[updateTopic] exam_id changed to ${newExamId}, regenerating sessions for topic ${id}`);
    await deleteSessionsByTopicId(id);
    const sessionsResult = await generateSessions(data.id);
    if (sessionsResult.error) {
      logger.warn('[updateTopic] Could not regenerate sessions after exam change:', sessionsResult.error);
    }
  }

  revalidatePath('/dashboard/subjects');
  revalidatePath(`/dashboard/subjects/${topicWithOwner.subject_id}`);
  revalidatePath('/dashboard/sessions');
  revalidatePath('/dashboard');
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
