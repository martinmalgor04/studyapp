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
        <h1 className="text-3xl font-bold text-gray-900">Notificaciones</h1>
        <p className="mt-2 text-gray-600">
          Todas tus notificaciones en un solo lugar
        </p>
      </div>
      <NotificationsClient initialData={initialData} />
    </div>
  );
}
