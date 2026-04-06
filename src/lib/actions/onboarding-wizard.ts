'use server';

import { revalidatePath } from 'next/cache';
import { logger } from '@/lib/utils/logger';
import { createClient } from '@/lib/supabase/server';
import { dateToLocalArgentinaMinutes } from '@/lib/services/session-generator';
import type { OccupiedRange } from '@/lib/services/slot-resolver';
import {
  getSequentialClassDatesForTopics,
  generatePreClassSessions,
  type TopicWithClassDate,
} from '@/lib/services/pre-class-generator';
import { findAvailabilityByUserId } from '@/lib/repositories/availability.repository';
import { findUserSettings } from '@/lib/repositories/user-settings.repository';
import { insertSessions, findPendingSessionSlots } from '@/lib/repositories/sessions.repository';
import { getAuthenticatedUser } from '@/lib/utils/auth';
import { createSubject } from './subjects';
import { createExam } from './exams';
import { createTopic } from './topics';
import { sendNotification } from './notifications';

// --- Types ---

export interface SubjectWizardInput {
  subject: {
    name: string;
    year?: number;
    semester?: 'ANNUAL' | 'FIRST' | 'SECOND';
    professors?: string;
    description?: string;
    studyPath: 'CURSANDO' | 'LIBRE';
  };

  freeStudy?: {
    examDate: string;
    topics: Array<{
      name: string;
      difficulty: 'EASY' | 'MEDIUM' | 'HARD';
      hours: number;
    }>;
  };

  cursada?: {
    schedule: Array<{
      day: 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado';
      startTime: string;
      endTime: string;
    }>;
    topics: Array<{
      name: string;
      difficulty: 'EASY' | 'MEDIUM' | 'HARD';
      hours: number;
    }>;
    parciales: Array<{
      name: string;
      date: string;
      category: 'PARCIAL' | 'RECUPERATORIO';
      modality: 'THEORY' | 'PRACTICE' | 'THEORY_PRACTICE';
      topicIndices: number[];
    }>;
    /**
     * Opcional: misma longitud y orden que `topics`. Fecha de clase confirmada por índice (YYYY-MM-DD, UTC medianoche).
     */
    topicClassDates?: string[];
  };

  /** Metadata persistida al crear la materia (Sprint 7h) */
  pdfMetadata?: {
    extractionId?: string;
    totalHours?: number;
    weeklyHours?: number;
    bibliography?: string[];
    evaluationCriteria?: string;
  };
}

export interface SubjectWizardResult {
  error?: string;
  data?: {
    subjectId: string;
    subjectName: string;
    topicsCreated: number;
    sessionsGenerated: number;
    /** Aviso no bloqueante (p. ej. fallo al persistir pre-clases) */
    warning?: string;
  };
}

const SESSIONS_PER_TOPIC = 4;

async function notifyWizardBulkSessionsSummary(params: {
  subjectId: string;
  subjectName: string;
  topicsCreated: number;
  sessionsCount: number;
}): Promise<void> {
  const { subjectId, subjectName, topicsCreated, sessionsCount } = params;
  const user = await getAuthenticatedUser();
  if (!user) {
    logger.warn(
      '[completeSubjectWizard] Usuario no autenticado; se omite notificación de resumen de sesiones generadas.',
    );
    return;
  }
  await sendNotification({
    userId: user.id,
    type: 'SESSION_REMINDER',
    title: 'Nuevas sesiones generadas',
    message: `Se generaron sesiones para la materia "${subjectName}": ${topicsCreated} temas, ${sessionsCount} sesiones`,
    metadata: {
      subject_id: subjectId,
      topics_created: topicsCreated,
      sessions_count: sessionsCount,
    },
  });
}

function formatUtcYmd(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const STRICT_YMD_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Medianoche UTC para strings tipo YYYY-MM-DD o ISO. */
function parseParcialDateUtcMidnight(dateStr: string): Date {
  const trimmed = dateStr.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed);
  if (match) {
    return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  }
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return new Date(0);
  }
  return new Date(
    Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()),
  );
}

