import { logger } from '@/lib/utils/logger';
import type { INotificationChannel, NotificationPayload } from './channels/notification-channel.interface';
import { InAppChannel } from './channels/in-app.channel';
import { EmailChannel } from './channels/email.channel';
import { TelegramChannel } from './channels/telegram.channel';
import { findUserSettingsOrCreate } from '@/lib/repositories/user-settings.repository';

/**
 * Notification Service (Facade Pattern)
 * 
 * Centraliza el envío de notificaciones a múltiples canales.
 * Consulta las preferencias del usuario y despacha solo a canales activos.
 */
export class NotificationService {
  private channels: Map<string, INotificationChannel>;

  constructor() {
    this.channels = new Map([
      ['in-app', new InAppChannel()],
      ['email', new EmailChannel()],
      ['telegram', new TelegramChannel()],
    ]);
  }

  /**
   * Envia una notificación a los canales activos según preferencias del usuario
   */
  async send(notification: NotificationPayload): Promise<void> {
    try {
      logger.debug('[NotificationService] Processing notification:', {
        type: notification.type,
        userId: notification.userId,
        title: notification.title
      });

      const raw = await this.getUserSettings(notification.userId);
      const settings = raw ?? {
        email_notifications: true,
        telegram_notifications: false,
        in_app_notifications: true,
      };

      logger.debug('[NotificationService] User settings:', {
        userId: notification.userId,
        email_notifications: settings.email_notifications,
        telegram_notifications: settings.telegram_notifications,
        in_app_notifications: settings.in_app_notifications
      });

      const activeChannels: string[] = [];
      if (settings.in_app_notifications) activeChannels.push('in-app');
      if (settings.email_notifications) activeChannels.push('email');
      if (settings.telegram_notifications) activeChannels.push('telegram');

      // Si no hay canales activos, salir
      if (activeChannels.length === 0) {
        logger.warn('[NotificationService] No active channels for user:', notification.userId);
        return;
      }

      logger.debug('[NotificationService] Active channels:', activeChannels);

      // Enviar a cada canal (en paralelo)
      const results = await Promise.allSettled(
        activeChannels.map(channelName => {
          const channel = this.channels.get(channelName);
          if (!channel) {
            logger.warn(`[NotificationService] Channel "${channelName}" not found`);
            return Promise.resolve();
          }
          return channel.send(notification);
        })
      );

      // Loguear resultados
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          logger.error(`[NotificationService] Channel "${activeChannels[index]}" failed:`, result.reason);
        } else {
          logger.debug(`[NotificationService] Channel "${activeChannels[index]}" succeeded`);
        }
      });

    } catch (error) {
      logger.error('[NotificationService] Error sending notification:', error);
      throw error;
    }
  }

  /**
   * Obtiene las preferencias de notificación del usuario
   * Si no existen, crea configuración por defecto
   */
  private async getUserSettings(userId: string) {
    return findUserSettingsOrCreate(userId);
  }

  /**
   * Envía múltiples notificaciones (batch)
   */
  async sendBatch(notifications: NotificationPayload[]): Promise<void> {
    await Promise.allSettled(
      notifications.map(notification => this.send(notification))
    );
  }
}

// Singleton instance para reutilizar
let notificationServiceInstance: NotificationService | null = null;

export function getNotificationService(): NotificationService {
  if (!notificationServiceInstance) {
    notificationServiceInstance = new NotificationService();
  }
  return notificationServiceInstance;
}
