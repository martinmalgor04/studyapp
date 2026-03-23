import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  expiry_date?: number;
}

const USER_SETTINGS_DEFAULTS = {
  email_notifications: true,
  telegram_notifications: false,
  in_app_notifications: true,
  daily_summary_time: '08:00:00',
} as const;

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function findUserSettings(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    logger.error('Error fetching user settings:', error);
    return null;
  }

  return data;
}

/**
 * Fetches user settings or creates a row with sane defaults when none exists.
 * Used by notification preferences and the notification dispatch service.
 */
export async function findUserSettingsOrCreate(userId: string) {
  const supabase = await createClient();

  const { data: settings, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!error && settings) {
    return settings;
  }

  const { data: newSettings } = await supabase
    .from('user_settings')
    .insert({ user_id: userId, ...USER_SETTINGS_DEFAULTS })
    .select()
    .single();

  return newSettings;
}

export async function findGoogleTokens(userId: string): Promise<GoogleTokens | null> {
  const supabase = await createClient();

  const { data: settings } = await supabase
    .from('user_settings')
    .select('google_access_token, google_refresh_token, google_token_expiry')
    .eq('user_id', userId)
    .single();

  if (!settings?.google_access_token) {
    return null;
  }

  return {
    access_token: settings.google_access_token,
    refresh_token: settings.google_refresh_token ?? undefined,
    expiry_date: settings.google_token_expiry
      ? new Date(settings.google_token_expiry).getTime()
      : undefined,
  };
}

export async function isGoogleCalendarEnabled(userId: string): Promise<boolean> {
  const supabase = await createClient();

  const { data: settings } = await supabase
    .from('user_settings')
    .select('google_calendar_enabled, google_access_token')
    .eq('user_id', userId)
    .single();

  return !!(settings?.google_calendar_enabled && settings?.google_access_token);
}

export async function findOnboardingStatus(userId: string): Promise<boolean> {
  const supabase = await createClient();

  const { data: settings } = await supabase
    .from('user_settings')
    .select('onboarding_completed')
    .eq('user_id', userId)
    .single();

  return settings?.onboarding_completed || false;
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function upsertUserSettings(
  userId: string,
  data: Record<string, unknown>,
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('user_settings')
    .upsert({ user_id: userId, ...data }, { onConflict: 'user_id' });

  if (error) {
    logger.error('Error upserting user settings:', error);
    return { error: 'Error al guardar configuración' };
  }

  return { error: null };
}

export async function updateUserSettingsById(
  userId: string,
  data: Record<string, unknown>,
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('user_settings')
    .update(data)
    .eq('user_id', userId);

  if (error) {
    logger.error('Error updating user settings:', error);
    return { error: 'Error al actualizar configuración' };
  }

  return { error: null };
}

export async function clearGoogleTokens(
  userId: string,
): Promise<{ error: string | null }> {
  return updateUserSettingsById(userId, {
    google_access_token: null,
    google_refresh_token: null,
    google_calendar_enabled: false,
    google_token_expiry: null,
  });
}

export async function findUserEmail(userId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('users')
    .select('email')
    .eq('id', userId)
    .single();
  if (error || !data?.email) {
    logger.error('Error fetching user email:', error);
    return null;
  }
  return data.email;
}
