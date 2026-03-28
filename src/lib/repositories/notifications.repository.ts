import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import type { Json, Database } from '@/types/database.types';

type NotificationType = Database['public']['Enums']['notification_type'];

export interface NotificationRow {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function findNotificationsByUserId(
  userId: string,
  limit: number = 50,
): Promise<{ notifications: NotificationRow[]; unreadCount: number }> {
  const supabase = await createClient();

  const { data: notifications, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    logger.error('Error fetching notifications:', error);
    return { notifications: [], unreadCount: 0 };
  }

  const rows = (notifications ?? []) as NotificationRow[];
  const unreadCount = rows.filter((n) => !n.read).length;

  return { notifications: rows, unreadCount };
}

// ---------------------------------------------------------------------------
// Filtered + paginated query
// ---------------------------------------------------------------------------

export interface NotificationFilters {
  readFilter?: 'all' | 'unread' | 'read';
  typeFilter?: string | null;
  limit?: number;
  offset?: number;
}

export interface PaginatedNotifications {
  notifications: NotificationRow[];
  totalCount: number;
  unreadCount: number;
}

export async function findFilteredNotifications(
  userId: string,
  filters: NotificationFilters = {},
): Promise<PaginatedNotifications> {
  const { readFilter = 'all', typeFilter = null, limit = 20, offset = 0 } = filters;
  const supabase = await createClient();

  // Base query with count
  let query = supabase
    .from('notifications')
    .select('*', { count: 'exact', head: false })
    .eq('user_id', userId);

  if (readFilter === 'read') query = query.eq('read', true);
  else if (readFilter === 'unread') query = query.eq('read', false);

  if (typeFilter) query = query.eq('type', typeFilter as NotificationType);

  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    logger.error('Error fetching filtered notifications:', error);
    return { notifications: [], totalCount: 0, unreadCount: 0 };
  }

  // Separate lightweight query for global unread count (independent of current filters)
  const { count: unread, error: unreadError } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false);

  if (unreadError) {
    logger.error('Error fetching unread count:', unreadError);
  }

  return {
    notifications: (data ?? []) as NotificationRow[],
    totalCount: count ?? 0,
    unreadCount: unread ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function markNotificationRead(
  id: string,
  userId: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    logger.error('Error marking notification as read:', error);
    return { error: 'Error al marcar como leída' };
  }

  return { error: null };
}

export async function markAllNotificationsRead(
  userId: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) {
    logger.error('Error marking all notifications as read:', error);
    return { error: 'Error al marcar todas como leídas' };
  }

  return { error: null };
}

export interface InsertNotificationData {
  user_id: string;
  type: string;
  title: string;
  message: string;
  metadata?: unknown;
}

export async function insertNotification(
  data: InsertNotificationData,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.from('notifications').insert({
    user_id: data.user_id,
    type: data.type as NotificationType,
    title: data.title,
    message: data.message,
    metadata: (data.metadata ?? null) as Json | null,
    read: false,
  });
  if (error) {
    logger.error('Error inserting notification:', error);
    return { error: error.message };
  }
  return { error: null };
}
