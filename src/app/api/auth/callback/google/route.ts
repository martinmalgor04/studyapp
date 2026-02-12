import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const state = requestUrl.searchParams.get('state'); // userId
  const origin = requestUrl.origin;

  if (!code || !state) {
    return NextResponse.redirect(`${origin}/dashboard/settings?error=invalid_callback`);
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

    // Guardar tokens en user_settings
    const supabase = await createClient();
    const { error } = await supabase
      .from('user_settings')
      .update({
        google_access_token: tokens.access_token,
        google_refresh_token: tokens.refresh_token,
        google_calendar_enabled: true,
        google_token_expiry: tokens.expiry_date 
          ? new Date(tokens.expiry_date).toISOString() 
          : null,
      })
      .eq('user_id', state);

    if (error) {
      console.error('Error saving Google tokens:', error);
      return NextResponse.redirect(`${origin}/dashboard/settings?error=save_failed`);
    }

    return NextResponse.redirect(`${origin}/dashboard/settings?google_connected=true`);
  } catch (error) {
    console.error('Error in Google OAuth callback:', error);
    return NextResponse.redirect(`${origin}/dashboard/settings?error=auth_failed`);
  }
}