export async function completeSubjectWizard(
  input: SubjectWizardInput,
): Promise<SubjectWizardResult> {
  const { subject, freeStudy, cursada, pdfMetadata } = input;

  // 1. Create subject
  const subjectResult = await createSubject({
    name: subject.name,
    year: subject.year,
    semester: subject.semester,
    description: subject.description,
    status: subject.studyPath === 'LIBRE' ? 'LIBRE' : 'CURSANDO',
    professors: subject.professors ? [subject.professors] : undefined,
    schedule: cursada?.schedule,
    total_hours: pdfMetadata?.totalHours,
    weekly_hours: pdfMetadata?.weeklyHours,
    bibliography: pdfMetadata?.bibliography,
    evaluation_criteria: pdfMetadata?.evaluationCriteria,
    ai_extraction_id: pdfMetadata?.extractionId,
  });

  if (subjectResult.error || !subjectResult.data) {
    logger.error('[completeSubjectWizard] Failed to create subject:', subjectResult.error);
    return { error: subjectResult.error ?? 'Error al crear la materia' };
  }

  const { id: subjectId, name: subjectName } = subjectResult.data;
  logger.info(`[completeSubjectWizard] Subject created: ${subjectId} — ${subjectName}`);

  if (pdfMetadata?.extractionId) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { error: linkErr } = await supabase
        .from('ai_extractions')
        .update({ subject_id: subjectId })
        .eq('id', pdfMetadata.extractionId)
        .eq('user_id', user.id);
      if (linkErr) {
        logger.warn('[completeSubjectWizard] No se pudo vincular extracción IA a la materia:', linkErr.message);
      }
    }
  }

  // 2. Branch by study path
  if (subject.studyPath === 'LIBRE' && freeStudy) {
    return handleLibrePath(subjectId, subjectName, freeStudy);
  }

  if (subject.studyPath === 'CURSANDO' && cursada) {
    return handleCursadaPath(subjectId, subjectName, cursada);
  }

  logger.error('[completeSubjectWizard] Invalid studyPath/data combination');
  return { error: 'Datos inválidos: falta información del path de estudio' };
}

// --- Path LIBRE ---

async function handleLibrePath(
  subjectId: string,
  subjectName: string,
  freeStudy: NonNullable<SubjectWizardInput['freeStudy']>,
): Promise<SubjectWizardResult> {
  const examResult = await createExam({
    subject_id: subjectId,
    category: 'FINAL',
    modality: 'THEORY_PRACTICE',
    date: freeStudy.examDate,
  });

  if (examResult.error || !examResult.data) {
    logger.error('[completeSubjectWizard] Failed to create FINAL exam:', examResult.error);
    return { error: `Error al crear examen final: ${examResult.error}` };
  }

  const examId = examResult.data.id as string;
  logger.info(`[completeSubjectWizard] FINAL exam created: ${examId}`);

  const topicsCreated = await createTopicsBatch(
    subjectId,
    examId,
    freeStudy.topics,
    'FREE_STUDY',
  );

  const sessionsGenerated = topicsCreated * SESSIONS_PER_TOPIC;
  if (topicsCreated > 0) {
    await notifyWizardBulkSessionsSummary({
      subjectId,
      subjectName,
      topicsCreated,
      sessionsCount: sessionsGenerated,
    });
  }

  revalidatePath('/dashboard');

  return {
    data: {
      subjectId,
      subjectName,
      topicsCreated,
      sessionsGenerated,
    },
  };
}

// --- Path CURSADA ---

