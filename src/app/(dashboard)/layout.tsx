import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/layout/sidebar';
import { MobileNav } from '@/components/layout/mobile-nav';
import { logger } from '@/lib/utils/logger';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data?.user) {
    redirect('/login');
  }

  const { data: settings } = await supabase
    .from('user_settings')
    .select('onboarding_completed')
    .eq('user_id', data.user.id)
    .single();

  const settingsData = settings as { onboarding_completed: boolean } | null;
  if (!settingsData || !settingsData.onboarding_completed) {
    redirect('/onboarding');
  }

  import('@/lib/actions/sessions').then(({ processOverdueSessions }) => {
    processOverdueSessions().catch(err => logger.error('Error processing overdue sessions:', err));
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar — desktop */}
      <div className="hidden md:block">
        <Sidebar
          userEmail={data.user.email!}
          userName={data.user.user_metadata?.name}
        />
      </div>

      {/* Main content */}
      <main className="min-h-screen pb-20 md:ml-64 md:pb-0" aria-label="Contenido principal">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 xl:px-12">
          {children}
        </div>
      </main>

      {/* Mobile nav */}
      <MobileNav />
    </div>
  );
}
