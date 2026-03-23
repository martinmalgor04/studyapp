import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { UserMenu } from '@/components/layout/user-menu';
import { NotificationBell } from '@/components/features/notifications/notification-bell';
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

  // Verificar si completó el onboarding
  const { data: settings } = await supabase
    .from('user_settings')
    .select('onboarding_completed')
    .eq('user_id', data.user.id)
    .single();

  // Si no completó onboarding, redirigir
  const settingsData = settings as { onboarding_completed: boolean } | null;
  if (!settingsData || !settingsData.onboarding_completed) {
    redirect('/onboarding');
  }

  // Procesar sesiones vencidas (auto-abandono + notificaciones)
  // Ejecutar en background, no bloquear render
  import('@/lib/actions/sessions').then(({ processOverdueSessions }) => {
    processOverdueSessions().catch(err => logger.error('Error processing overdue sessions:', err));
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b bg-white" aria-label="Navegación principal">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex flex-shrink-0 items-center">
                <Link href="/dashboard" className="text-xl font-bold text-gray-900" aria-label="Ir al inicio - StudyApp">
                  StudyApp
                </Link>
              </div>
              <div className="ml-10 flex space-x-8" role="list" aria-label="Menú principal">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/subjects"
                  className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
                >
                  Materias
                </Link>
                <Link
                  href="/dashboard/sessions"
                  className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
                >
                  Sesiones
                </Link>
                <Link
                  href="/dashboard/settings"
                  className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
                >
                  Configuración
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4" aria-label="Acciones de usuario">
              <NotificationBell />
              <UserMenu 
                userEmail={data.user.email!} 
                userName={data.user.user_metadata?.name}
              />
            </div>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" aria-label="Contenido principal">{children}</main>
    </div>
  );
}
