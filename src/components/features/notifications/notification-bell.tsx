'use client';

import { useEffect, useState } from 'react';
import { getNotifications, markAllNotificationsAsRead } from '@/lib/actions/notifications';
import { NotificationItem } from './notification-item';

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Array<{ id: string; title?: string; body?: string; read: boolean; created_at: string; [key: string]: unknown }>>([]);
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
    loadNotifications();
    
    // Recargar cada 60 segundos
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
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
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
        title="Notificaciones"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 z-50 mt-2 w-96 rounded-lg border border-gray-200 bg-white shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900">Notificaciones</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  Marcar todas como leídas
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-gray-500">
                  <p>Cargando...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <p>No hay notificaciones</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
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

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="border-t border-gray-200 p-3 text-center">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    // TODO: Navegar a página de notificaciones completa si existe
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Ver todas las notificaciones
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
