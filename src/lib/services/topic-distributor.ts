import { logger } from '@/lib/utils/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ScheduleBlock {
  day: string;
  startTime: string;
  endTime: string;
}

export interface TopicForDistribution {
  id: string;
  name: string;
  hours: number;
  parcialIndex: number;
}

export interface ParcialInfo {
  index: number;
  name: string;
  date: Date;
}

export interface TopicDistributorInput {
  schedule: ScheduleBlock[];
  topics: TopicForDistribution[];
  parciales: ParcialInfo[];
  startDate: Date;
}

export interface TentativeScheduleItem {
  date: Date;
  dayOfWeek: string;
  topicIds: string[];
  isNew: boolean;
}

export interface DistributionResult {
  schedule: TentativeScheduleItem[];
  warnings: string[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DAY_MAP: Record<string, number> = {
  Domingo: 0,
  Lunes: 1,
  Martes: 2,
  Miércoles: 3,
  Jueves: 4,
  Viernes: 5,
  Sábado: 6,
};

const REVIEW_BUFFER_DAYS = 7;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseTimeToMinutes(time: string): number {
  const parts = time.split(':').map(Number);
  return (parts[0] ?? 0) * 60 + (parts[1] ?? 0);
}

function blockDurationMinutes(block: ScheduleBlock): number {
  return Math.max(
    0,
    parseTimeToMinutes(block.endTime) - parseTimeToMinutes(block.startTime),
  );
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatShort(date: Date): string {
  const d = date.getUTCDate();
  const m = date.getUTCMonth() + 1;
  return `${d}/${m}`;
}

// ---------------------------------------------------------------------------
// Available-class finder
// ---------------------------------------------------------------------------

interface ClassDate {
  date: Date;
  dayOfWeek: string;
  durationMinutes: number;
}

/**
 * Builds a map of JS-day-of-week → aggregate class duration from schedule
 * blocks, then walks every calendar day in [startDate, cutoffDate) and
 * collects those that match a scheduled day.
 */
function findClassDates(
  startDate: Date,
  cutoffDate: Date,
  schedule: ScheduleBlock[],
): ClassDate[] {
  const dayInfo = new Map<number, { dayName: string; duration: number }>();

  for (const block of schedule) {
    const dayNum = DAY_MAP[block.day];
    if (dayNum === undefined) continue;
    const dur = blockDurationMinutes(block);
    if (dur <= 0) continue;

    const existing = dayInfo.get(dayNum);
    dayInfo.set(dayNum, {
      dayName: block.day,
      duration: (existing?.duration ?? 0) + dur,
    });
  }

  const results: ClassDate[] = [];
  const cursor = new Date(startDate);
  cursor.setUTCHours(0, 0, 0, 0);
  const limit = new Date(cutoffDate);
  limit.setUTCHours(0, 0, 0, 0);

  while (cursor < limit) {
    const info = dayInfo.get(cursor.getUTCDay());
    if (info) {
      results.push({
        date: new Date(cursor),
        dayOfWeek: info.dayName,
        durationMinutes: info.duration,
      });
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return results;
}

// ---------------------------------------------------------------------------
// Slot allocation
// ---------------------------------------------------------------------------

interface Slot {
  date: Date;
  dayOfWeek: string;
  capacity: number;
  remaining: number;
  topicIds: string[];
}

interface AllocationResult {
  items: TentativeScheduleItem[];
  warnings: string[];
  usedDateKeys: Set<string>;
}

/**
 * Sequentially assigns topics to class slots.
 *
 * - If a topic doesn't fit in the *remaining* space of a partially-used slot
 *   it advances to the next fresh slot (avoids awkward splits on small gaps).
 * - A topic that is larger than a single slot spans consecutive slots.
 */
function allocateTopics(
  topics: TopicForDistribution[],
  classes: ClassDate[],
  parcialName: string,
): AllocationResult {
  const warnings: string[] = [];
  const usedDateKeys = new Set<string>();

  if (topics.length === 0) return { items: [], warnings, usedDateKeys };

  if (classes.length === 0) {
    warnings.push(
      `No hay clases disponibles para distribuir los temas de "${parcialName}".`,
    );
    return { items: [], warnings, usedDateKeys };
  }

  const slots: Slot[] = classes.map((c) => ({
    date: c.date,
    dayOfWeek: c.dayOfWeek,
    capacity: c.durationMinutes,
    remaining: c.durationMinutes,
    topicIds: [],
  }));

  let idx = 0;

  for (const topic of topics) {
    while (idx < slots.length && slots[idx].remaining <= 0) idx++;
    if (idx >= slots.length) {
      warnings.push(
        `No hay suficientes clases para "${topic.name}" de "${parcialName}".`,
      );
      continue;
    }

    let topicRemaining = topic.hours;
    const current = slots[idx];

    if (
      current.remaining < current.capacity &&
      topicRemaining > current.remaining
    ) {
      idx++;
      while (idx < slots.length && slots[idx].remaining <= 0) idx++;
      if (idx >= slots.length) {
        warnings.push(
          `No hay suficientes clases para "${topic.name}" de "${parcialName}".`,
        );
        continue;
      }
    }

    while (topicRemaining > 0 && idx < slots.length) {
      const slot = slots[idx];
      const allocated = Math.min(topicRemaining, slot.remaining);

      if (allocated > 0) {
        slot.topicIds.push(topic.id);
        slot.remaining -= allocated;
        topicRemaining -= allocated;
      }

      if (slot.remaining <= 0 && topicRemaining > 0) idx++;
    }

    if (topicRemaining > 0) {
      warnings.push(
        `No hay suficientes clases para "${topic.name}" de "${parcialName}" ` +
          `(faltan ${topicRemaining} min).`,
      );
    }
  }

  const items: TentativeScheduleItem[] = [];
  for (const slot of slots) {
    if (slot.topicIds.length > 0) {
      items.push({
        date: slot.date,
        dayOfWeek: slot.dayOfWeek,
        topicIds: slot.topicIds,
        isNew: true,
      });
      usedDateKeys.add(toDateKey(slot.date));
    }
  }

  return { items, warnings, usedDateKeys };
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export function distributeTopics(
  input: TopicDistributorInput,
): DistributionResult {
  const { schedule, topics, parciales, startDate } = input;
  const warnings: string[] = [];
  const allItems: TentativeScheduleItem[] = [];
  const usedDates = new Set<string>();

  if (schedule.length === 0) {
    warnings.push('No se definieron bloques de horario.');
    return { schedule: [], warnings };
  }

  if (parciales.length === 0) {
    warnings.push('No se definieron parciales.');
    return { schedule: [], warnings };
  }

  const sorted = [...parciales].sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );

  for (const parcial of sorted) {
    const parcialTopics = topics.filter(
      (t) => t.parcialIndex === parcial.index,
    );

    if (parcialTopics.length === 0) {
      logger.info(
        `[TopicDistributor] Sin topics para "${parcial.name}", saltando.`,
      );
      continue;
    }

    const cutoff = addDays(parcial.date, -REVIEW_BUFFER_DAYS);

    if (cutoff <= startDate) {
      const daysLeft = Math.max(
        0,
        Math.round(
          (parcial.date.getTime() - startDate.getTime()) / 86_400_000,
        ),
      );
      warnings.push(
        `No hay tiempo suficiente para distribuir los temas de "${parcial.name}" ` +
          `(parcial el ${formatShort(parcial.date)}, solo quedan ${daysLeft} días).`,
      );
      continue;
    }

    let available = findClassDates(startDate, cutoff, schedule);
    available = available.filter((c) => !usedDates.has(toDateKey(c.date)));

    if (available.length === 0) {
      warnings.push(
        `No se encontraron clases disponibles para "${parcial.name}" ` +
          `entre ${formatShort(startDate)} y ${formatShort(cutoff)}.`,
      );
      continue;
    }

    const totalTopicMin = parcialTopics.reduce((s, t) => s + t.hours, 0);
    const totalClassMin = available.reduce((s, c) => s + c.durationMinutes, 0);

    if (totalTopicMin > totalClassMin) {
      warnings.push(
        `Los temas de "${parcial.name}" requieren ${totalTopicMin} min ` +
          `pero solo hay ${totalClassMin} min en ${available.length} clases.`,
      );
    }

    logger.info(
      `[TopicDistributor] "${parcial.name}": ${parcialTopics.length} topics ` +
        `(${totalTopicMin} min) → ${available.length} clases (${totalClassMin} min)`,
    );

    const result = allocateTopics(parcialTopics, available, parcial.name);

    allItems.push(...result.items);
    warnings.push(...result.warnings);
    for (const key of result.usedDateKeys) usedDates.add(key);
  }

  logger.info(
    `[TopicDistributor] Distribución completada: ` +
      `${allItems.length} clases, ${warnings.length} warnings`,
  );

  return { schedule: allItems, warnings };
}
