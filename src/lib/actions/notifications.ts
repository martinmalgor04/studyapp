'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getNotificationService } from '@/lib/services/notifications/notification.service';
import type { NotificationPayload } from '@/lib/services/notifications/channels/notification-channel.interface';

/**
 * Obtiene todas las notificaciones del usuario (últimas 50)
 */
export async function getNotifications() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { notifications: [], unreadCount: 0 };
  }

  const { data: notifications, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching notifications:', error);
    return { notifications: [], unreadCount: 0 };
  }

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  return {
    notifications: notifications || [],
    unreadCount,
  };
}

/**
 * Marca una notificación como leída
 */
export async function markNotificationAsRead(notificationId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'No autenticado' };
  }

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error marking notification as read:', error);
    return { error: 'Error al marcar como leída' };
  }

  revalidatePath('/dashboard');
  return { success: true };
}

/**
 * Marca todas las notificaciones como leídas
 */
export async function markAllNotificationsAsRead() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'No autenticado' };
  }

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', user.id)
    .eq('read', false);

  if (error) {
    console.error('Error marking all notifications as read:', error);
    return { error: 'Error al marcar todas como leídas' };
  }

  revalidatePath('/dashboard');
  return { success: true };
}

/**
 * Obtiene las preferencias de notificación del usuario
 */
export async function getUserSettings() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  const { data: settings, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error || !settings) {
    // Crear configuración por defecto si no existe
    const { data: newSettings } = await supabase
      .from('user_settings')
      .insert({
        user_id: user.id,
        email_notifications: true,
        telegram_notifications: false,
        in_app_notifications: true,
        daily_summary_time: '08:00:00',
      })
      .select()
      .single();

    return newSettings;
  }

  return settings;
}

/**
 * Actualiza las preferencias de notificación del usuario
 */
export async function updateUserSettings(settings: {
  email_notifications?: boolean;
  telegram_notifications?: boolean;
  in_app_notifications?: boolean;
  daily_summary_time?: string;
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'No autenticado' };
  }

  const { error } = await supabase
    .from('user_settings')
    .update(settings)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error updating user settings:', error);
    return { error: 'Error al actualizar configuración' };
  }

  revalidatePath('/dashboard/settings');
  return { success: true };
}

/**
 * Envía una notificación (wrapper para el servicio)
 * Útil para invocar desde otras server actions o edge functions
 */
export async function sendNotification(payload: NotificationPayload) {
  try {
    const service = getNotificationService();
    await service.send(payload);
    return { success: true };
  } catch (error) {
    console.error('Error sending notification:', error);
    return { error: 'Error al enviar notificación' };
  }
}
