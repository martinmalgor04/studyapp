'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { saveOnboardingAvailability } from '@/lib/actions/onboarding';
import { connectGoogleCalendar } from '@/lib/actions/google-calendar';
import { Button } from '@/components/ui/button';

type Shift = 'MORNING' | 'AFTERNOON' | 'NIGHT';
type OnboardingMode = 'selection' | 'manual' | 'google';

export function OnboardingClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<OnboardingMode>('selection');
  const [selectedShifts, setSelectedShifts] = useState<Shift[]>([]);
  const [includeWeekends, setIncludeWeekends] = useState(false);
  const [studyStartHour, setStudyStartHour] = useState('08:00');
  const [studyEndHour, setStudyEndHour] = useState('23:00');
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

    const result = await saveOnboardingAvailability(
      selectedShifts,
      includeWeekends,
      studyStartHour,
      studyEndHour,
    );

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
    <div className="min-h-screen bg-gradient-to-br from-tertiary-container/10 to-surface flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="font-headline text-4xl text-on-surface mb-2">Bienvenido a StudyApp</h1>
          <p className="text-lg text-on-surface-variant">
            Configuremos tus horarios de estudio para empezar
          </p>
        </div>

        {googleConnectedSuccess && (
          <div className="mb-6 rounded-xl border border-secondary/20 bg-secondary-container/20 p-4 text-center text-on-secondary-container">
            <p className="font-medium">Google Calendar conectado.</p>
            <p className="text-sm mt-1 text-on-secondary-container/80">Podés elegir otra opción o continuar al dashboard.</p>
          </div>
        )}

        {mode === 'selection' && (
          <>
            <div className="grid gap-6 sm:grid-cols-2 mb-8">
              <button
                onClick={() => setMode('manual')}
                className="rounded-xl border-2 border-outline-variant/20 bg-surface-container-lowest p-8 transition-all hover:border-tertiary hover:shadow-lg text-left"
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-tertiary-container/30 mb-4">
                  <span className="material-symbols-rounded text-[32px] text-tertiary">calendar_month</span>
                </div>
                <h3 className="text-xl font-semibold text-on-surface mb-2">Configurar Manualmente</h3>
                <p className="text-sm text-on-surface-variant">
                  Elegí turnos predefinidos (Mañana, Tarde, Noche)
                </p>
                <p className="text-xs text-on-surface-variant/60 mt-3">
                  <span className="material-symbols-rounded text-[14px] align-text-bottom">timer</span> Toma 1 minuto
                </p>
              </button>

              <button
                onClick={handleImportFromGoogle}
                disabled={saving}
                className="rounded-xl border-2 border-tertiary bg-gradient-to-br from-tertiary-container/10 to-surface-container-lowest p-8 transition-all hover:border-tertiary-dim hover:shadow-xl text-left disabled:opacity-50 relative"
              >
                <div className="absolute -top-3 -right-3 bg-tertiary text-on-tertiary text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                  Recomendado
                </div>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-tertiary-container/30 mb-4">
                  <svg className="h-8 w-8 text-tertiary" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-on-surface mb-2">Conectar Google Calendar</h3>
                <p className="text-sm text-on-surface-variant mb-2">Sincronización automática y continua</p>
                <ul className="text-xs text-on-surface-variant/60 space-y-1">
                  <li>✓ Detecta tus horarios libres automáticamente</li>
                  <li>✓ Evita conflictos con tus eventos</li>
                  <li>✓ Se actualiza cuando cambia tu agenda</li>
                </ul>
              </button>
            </div>

            <div className="text-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-sm text-on-surface-variant hover:text-on-surface transition-colors"
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
              className="mb-6 flex items-center gap-1 text-sm text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-rounded text-[18px]">arrow_back</span>
              Volver atrás
            </button>

            <div className="mb-12">
              <h2 className="font-headline text-xl text-on-surface mb-6 text-center">
                ¿Cuándo preferís estudiar?
              </h2>
              <p className="text-sm text-on-surface-variant mb-6 text-center">
                Seleccioná todos los momentos que quieras (podés elegir más de uno)
              </p>

              <div className="grid gap-6 sm:grid-cols-3">
                <button
                  onClick={() => toggleShift('MORNING')}
                  className={`rounded-xl border-2 p-8 transition-all hover:shadow-lg ${
                    selectedShifts.includes('MORNING')
                      ? 'border-tertiary bg-tertiary-container/10 shadow-md'
                      : 'border-outline-variant/20 bg-surface-container-lowest hover:border-tertiary/50'
                  }`}
                >
                  <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${
                    selectedShifts.includes('MORNING') ? 'bg-warning-container/30' : 'bg-surface-container-low'
                  }`}>
                    <span className="material-symbols-rounded text-[40px] text-warning">light_mode</span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-on-surface">Mañana</h3>
                  <p className="mt-2 text-sm text-on-surface-variant">08:00 - 12:00 hs</p>
                </button>

                <button
                  onClick={() => toggleShift('AFTERNOON')}
                  className={`rounded-xl border-2 p-8 transition-all hover:shadow-lg ${
                    selectedShifts.includes('AFTERNOON')
                      ? 'border-tertiary bg-tertiary-container/10 shadow-md'
                      : 'border-outline-variant/20 bg-surface-container-lowest hover:border-tertiary/50'
                  }`}
                >
                  <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${
                    selectedShifts.includes('AFTERNOON') ? 'bg-warning-container/30' : 'bg-surface-container-low'
                  }`}>
                    <span className="material-symbols-rounded text-[40px] text-warning">partly_cloudy_day</span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-on-surface">Tarde</h3>
                  <p className="mt-2 text-sm text-on-surface-variant">13:00 - 17:00 hs</p>
                </button>

                <button
                  onClick={() => toggleShift('NIGHT')}
                  className={`rounded-xl border-2 p-8 transition-all hover:shadow-lg ${
                    selectedShifts.includes('NIGHT')
                      ? 'border-tertiary bg-tertiary-container/10 shadow-md'
                      : 'border-outline-variant/20 bg-surface-container-lowest hover:border-tertiary/50'
                  }`}
                >
                  <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${
                    selectedShifts.includes('NIGHT') ? 'bg-primary-container/30' : 'bg-surface-container-low'
                  }`}>
                    <span className="material-symbols-rounded text-[40px] text-primary">dark_mode</span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-on-surface">Noche</h3>
                  <p className="mt-2 text-sm text-on-surface-variant">18:00 - 22:00 hs</p>
                </button>
              </div>
            </div>

            <div className="mb-12">
              <div className="rounded-xl border-2 border-outline-variant/20 bg-surface-container-lowest p-6 text-center">
                <h2 className="font-headline text-lg text-on-surface mb-4">
                  ¿Estudiás los fines de semana?
                </h2>
                <label className="inline-flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeWeekends}
                    onChange={(e) => setIncludeWeekends((e.target as HTMLInputElement).checked)}
                    className="h-6 w-6 rounded border-outline-variant/30 text-secondary accent-secondary focus:ring-2 focus:ring-secondary/30"
                  />
                  <span className="text-base text-on-surface-variant">
                    Sí, incluir sábados y domingos con los turnos seleccionados
                  </span>
                </label>
              </div>
            </div>

            <div className="mb-12">
              <div className="rounded-xl border-2 border-outline-variant/20 bg-surface-container-lowest p-6">
                <h2 className="font-headline text-lg text-on-surface mb-2 text-center">
                  Horario de estudio
                </h2>
                <p className="text-sm text-on-surface-variant mb-4 text-center">
                  Las sesiones se programarán dentro de este rango horario
                </p>
                <div className="flex items-center justify-center gap-4">
                  <div>
                    <label className="block text-sm font-medium text-on-surface-variant mb-1">Desde</label>
                    <input
                      type="time"
                      value={studyStartHour}
                      onChange={(e) => setStudyStartHour(e.target.value)}
                      className="block w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-on-surface focus:border-tertiary focus:outline-none focus:ring-2 focus:ring-tertiary/30 sm:text-sm"
                    />
                  </div>
                  <span className="mt-6 text-on-surface-variant/40">—</span>
                  <div>
                    <label className="block text-sm font-medium text-on-surface-variant mb-1">Hasta</label>
                    <input
                      type="time"
                      value={studyEndHour}
                      onChange={(e) => setStudyEndHour(e.target.value)}
                      className="block w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-on-surface focus:border-tertiary focus:outline-none focus:ring-2 focus:ring-tertiary/30 sm:text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-6 rounded-lg bg-error-container/20 border border-error/20 p-4 text-center">
                <p className="text-sm text-on-error-container">{error}</p>
              </div>
            )}

            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard')}
              >
                Omitir por ahora
              </Button>
              <Button
                onClick={handleFinish}
                disabled={saving || selectedShifts.length === 0}
                size="lg"
              >
                {saving ? 'Guardando...' : 'Finalizar y empezar'}
              </Button>
            </div>

            <p className="mt-8 text-center text-xs text-on-surface-variant/60">
              Podés ajustar estos horarios más tarde en Configuración
            </p>
          </>
        )}
      </div>
    </div>
  );
}
