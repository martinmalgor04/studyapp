import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import type { Database } from '@/types/database.types';

type UserStatsRow = Database['public']['Tables']['user_stats']['Row'];

export async function getUserStatsByUserId(userId: string): Promise<UserStatsRow | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    logger.error('Error fetching user_stats:', error);
    return null;
  }

  return data;
}

export async function updateUserStreaks(
  userId: string,
  currentStreak: number,
  longestStreak: number,
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('user_stats')
    .update({
      current_streak: currentStreak,
      longest_streak: longestStreak,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) {
    logger.error('Error updating user streaks:', error);
    return { error: error.message };
  }

  return { error: null };
}

export async function incrementUserTotalPoints(
  userId: string,
  delta: number,
): Promise<{ error: string | null }> {
  if (delta <= 0) return { error: null };

  const row = await getUserStatsByUserId(userId);
  if (!row) {
    return { error: 'user_stats not found' };
  }

  const supabase = await createClient();
  const next = (row.total_points ?? 0) + delta;

  const { error } = await supabase
    .from('user_stats')
    .update({
      total_points: next,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) {
    logger.error('Error incrementing total_points:', error);
    return { error: error.message };
  }

  return { error: null };
}
