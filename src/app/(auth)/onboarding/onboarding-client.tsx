'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { saveOnboardingAvailability } from '@/lib/actions/onboarding';
import { connectGoogleCalendar } from '@/lib/actions/google-calendar';

type Shift = 'MORNING' | 'AFTERNOON' | 'NIGHT';
type OnboardingMode = 'selection' | 'manual' | 'google';

export function OnboardingClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<OnboardingMode>('selection');
  const [selectedShifts, setSelectedShifts] = useState<Shift[]>([]);
  const [includeWeekends, setIncludeWeekends] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleConnectedSuccess, setGoogleConnectedSuccess] = useState(false);

  useEffect(() => {
    if (searchParams?.get('google_connected') === 'true') {
      setGoogleConnectedSuccess(true);
      router.replace('/onboarding', { scroll: false });
    }
  }, [searchParams, router]);

  const toggleShift = (shift: Shift) => {
    if (selectedShifts.includes(shift)) {
      setSelectedShifts(selectedShifts.filter(s => s !== shift));
    } else {
      setSelectedShifts([...selectedShifts, shift]);
    }
  };

  const handleFinish = async () => {
    if (selectedShifts.length === 0) {
      setError('Seleccioná al menos un turno');
      return;
    }

    setSaving(true);
    setError(null);

    const result = await saveOnboardingAvailability(selectedShifts, includeWeekends);

    if (result.error) {
      setError(result.error);
      setSaving(false);
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  };

  const handleImportFromGoogle = async () => {
    setSaving(true);
    setError(null);

    try {
      await connectGoogleCalendar('onboarding');
    } catch {
      setError('Error al conectar con Google Calendar');
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Bienvenido a StudyApp</h1>
          <p className="text-lg text-gray-600">
            Configuremos tus horarios de estudio para empezar
          </p>
        </div>

        {googleConnectedSuccess && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-center text-green-800">
            <p className="font-medium">Google Calendar conectado.</p>
            <p className="text-sm mt-1">Podés elegir otra opción o continuar al dashboard.</p>
          </div>
        )}

        {mode === 'selection' && (
          <>
            <div className="grid gap-6 sm:grid-cols-2 mb-8">
              <button
                onClick={() => setMode('manual')}
                className="rounded-xl border-2 border-gray-200 bg-white p-8 transition-all hover:border-blue-500 hover:shadow-lg text-left"
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 mb-4">
                  <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Configurar Manualmente</h3>
                <p className="text-sm text-gray-600">
                  Elegí turnos predefinidos (Mañana, Tarde, Noche)
                </p>
                <p className="text-xs text-gray-500 mt-3">⏱️ Toma 1 minuto</p>
              </button>

              <button
                onClick={handleImportFromGoogle}
                disabled={saving}
                className="rounded-xl border-2 border-blue-500 bg-gradient-to-br from-blue-50 to-white p-8 transition-all hover:border-blue-600 hover:shadow-xl text-left disabled:opacity-50 relative"
              >
                <div className="absolute -top-3 -right-3 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                  ⭐ Recomendado
                </div>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 mb-4">
                  <svg className="h-8 w-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Conectar Google Calendar</h3>
                <p className="text-sm text-gray-600 mb-2">Sincronización automática y continua</p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>✓ Detecta tus horarios libres automáticamente</li>
                  <li>✓ Evita conflictos con tus eventos</li>
                  <li>✓ Se actualiza cuando cambia tu agenda</li>
                </ul>
              </button>
            </div>

            <div className="text-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Omitir por ahora
              </button>
            </div>
          </>
        )}

        {mode === 'manual' && (
          <>
            <button
              onClick={() => setMode('selection')}
              className="mb-6 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Volver atrás
            </button>

            <div className="mb-12">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                ¿Cuándo preferís estudiar?
              </h2>
              <p className="text-sm text-gray-600 mb-6 text-center">
                Seleccioná todos los momentos que quieras (podés elegir más de uno)
              </p>

              <div className="grid gap-6 sm:grid-cols-3">
                <button
                  onClick={() => toggleShift('MORNING')}
                  className={`rounded-xl border-2 p-8 transition-all hover:shadow-lg ${
                    selectedShifts.includes('MORNING')
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-blue-300'
                  }`}
                >
                  <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${
                    selectedShifts.includes('MORNING') ? 'bg-yellow-100' : 'bg-gray-100'
                  }`}>
                    <svg className="h-10 w-10 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">Mañana</h3>
                  <p className="mt-2 text-sm text-gray-600">08:00 - 12:00 hs</p>
                </button>

                <button
                  onClick={() => toggleShift('AFTERNOON')}
                  className={`rounded-xl border-2 p-8 transition-all hover:shadow-lg ${
                    selectedShifts.includes('AFTERNOON')
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-blue-300'
                  }`}
                >
                  <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${
                    selectedShifts.includes('AFTERNOON') ? 'bg-orange-100' : 'bg-gray-100'
                  }`}>
                    <svg className="h-10 w-10 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                    </svg>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">Tarde</h3>
                  <p className="mt-2 text-sm text-gray-600">13:00 - 17:00 hs</p>
                </button>

                <button
                  onClick={() => toggleShift('NIGHT')}
                  className={`rounded-xl border-2 p-8 transition-all hover:shadow-lg ${
                    selectedShifts.includes('NIGHT')
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-blue-300'
                  }`}
                >
                  <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${
                    selectedShifts.includes('NIGHT') ? 'bg-indigo-100' : 'bg-gray-100'
                  }`}>
                    <svg className="h-10 w-10 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">Noche</h3>
                  <p className="mt-2 text-sm text-gray-600">18:00 - 22:00 hs</p>
                </button>
              </div>
            </div>

            <div className="mb-12">
              <div className="rounded-xl border-2 border-gray-200 bg-white p-6 text-center">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  ¿Estudiás los fines de semana?
                </h2>
                <label className="inline-flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeWeekends}
                    onChange={(e) => setIncludeWeekends((e.target as HTMLInputElement).checked)}
                    className="h-6 w-6 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-base text-gray-700">
                    Sí, incluir sábados y domingos con los turnos seleccionados
                  </span>
                </label>
              </div>
            </div>

            {error && (
              <div className="mb-6 rounded-md bg-red-50 p-4 text-center">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="flex justify-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="rounded-md border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Omitir por ahora
              </button>
              <button
                onClick={handleFinish}
                disabled={saving || selectedShifts.length === 0}
                className="rounded-md bg-blue-600 px-8 py-3 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Guardando...' : 'Finalizar y empezar'}
              </button>
            </div>

            <p className="mt-8 text-center text-xs text-gray-500">
              Podés ajustar estos horarios más tarde en Configuración
            </p>
          </>
        )}
      </div>
    </div>
  );
}
