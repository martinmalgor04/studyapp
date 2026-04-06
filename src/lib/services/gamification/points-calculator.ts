import type { Database } from '@/types/database.types';

type Difficulty = Database['public']['Enums']['difficulty'];
type Priority = Database['public']['Enums']['priority'];
type Rating = 'EASY' | 'NORMAL' | 'HARD';

const RATING_BASE: Record<Rating, number> = {
  EASY: 10,
  NORMAL: 15,
  HARD: 20,
};

const DIFFICULTY_MULT: Record<Difficulty, number> = {
  EASY: 0.9,
  MEDIUM: 1.0,
  HARD: 1.15,
};

const PRIORITY_MULT: Record<Priority, number> = {
  CRITICAL: 1.25,
  URGENT: 1.15,
  IMPORTANT: 1.08,
  NORMAL: 1.0,
  LOW: 0.95,
};

function roundPoints(n: number): number {
  return Math.max(0, Math.round(n));
}

/**
 * Puntos por sesión completada: base × dificultad × prioridad + bonus por racha (acotado).
 */
export function computeSessionPoints(params: {
  rating: Rating;
  topicDifficulty: Difficulty;
  sessionPriority: Priority;
  /** Racha actual ya incluyendo el día del evento (mismo criterio que streak-calculator). */
  currentStreak: number;
}): number {
  const base = RATING_BASE[params.rating];
  const d = DIFFICULTY_MULT[params.topicDifficulty] ?? 1;
  const p = PRIORITY_MULT[params.sessionPriority] ?? 1;
  const streakBonus = Math.min(15, Math.max(0, params.currentStreak - 1) * 2);
  return roundPoints(base * d * p + streakBonus);
}
