import { createClient } from '@/lib/supabase/server';
import { getFilteredNotifications } from '@/lib/actions/notifications';
import { NotificationsClient } from './notifications-client';

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data?.user) {
    return null;
  }

  const initialData = await getFilteredNotifications({ limit: 20, offset: 0 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-headline text-3xl text-on-surface">Notificaciones</h1>
        <p className="mt-2 text-on-surface-variant">
          Todas tus notificaciones en un solo lugar
        </p>
      </div>
      <NotificationsClient initialData={initialData} />
    </div>
  );
}
