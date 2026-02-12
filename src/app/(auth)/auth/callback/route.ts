import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
    
    // Verificar si el usuario completó el onboarding
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Consultar si tiene onboarding completado
      const { data: settings } = await supabase
        .from('user_settings')
        .select('onboarding_completed')
        .eq('user_id', user.id)
        .single();
      
      // Si no completó onboarding, redirigir allí
      if (!settings || !settings.onboarding_completed) {
        return NextResponse.redirect(`${origin}/onboarding`);
      }
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${origin}/dashboard`);
}
