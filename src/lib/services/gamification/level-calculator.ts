/**
 * Nivel por materia según cantidad de sesiones completadas en esa materia.
 * Cada 3 sesiones completadas sube un nivel (tope 99).
 */
export function levelFromCompletedSessions(completedCount: number): number {
  if (completedCount <= 0) return 1;
  return Math.min(99, Math.max(1, 1 + Math.floor((completedCount - 1) / 3)));
}
