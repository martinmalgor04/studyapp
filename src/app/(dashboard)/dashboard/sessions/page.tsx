import { createClient } from '@/lib/supabase/server';
import { SessionsClient } from './sessions-client';

export default async function SessionsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  
  if (!data?.user) {
    // Redirect if no user
    return null;
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Sesiones de Estudio</h1>
        <p className="mt-2 text-gray-600">
          Próximos 30 días - Gestioná tus sesiones de repaso programadas
        </p>
      </div>
      
      <SessionsClient userId={data.user.id} />
    </div>
  );
}
