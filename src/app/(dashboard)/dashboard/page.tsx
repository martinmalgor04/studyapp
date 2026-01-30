import { createClient } from '@/lib/supabase/server';
import { DashboardClient } from './dashboard-client';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  return (
    <DashboardClient
      userName={data.user?.user_metadata?.name || data.user?.email || 'Usuario'}
    />
  );
}
