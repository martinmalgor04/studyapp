import { google } from 'googleapis';

interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  expiry_date?: number;
}

interface CalendarEvent {
  start: Date;
  end: Date;
  summary: string;
}

export interface TimeSlot {
  day_of_week: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  start_time: string;   // "09:00"
  end_time: string;     // "11:30"
  is_enabled: boolean;
}

interface DetectionOptions {
  startDate: Date;
  endDate: Date;
  minSlotDuration: number; // minutos
  workingHoursStart: number; // hora (ej: 6)
  workingHoursEnd: number;   // hora (ej: 23)
}

/**
 * Servicio para importar disponibilidad horaria desde Google Calendar
 * 
 * Algoritmo:
 * 1. Lee eventos del calendario del usuario en un rango de fechas
 * 2. Por cada día de la semana, detecta "gaps" (huecos) entre eventos
 * 3. Consolida gaps en slots de tiempo disponibles
 * 4. Filtra slots demasiado cortos (< minSlotDuration)
 * 5. Identifica patrones semanales repetidos
 */
export class AvailabilityImporterService {
  private oauth2Client;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  /**
   * Importa disponibilidad desde Google Calendar
   */
  async importFromGoogleCalendar(
    tokens: GoogleTokens,
    options: Partial<DetectionOptions> = {}
  ): Promise<TimeSlot[]> {
    const opts: DetectionOptions = {
      startDate: options.startDate || new Date(),
      endDate: options.endDate || this.addDays(new Date(), 30), // próximos 30 días
      minSlotDuration: options.minSlotDuration || 30,
      workingHoursStart: options.workingHoursStart || 6,
      workingHoursEnd: options.workingHoursEnd || 23,
    };

    // 1. Leer eventos del calendario
    const events = await this.readCalendarEvents(tokens, opts.startDate, opts.endDate);

    // 2. Detectar slots libres por día
    const dailySlots = this.detectDailyFreeSlots(events, opts);

    // 3. Consolidar en patrón semanal
    const weeklyPattern = this.consolidateWeeklyPattern(dailySlots, opts.minSlotDuration);

    return weeklyPattern;
  }

  /**
   * Lee eventos del Google Calendar del usuario
   */
  private async readCalendarEvents(
    tokens: GoogleTokens,
    startDate: Date,
    endDate: Date
  ): Promise<CalendarEvent[]> {
    try {
      this.oauth2Client.setCredentials(tokens);
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        singleEvents: true, // Expandir eventos recurrentes
        orderBy: 'startTime',
      });

      const items = response.data.items || [];

