import { describe, expect, it } from 'vitest';
import { levelFromCompletedSessions } from '@/lib/services/gamification/level-calculator';

describe('level-calculator', () => {
  it('nivel 1 para pocas sesiones', () => {
    expect(levelFromCompletedSessions(0)).toBe(1);
    expect(levelFromCompletedSessions(1)).toBe(1);
    expect(levelFromCompletedSessions(3)).toBe(1);
  });

  it('sube cada 3 completadas', () => {
    expect(levelFromCompletedSessions(4)).toBe(2);
    expect(levelFromCompletedSessions(6)).toBe(2);
    expect(levelFromCompletedSessions(7)).toBe(3);
  });

  it('tope 99', () => {
    expect(levelFromCompletedSessions(999)).toBe(99);
  });
});
