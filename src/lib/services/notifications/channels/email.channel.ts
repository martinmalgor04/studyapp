import { Resend } from 'resend';
import { logger } from '@/lib/utils/logger';
import { findUserEmail } from '@/lib/repositories/user-settings.repository';
import type { INotificationChannel, NotificationPayload } from './notification-channel.interface';

/**
 * Email Channel - Implementación con Resend
 * Envía notificaciones por email usando Resend API
 */
export class EmailChannel implements INotificationChannel {
  private resend: Resend;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      logger.warn('[EmailChannel] RESEND_API_KEY not configured');
    }
    this.resend = new Resend(apiKey);
  }

  async send(notification: NotificationPayload): Promise<void> {
    try {
      logger.debug('[EmailChannel] Attempting to send email:', {
        type: notification.type,
        userId: notification.userId,
        title: notification.title
      });

      // Obtener email del usuario
      const email = await this.getUserEmail(notification.userId);
      if (!email) {
        logger.warn('[EmailChannel] No email found for user:', notification.userId);
        return;
      }

      logger.debug('[EmailChannel] Sending to:', email);

      // Enviar email
      const { data, error } = await this.resend.emails.send({
        from: 'StudyApp <onboarding@resend.dev>', // Dominio de prueba de Resend
        to: email,
        subject: notification.title,
        html: this.buildEmailTemplate(notification),
      });

      if (error) {
        logger.error('[EmailChannel] Resend API error:', {
          error,
          type: notification.type,
          email
        });
        throw new Error(`Failed to send email: ${error.message}`);
      }

      logger.debug('[EmailChannel] Email sent successfully:', {
        to: email,
        messageId: data?.id,
        type: notification.type
      });
    } catch (error) {
      logger.error('[EmailChannel] Unexpected error:', error);
      throw error;
    }
  }

  private async getUserEmail(userId: string): Promise<string | null> {
    return findUserEmail(userId);
  }

  private buildEmailTemplate(notification: NotificationPayload): string {
    const iconMap: Record<string, string> = {
      SESSION_REMINDER: '📚',
      EXAM_APPROACHING: '⚠️',
      STREAK_WARNING: '🔥',
      ACHIEVEMENT_UNLOCKED: '🏆',
      SESSION_RESCHEDULED: '🔄',
      GENERAL: '📢',
    };

    const icon = iconMap[notification.type] || '📧';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .message { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">${icon} StudyApp</h1>
            </div>
            <div class="content">
              <h2 style="margin-top: 0;">${notification.title}</h2>
              <div class="message">
                <p>${notification.message}</p>
              </div>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="button">
                Ir al Dashboard
              </a>
            </div>
            <div class="footer">
              <p>StudyApp - Tu asistente de estudio con repetición espaciada</p>
              <p style="font-size: 10px;">Podés desactivar estas notificaciones desde Configuración</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}

