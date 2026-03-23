import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

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
