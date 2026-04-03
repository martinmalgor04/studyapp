'use server';

import { revalidatePath } from 'next/cache';
import { logger } from '@/lib/utils/logger';
import { createClient } from '@/lib/supabase/server';
import { createSubject } from './subjects';
import { createExam } from './exams';
import { createTopic } from './topics';

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
  };
}

const SESSIONS_PER_TOPIC = 4;

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

  revalidatePath('/dashboard');

  return {
    data: {
      subjectId,
      subjectName,
      topicsCreated,
      sessionsGenerated: topicsCreated * SESSIONS_PER_TOPIC,
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

  // Create topics linked to their parcial
  const today = new Date().toISOString().split('T')[0];
  let topicsCreated = 0;

  for (let i = 0; i < cursada.topics.length; i++) {
    const topic = cursada.topics[i];
    const examId = topicExamMap.get(i);

    const topicResult = await createTopic({
      subject_id: subjectId,
      exam_id: examId,
      name: topic.name,
      difficulty: topic.difficulty,
      hours: topic.hours,
      source: 'CLASS',
      source_date: today,
    });

    if (topicResult.error) {
      logger.error(
        `[completeSubjectWizard] Failed to create topic "${topic.name}":`,
        topicResult.error,
      );
      continue;
    }

    topicsCreated++;
    logger.debug(`[completeSubjectWizard] Topic "${topic.name}" created`);
  }

  revalidatePath('/dashboard');

  return {
    data: {
      subjectId,
      subjectName,
      topicsCreated,
      sessionsGenerated: topicsCreated * SESSIONS_PER_TOPIC,
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
