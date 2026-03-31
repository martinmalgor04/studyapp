import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { LoginForm } from '@/components/features/auth/login-form';

export default async function LoginPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (data?.user) {
    redirect('/dashboard');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center font-headline text-3xl text-on-surface">
            Iniciar Sesión
          </h2>
          <p className="mt-2 text-center text-sm text-on-surface-variant">
            Sistema de Repetición Espaciada
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
