import type { SessionCompletedEvent } from '../session-events';
import {
  findSessionGamificationContext,
  listCompletedSessionUtcDateKeys,
} from '@/lib/repositories/sessions.repository';
import { computeSessionPoints } from '@/lib/services/gamification/points-calculator';
import {
  computeStreaksFromCompletionDates,
  utcDateKeyFromDate,
} from '@/lib/services/gamification/streak-calculator';

export async function computeCompletionRewards(
  event: SessionCompletedEvent,
): Promise<{
  pointsDelta: number;
  subjectId: string;
} | null> {
  const ctx = await findSessionGamificationContext(event.sessionId, event.userId);
  if (!ctx) return null;

  const dateKeys = await listCompletedSessionUtcDateKeys(event.userId);
  const asOf = utcDateKeyFromDate(event.completedAt);
  const { currentStreak } = computeStreaksFromCompletionDates(dateKeys, asOf);

  const pointsDelta = computeSessionPoints({
    rating: event.rating,
    topicDifficulty: ctx.topicDifficulty,
    sessionPriority: ctx.priority,
    currentStreak,
  });

  return { pointsDelta, subjectId: ctx.subjectId };
}
