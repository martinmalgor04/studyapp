'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import {
  getFilteredNotifications,
  markAllNotificationsAsRead,
} from '@/lib/actions/notifications';
import { NotificationItem } from '@/components/features/notifications/notification-item';
import { Button } from '@/components/ui/button';

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
      <div className="flex items-center justify-between rounded-xl border border-outline-variant/10 bg-surface-container-lowest px-5 py-4 shadow-card">
        <p className="text-sm text-on-surface-variant">
          {unreadCount > 0 ? (
            <>
              <span className="font-semibold text-on-surface">{unreadCount}</span>{' '}
              {unreadCount === 1 ? 'notificación sin leer' : 'notificaciones sin leer'}
            </>
          ) : (
            'Estás al día — sin notificaciones pendientes'
          )}
        </p>
        {unreadCount > 0 && (
          <Button
            onClick={handleMarkAllRead}
            disabled={isMarkingAll}
            size="sm"
            aria-label="Marcar todas las notificaciones como leídas"
          >
            {isMarkingAll ? 'Marcando…' : 'Marcar todas como leídas'}
          </Button>
        )}
      </div>

      {/* Filtros: tabs + tipo */}
      <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest shadow-card">
        {/* Tabs */}
        <div className="flex border-b border-outline-variant/10" role="tablist" aria-label="Filtrar por estado de lectura">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={readFilter === tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                readFilter === tab.key
                  ? 'border-b-2 border-tertiary text-tertiary'
                  : 'text-on-surface-variant hover:text-on-surface'
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
            className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus:border-tertiary focus:outline-none focus:ring-2 focus:ring-tertiary/30 sm:w-64"
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
          <div className="flex items-center justify-between rounded-xl border border-outline-variant/10 bg-surface-container-lowest px-5 py-3 shadow-card">
            <p className="text-sm text-on-surface-variant">
              {notifications.length} de {totalCount}{' '}
              {totalCount === 1 ? 'notificación' : 'notificaciones'}
            </p>
            {hasMore && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadMore}
                disabled={isLoadingMore || isPending}
              >
                {isLoadingMore ? 'Cargando…' : 'Cargar más'}
              </Button>
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
          className="animate-pulse rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-3"
        >
          <div className="flex items-start gap-3">
            <div className="mt-1 h-6 w-6 rounded-full bg-surface-container" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 rounded bg-surface-container" />
              <div className="h-3 w-2/3 rounded bg-surface-container" />
              <div className="h-3 w-16 rounded bg-surface-container" />
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
      <span className="material-symbols-rounded mx-auto text-[48px] text-on-surface-variant/30" aria-hidden="true">folder_open</span>
    );
  } else if (readFilter === 'unread') {
    text = 'No hay notificaciones sin leer';
    icon = (
      <span className="material-symbols-rounded mx-auto text-[48px] text-secondary/40" aria-hidden="true">check_circle</span>
    );
  } else if (readFilter === 'read') {
    text = 'No hay notificaciones leídas';
    icon = (
      <span className="material-symbols-rounded mx-auto text-[48px] text-on-surface-variant/30" aria-hidden="true">mark_email_read</span>
    );
  } else {
    text = 'No tenés notificaciones todavía';
    icon = (
      <span className="material-symbols-rounded mx-auto text-[48px] text-on-surface-variant/30" aria-hidden="true">notifications_off</span>
    );
  }

  return (
    <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest py-16 text-center shadow-card">
      <div className="flex justify-center">{icon}</div>
      <p className="mt-4 text-sm text-on-surface-variant">{text}</p>
    </div>
  );
}
