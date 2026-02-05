export type NotificationType = 
  | 'SESSION_REMINDER'
  | 'EXAM_APPROACHING'
  | 'STREAK_WARNING'
  | 'ACHIEVEMENT_UNLOCKED'
  | 'SESSION_RESCHEDULED'
  | 'GENERAL';

export interface NotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, any>;
}

export interface INotificationChannel {
  send(notification: NotificationPayload): Promise<void>;
}
