import type { ISessionEventHandler, SessionCompletedEvent } from '../session-events';
import { listCompletedSessionUtcDateKeys } from '@/lib/repositories/sessions.repository';
import { getUserStatsByUserId, updateUserStreaks } from '@/lib/repositories/user-stats.repository';
import {
  computeStreaksFromCompletionDates,
  utcDateKeyFromDate,
} from '@/lib/services/gamification/streak-calculator';
import { logger } from '@/lib/utils/logger';

class StreakEventHandler implements ISessionEventHandler {
  async onSessionCompleted(event: SessionCompletedEvent): Promise<void> {
    try {
      const stats = await getUserStatsByUserId(event.userId);
      if (!stats) {
        logger.warn('[StreakHandler] user_stats missing for user, skipping streak update');
        return;
      }

      const dateKeys = await listCompletedSessionUtcDateKeys(event.userId);
      const asOf = utcDateKeyFromDate(event.completedAt);
      const { currentStreak, longestStreak } = computeStreaksFromCompletionDates(dateKeys, asOf);

      const { error } = await updateUserStreaks(event.userId, currentStreak, longestStreak);
      if (error) {
        logger.warn('[StreakHandler] Failed to persist streaks:', error);
      }
    } catch (e) {
      logger.error('[StreakHandler] onSessionCompleted error:', e);
    }
  }
}

export const streakEventHandler = new StreakEventHandler();
