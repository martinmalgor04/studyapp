import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { levelFromCompletedSessions } from '@/lib/services/gamification/level-calculator';

export async function recordSubjectSessionComplete(params: {
  userStatsId: string;
  subjectId: string;
  pointsDelta: number;
}): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { data: existing, error: selErr } = await supabase
    .from('subject_stats')
    .select('id, completed_sessions, points')
    .eq('user_stats_id', params.userStatsId)
    .eq('subject_id', params.subjectId)
    .maybeSingle();

  if (selErr) {
    logger.error('Error selecting subject_stats:', selErr);
    return { error: selErr.message };
  }

  const prevC = existing?.completed_sessions ?? 0;
  const nextC = prevC + 1;
  const nextP = (existing?.points ?? 0) + params.pointsDelta;
  const nextLevel = levelFromCompletedSessions(nextC);

  if (!existing) {
    const { error } = await supabase.from('subject_stats').insert({
      user_stats_id: params.userStatsId,
      subject_id: params.subjectId,
      completed_sessions: nextC,
      points: nextP,
      level: nextLevel,
      total_sessions: 0,
    });

    if (error) {
      logger.error('Error inserting subject_stats:', error);
      return { error: error.message };
    }
    return { error: null };
  }

  const { error } = await supabase
    .from('subject_stats')
    .update({
      completed_sessions: nextC,
      points: nextP,
      level: nextLevel,
      updated_at: new Date().toISOString(),
    })
    .eq('id', existing.id);

  if (error) {
    logger.error('Error updating subject_stats:', error);
    return { error: error.message };
  }

  return { error: null };
}
