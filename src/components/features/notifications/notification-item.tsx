'use client';

import { markNotificationAsRead } from '@/lib/actions/notifications';

interface NotificationItemProps {
  notification: {
    id: string;
    type: string;
    title: string;
    message: string;
    read: boolean;
    created_at: string;
  };
  onRead?: (id: string) => void;
}

const NOTIFICATION_COLORS: Record<string, string> = {
  SESSION_REMINDER: 'bg-tertiary-container/20 border-tertiary/20',
  EXAM_APPROACHING: 'bg-error-container/20 border-error/20',
  STREAK_WARNING: 'bg-primary-container/20 border-primary/20',
  ACHIEVEMENT_UNLOCKED: 'bg-secondary-container/20 border-secondary/20',
  SESSION_RESCHEDULED: 'bg-surface-container-high border-outline-variant/20',
  GENERAL: 'bg-surface-container-low border-outline-variant/20',
};

const NOTIFICATION_ICONS: Record<string, { icon: string; color: string }> = {
  SESSION_REMINDER: { icon: 'menu_book', color: 'text-tertiary' },
  EXAM_APPROACHING: { icon: 'warning', color: 'text-error' },
  STREAK_WARNING: { icon: 'local_fire_department', color: 'text-primary' },
  ACHIEVEMENT_UNLOCKED: { icon: 'auto_awesome', color: 'text-secondary' },
  SESSION_RESCHEDULED: { icon: 'event_repeat', color: 'text-on-surface-variant' },
  GENERAL: { icon: 'info', color: 'text-on-surface-variant' },
};

export function NotificationItem({ notification, onRead }: NotificationItemProps) {
  const iconConfig = NOTIFICATION_ICONS[notification.type] || NOTIFICATION_ICONS.GENERAL;
  const colorClass = NOTIFICATION_COLORS[notification.type] || NOTIFICATION_COLORS.GENERAL;

  const handleMarkAsRead = async () => {
    if (notification.read) return;
    
    await markNotificationAsRead(notification.id);
    onRead?.(notification.id);
  };

  const timeAgo = getTimeAgo(notification.created_at);

  return (
    <div
      className={`p-3 border rounded-xl cursor-pointer transition-colors ${
        notification.read ? 'bg-surface-container-lowest border-outline-variant/10 opacity-60' : colorClass
      } hover:shadow-card`}
      onClick={handleMarkAsRead}
    >
      <div className="flex items-start gap-3">
        <div className="mt-1">
          <span className={`material-symbols-outlined text-[24px] ${iconConfig.color}`}>
            {iconConfig.icon}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className={`text-sm font-semibold ${notification.read ? 'text-on-surface-variant' : 'text-on-surface'}`}>
              {notification.title}
            </h4>
            {!notification.read && (
              <span className="w-2 h-2 bg-tertiary rounded-full flex-shrink-0"></span>
            )}
          </div>
          <p className={`text-xs mt-1 ${notification.read ? 'text-on-surface-variant/70' : 'text-on-surface-variant'}`}>
            {notification.message}
          </p>
          <p className="text-xs text-on-surface-variant/50 mt-2">{timeAgo}</p>
        </div>
      </div>
    </div>
  );
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Hace un momento';
  if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)} min`;
  if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)} hs`;
  if (diffInSeconds < 604800) return `Hace ${Math.floor(diffInSeconds / 86400)} días`;
  
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
}
