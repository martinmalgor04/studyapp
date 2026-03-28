'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import {
  getFilteredNotifications,
  markAllNotificationsAsRead,
} from '@/lib/actions/notifications';
import { NotificationItem } from '@/components/features/notifications/notification-item';

interface NotificationRow {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

interface Props {
  initialData: {
    notifications: NotificationRow[];
    totalCount: number;
    unreadCount: number;
  };
}

type ReadFilter = 'all' | 'unread' | 'read';

const TYPE_LABELS: Record<string, string> = {
  SESSION_REMINDER: 'Recordatorio sesión',
  EXAM_APPROACHING: 'Examen próximo',
  STREAK_WARNING: 'Racha en riesgo',
  ACHIEVEMENT_UNLOCKED: 'Logro desbloqueado',
  SESSION_RESCHEDULED: 'Sesión reagendada',
  GENERAL: 'General',
};

const TABS: { key: ReadFilter; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'unread', label: 'No leídas' },
  { key: 'read', label: 'Leídas' },
];

const PAGE_SIZE = 20;

export function NotificationsClient({ initialData }: Props) {
  const [notifications, setNotifications] = useState<NotificationRow[]>(initialData.notifications);
  const [totalCount, setTotalCount] = useState(initialData.totalCount);
  const [unreadCount, setUnreadCount] = useState(initialData.unreadCount);

  const [readFilter, setReadFilter] = useState<ReadFilter>('all');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);

  const [isPending, startTransition] = useTransition();
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  useEffect(() => {
    setNotifications(initialData.notifications);
    setTotalCount(initialData.totalCount);
    setUnreadCount(initialData.unreadCount);
  }, [initialData]);

  const fetchNotifications = useCallback(
    (newOffset: number, append: boolean) => {
      startTransition(async () => {
        const result = await getFilteredNotifications({
          readFilter,
          typeFilter,
          limit: PAGE_SIZE,
          offset: newOffset,
        });

        if (append) {
          setNotifications((prev) => [...prev, ...result.notifications]);
        } else {
          setNotifications(result.notifications);
        }
        setTotalCount(result.totalCount);
        setUnreadCount(result.unreadCount);
        setOffset(newOffset);
      });
    },
    [readFilter, typeFilter],
  );

  useEffect(() => {
    fetchNotifications(0, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readFilter, typeFilter]);

  const handleLoadMore = async () => {
    const newOffset = offset + PAGE_SIZE;
    setIsLoadingMore(true);

    const result = await getFilteredNotifications({
      readFilter,
      typeFilter,
      limit: PAGE_SIZE,
      offset: newOffset,
    });

    setNotifications((prev) => [...prev, ...result.notifications]);
    setTotalCount(result.totalCount);
    setUnreadCount(result.unreadCount);
    setOffset(newOffset);
    setIsLoadingMore(false);
  };

  const handleMarkAllRead = async () => {
    setIsMarkingAll(true);
    await markAllNotificationsAsRead();
    fetchNotifications(0, false);
    setIsMarkingAll(false);
  };

  const handleNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleTabChange = (tab: ReadFilter) => {
    setReadFilter(tab);
    setOffset(0);
  };

  const handleTypeChange = (value: string) => {
    setTypeFilter(value || null);
    setOffset(0);
  };

  const hasMore = notifications.length < totalCount;

  return (
    <div className="space-y-4">
      {/* Header con contador y mark all */}
      <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-5 py-4 shadow-sm">
        <p className="text-sm text-gray-700">
          {unreadCount > 0 ? (
            <>
              <span className="font-semibold text-gray-900">{unreadCount}</span>{' '}
              {unreadCount === 1 ? 'notificación sin leer' : 'notificaciones sin leer'}
            </>
          ) : (
            'Estás al día — sin notificaciones pendientes'
          )}
        </p>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={isMarkingAll}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            aria-label="Marcar todas las notificaciones como leídas"
          >
            {isMarkingAll ? 'Marcando…' : 'Marcar todas como leídas'}
          </button>
        )}
      </div>

      {/* Filtros: tabs + tipo */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        {/* Tabs */}
        <div className="flex border-b border-gray-200" role="tablist" aria-label="Filtrar por estado de lectura">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={readFilter === tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                readFilter === tab.key
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filtro por tipo */}
        <div className="px-4 py-3">
          <label htmlFor="type-filter" className="sr-only">
            Filtrar por tipo de notificación
          </label>
          <select
            id="type-filter"
            value={typeFilter ?? ''}
            onChange={(e) => handleTypeChange(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:w-64"
          >
            <option value="">Todos los tipos</option>
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de notificaciones */}
      {isPending && notifications.length === 0 ? (
        <SkeletonList />
      ) : notifications.length === 0 ? (
        <EmptyState readFilter={readFilter} typeFilter={typeFilter} />
      ) : (
        <>
          <div className="space-y-2">
            {notifications.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onRead={handleNotificationRead}
              />
            ))}
          </div>

          {/* Paginación */}
          <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-5 py-3 shadow-sm">
            <p className="text-sm text-gray-500">
              {notifications.length} de {totalCount}{' '}
              {totalCount === 1 ? 'notificación' : 'notificaciones'}
            </p>
            {hasMore && (
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore || isPending}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {isLoadingMore ? 'Cargando…' : 'Cargar más'}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Cargando notificaciones">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-md border border-gray-200 bg-white p-3"
        >
          <div className="flex items-start gap-3">
            <div className="mt-1 h-6 w-6 rounded-full bg-gray-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 rounded bg-gray-200" />
              <div className="h-3 w-2/3 rounded bg-gray-200" />
              <div className="h-3 w-16 rounded bg-gray-200" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  readFilter,
  typeFilter,
}: {
  readFilter: ReadFilter;
  typeFilter: string | null;
}) {
  let icon: React.ReactNode;
  let text: string;

  if (typeFilter) {
    const label = TYPE_LABELS[typeFilter] ?? typeFilter;
    text = `No hay notificaciones de tipo "${label}"`;
    icon = (
      <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    );
  } else if (readFilter === 'unread') {
    text = 'No hay notificaciones sin leer';
    icon = (
      <svg className="mx-auto h-12 w-12 text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
      </svg>
    );
  } else if (readFilter === 'read') {
    text = 'No hay notificaciones leídas';
    icon = (
      <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
      </svg>
    );
  } else {
    text = 'No tenés notificaciones todavía';
    icon = (
      <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white py-16 text-center shadow-sm">
      {icon}
      <p className="mt-4 text-sm text-gray-500">{text}</p>
    </div>
  );
}