      return items
        .filter(item => item.start?.dateTime && item.end?.dateTime) // Solo eventos con hora específica
        .map(item => ({
          start: new Date(item.start!.dateTime!),
          end: new Date(item.end!.dateTime!),
          summary: item.summary || 'Sin título',
        }));
    } catch (error) {
      console.error('[AvailabilityImporter] Error reading calendar:', error);
      return [];
    }
  }

  /**
   * Detecta slots libres entre eventos por cada día
   */
  private detectDailyFreeSlots(
    events: CalendarEvent[],
    options: DetectionOptions
  ): Map<string, TimeSlot[]> {
    const dailySlots = new Map<string, TimeSlot[]>();

    let currentDate = new Date(options.startDate);
    const endDate = new Date(options.endDate);

    while (currentDate <= endDate) {
      const dateKey = this.formatDate(currentDate);
      const dayOfWeek = currentDate.getDay();

      // Horario de trabajo para este día (06:00 - 23:00)
      const dayStart = new Date(currentDate);
      dayStart.setHours(options.workingHoursStart, 0, 0, 0);

      const dayEnd = new Date(currentDate);
      dayEnd.setHours(options.workingHoursEnd, 0, 0, 0);

      // Eventos de este día
      const dayEvents = events
        .filter(e => this.isSameDay(e.start, currentDate))
        .sort((a, b) => a.start.getTime() - b.start.getTime());

      // Encontrar gaps entre eventos
      const slots: TimeSlot[] = [];
      let currentTime = dayStart;

      for (const event of dayEvents) {
        const gapMinutes = (event.start.getTime() - currentTime.getTime()) / 60000;

        if (gapMinutes >= options.minSlotDuration) {
          slots.push({
            day_of_week: dayOfWeek,
            start_time: this.formatTime(currentTime),
            end_time: this.formatTime(event.start),
            is_enabled: true,
          });
        }

        // Mover cursor al final del evento
        currentTime = new Date(Math.max(currentTime.getTime(), event.end.getTime()));
      }

      // Gap final del día (último evento → 23:00)
      const finalGapMinutes = (dayEnd.getTime() - currentTime.getTime()) / 60000;
      if (finalGapMinutes >= options.minSlotDuration) {
        slots.push({
          day_of_week: dayOfWeek,
          start_time: this.formatTime(currentTime),
          end_time: this.formatTime(dayEnd),
          is_enabled: true,
        });
      }

      if (slots.length > 0) {
        dailySlots.set(dateKey, slots);
      }

      // Siguiente día
      currentDate = this.addDays(currentDate, 1);
    }

    return dailySlots;
  }

  /**
   * Consolida slots diarios en un patrón semanal repetido
   * 
   * Si un slot aparece en 3+ ocurrencias del mismo día de semana,
   * se considera un patrón y se incluye en el resultado final.
   */
  private consolidateWeeklyPattern(
    dailySlots: Map<string, TimeSlot[]>,
    minSlotDuration: number
  ): TimeSlot[] {
    // Agrupar por día de semana
    const weeklyGroups = new Map<number, TimeSlot[]>();

    for (const slots of dailySlots.values()) {
      for (const slot of slots) {
        if (!weeklyGroups.has(slot.day_of_week)) {
          weeklyGroups.set(slot.day_of_week, []);
        }
        weeklyGroups.get(slot.day_of_week)!.push(slot);
      }
    }

    // Por cada día de semana, encontrar slots que se repiten
    const weeklyPattern: TimeSlot[] = [];

    for (const [dayOfWeek, slots] of weeklyGroups.entries()) {
      // Agrupar slots similares (misma hora ±30min)
      const slotGroups = this.groupSimilarSlots(slots);

      // Si un slot aparece en al menos 3 ocurrencias, es un patrón
      for (const group of slotGroups) {
        if (group.length >= 3) {
          // Usar el slot más común (moda)
          const representative = this.getMostCommonSlot(group);
          weeklyPattern.push(representative);
        }
      }
    }

    // Ordenar por día y hora
    return weeklyPattern.sort((a, b) => {
      if (a.day_of_week !== b.day_of_week) {
        return a.day_of_week - b.day_of_week;
      }
      return a.start_time.localeCompare(b.start_time);
    });
  }

  /**
   * Agrupa slots con horarios similares (±30min de diferencia)
   */
  private groupSimilarSlots(slots: TimeSlot[]): TimeSlot[][] {
    const groups: TimeSlot[][] = [];
    const TOLERANCE_MINUTES = 30;

    for (const slot of slots) {
      const slotStartMinutes = this.timeToMinutes(slot.start_time);
      const slotEndMinutes = this.timeToMinutes(slot.end_time);

      // Buscar grupo existente similar
      let foundGroup = false;
      for (const group of groups) {
        const groupSlot = group[0];
        const groupStartMinutes = this.timeToMinutes(groupSlot.start_time);
        const groupEndMinutes = this.timeToMinutes(groupSlot.end_time);

        const startDiff = Math.abs(slotStartMinutes - groupStartMinutes);
        const endDiff = Math.abs(slotEndMinutes - groupEndMinutes);

        if (startDiff <= TOLERANCE_MINUTES && endDiff <= TOLERANCE_MINUTES) {
          group.push(slot);
          foundGroup = true;
          break;
        }
      }

      if (!foundGroup) {
        groups.push([slot]);
      }
    }

    return groups;
  }

  /**
   * Obtiene el slot más representativo de un grupo (el más común)
   */
  private getMostCommonSlot(slots: TimeSlot[]): TimeSlot {
    // Simplificación: devolver el primero
    // En una implementación más sofisticada, calcular la media de todos los slots
    return slots[0];
  }

  // Utilidades

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private formatTime(date: Date): string {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
}

// Singleton instance
let availabilityImporterServiceInstance: AvailabilityImporterService | null = null;

export function getAvailabilityImporterService(): AvailabilityImporterService {
  if (!availabilityImporterServiceInstance) {
    availabilityImporterServiceInstance = new AvailabilityImporterService();
  }
  return availabilityImporterServiceInstance;
}
