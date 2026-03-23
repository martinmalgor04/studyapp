'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { getGoogleCalendarService } from '@/lib/services/google-calendar.service';
import {
  clearGoogleTokens,
  isGoogleCalendarEnabled,
} from '@/lib/repositories/user-settings.repository';

/**
 * Inicia el flujo de OAuth para conectar Google Calendar.
 * @param returnTo - Si es 'onboarding', tras autorizar Google se redirige a /onboarding en vez de a Settings.
 */
export async function connectGoogleCalendar(returnTo?: 'onboarding' | 'settings') {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'No autenticado' };
  }

  const query = returnTo === 'onboarding' ? '?returnTo=onboarding' : '';
  redirect(`/api/auth/google${query}`);
}

/**
 * Desconecta Google Calendar
 */
export async function disconnectGoogleCalendar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'No autenticado' };
  }

  const result = await clearGoogleTokens(user.id);
  if (result.error) {
    return { error: 'Error al desconectar' };
  }

  revalidatePath('/dashboard/settings');
  return { success: true };
}

/**
 * Verifica si el usuario tiene Google Calendar conectado
 */
export async function isGoogleCalendarConnected() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  return isGoogleCalendarEnabled(user.id);
}

/**
 * Sincroniza sesiones pendientes a Google Calendar
 */
export async function syncSessionsToGoogleCalendar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'No autenticado' };
  }

  try {
    const service = getGoogleCalendarService();
    const result = await service.syncSessions(user.id);

    revalidatePath('/dashboard/sessions');
    return { success: true, ...result };
  } catch (error) {
    logger.error('Error syncing to Google Calendar:', error);
    return { error: 'Error al sincronizar' };
  }
}
