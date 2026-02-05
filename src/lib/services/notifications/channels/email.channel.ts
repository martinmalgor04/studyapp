import type { INotificationChannel, NotificationPayload } from './notification-channel.interface';

/**
 * Email Channel (Stub Implementation)
 * 
 * TODO: Implementar con un provider de email:
 * - Opción 1: Resend (https://resend.com) - Recomendado para Next.js
 * - Opción 2: SendGrid
 * - Opción 3: Nodemailer con SMTP
 * 
 * Configuración necesaria:
 * - RESEND_API_KEY en .env.local
 * - Email template básico para notificaciones
 */
export class EmailChannel implements INotificationChannel {
  async send(notification: NotificationPayload): Promise<void> {
    console.log('[EmailChannel] Notification queued (not implemented):', {
      to: notification.userId,
      title: notification.title,
      message: notification.message,
    });

    // TODO: Implementar
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.emails.send({
    //   from: 'StudyApp <no-reply@studyapp.com>',
    //   to: userEmail,
    //   subject: notification.title,
    //   html: `<p>${notification.message}</p>`,
    // });
  }
}
