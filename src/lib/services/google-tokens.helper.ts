import { createClient } from '@/lib/supabase/server';

export interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  expiry_date?: number;
}

/**
 * Obtiene los tokens de Google Calendar de un usuario desde la DB.
 * Retorna null si el usuario no tiene Google Calendar conectado.
 */
export async function getGoogleTokens(userId: string): Promise<GoogleTokens | null> {
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
