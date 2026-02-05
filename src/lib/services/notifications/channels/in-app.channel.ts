import { createClient } from '@/lib/supabase/server';
import type { INotificationChannel, NotificationPayload } from './notification-channel.interface';

export class InAppChannel implements INotificationChannel {
  async send(notification: NotificationPayload): Promise<void> {
    const supabase = await createClient();
    
    const { error } = await supabase.from('notifications').insert({
      user_id: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      metadata: notification.metadata || null,
      read: false,
    });

    if (error) {
      console.error('[InAppChannel] Error sending notification:', error);
      throw new Error(`Failed to send in-app notification: ${error.message}`);
    }

    console.log('[InAppChannel] Notification sent:', notification.title);
  }
}
