import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const url = new URL(request.url);
  const returnTo = url.searchParams.get('returnTo'); // 'onboarding' | null
  const state = returnTo === 'onboarding' ? `${user.id}|onboarding` : user.id;

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/calendar.events', // Crear/editar eventos
      'https://www.googleapis.com/auth/calendar.readonly', // Leer calendario completo
    ],
    prompt: 'consent', // Forzar refresh token
    state, // userId o "userId|onboarding" para volver a /onboarding
  });

  return NextResponse.redirect(authUrl);
}
