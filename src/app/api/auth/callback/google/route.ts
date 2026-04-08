import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import type { Database } from '@/types/database.types';

type UserSettingsInsert = Database['public']['Tables']['user_settings']['Insert'];

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const state = requestUrl.searchParams.get('state'); // userId o "userId|onboarding"
  const origin = requestUrl.origin;

  if (!code || !state) {
    return NextResponse.redirect(`${origin}/dashboard/settings?error=invalid_callback`);
  }

  const stateParts = state.includes('|') ? state.split('|') : [state, null];
  const userId = stateParts[0] as string;
  const returnTo = stateParts[1] ?? null; // 'onboarding' si vino del onboarding

  if (!userId) {
    return NextResponse.redirect(`${origin}/dashboard/settings?error=invalid_state`);
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  try {
    // Intercambiar code por tokens
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error('No tokens received from Google');
    }

    // Guardar tokens en user_settings. Si vino del onboarding, hacer UPSERT para crear la fila si no existe.
    const supabase = await createClient();

    // Validar que el userId del state coincide con la sesión actual
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) {
      logger.warn('OAuth callback: userId mismatch', { stateUserId: userId, sessionUserId: user?.id });
      const to = returnTo === 'onboarding' ? '/onboarding' : '/dashboard/settings';
      return NextResponse.redirect(`${origin}${to}?error=invalid_state`);
    }
    const basePayload = {
      google_access_token: tokens.access_token,
      google_refresh_token: tokens.refresh_token,
      google_calendar_enabled: true,
      google_token_expiry: tokens.expiry_date
        ? new Date(tokens.expiry_date).toISOString()
        : null,
    };

    if (returnTo === 'onboarding') {
      // UPSERT: crea o actualiza tokens; no marcar onboarding_completed (lo setea el wizard al terminar).
      const upsertData: UserSettingsInsert = {
        user_id: userId,
        ...basePayload,
        email_notifications: true,
        telegram_notifications: false,
        in_app_notifications: true,
        daily_summary_time: '08:00:00',
      };
      const { error: upsertError } = await supabase
        .from('user_settings')
        .upsert(upsertData, { onConflict: 'user_id' });

      if (upsertError) {
        logger.error('Error saving Google tokens (onboarding upsert):', upsertError);
        return NextResponse.redirect(`${origin}/onboarding?error=save_failed`);
      }
    } else {
      // Update normal para quien ya tiene fila (Settings)
      const { error } = await supabase
        .from('user_settings')
        .update(basePayload)
        .eq('user_id', userId);

      if (error) {
        logger.error('Error saving Google tokens:', error);
        return NextResponse.redirect(`${origin}/dashboard/settings?error=save_failed`);
      }
    }

    if (returnTo === 'onboarding') {
      return NextResponse.redirect(`${origin}/onboarding?google_connected=true`);
    }
    return NextResponse.redirect(`${origin}/dashboard/settings?google_connected=true`);
  } catch (error) {
    logger.error('Error in Google OAuth callback:', error);
    const to = returnTo === 'onboarding' ? '/onboarding' : '/dashboard/settings';
    return NextResponse.redirect(`${origin}${to}?error=auth_failed`);
  }
}
