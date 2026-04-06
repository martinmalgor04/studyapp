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

/**
 * Entrada de {@link distributeTopics}.
 *
 * **Armar desde el wizard:** preferí {@link buildTopicDistributorInputFromWizard}
 * con `schedule`, `topics` (`id` + `name` + `hours` en minutos, igual que
 * {@link TopicForDistribution}), `parciales` con fechas y `assignedTopicIds`, y
 * `startDate` en medianoche UTC (p. ej. hoy). Si armás a mano: cada
 * `ParcialInfo.index` debe ser 0-based en el orden **por fecha ascendente**;
 * cada topic debe tener `parcialIndex` igual al índice del parcial que lo
 * asigna (ver builder para huérfanos).
 */
export interface TopicDistributorInput {
  schedule: ScheduleBlock[];
  topics: TopicForDistribution[];
  parciales: ParcialInfo[];
  startDate: Date;
}

/** Fila de parcial proveniente del wizard (el builder ordena por `date` y asigna índices 0..n-1). */
export interface WizardParcialRowForDistributor {
  /** Índice esperado en el orden por fecha (documentación / validación del caller); el builder ordena por `date` y no usa este valor para persistir. */
  index: number;
  name: string;
  date: string | Date;
  assignedTopicIds: string[];
}

/** Tema del wizard con id estable (mismo orden que al persistir topics). */
export interface WizardTopicRowForDistributor {
  id: string;
  name: string;
  /** Minutos de estudio del tema (misma unidad que `TopicForDistribution.hours` en este módulo). */
  hours: number;
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

/** Clave calendario `YYYY-MM-DD` en UTC (alineado con `findClassDates` / slots). */
export function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function parseWizardDateUtcMidnight(value: string | Date): Date {
  if (value instanceof Date) {
    return new Date(
      Date.UTC(
        value.getUTCFullYear(),
        value.getUTCMonth(),
        value.getUTCDate(),
      ),
    );
  }
  const trimmed = value.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed);
  if (match) {
    return new Date(
      Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
    );
  }
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return new Date(0);
  }
  return new Date(
    Date.UTC(
      parsed.getUTCFullYear(),
      parsed.getUTCMonth(),
      parsed.getUTCDate(),
    ),
  );
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
// Pure helpers (post-distribución y armado de input desde wizard)
// ---------------------------------------------------------------------------

/**
 * A partir del calendario tentativo (`distributeTopics` → `schedule`), obtiene
 * para cada id en `topicsInOrder` la **primera** fecha (UTC, `YYYY-MM-DD` vía
 * {@link toDateKey}) en la que ese id figura en `topicIds` de algún ítem.
 * Si no aparece, `null` (el caller puede hacer fallback).
 */
export function earliestClassDateKeysForTopics(
  tentativeSchedule: TentativeScheduleItem[],
  topicsInOrder: ReadonlyArray<{ id: string }>,
): (string | null)[] {
  const earliestKeyByTopicId = new Map<string, string>();

  for (const item of tentativeSchedule) {
    const dateKey = toDateKey(item.date);
    const seenInSlot = new Set<string>();
    for (const topicId of item.topicIds) {
      if (seenInSlot.has(topicId)) continue;
      seenInSlot.add(topicId);
      const prev = earliestKeyByTopicId.get(topicId);
      if (prev === undefined || dateKey < prev) {
        earliestKeyByTopicId.set(topicId, dateKey);
      }
    }
  }

  return topicsInOrder.map(({ id }) => earliestKeyByTopicId.get(id) ?? null);
}

/**
 * Arma {@link TopicDistributorInput} desde datos de wizard.
 *
 * - Ordena `parciales` por `date` ascendente y asigna `ParcialInfo.index` 0…n-1.
 * - `parcialIndex` de cada topic = índice del parcial cuyo `assignedTopicIds`
 *   lo incluye; si varios lo listan, gana el de **menor índice** (parcial más
 *   temprano).
 * - Si ningún parcial asigna el topic: **parcialIndex = 0** (primer parcial
 *   por fecha), para que no quede huérfano y `distributeTopics` no lo omita
 *   sin aviso en el filtro por `parcialIndex`.
 */
export function buildTopicDistributorInputFromWizard(params: {
  schedule: ScheduleBlock[];
  topics: WizardTopicRowForDistributor[];
  parciales: WizardParcialRowForDistributor[];
  startDate: Date;
}): TopicDistributorInput {
  const { schedule, topics, parciales, startDate } = params;

  const sorted = [...parciales].sort(
    (a, b) =>
      parseWizardDateUtcMidnight(a.date).getTime() -
      parseWizardDateUtcMidnight(b.date).getTime(),
  );

  const parcialInfos: ParcialInfo[] = sorted.map((p, i) => ({
    index: i,
    name: p.name,
    date: parseWizardDateUtcMidnight(p.date),
  }));

  const parcialIndexByTopicId = new Map<string, number>();
  for (let i = 0; i < sorted.length; i++) {
    for (const topicId of sorted[i].assignedTopicIds) {
      if (!parcialIndexByTopicId.has(topicId)) {
        parcialIndexByTopicId.set(topicId, i);
      }
    }
  }

  const topicsForDistribution: TopicForDistribution[] = topics.map((t) => ({
    id: t.id,
    name: t.name,
    hours: t.hours,
    parcialIndex: parcialIndexByTopicId.get(t.id) ?? 0,
  }));

  const start = new Date(startDate);
  start.setUTCHours(0, 0, 0, 0);

  return {
    schedule,
    topics: topicsForDistribution,
    parciales: parcialInfos,
    startDate: start,
  };
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
