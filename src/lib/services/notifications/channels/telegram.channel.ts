import type { INotificationChannel, NotificationPayload } from './notification-channel.interface';

/**
 * Telegram Channel (Stub Implementation)
 * 
 * TODO: Implementar con Bot API de Telegram:
 * - Crear un bot en @BotFather
 * - Obtener TELEGRAM_BOT_TOKEN
 * - El usuario debe iniciar chat con el bot y obtener su chat_id
 * - Guardar telegram_chat_id en la tabla users
 * 
 * Configuración necesaria:
 * - TELEGRAM_BOT_TOKEN en .env.local
 * - Campo telegram_chat_id en users (ya existe)
 * 
 * Endpoint: https://api.telegram.org/bot{token}/sendMessage
 */
export class TelegramChannel implements INotificationChannel {
  async send(notification: NotificationPayload): Promise<void> {
    console.log('[TelegramChannel] Notification queued (not implemented):', {
      userId: notification.userId,
      title: notification.title,
      message: notification.message,
    });

    // TODO: Implementar
    // const botToken = process.env.TELEGRAM_BOT_TOKEN;
    // const chatId = await this.getChatId(notification.userId);
    // 
    // if (!chatId) {
    //   console.warn('[TelegramChannel] User has no telegram_chat_id configured');
    //   return;
    // }
    //
    // const text = `*${notification.title}*\n\n${notification.message}`;
    // 
    // await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     chat_id: chatId,
    //     text: text,
    //     parse_mode: 'Markdown',
    //   }),
    // });
  }
}
