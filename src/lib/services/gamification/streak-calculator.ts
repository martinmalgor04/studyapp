/**
 * Cálculo de rachas por días calendario (UTC) en los que hubo al menos una sesión COMPLETED.
 */

/** YYYY-MM-DD en UTC */
export function utcDateKeyFromDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addUtcDays(isoDate: string, deltaDays: number): string {
  const [y, m, day] = isoDate.split('-').map(Number);
  const next = new Date(Date.UTC(y, m - 1, day + deltaDays));
  return next.toISOString().slice(0, 10);
}

/**
 * Racha actual: días consecutivos hacia atrás desde `asOfDate` presentes en el set.
 */
export function computeCurrentStreak(activeDates: Set<string>, asOfDate: string): number {
  if (!activeDates.has(asOfDate)) return 0;
  let count = 0;
  let d = asOfDate;
  while (activeDates.has(d)) {
    count += 1;
    d = addUtcDays(d, -1);
  }
  return count;
}

/**
 * Mayor cantidad de días consecutivos en el historial.
 */
export function computeLongestStreak(sortedAscDates: string[]): number {
  if (sortedAscDates.length === 0) return 0;
  let best = 1;
  let run = 1;
  for (let i = 1; i < sortedAscDates.length; i++) {
    const prev = sortedAscDates[i - 1];
    const cur = sortedAscDates[i];
    if (addUtcDays(prev, 1) === cur) {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 1;
    }
  }
  return best;
}

export function mergeUniqueSortedAsc(dates: string[]): string[] {
  const uniq = [...new Set(dates)].sort();
  return uniq;
}

export function computeStreaksFromCompletionDates(
  completionDateKeysUtc: string[],
  asOfDateKeyUtc: string
): { currentStreak: number; longestStreak: number } {
  const set = new Set(completionDateKeysUtc);
  if (!set.has(asOfDateKeyUtc)) {
    set.add(asOfDateKeyUtc);
  }
  const sortedAsc = mergeUniqueSortedAsc([...set]);
  return {
    currentStreak: computeCurrentStreak(set, asOfDateKeyUtc),
    longestStreak: computeLongestStreak(sortedAsc),
  };
}
