import { google } from 'googleapis';
import { createClient } from '@/lib/supabase/server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getSupabase = async () => await createClient() as any;

interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  expiry_date?: number;
}

interface UserSettings {
  google_access_token: string | null;
  google_refresh_token: string | null;
  google_token_expiry: string | null;
  google_calendar_enabled: boolean | null;
}

interface Session {
  id: string;
  scheduled_at: string;
  duration: number;
  topic: { name: string };
  subject: { name: string };
  number: number;
}

export class GoogleCalendarService {
  private oauth2Client;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  /**
   * Crea un evento en Google Calendar para una sesión
   */
  async createEventForSession(tokens: GoogleTokens, session: Session): Promise<string | null> {
    try {
      this.oauth2Client.setCredentials(tokens);
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      // Calcular hora de fin
      const startDate = new Date(session.scheduled_at);
      const endDate = new Date(startDate.getTime() + session.duration * 60 * 1000);

      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: {
          summary: `${session.topic.name} - R${session.number}`,
          description: `Materia: ${session.subject.name}\nDuración estimada: ${session.duration} minutos\n\nGenerado por StudyApp`,
          start: {
            dateTime: startDate.toISOString(),
            timeZone: 'America/Argentina/Buenos_Aires',
          },
          end: {
            dateTime: endDate.toISOString(),
            timeZone: 'America/Argentina/Buenos_Aires',
          },
          colorId: '9', // Azul en Google Calendar
        },
      });

