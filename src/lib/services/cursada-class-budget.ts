import { getSequentialClassDatesForTopics } from '@/lib/services/pre-class-generator';

export type CursadaScheduleBlock = {
  day: string;
  startTime: string;
  endTime: string;
};

/**
 * Cantidad de días con clase en [rangeStart, rangeEndExclusive) según bloques de cursada.
 */
export function countClassSessionsBetween(
  schedule: CursadaScheduleBlock[],
  rangeStart: Date,
  rangeEndExclusive: Date,
): number {
  if (schedule.length === 0) return 0;
  const dates = getSequentialClassDatesForTopics(
    schedule,
    5000,
    rangeStart,
    rangeEndExclusive,
  );
  return dates.length;
}

/**
 * Objetivo de cantidad de temas por unidad a partir de K clases hasta el primer parcial,
 * ponderando por cantidad de subtemas. Acota a [1, subtopics.length] por unidad.
 * La suma no fuerza exactamente K (aproximación estable).
 */
export function allocateTopicCountPerUnit(
  unitNumbers: readonly number[],
  weights: ReadonlyMap<number, number>,
  subtopicCounts: ReadonlyMap<number, number>,
  K: number,
): Map<number, number> {
  const result = new Map<number, number>();
  const m = unitNumbers.length;
  if (m === 0 || K <= 0) return result;

  const totalW = unitNumbers.reduce((s, u) => s + (weights.get(u) ?? 1), 0);
  const effectiveK = Math.max(K, m);

  for (const u of unitNumbers) {
    const w = weights.get(u) ?? 1;
    const subs = Math.max(1, subtopicCounts.get(u) ?? 1);
    const ideal = Math.round((effectiveK * w) / totalW);
    const t = Math.max(1, Math.min(subs, ideal));
    result.set(u, t);
  }
  return result;
}
