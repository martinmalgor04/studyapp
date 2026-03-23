/**
 * Google Calendar Event Handler
 * 
 * Sincroniza cambios de sesiones de StudyApp → Google Calendar
 * Se ejecuta automáticamente cuando se completan, abandonan o reagendan sesiones
 */

import {
  ISessionEventHandler,
  SessionCompletedEvent,
  SessionAbandonedEvent
} from './session-events';
import { getGoogleCalendarService } from './google-calendar.service';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { getGoogleTokens } from './google-tokens.helper';

/**
 * Obtiene una sesión de la base de datos
 */
async function getSessionById(sessionId: string) {
  const supabase = await createClient();

  const { data: session } = await supabase
    .from('sessions')
    .select('id, google_event_id, scheduled_at, duration')
    .eq('id', sessionId)
    .single();

  return session;
}

/**
 * Handler de eventos de sesiones para Google Calendar
 */
class GoogleCalendarEventHandler implements ISessionEventHandler {
  /**
   * Cuando se completa una sesión, actualizar el evento en Google Calendar
   * Cambiar color a verde para indicar que está completada
   */
  async onSessionCompleted(event: SessionCompletedEvent): Promise<void> {
    try {
      const service = getGoogleCalendarService();
      
      // Obtener sesión de DB para ver si tiene google_event_id
      const session = await getSessionById(event.sessionId);
      if (!session?.google_event_id) {
        logger.debug('[GoogleCalendarHandler] Session has no google_event_id, skipping sync');
        return;
      }
      
      // Obtener tokens del usuario
      const tokens = await getGoogleTokens(event.userId);
      if (!tokens) {
        logger.debug('[GoogleCalendarHandler] User has no Google Calendar tokens, skipping sync');
        return;
      }
      
      // Actualizar evento en Google Calendar (color verde = completado)
      const success = await service.updateEvent(tokens, session.google_event_id, {
        colorId: '10' // Verde
      });

      if (success) {
        logger.debug(`[GoogleCalendarHandler] Successfully updated event ${session.google_event_id} to completed`);
      } else {
        logger.warn(`[GoogleCalendarHandler] Failed to update event ${session.google_event_id}`);
      }
    } catch (error) {
      logger.error('[GoogleCalendarHandler] Error in onSessionCompleted:', error);
      // No lanzar error para no afectar el flujo principal
    }
  }
  
  /**
   * Cuando se abandona una sesión, actualizar el evento en Google Calendar
   * Cambiar color a rojo para indicar que está abandonada
   */
  async onSessionAbandoned(event: SessionAbandonedEvent): Promise<void> {
    try {
      const service = getGoogleCalendarService();
      
      // Obtener sesión de DB para ver si tiene google_event_id
      const session = await getSessionById(event.sessionId);
      if (!session?.google_event_id) {
        logger.debug('[GoogleCalendarHandler] Session has no google_event_id, skipping sync');
        return;
      }
      
      // Obtener tokens del usuario
      const tokens = await getGoogleTokens(event.userId);
      if (!tokens) {
        logger.debug('[GoogleCalendarHandler] User has no Google Calendar tokens, skipping sync');
        return;
      }
      
      // Actualizar evento en Google Calendar (color rojo = abandonada/cancelada)
      const success = await service.updateEvent(tokens, session.google_event_id, {
        colorId: '11' // Rojo
      });

      if (success) {
        logger.debug(`[GoogleCalendarHandler] Successfully updated event ${session.google_event_id} to abandoned`);
      } else {
        logger.warn(`[GoogleCalendarHandler] Failed to update event ${session.google_event_id}`);
      }
    } catch (error) {
      logger.error('[GoogleCalendarHandler] Error in onSessionAbandoned:', error);
      // No lanzar error para no afectar el flujo principal
    }
  }
}

// Exportar instancia singleton
export const googleCalendarEventHandler = new GoogleCalendarEventHandler();