async function handleCursadaPath(
  subjectId: string,
  subjectName: string,
  cursada: NonNullable<SubjectWizardInput['cursada']>,
): Promise<SubjectWizardResult> {
  // Build topic→exam mapping from parciales
  const topicExamMap = new Map<number, string>();

  for (let i = 0; i < cursada.parciales.length; i++) {
    const parcial = cursada.parciales[i];

    const examResult = await createExam({
      subject_id: subjectId,
      category: parcial.category,
      modality: parcial.modality,
      number: i + 1,
      date: parcial.date,
      description: parcial.name,
    });

    if (examResult.error || !examResult.data) {
      logger.error(
        `[completeSubjectWizard] Failed to create parcial "${parcial.name}":`,
        examResult.error,
      );
      return { error: `Error al crear parcial "${parcial.name}": ${examResult.error}` };
    }

    const examId = examResult.data.id as string;
    logger.info(`[completeSubjectWizard] Parcial "${parcial.name}" created: ${examId}`);

    for (const topicIdx of parcial.topicIndices) {
      topicExamMap.set(topicIdx, examId);
    }
  }

  const rangeStart = new Date();
  rangeStart.setUTCHours(0, 0, 0, 0);

  let rangeEnd: Date;
  if (cursada.parciales.length === 0) {
    rangeEnd = new Date(rangeStart);
    rangeEnd.setUTCDate(rangeEnd.getUTCDate() + 365);
  } else {
    const lastParcial = cursada.parciales.reduce<Date>((max, p) => {
      const d = parseParcialDateUtcMidnight(p.date);
      return d > max ? d : max;
    }, parseParcialDateUtcMidnight(cursada.parciales[0].date));
    rangeEnd = new Date(lastParcial);
    rangeEnd.setUTCHours(0, 0, 0, 0);
    rangeEnd.setUTCDate(rangeEnd.getUTCDate() + 1);
  }

  const classDates = getSequentialClassDatesForTopics(
    cursada.schedule,
    cursada.topics.length,
    rangeStart,
    rangeEnd,
  );

  const topicClassDates = cursada.topicClassDates;
  const useConfirmedTopicDates =
    topicClassDates != null && topicClassDates.length === cursada.topics.length;

  const topicsWithDates: TopicWithClassDate[] = [];
  let topicsCreated = 0;

  for (let i = 0; i < cursada.topics.length; i++) {
    const topicSpec = cursada.topics[i];
    const examId = topicExamMap.get(i);
    const confirmedRaw = useConfirmedTopicDates ? topicClassDates[i] : undefined;
    const confirmedTrimmed =
      typeof confirmedRaw === 'string' ? confirmedRaw.trim() : '';
    const classDateUsed =
      confirmedTrimmed !== '' && STRICT_YMD_RE.test(confirmedTrimmed)
        ? parseParcialDateUtcMidnight(confirmedTrimmed)
        : (classDates[i] ?? new Date(rangeStart.getTime()));
    const sourceDateStr = formatUtcYmd(classDateUsed);

    const topicResult = await createTopic({
      subject_id: subjectId,
      exam_id: examId,
      name: topicSpec.name,
      difficulty: topicSpec.difficulty,
      hours: topicSpec.hours,
      source: 'CLASS',
      source_date: sourceDateStr,
      skip_sessions_created_notification: true,
    });

    if (topicResult.error || !topicResult.data) {
      logger.error(
        `[completeSubjectWizard] Failed to create topic "${topicSpec.name}":`,
        topicResult.error,
      );
      continue;
    }

    topicsCreated++;
    topicsWithDates.push({
      id: topicResult.data.id,
      subject_id: subjectId,
      exam_id: topicResult.data.exam_id,
      name: topicResult.data.name,
      hours: topicResult.data.hours,
      classDate: classDateUsed,
    });
    logger.debug(`[completeSubjectWizard] Topic "${topicSpec.name}" created`);
  }

  let preClassInserted = 0;
  let warning: string | undefined;

  if (topicsWithDates.length > 0) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      logger.warn(
        '[completeSubjectWizard] Usuario no autenticado al generar pre-clases; se omiten.',
      );
    } else {
      const examDates = cursada.parciales.map((p) => parseParcialDateUtcMidnight(p.date));

      try {
        const [availabilitySlots, userSettings] = await Promise.all([
          findAvailabilityByUserId(user.id),
          findUserSettings(user.id),
        ]);

        const studyHours = {
          startHour: userSettings?.study_start_hour?.substring(0, 5) ?? '08:00',
          endHour: userSettings?.study_end_hour?.substring(0, 5) ?? '23:00',
        };

        const now = new Date();
        const rangeEndSlots = new Date(now);
        rangeEndSlots.setUTCDate(rangeEndSlots.getUTCDate() + 30);

        const existingSlots = await findPendingSessionSlots(
          user.id,
          now.toISOString(),
          rangeEndSlots.toISOString(),
        );

        const occupiedRanges: OccupiedRange[] = existingSlots.map((s) => {
          const date = new Date(s.scheduled_at);
          const startMin = dateToLocalArgentinaMinutes(date);
          return {
            startMinutes: startMin,
            endMinutes: startMin + s.duration,
          };
        });

        const preSessions = generatePreClassSessions({
          userId: user.id,
          subjectId,
          schedule: cursada.schedule,
          topicsWithDates,
          examDates,
          options: { availabilitySlots, studyHours, occupiedRanges },
        });

        if (preSessions.length > 0) {
          const { error: insertError } = await insertSessions(preSessions);
          if (insertError) {
            logger.error('[completeSubjectWizard] Error insertando pre-clases:', insertError);
            warning =
              'Las sesiones de pre-clase no se pudieron guardar; los repasos del tema sí están creados.';
          } else {
            preClassInserted = preSessions.length;
            try {
              const { getGoogleCalendarService } = await import(
                '@/lib/services/google-calendar.service'
              );
              const { getGoogleTokens } = await import('@/lib/services/google-tokens.helper');
              const tokens = await getGoogleTokens(user.id);
              if (tokens) {
                const service = getGoogleCalendarService();
                await service.syncSessions(user.id);
                logger.debug('[completeSubjectWizard] Google Calendar sincronizado tras pre-clases');
              }
            } catch (gcalError) {
              logger.warn(
                '[completeSubjectWizard] No se pudo sincronizar Google Calendar:',
                gcalError,
              );
            }
            revalidatePath('/dashboard/sessions');
          }
        }
      } catch (err) {
        logger.error('[completeSubjectWizard] Error en flujo de pre-clases:', err);
        warning = 'No se pudieron generar las sesiones de pre-clase.';
      }
    }
  }

  const sessionsGenerated = topicsCreated * SESSIONS_PER_TOPIC + preClassInserted;
  if (topicsCreated > 0) {
    await notifyWizardBulkSessionsSummary({
      subjectId,
      subjectName,
      topicsCreated,
      sessionsCount: sessionsGenerated,
    });
  }

  revalidatePath('/dashboard');

  return {
    data: {
      subjectId,
      subjectName,
      topicsCreated,
      sessionsGenerated,
      ...(warning ? { warning } : {}),
    },
  };
}

// --- Helpers ---

async function createTopicsBatch(
  subjectId: string,
  examId: string,
  topics: Array<{ name: string; difficulty: 'EASY' | 'MEDIUM' | 'HARD'; hours: number }>,
  source: 'FREE_STUDY' | 'CLASS',
  sourceDate?: string,
): Promise<number> {
  let created = 0;

  for (const topic of topics) {
    const result = await createTopic({
      subject_id: subjectId,
      exam_id: examId,
      name: topic.name,
      difficulty: topic.difficulty,
      hours: topic.hours,
      source,
      source_date: sourceDate,
      skip_sessions_created_notification: true,
    });

    if (result.error) {
      logger.error(
        `[completeSubjectWizard] Failed to create topic "${topic.name}":`,
        result.error,
      );
      continue;
    }

    created++;
    logger.debug(`[completeSubjectWizard] Topic "${topic.name}" created`);
  }

  return created;
}
