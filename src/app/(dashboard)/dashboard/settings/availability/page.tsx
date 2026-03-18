'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAvailability, updateAvailability, importAvailabilityFromGoogleCalendar, previewAvailabilityFromGoogleCalendar } from '@/lib/actions/availability';
import { WeeklyScheduler } from '@/components/features/availability/weekly-scheduler';
import { AvailabilityCalendarGrid } from '@/components/features/availability/availability-calendar-grid';
import { AvailabilitySlot } from '@/lib/validations/availability';
import { isGoogleCalendarConnected, connectGoogleCalendar } from '@/lib/actions/google-calendar';
import { ImportPreviewDialog } from '@/components/features/availability/import-preview-dialog';
import type { TimeSlot } from '@/lib/services/availability-importer.service';

export default function AvailabilityPage() {
  const [initialSlots, setInitialSlots] = useState<Array<{ day_of_week: number; start_time: string; end_time: string; is_enabled: boolean }>>([]);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [configMethod, setConfigMethod] = useState<'manual' | 'google'>('manual');
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [previewSlots, setPreviewSlots] = useState<TimeSlot[]>([]);
  const [previewStats, setPreviewStats] = useState<any>(null);
  const [existingSlots, setExistingSlots] = useState<TimeSlot[]>([]);

  const router = useRouter();

  useEffect(() => {
    async function load() {
      const data = await getAvailability();
      const connected = await isGoogleCalendarConnected();
      setIsGoogleConnected(connected);
      
      setInitialSlots(data);
      // Transformar para calendario
      const transformed = data.map(d => ({
        day_of_week: d.day_of_week,
        start_time: d.start_time.substring(0, 5),
        end_time: d.end_time.substring(0, 5),
        is_enabled: d.is_enabled
      }));
      setSlots(transformed);
      setLoading(false);
    }
    load();
  }, []);

  // onSave para WeeklyScheduler (mantiene comportamiento original)
  const handleSaveFromScheduler = async (newSlots: AvailabilitySlot[]) => {
    await updateAvailability({ slots: newSlots });
  };

  // handleSave para Calendario
  const handleSaveCalendar = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    const result = await updateAvailability({ slots });

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }

    setSaving(false);
  };

  const handleConnectGoogle = async () => {
    setSaving(true);
    try {
      await connectGoogleCalendar();
    } catch {
      setError('Error al conectar con Google Calendar');
      setSaving(false);
    }
  };

  const handleImportFromGoogle = async () => {
    setSaving(true);
    setError(null);
    
    // Obtener preview sin guardar
    const result = await previewAvailabilityFromGoogleCalendar();
    
    if (result.error) {
      setError(result.error);
      setSaving(false);
      return;
    }
    
    // Guardar datos del preview y mostrar diálogo
    setPreviewSlots(result.detectedSlots || []);
    setPreviewStats(result.stats);
    setExistingSlots(result.existingSlots || []);
    setShowImportDialog(true);
    setSaving(false);
  };

  const handleConfirmImport = async (strategy: 'REPLACE' | 'MERGE') => {
    setSaving(true);
    setError(null);
    
    // Ahora sí ejecutar la importación real
    const result = await importAvailabilityFromGoogleCalendar(strategy);
    
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      setShowImportDialog(false);
      setTimeout(() => {
        setSuccess(false);
        router.refresh();
      }, 2000);
    }
    
    setSaving(false);
  };

  const handleCancelImport = () => {
    setShowImportDialog(false);
    setPreviewSlots([]);
    setPreviewStats(null);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center text-gray-500">Cargando disponibilidad...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Disponibilidad de Estudio</h1>
        <p className="mt-1 text-sm text-gray-600">
          Definí tus horarios libres para que el generador asigne sesiones automáticamente.
        </p>
      </div>

      {/* Feedback Messages - Solo en modo calendario */}
      {viewMode === 'calendar' && success && (
        <div className="mb-4 rounded-md bg-green-50 p-4">
          <p className="text-sm text-green-800">Disponibilidad guardada correctamente</p>
        </div>
      )}

      {viewMode === 'calendar' && error && (
        <div className="mb-4 rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Selector de método de configuración */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        {/* Manual */}
        <button
          onClick={() => setConfigMethod('manual')}
          className={`rounded-xl border-2 p-6 transition-all text-left ${
            configMethod === 'manual'
              ? 'border-gray-400 bg-gray-50 shadow-md'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
              <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Configuración Manual</h3>
          </div>
          <p className="text-sm text-gray-600">Definir horarios manualmente</p>
        </button>

        {/* Google Calendar */}
        <button
          onClick={() => setConfigMethod('google')}
          className={`rounded-xl border-2 p-6 transition-all text-left relative ${
            configMethod === 'google'
              ? 'border-blue-500 bg-blue-50 shadow-md'
              : 'border-gray-200 bg-white hover:border-blue-300'
          }`}
        >
          <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            ⭐ Recomendado
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Google Calendar</h3>
          </div>
          <p className="text-sm text-gray-600">Sincronización automática</p>
        </button>
      </div>

      {/* Google Calendar Section */}
      {configMethod === 'google' && (
        <div className="mb-6 rounded-lg border-2 border-blue-200 bg-blue-50 p-6">
          {isGoogleConnected ? (
            <>
              <div className="flex items-center gap-2 mb-4">
                <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium text-gray-900">Google Calendar conectado</span>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Tus horarios se sincronizan automáticamente. Las sesiones se programarán evitando conflictos con tus eventos.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleImportFromGoogle}
                  disabled={saving}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Actualizando...' : 'Actualizar desde Google Calendar'}
                </button>
              </div>
            </>
          ) : (
            <>
              <h3 className="font-medium text-gray-900 mb-2">Conectar Google Calendar</h3>
              <p className="text-sm text-gray-600 mb-4">
                Sincroniza automáticamente tus horarios libres y evita conflictos al programar sesiones.
              </p>
              <button
                onClick={handleConnectGoogle}
                disabled={saving}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Conectando...' : 'Conectar Google Calendar'}
              </button>
            </>
          )}
        </div>
      )}

      {/* Manual Configuration Section */}
      {configMethod === 'manual' && (
        <>
          {/* Toggle de vista */}
          <div className="mb-6 flex justify-end">
            <div className="flex rounded-md bg-gray-100 p-1">
              <button
                onClick={() => setViewMode('calendar')}
                className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === 'calendar' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Calendario
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Lista
              </button>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 flex-shrink-0">
            <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-blue-900">Cómo funciona</h3>
            <p className="text-sm text-blue-800 mt-1">
              {viewMode === 'calendar' 
                ? 'Click en "+ Agregar" de cada día para definir rangos horarios. Los bloques verdes indican tus horas disponibles.'
                : 'Agregá rangos horarios (ej: 18:00 a 22:00) en los días que podés estudiar. El botón de guardar está al final de la página.'}
            </p>
          </div>
        </div>
      </div>

          {/* Vista Calendario o Lista */}
          {viewMode === 'calendar' ? (
            <>
              <AvailabilityCalendarGrid
                slots={slots}
                onSlotsChange={setSlots}
              />
              {/* Save Button para Calendario */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleSaveCalendar}
                  disabled={saving}
                  className="rounded-md bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Guardar Disponibilidad'}
                </button>
              </div>
            </>
          ) : (
            <WeeklyScheduler
              initialSlots={initialSlots}
              onSave={handleSaveFromScheduler}
            />
          )}
        </>
      )}

      {/* Import Preview Dialog */}
      {showImportDialog && (
        <ImportPreviewDialog
          slots={previewSlots}
          existingSlots={existingSlots}
          stats={previewStats}
          showStrategyOption={existingSlots.length > 0}
          onConfirm={handleConfirmImport}
          onCancel={handleCancelImport}
        />
      )}
    </div>
  );
}
