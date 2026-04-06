import { logger } from '@/lib/utils/logger';

/**
 * Session Event System (Observer Pattern + OCP)
 * 
 * Este sistema permite extender la funcionalidad cuando se completan sesiones
 * sin modificar el código existente. Útil para gamificación, analytics, etc.
 */

export interface SessionCompletedEvent {
  sessionId: string;
  userId: string;
  topicId: string;
  rating: 'EASY' | 'NORMAL' | 'HARD';
  actualDuration: number | null;
  plannedDuration: number;
  completedAt: Date;
}

export interface SessionAbandonedEvent {
  sessionId: string;
  userId: string;
  topicId: string;
  reason: 'AUTO' | 'MANUAL';
  scheduledAt: Date;
}

export interface SessionStartedEvent {
  sessionId: string;
  userId: string;
  topicId: string;
  startedAt: Date;
}

/**
 * Interface para handlers de eventos de sesiones
 * Implementar esta interfaz para agregar nueva funcionalidad (gamificación, analytics, etc)
 */
export interface ISessionEventHandler {
  onSessionCompleted?(event: SessionCompletedEvent): Promise<void>;
  onSessionAbandoned?(event: SessionAbandonedEvent): Promise<void>;
  onSessionStarted?(event: SessionStartedEvent): Promise<void>;
}

/**
 * Registry de handlers de eventos (Singleton)
 * Permite registrar múltiples handlers sin modificar el código core
 */
class SessionEventRegistryClass {
  private handlers: ISessionEventHandler[] = [];

  register(handler: ISessionEventHandler) {
    this.handlers.push(handler);
  }

  /**
   * Secuencial: gamificación (racha → puntos → materia → logros) depende del orden;
   * Google Calendar no compite por filas locales pero se mantiene estable con el mismo orden de registro.
   */
  async emitCompleted(event: SessionCompletedEvent) {
    for (const h of this.handlers) {
      if (!h.onSessionCompleted) continue;
      try {
        await h.onSessionCompleted(event);
      } catch (e) {
        logger.error('[SessionEventRegistry] onSessionCompleted handler failed:', e);
      }
    }
  }

  async emitAbandoned(event: SessionAbandonedEvent) {
    await Promise.allSettled(
      this.handlers
        .filter(h => h.onSessionAbandoned)
        .map(h => h.onSessionAbandoned!(event))
    );
  }

  async emitStarted(event: SessionStartedEvent) {
    await Promise.allSettled(
      this.handlers
        .filter(h => h.onSessionStarted)
        .map(h => h.onSessionStarted!(event))
    );
  }
}

// Singleton instance
export const SessionEventRegistry = new SessionEventRegistryClass();

/**
 * Ejemplo de handler para gamificación (NO implementado aún)
 * 
 * Cuando se implemente gamificación, crear este archivo:
 * src/lib/services/gamification/gamification-handler.ts
 * 
 * import { ISessionEventHandler, SessionEventRegistry } from '../session-events';
 * 
 * class GamificationHandler implements ISessionEventHandler {
 *   async onSessionCompleted(event: SessionCompletedEvent) {
 *     // Calcular puntos según rating
 *     const points = event.rating === 'EASY' ? 10 : event.rating === 'NORMAL' ? 15 : 20;
 *     
 *     // Actualizar user_stats
 *     await updateUserStats(event.userId, { points });
 *     
 *     // Verificar streaks
 *     await checkStreak(event.userId);
 *   }
 * }
 * 
 * // Registrar handler
 * SessionEventRegistry.register(new GamificationHandler());
 */

// ============================================================
// REGISTRAR HANDLERS ACTIVOS
// ============================================================

import { googleCalendarEventHandler } from './google-calendar-event-handler';
import { streakEventHandler } from './gamification/streak-event-handler';
import { pointsEventHandler } from './gamification/points-event-handler';
import { subjectLevelEventHandler } from './gamification/subject-level-event-handler';
import { achievementsEventHandler } from './gamification/achievements-event-handler';

// Registrar handler de Google Calendar para sincronización bidireccional
SessionEventRegistry.register(googleCalendarEventHandler);
SessionEventRegistry.register(streakEventHandler);
SessionEventRegistry.register(pointsEventHandler);
SessionEventRegistry.register(subjectLevelEventHandler);
SessionEventRegistry.register(achievementsEventHandler);
