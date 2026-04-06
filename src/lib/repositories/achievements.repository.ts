import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export async function findAchievementIdByCode(code: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('achievements')
    .select('id')
    .eq('code', code)
    .maybeSingle();

  if (error) {
    logger.error('Error findAchievementIdByCode:', error);
    return null;
  }
  return data?.id ?? null;
}

export async function userHasAchievement(userId: string, achievementId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('user_achievements')
    .select('id')
    .eq('user_id', userId)
    .eq('achievement_id', achievementId)
    .maybeSingle();

  if (error) {
    logger.error('Error userHasAchievement:', error);
    return true;
  }
  return !!data;
}

export async function grantUserAchievement(
  userId: string,
  achievementId: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.from('user_achievements').insert({
    user_id: userId,
    achievement_id: achievementId,
  });

  if (error) {
    logger.error('Error grantUserAchievement:', error);
    return { error: error.message };
  }
  return { error: null };
}

export async function countCompletedSessionsForUser(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'COMPLETED');

  if (error) {
    logger.error('Error countCompletedSessionsForUser:', error);
    return 0;
  }
  return count ?? 0;
}

export async function maxSubjectLevelForUserStats(userStatsId: string): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('subject_stats')
    .select('level')
    .eq('user_stats_id', userStatsId);

  if (error || !data?.length) {
    return 0;
  }
  return Math.max(0, ...data.map(r => r.level ?? 0));
}

export async function countUserAchievements(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from('user_achievements')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) {
    logger.error('Error countUserAchievements:', error);
    return 0;
  }
  return count ?? 0;
}
