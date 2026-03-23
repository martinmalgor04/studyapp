import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import type { Database } from '@/types/database.types';

type Tables = Database['public']['Tables'];
type SubjectInsert = Tables['subjects']['Insert'];
type SubjectUpdate = Tables['subjects']['Update'];

export interface SubjectRow {
  id: string;
  name: string;
  description: string | null;
  year: number | null;
  semester: string | null;
  status: string;
  professors: string[] | null;
  schedule: Database['public']['Tables']['subjects']['Row']['schedule'];
  user_id: string;
  is_active: boolean;
  created_at: string;
  [key: string]: unknown;
}

export interface SubjectWithProgress extends SubjectRow {
  total_sessions: number;
  completed_sessions: number;
  progress_percentage: number;
}

interface SubjectRowWithSessions extends SubjectRow {
  sessions?: Array<{ id: string; status: string }>;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Fetch all active subjects with progress calculated from sessions.
 *
 * Progress = (COMPLETED sessions / total sessions) per subject.
 * Sessions relation is fetched inline and stripped from the final output.
 */
export async function findAllSubjects(
  options?: { includeAprobadas?: boolean },
): Promise<SubjectWithProgress[]> {
  const supabase = await createClient();

  let query = supabase
    .from('subjects')
    .select(`
      *,
      sessions(id, status)
    `)
    .eq('is_active', true);

  if (!options?.includeAprobadas) {
    query = query.neq('status', 'APROBADA');
  }

  const { data: subjects, error } = await query
    .order('created_at', { ascending: false }) as {
      data: SubjectRowWithSessions[] | null;
      error: unknown;
    };

  if (error) {
    logger.error('Error fetching subjects:', error);
    return [];
  }

  return (subjects ?? []).map((subject) => {
    const sessions = subject.sessions ?? [];
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter((s) => s.status === 'COMPLETED').length;
    const progressPercentage =
      totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

    const { sessions: _sessions, ...rest } = subject;
    return {
      ...rest,
      total_sessions: totalSessions,
      completed_sessions: completedSessions,
      progress_percentage: progressPercentage,
    };
  });
}

export async function findSubjectById(id: string): Promise<SubjectRow | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    logger.error('Error fetching subject:', error);
    return null;
  }

  return data as SubjectRow;
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function insertSubject(
  data: SubjectInsert,
): Promise<{ data: SubjectRow | null; error: string | null }> {
  const supabase = await createClient();

  const { data: subject, error } = await supabase
    .from('subjects')
    .insert(data)
    .select()
    .single();

  if (error) {
    logger.error('Error creating subject:', error);
    return { data: null, error: 'Error al crear la materia' };
  }

  return { data: subject as SubjectRow, error: null };
}

export async function updateSubjectById(
  id: string,
  data: SubjectUpdate,
): Promise<{ data: SubjectRow | null; error: string | null }> {
  const supabase = await createClient();

  const { data: subject, error } = await supabase
    .from('subjects')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    logger.error('Error updating subject:', error);
    return { data: null, error: 'Error al actualizar la materia' };
  }

  return { data: subject as SubjectRow, error: null };
}

export async function softDeleteSubject(
  id: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('subjects')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    logger.error('Error deleting subject:', error);
    return { error: 'Error al eliminar la materia' };
  }

  return { error: null };
}

/**
 * Verify that a subject belongs to a specific user.
 * Useful for cross-module ownership checks before mutations.
 */
export async function findSubjectByIdAndUserId(
  id: string,
  userId: string,
): Promise<{ id: string } | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('subjects')
    .select('id')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error) {
    logger.error('Error verifying subject ownership:', error);
    return null;
  }

  return data as { id: string };
}

// ---------------------------------------------------------------------------
// Mutations used by setSubjectLibre flow
// ---------------------------------------------------------------------------

export async function abandonSessionsBySubjectId(
  subjectId: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('sessions')
    .update({ status: 'ABANDONED' })
    .eq('subject_id', subjectId)
    .eq('status', 'PENDING');

  if (error) {
    logger.error('Error updating sessions:', error);
    return { error: 'Error al marcar sesiones como abandonadas' };
  }

  return { error: null };
}

export async function updateSubjectStatus(
  id: string,
  status: Database['public']['Enums']['subject_status'],
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('subjects')
    .update({ status })
    .eq('id', id);

  if (error) {
    logger.error('Error updating subject status:', error);
    return { error: 'Error al cambiar estado de la materia' };
  }

  return { error: null };
}
