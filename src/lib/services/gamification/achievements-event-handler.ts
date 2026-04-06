import type { ISessionEventHandler, SessionCompletedEvent } from '../session-events';
import {
  countCompletedSessionsForUser,
  findAchievementIdByCode,
  grantUserAchievement,
  maxSubjectLevelForUserStats,
  userHasAchievement,
} from '@/lib/repositories/achievements.repository';
import { getUserStatsByUserId } from '@/lib/repositories/user-stats.repository';
import { logger } from '@/lib/utils/logger';

async function tryUnlock(userId: string, code: string, condition: boolean): Promise<void> {
  if (!condition) return;
  const achId = await findAchievementIdByCode(code);
  if (!achId) return;
  if (await userHasAchievement(userId, achId)) return;
  const { error } = await grantUserAchievement(userId, achId);
  if (error) {
    logger.debug(`[AchievementsHandler] skip grant ${code}:`, error);
  }
}

class AchievementsEventHandler implements ISessionEventHandler {
  async onSessionCompleted(event: SessionCompletedEvent): Promise<void> {
    try {
      const stats = await getUserStatsByUserId(event.userId);
      if (!stats) return;

      const completedCount = await countCompletedSessionsForUser(event.userId);
      const streak = stats.current_streak ?? 0;
      const maxLevel = await maxSubjectLevelForUserStats(stats.id);

      await tryUnlock(event.userId, 'FIRST_SESSION', completedCount === 1);
      await tryUnlock(event.userId, 'STREAK_7', streak >= 7);
      await tryUnlock(event.userId, 'STREAK_30', streak >= 30);
      await tryUnlock(event.userId, 'MASTER_SUBJECT', maxLevel >= 10);
    } catch (e) {
      logger.error('[AchievementsHandler] onSessionCompleted error:', e);
    }
  }
}

export const achievementsEventHandler = new AchievementsEventHandler();
