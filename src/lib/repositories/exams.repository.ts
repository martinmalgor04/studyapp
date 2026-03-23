import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import type { Database } from '@/types/database.types';

type Tables = Database['public']['Tables'];
type ExamRow = Tables['exams']['Row'];
type ExamInsert = Tables['exams']['Insert'];
type ExamUpdate = Tables['exams']['Update'];

export interface ExamWithOwner {
  subject_id: string;
  subjects: { user_id: string };
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function findExamsBySubjectId(
  subjectId: string,
): Promise<ExamRow[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('exams')
    .select('*')
    .eq('subject_id', subjectId)
    .order('date', { ascending: true });

  if (error) {
    logger.error('Error fetching exams by subject:', error);
    return [];
  }

  return data;
}

export async function findExamById(id: string): Promise<ExamRow | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('exams')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    logger.error('Error fetching exam:', error);
    return null;
  }

  return data;
}

/**
 * Fetch exam with its owning subject's user_id via join.
 * Used for ownership verification before mutations.
 */
export async function findExamWithOwner(
  id: string,
): Promise<ExamWithOwner | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('exams')
    .select('subject_id, subjects!inner(user_id)')
    .eq('id', id)
    .single();

  if (error) {
    logger.error('Error fetching exam with owner:', error);
    return null;
  }

  return data as unknown as ExamWithOwner;
}

/**
 * Fetch topic ids and their current exam_id for a subject.
 * Used during final-exam conversion flow.
 */
export async function findTopicsBySubjectIdForConversion(
  subjectId: string,
): Promise<{ id: string; exam_id: string | null }[] | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('topics')
    .select('id, exam_id')
    .eq('subject_id', subjectId);

  if (error) {
    logger.error('Error fetching topics for conversion:', error);
    return null;
  }

  return data;
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function insertExam(
  data: ExamInsert,
): Promise<{ data: ExamRow | null; error: string | null }> {
  const supabase = await createClient();

  const { data: exam, error } = await supabase
    .from('exams')
    .insert(data)
    .select()
    .single();

  if (error) {
    logger.error('Error creating exam:', error);
    return { data: null, error: 'Error al crear el examen' };
  }

  return { data: exam, error: null };
}

export async function updateExamById(
  id: string,
  data: ExamUpdate,
): Promise<{ data: ExamRow | null; error: string | null }> {
  const supabase = await createClient();

  const { data: exam, error } = await supabase
    .from('exams')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    logger.error('Error updating exam:', error);
    return { data: null, error: 'Error al actualizar el examen' };
  }

  return { data: exam, error: null };
}

export async function deleteExamById(
  id: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { error } = await supabase.from('exams').delete().eq('id', id);

  if (error) {
    logger.error('Error deleting exam:', error);
    return { error: 'Error al eliminar el examen' };
  }

  return { error: null };
}

// ---------------------------------------------------------------------------
// Cross-table mutations for final-exam conversion
// ---------------------------------------------------------------------------

export async function deleteSessionsByTopicId(
  topicId: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('topic_id', topicId);

  if (error) {
    logger.error('Error deleting sessions for topic:', error);
    return { error: 'Error al eliminar sesiones del tema' };
  }

  return { error: null };
}

export async function updateTopicForFinalConversion(
  topicId: string,
  finalExamId: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('topics')
    .update({
      exam_id: finalExamId,
      source: 'FREE_STUDY' as Database['public']['Enums']['topic_source'],
      source_date: new Date().toISOString(),
    })
    .eq('id', topicId);

  if (error) {
    logger.error('Error updating topic for final conversion:', error);
    return { error: 'Error al convertir tema a modo final' };
  }

  return { error: null };
}

export async function updateSubjectStatusById(
  subjectId: string,
  status: Database['public']['Enums']['subject_status'],
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('subjects')
    .update({ status })
    .eq('id', subjectId);

  if (error) {
    logger.error('Error updating subject status:', error);
    return { error: 'Error al cambiar estado de la materia' };
  }

  return { error: null };
}

export async function findExamsBySubjectIds(subjectIds: string[]): Promise<ExamRow[]> {
  if (subjectIds.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('exams')
    .select('id, date, subject_id, type')
    .in('subject_id', subjectIds);
  if (error) {
    logger.error('Error fetching exams by subject IDs:', error);
    return [];
  }
  return (data ?? []) as ExamRow[];
}