      return response.data.id || null;
    } catch (error) {
      console.error('[GoogleCalendar] Error creating event:', error);
      return null;
    }
  }

  /**
   * Elimina un evento de Google Calendar
   */
  async deleteEvent(tokens: GoogleTokens, eventId: string): Promise<boolean> {
    try {
      this.oauth2Client.setCredentials(tokens);
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      await calendar.events.delete({
        calendarId: 'primary',
        eventId,
      });

      return true;
    } catch (error) {
      console.error('[GoogleCalendar] Error deleting event:', error);
      return false;
    }
  }

  /**
   * Sincroniza todas las sesiones pendientes de un usuario a Google Calendar
   */
  async syncSessions(userId: string): Promise<{ synced: number; errors: number }> {
    const supabase = await getSupabase();

    // Obtener tokens
    const { data: settings } = await supabase
      .from('user_settings')
      .select('google_access_token, google_refresh_token, google_token_expiry')
      .eq('user_id', userId)
      .single() as { data: UserSettings | null };

    if (!settings?.google_access_token) {
      return { synced: 0, errors: 0 };
    }

    const tokens: GoogleTokens = {
      access_token: settings.google_access_token,
      refresh_token: settings.google_refresh_token || undefined,
      expiry_date: settings.google_token_expiry
        ? new Date(settings.google_token_expiry).getTime()
        : undefined,
    };

    // Obtener sesiones pendientes
    const { data: sessions } = await supabase
      .from('sessions')
      .select(`
        id,
        scheduled_at,
        duration,
        number,
        topic:topics(name),
        subject:subjects(name)
      `)
      .eq('user_id', userId)
      .eq('status', 'PENDING')
      .gte('scheduled_at', new Date().toISOString());

    if (!sessions || sessions.length === 0) {
      return { synced: 0, errors: 0 };
    }

    let synced = 0;
    let errors = 0;

    for (const session of sessions) {
      const mappedSession: Session = {
        id: session.id,
        scheduled_at: session.scheduled_at,
        duration: session.duration || 30,
        topic: { name: session.topic?.name || 'Sin tema' },
        subject: { name: session.subject?.name || 'Sin materia' },
        number: session.number || 1,
      };
      const eventId = await this.createEventForSession(tokens, mappedSession);
      if (eventId) {
        synced++;
        
        // Guardar google_event_id en la sesión
        await supabase
          .from('sessions')
          .update({ 
            google_event_id: eventId,
            google_calendar_synced_at: new Date().toISOString()
          })
          .eq('id', session.id);
      } else {
        errors++;
      }
    }

    return { synced, errors };
  }

  /**
   * Verifica si los tokens son válidos
   */
  isTokenValid(tokens: GoogleTokens): boolean {
    if (!tokens.access_token) return false;
    if (tokens.expiry_date && tokens.expiry_date < Date.now()) {
      return false; // Token expirado
    }
    return true;
  }

  /**
   * Verifica si hay eventos en Google Calendar en un rango de tiempo
   */
  async checkConflicts(
    tokens: GoogleTokens,
    startDateTime: Date,
    endDateTime: Date
  ): Promise<boolean> {
    try {
      this.oauth2Client.setCredentials(tokens);
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: startDateTime.toISOString(),
        timeMax: endDateTime.toISOString(),
        singleEvents: true,
      });

      const events = response.data.items || [];
      return events.length > 0;
    } catch (error) {
      console.error('[GoogleCalendar] Error checking conflicts:', error);
      return false; // En caso de error, asumir que no hay conflictos
    }
  }

  /**
   * Obtiene eventos de Google Calendar en un rango de fechas
   */
  async getEventsInRange(
    tokens: GoogleTokens,
    startDateTime: Date,
    endDateTime: Date
  ): Promise<Array<{ start: Date; end: Date; summary: string }>> {
    try {
      this.oauth2Client.setCredentials(tokens);
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: startDateTime.toISOString(),
        timeMax: endDateTime.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });

      const items = response.data.items || [];
      
      return items
        .filter(item => item.start?.dateTime && item.end?.dateTime)
        .map(item => ({
          start: new Date(item.start!.dateTime!),
          end: new Date(item.end!.dateTime!),
          summary: item.summary || 'Sin título',
        }));
    } catch (error) {
      console.error('[GoogleCalendar] Error getting events:', error);
      return [];
    }
  }

  /**
   * Actualiza un evento existente (cambio de fecha, estado)
   */
  async updateEvent(
    tokens: GoogleTokens,
    eventId: string,
    updates: {
      startDateTime?: Date;
      endDateTime?: Date;
      colorId?: string;
      summary?: string;
    }
  ): Promise<boolean> {
    try {
      this.oauth2Client.setCredentials(tokens);
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      const requestBody: { summary?: string; colorId?: string; start?: { dateTime: string; timeZone: string }; end?: { dateTime: string; timeZone: string } } = {};

      if (updates.summary) {
        requestBody.summary = updates.summary;
      }

      if (updates.colorId) {
        requestBody.colorId = updates.colorId;
      }

      if (updates.startDateTime && updates.endDateTime) {
        requestBody.start = {
          dateTime: updates.startDateTime.toISOString(),
          timeZone: 'America/Argentina/Buenos_Aires',
        };
        requestBody.end = {
          dateTime: updates.endDateTime.toISOString(),
          timeZone: 'America/Argentina/Buenos_Aires',
        };
      }

      await calendar.events.patch({
        calendarId: 'primary',
        eventId,
        requestBody,
      });

      return true;
    } catch (error) {
      console.error('[GoogleCalendar] Error updating event:', error);
      return false;
    }
  }

  /**
   * Verifica si el usuario tiene Google Calendar conectado
   */
  async isConnected(userId: string): Promise<boolean> {
    const supabase = await getSupabase();

    const { data: settings } = await supabase
      .from('user_settings')
      .select('google_access_token, google_calendar_enabled')
      .eq('user_id', userId)
      .single() as { data: UserSettings | null };

    return !!(settings?.google_access_token && settings?.google_calendar_enabled !== false);
  }
}

// Singleton instance
let googleCalendarServiceInstance: GoogleCalendarService | null = null;

export function getGoogleCalendarService(): GoogleCalendarService {
  if (!googleCalendarServiceInstance) {
    googleCalendarServiceInstance = new GoogleCalendarService();
  }
  return googleCalendarServiceInstance;
}
