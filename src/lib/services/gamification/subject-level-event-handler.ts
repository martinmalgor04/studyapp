import type { ISessionEventHandler, SessionCompletedEvent } from '../session-events';
import { recordSubjectSessionComplete } from '@/lib/repositories/subject-stats.repository';
import { getUserStatsByUserId } from '@/lib/repositories/user-stats.repository';
import { computeCompletionRewards } from '@/lib/services/gamification/gamification-rewards';
import { logger } from '@/lib/utils/logger';

class SubjectLevelEventHandler implements ISessionEventHandler {
  async onSessionCompleted(event: SessionCompletedEvent): Promise<void> {
    try {
      const rewards = await computeCompletionRewards(event);
      if (!rewards) {
        return;
      }

      const stats = await getUserStatsByUserId(event.userId);
      if (!stats) {
        logger.warn('[SubjectLevelHandler] user_stats missing');
        return;
      }

      const { error } = await recordSubjectSessionComplete({
        userStatsId: stats.id,
        subjectId: rewards.subjectId,
        pointsDelta: rewards.pointsDelta,
      });
      if (error) {
        logger.warn('[SubjectLevelHandler] record subject stats failed:', error);
      }
    } catch (e) {
      logger.error('[SubjectLevelHandler] onSessionCompleted error:', e);
    }
  }
}

export const subjectLevelEventHandler = new SubjectLevelEventHandler();
