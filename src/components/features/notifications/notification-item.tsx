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
  onRead?: () => void;
}

const NOTIFICATION_COLORS: Record<string, string> = {
  SESSION_REMINDER: 'bg-blue-50 border-blue-200',
  EXAM_APPROACHING: 'bg-red-50 border-red-200',
  STREAK_WARNING: 'bg-orange-50 border-orange-200',
  ACHIEVEMENT_UNLOCKED: 'bg-green-50 border-green-200',
  SESSION_RESCHEDULED: 'bg-yellow-50 border-yellow-200',
  GENERAL: 'bg-gray-50 border-gray-200',
};

function getNotificationIcon(type: string) {
  const iconClass = "h-6 w-6";
  
  switch (type) {
    case 'SESSION_REMINDER':
      return (
        <svg className={`${iconClass} text-blue-600`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      );
    case 'EXAM_APPROACHING':
      return (
        <svg className={`${iconClass} text-red-600`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
    case 'STREAK_WARNING':
      return (
        <svg className={`${iconClass} text-orange-600`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
        </svg>
      );
    case 'ACHIEVEMENT_UNLOCKED':
      return (
        <svg className={`${iconClass} text-green-600`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      );
    case 'SESSION_RESCHEDULED':
      return (
        <svg className={`${iconClass} text-yellow-600`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      );
    default:
      return (
        <svg className={`${iconClass} text-gray-600`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      );
  }
}

export function NotificationItem({ notification, onRead }: NotificationItemProps) {
  const icon = getNotificationIcon(notification.type);
  const colorClass = NOTIFICATION_COLORS[notification.type] || NOTIFICATION_COLORS.GENERAL;

  const handleMarkAsRead = async () => {
    if (notification.read) return;
    
    await markNotificationAsRead(notification.id);
    onRead?.();
  };

  const timeAgo = getTimeAgo(notification.created_at);

  return (
    <div
      className={`p-3 border rounded-md cursor-pointer transition-colors ${
        notification.read ? 'bg-white border-gray-200 opacity-60' : colorClass
      } hover:shadow-sm`}
      onClick={handleMarkAsRead}
    >
      <div className="flex items-start gap-3">
        <div className="mt-1">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className={`text-sm font-semibold ${notification.read ? 'text-gray-600' : 'text-gray-900'}`}>
              {notification.title}
            </h4>
            {!notification.read && (
              <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></span>
            )}
          </div>
          <p className={`text-xs mt-1 ${notification.read ? 'text-gray-500' : 'text-gray-700'}`}>
            {notification.message}
          </p>
          <p className="text-xs text-gray-400 mt-2">{timeAgo}</p>
        </div>
      </div>
    </div>
  );
}

// Helper para formatear tiempo relativo
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
