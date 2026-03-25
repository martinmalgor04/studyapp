'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { getNotificationService } from '@/lib/services/notifications/notification.service';
import type { NotificationPayload } from '@/lib/services/notifications/channels/notification-channel.interface';
import {
  findNotificationsByUserId,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/lib/repositories/notifications.repository';
import {
  findUserSettingsOrCreate,
  updateUserSettingsById,
} from '@/lib/repositories/user-settings.repository';

/**
 * Obtiene todas las notificaciones del usuario (últimas 50)
 */
export async function getNotifications() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { notifications: [], unreadCount: 0 };
  }

  return findNotificationsByUserId(user.id);
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

  const result = await markNotificationRead(notificationId, user.id);
  if (result.error) {
    return { error: result.error };
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

  const result = await markAllNotificationsRead(user.id);
  if (result.error) {
    return { error: result.error };
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

  return findUserSettingsOrCreate(user.id);
}

/**
 * Actualiza las preferencias de notificación del usuario
 */
export async function updateUserSettings(settings: {
  email_notifications?: boolean;
  telegram_notifications?: boolean;
  in_app_notifications?: boolean;
  daily_summary_time?: string;
  study_start_hour?: string;
  study_end_hour?: string;
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'No autenticado' };
  }

  const result = await updateUserSettingsById(user.id, settings);
  if (result.error) {
    return { error: result.error };
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
    logger.error('Error sending notification:', error);
    return { error: 'Error al enviar notificación' };
  }
}
