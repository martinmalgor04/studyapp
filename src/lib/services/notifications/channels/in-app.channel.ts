import { logger } from '@/lib/utils/logger';
import { insertNotification } from '@/lib/repositories/notifications.repository';
import type { INotificationChannel, NotificationPayload } from './notification-channel.interface';

export class InAppChannel implements INotificationChannel {
  async send(notification: NotificationPayload): Promise<void> {
    const { error } = await insertNotification({
      user_id: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      metadata: notification.metadata,
    });
    if (error) {
      logger.error('[InAppChannel] Error sending notification:', error);
      throw new Error(`Failed to send in-app notification: ${error}`);
    }
    logger.debug('[InAppChannel] Notification sent:', notification.title);
  }
}
