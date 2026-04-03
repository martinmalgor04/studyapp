import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (data?.user) {
    redirect('/dashboard');
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-4xl text-center">
        <h1 className="mb-4 text-5xl font-bold">StudyApp</h1>
        <p className="mb-8 text-xl text-on-surface-variant">
          Sistema de estudio automatizado basado en Spaced Repetition
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="rounded-md bg-tertiary px-6 py-3 text-on-tertiary hover:bg-tertiary-dim"
          >
            Iniciar Sesión
          </Link>
          <Link
            href="/register"
            className="rounded-md border border-outline-variant px-6 py-3 hover:bg-surface-container-low"
          >
            Crear Cuenta
          </Link>
        </div>
        <div className="mt-12 rounded-lg bg-tertiary-container/30 p-6">
          <h2 className="mb-2 text-lg font-semibold">Features</h2>
          <ul className="space-y-2 text-sm text-on-surface-variant">
            <li>✓ Generación automática de repasos con Spaced Repetition</li>
            <li>✓ Priorización inteligente según dificultad y fechas de exámenes</li>
            <li>✓ Gamificación con rachas y logros</li>
            <li>✓ Integración con Google Calendar</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
