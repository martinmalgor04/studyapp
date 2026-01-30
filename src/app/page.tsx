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
        <p className="mb-8 text-xl text-gray-600">
          Sistema de estudio automatizado basado en Spaced Repetition
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="rounded-md bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
          >
            Iniciar Sesión
          </Link>
          <Link
            href="/register"
            className="rounded-md border border-gray-300 px-6 py-3 hover:bg-gray-50"
          >
            Crear Cuenta
          </Link>
        </div>
        <div className="mt-12 rounded-lg bg-blue-50 p-6">
          <h2 className="mb-2 text-lg font-semibold">Features</h2>
          <ul className="space-y-2 text-sm text-gray-700">
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
