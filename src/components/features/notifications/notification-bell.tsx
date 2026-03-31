'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getNotifications, markAllNotificationsAsRead } from '@/lib/actions/notifications';
import { NotificationItem } from './notification-item';
import { Skeleton } from '@/components/ui/skeleton';

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Array<{ id: string; type: string; title: string; message: string; read: boolean; created_at: string }>>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    setLoading(true);
    const result = await getNotifications();
    setNotifications(result.notifications);
    setUnreadCount(result.unreadCount);
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;

    const fetchNotifications = async () => {
      setLoading(true);
      const result = await getNotifications();
      if (!cancelled) {
        setNotifications(result.notifications);
        setUnreadCount(result.unreadCount);
        setLoading(false);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead();
    await loadNotifications();
  };

  const handleNotificationRead = () => {
    loadNotifications();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded-full transition-colors"
        aria-label={unreadCount > 0 ? `Notificaciones (${unreadCount} sin leer)` : 'Notificaciones'}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="material-symbols-outlined text-[24px]" aria-hidden="true">
          notifications
        </span>
        {unreadCount > 0 && (
          <span
            className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-error text-xs font-bold text-on-error"
            aria-hidden="true"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          <div
            className="absolute right-0 z-50 mt-2 w-96 rounded-xl border border-outline-variant/10 bg-surface-container-lowest shadow-subtle"
            role="dialog"
            aria-label="Panel de notificaciones"
          >
            <div className="flex items-center justify-between border-b border-outline-variant/10 p-4">
              <h3 className="font-semibold text-on-surface">Notificaciones</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-tertiary hover:text-tertiary-dim"
                >
                  Marcar todas como leídas
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="space-y-3 p-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16 rounded-lg" />
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <span className="material-symbols-outlined text-3xl text-on-surface-variant/40 mb-2">notifications_off</span>
                  <p className="text-sm text-on-surface-variant">No hay notificaciones</p>
                </div>
              ) : (
                <div className="divide-y divide-outline-variant/10">
                  {notifications.map((notification) => (
                    <div key={notification.id} className="p-2">
                      <NotificationItem
                        notification={notification}
                        onRead={handleNotificationRead}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {notifications.length > 0 && (
              <div className="border-t border-outline-variant/10 p-3 text-center">
                <Link
                  href="/dashboard/notifications"
                  onClick={() => setIsOpen(false)}
                  className="text-sm text-tertiary hover:text-tertiary-dim"
                >
                  Ver todas las notificaciones
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
