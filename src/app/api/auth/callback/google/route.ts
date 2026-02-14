import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const state = requestUrl.searchParams.get('state'); // userId o "userId|onboarding"
  const origin = requestUrl.origin;

  if (!code || !state) {
    return NextResponse.redirect(`${origin}/dashboard/settings?error=invalid_callback`);
  }

  const stateParts = state.includes('|') ? state.split('|') : [state, null];
  const userId = stateParts[0];
  const returnTo = stateParts[1] ?? null; // 'onboarding' si vino del onboarding

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

    // Guardar tokens en user_settings
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('user_settings')
      .update({
        google_access_token: tokens.access_token,
        google_refresh_token: tokens.refresh_token,
        google_calendar_enabled: true,
        google_token_expiry: tokens.expiry_date
          ? new Date(tokens.expiry_date).toISOString()
          : null,
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error saving Google tokens:', error);
      const to = returnTo === 'onboarding' ? '/onboarding' : '/dashboard/settings';
      return NextResponse.redirect(`${origin}${to}?error=save_failed`);
    }

    if (returnTo === 'onboarding') {
      return NextResponse.redirect(`${origin}/onboarding?google_connected=true`);
    }
    return NextResponse.redirect(`${origin}/dashboard/settings?google_connected=true`);
  } catch (error) {
    console.error('Error in Google OAuth callback:', error);
    const to = returnTo === 'onboarding' ? '/onboarding' : '/dashboard/settings';
    return NextResponse.redirect(`${origin}${to}?error=auth_failed`);
  }
}
