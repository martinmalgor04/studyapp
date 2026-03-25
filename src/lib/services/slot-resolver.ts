import { AvailabilitySlotRow } from '@/lib/repositories/availability.repository';

export interface StudyHoursRange {
  startHour: string;
  endHour: string;
}

export interface SlotResolverResult {
  date: Date;
  adjusted: boolean;
  originalDate: Date | null;
}

interface ClippedSlot {
  startMinutes: number;
  endMinutes: number;
}

export function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m ?? 0);
}

// Argentina is UTC-3 (no daylight saving). "09:00" local → "12:00" UTC.
export function setDateToLocalArgentinaHour(date: Date, localHour: string): Date {
  const result = new Date(date);
  const [h, m] = localHour.split(':').map(Number);
  result.setUTCHours((h ?? 0) + 3, m ?? 0, 0, 0);
  return result;
}

function clipSlotsToStudyHours(
  slots: AvailabilitySlotRow[],
  studyHours: StudyHoursRange,
): ClippedSlot[] {
  const rangeStart = parseTimeToMinutes(studyHours.startHour);
  const rangeEnd = parseTimeToMinutes(studyHours.endHour);

  const clipped: ClippedSlot[] = [];

  for (const slot of slots) {
    const slotStart = parseTimeToMinutes(slot.start_time);
    const slotEnd = parseTimeToMinutes(slot.end_time);

    const effectiveStart = Math.max(slotStart, rangeStart);
    const effectiveEnd = Math.min(slotEnd, rangeEnd);

    if (effectiveStart < effectiveEnd) {
      clipped.push({ startMinutes: effectiveStart, endMinutes: effectiveEnd });
    }
  }

  return clipped;
}

function findFittingSlot(
  clippedSlots: ClippedSlot[],
  durationMinutes: number,
): ClippedSlot | null {
  for (const slot of clippedSlots) {
    if (slot.startMinutes + durationMinutes <= slot.endMinutes) {
      return slot;
    }
  }
  return null;
}

function minutesToLocalHour(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

export function resolveSessionTime(
  candidateDate: Date,
  durationMinutes: number,
  availabilitySlots: AvailabilitySlotRow[],
  studyHours: StudyHoursRange,
): SlotResolverResult {
  const MAX_OFFSET_DAYS = 3;

  for (let offset = 0; offset <= MAX_OFFSET_DAYS; offset++) {
    const targetDate = offset === 0 ? candidateDate : addDays(candidateDate, offset);

    // getUTCDay reflects the calendar date stored in UTC; since sessions are
    // date-level (no sub-day UTC drift matters here) this is consistent.
    const dayOfWeek = targetDate.getUTCDay();

    const slotsForDay = availabilitySlots.filter(
      (s) => s.is_enabled && s.day_of_week === dayOfWeek,
    );

    const clipped = clipSlotsToStudyHours(slotsForDay, studyHours);
    const fitting = findFittingSlot(clipped, durationMinutes);

    if (fitting) {
      const localHour = minutesToLocalHour(fitting.startMinutes);
      const resolvedDate = setDateToLocalArgentinaHour(targetDate, localHour);

      return {
        date: resolvedDate,
        adjusted: offset > 0,
        originalDate: offset > 0 ? candidateDate : null,
      };
    }
  }

  // Fallback: schedule at study start hour on the original candidate date.
  const fallbackDate = setDateToLocalArgentinaHour(candidateDate, studyHours.startHour);
  return {
    date: fallbackDate,
    adjusted: false,
    originalDate: null,
  };
}
