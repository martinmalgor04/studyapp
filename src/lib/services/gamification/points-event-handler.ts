import type { ISessionEventHandler, SessionCompletedEvent } from '../session-events';
import { incrementUserTotalPoints } from '@/lib/repositories/user-stats.repository';
import { computeCompletionRewards } from '@/lib/services/gamification/gamification-rewards';
import { logger } from '@/lib/utils/logger';

class PointsEventHandler implements ISessionEventHandler {
  async onSessionCompleted(event: SessionCompletedEvent): Promise<void> {
    try {
      const rewards = await computeCompletionRewards(event);
      if (!rewards) {
        logger.debug('[PointsHandler] No gamification context for session, skip points');
        return;
      }

      const { error } = await incrementUserTotalPoints(event.userId, rewards.pointsDelta);
      if (error) {
        logger.warn('[PointsHandler] increment points failed:', error);
      }
    } catch (e) {
      logger.error('[PointsHandler] onSessionCompleted error:', e);
    }
  }
}

export const pointsEventHandler = new PointsEventHandler();
