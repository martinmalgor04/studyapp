'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { getGoogleCalendarService } from '@/lib/services/google-calendar.service';

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

  const { error } = await supabase
    .from('user_settings')
    .update({
      google_access_token: null,
      google_refresh_token: null,
      google_calendar_enabled: false,
      google_token_expiry: null,
    })
    .eq('user_id', user.id);

  if (error) {
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

  const { data: settings } = await supabase
    .from('user_settings')
    .select('google_calendar_enabled, google_access_token')
    .eq('user_id', user.id)
    .single();

  return !!(settings?.google_calendar_enabled && settings?.google_access_token);
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
