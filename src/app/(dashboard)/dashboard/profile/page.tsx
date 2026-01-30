import { createClient } from '@/lib/supabase/server';
import { ProfileClient } from './profile-client';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
      <p className="mt-2 text-gray-600">Administrá tu información personal y configuración de cuenta</p>
      
      <div className="mt-8">
        <ProfileClient 
          user={{
            id: data.user!.id,
            email: data.user!.email!,
            name: data.user!.user_metadata?.name || ''
          }}
        />
      </div>
    </div>
  );
}
