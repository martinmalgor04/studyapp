import { describe, expect, it } from 'vitest';
import {
  addUtcDays,
  computeCurrentStreak,
  computeLongestStreak,
  computeStreaksFromCompletionDates,
  mergeUniqueSortedAsc,
  utcDateKeyFromDate,
} from '@/lib/services/gamification/streak-calculator';

describe('streak-calculator', () => {
  it('utcDateKeyFromDate uses UTC', () => {
    const d = new Date('2024-06-15T23:00:00.000Z');
    expect(utcDateKeyFromDate(d)).toBe('2024-06-15');
  });

  it('addUtcDays rolls month boundaries', () => {
    expect(addUtcDays('2024-03-01', -1)).toBe('2024-02-29');
  });

  it('computeCurrentStreak counts consecutive days ending at asOf', () => {
    const set = new Set(['2024-01-03', '2024-01-02', '2024-01-01']);
    expect(computeCurrentStreak(set, '2024-01-03')).toBe(3);
    expect(computeCurrentStreak(set, '2024-01-02')).toBe(2);
    expect(computeCurrentStreak(set, '2024-01-04')).toBe(0);
  });

  it('computeLongestStreak finds max run', () => {
    expect(computeLongestStreak(mergeUniqueSortedAsc(['2024-01-01']))).toBe(1);
    expect(
      computeLongestStreak(mergeUniqueSortedAsc(['2024-01-01', '2024-01-02', '2024-01-03'])),
    ).toBe(3);
    expect(
      computeLongestStreak(
        mergeUniqueSortedAsc(['2024-01-01', '2024-01-02', '2024-01-05', '2024-01-06']),
      ),
    ).toBe(2);
  });

  it('computeStreaksFromCompletionDates adds asOf if missing', () => {
    const r = computeStreaksFromCompletionDates(['2024-01-01'], '2024-01-02');
    expect(r.currentStreak).toBe(2);
    expect(r.longestStreak).toBe(2);
  });

  it('gap resets current but keeps longest', () => {
    const r = computeStreaksFromCompletionDates(
      ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-10'],
      '2024-01-10',
    );
    expect(r.currentStreak).toBe(1);
    expect(r.longestStreak).toBe(3);
  });
});
