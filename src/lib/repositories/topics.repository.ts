import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import type { Database } from '@/types/database.types';

type Tables = Database['public']['Tables'];
type TopicRow = Tables['topics']['Row'];
type TopicInsert = Tables['topics']['Insert'];
type TopicUpdate = Tables['topics']['Update'];

export interface TopicWithOwner {
  subject_id: string;
  subjects: { user_id: string };
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function findTopicsBySubjectId(
  subjectId: string,
): Promise<TopicRow[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('topics')
    .select('*')
    .eq('subject_id', subjectId)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Error fetching topics:', error);
    return [];
  }

  return data;
}

export async function findTopicById(id: string): Promise<TopicRow | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('topics')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    logger.error('Error fetching topic:', error);
    return null;
  }

  return data;
}

/**
 * Fetch topic with its owning subject's user_id via join.
 * Used for ownership verification before mutations.
 */
export async function findTopicWithOwner(
  id: string,
): Promise<TopicWithOwner | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('topics')
    .select('subject_id, subjects!inner(user_id)')
    .eq('id', id)
    .single();

  if (error) {
    logger.error('Error fetching topic with owner:', error);
    return null;
  }

  return data as unknown as TopicWithOwner;
}

/**
 * Verify that an exam belongs to the given subject.
 * Used during topic creation to validate exam_id.
 */
export async function findExamByIdAndSubjectId(
  examId: string,
  subjectId: string,
): Promise<{ id: string } | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('exams')
    .select('id')
    .eq('id', examId)
    .eq('subject_id', subjectId)
    .single();

  if (error) {
    logger.error('Error verifying exam for subject:', error);
    return null;
  }

  return data as { id: string };
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function insertTopic(
  data: TopicInsert,
): Promise<{ data: TopicRow | null; error: string | null }> {
  const supabase = await createClient();

  const { data: topic, error } = await supabase
    .from('topics')
    .insert(data)
    .select()
    .single();

  if (error) {
    logger.error('Error creating topic:', error);
    return { data: null, error: 'Error al crear el tema' };
  }

  return { data: topic, error: null };
}

export async function updateTopicById(
  id: string,
  data: TopicUpdate,
): Promise<{ data: TopicRow | null; error: string | null }> {
  const supabase = await createClient();

  const { data: topic, error } = await supabase
    .from('topics')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    logger.error('Error updating topic:', error);
    return { data: null, error: 'Error al actualizar el tema' };
  }

  return { data: topic, error: null };
}

export async function deleteTopicById(
  id: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { error } = await supabase.from('topics').delete().eq('id', id);

  if (error) {
    logger.error('Error deleting topic:', error);
    return { error: 'Error al eliminar el tema' };
  }

  return { error: null };
}

export async function findTopicsBySubjectIds(subjectIds: string[]): Promise<TopicRow[]> {
  if (subjectIds.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('topics')
    .select('id, name, difficulty, hours, source, source_date, subject_id, created_at')
    .in('subject_id', subjectIds)
    .order('created_at', { ascending: false });
  if (error) {
    logger.error('Error fetching topics by subject IDs:', error);
    return [];
  }
  return (data ?? []) as TopicRow[];
}
