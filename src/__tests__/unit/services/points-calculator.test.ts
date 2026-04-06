import { describe, expect, it } from 'vitest';
import { computeSessionPoints } from '@/lib/services/gamification/points-calculator';

describe('points-calculator', () => {
  it('combina base, mults y bonus de racha', () => {
    const p = computeSessionPoints({
      rating: 'NORMAL',
      topicDifficulty: 'MEDIUM',
      sessionPriority: 'NORMAL',
      currentStreak: 1,
    });
    expect(p).toBe(15);
  });

  it('sube con racha', () => {
    const p = computeSessionPoints({
      rating: 'NORMAL',
      topicDifficulty: 'MEDIUM',
      sessionPriority: 'NORMAL',
      currentStreak: 3,
    });
    expect(p).toBe(19);
  });
});
