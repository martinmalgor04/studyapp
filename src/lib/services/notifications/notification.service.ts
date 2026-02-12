import { createClient } from '@/lib/supabase/server';
import type { INotificationChannel, NotificationPayload } from './channels/notification-channel.interface';
import { InAppChannel } from './channels/in-app.channel';
import { EmailChannel } from './channels/email.channel';
import { TelegramChannel } from './channels/telegram.channel';

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
      // Obtener configuración del usuario
      const settings = await this.getUserSettings(notification.userId);
      
      // Determinar canales activos
      const activeChannels: string[] = [];
      if (settings.in_app_notifications) activeChannels.push('in-app');
      if (settings.email_notifications) activeChannels.push('email');
      if (settings.telegram_notifications) activeChannels.push('telegram');

      // Si no hay canales activos, salir
      if (activeChannels.length === 0) {
        console.warn('[NotificationService] No active channels for user:', notification.userId);
        return;
      }

      // Enviar a cada canal (en paralelo)
      const results = await Promise.allSettled(
        activeChannels.map(channelName => {
          const channel = this.channels.get(channelName);
          if (!channel) {
            console.warn(`[NotificationService] Channel "${channelName}" not found`);
            return Promise.resolve();
          }
          return channel.send(notification);
        })
      );

      // Loguear resultados
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`[NotificationService] Channel "${activeChannels[index]}" failed:`, result.reason);
        }
      });

    } catch (error) {
      console.error('[NotificationService] Error sending notification:', error);
      throw error;
    }
  }

  /**
   * Obtiene las preferencias de notificación del usuario
   * Si no existen, crea configuración por defecto
   */
  private async getUserSettings(userId: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = await createClient() as any;

    const { data: settings, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !settings) {
      // Si no existe configuración, crear con defaults
      const { data: newSettings } = await supabase
        .from('user_settings')
        .insert({
          user_id: userId,
          email_notifications: true,
          telegram_notifications: false,
          in_app_notifications: true,
          daily_summary_time: '08:00:00',
        })
        .select()
        .single();

      return newSettings || {
        email_notifications: true,
        telegram_notifications: false,
        in_app_notifications: true,
        daily_summary_time: '08:00:00',
      };
    }

    return settings;
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
