'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getUserSettings, updateUserSettings } from '@/lib/actions/notifications';
import { connectGoogleCalendar, disconnectGoogleCalendar, isGoogleCalendarConnected, syncSessionsToGoogleCalendar } from '@/lib/actions/google-calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Database } from '@/types/database.types';

type UserSettingsRow = Database['public']['Tables']['user_settings']['Row'] | null;

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const [settings, setSettings] = useState<UserSettingsRow>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const loadSettings = async () => {
    setLoading(true);
    const data = await getUserSettings();
    setSettings(data);
    const connected = await isGoogleCalendarConnected();
    setGoogleConnected(connected);
    setLoading(false);
  };

  useEffect(() => {
    loadSettings();
    
    const googleSuccess = searchParams?.get('google_connected');
    if (googleSuccess === 'true') {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
  }, [searchParams]);

  const handleToggle = (field: string, value: boolean) => {
    setSettings((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleTimeChange = (field: string, value: string) => {
    setSettings((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleConnectGoogle = async () => {
    try {
      await connectGoogleCalendar();
    } catch {
      setError('Error al conectar con Google Calendar');
    }
  };

  const handleDisconnectGoogle = async () => {
    if (typeof window !== 'undefined' && !window.confirm('¿Desconectar Google Calendar? Se eliminarán los eventos sincronizados.')) return;
    
    const result = await disconnectGoogleCalendar();
    if (result.error) {
      setError(result.error);
    } else {
      setGoogleConnected(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    setError(null);
    
    const result = await syncSessionsToGoogleCalendar();
    
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
    
    setSyncing(false);
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    const result = await updateUserSettings({
      email_notifications: settings.email_notifications ?? undefined,
      telegram_notifications: settings.telegram_notifications ?? undefined,
      in_app_notifications: settings.in_app_notifications ?? undefined,
      daily_summary_time: settings.daily_summary_time ?? undefined,
      study_start_hour: settings.study_start_hour ?? undefined,
      study_end_hour: settings.study_end_hour ?? undefined,
    });

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center text-on-surface-variant">Cargando configuración...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="font-headline text-3xl text-on-surface">Configuración</h1>
        <p className="mt-1 text-sm text-on-surface-variant">Gestiona tus preferencias de notificaciones</p>
      </div>

      {success && (
        <div className="mb-6 rounded-lg bg-secondary-container/20 border border-secondary/20 p-4">
          <p className="text-sm text-on-secondary-container">Configuración guardada correctamente</p>
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-lg bg-error-container/20 border border-error/20 p-4">
          <p className="text-sm text-on-error-container">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        {/* In-App Notifications */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning-container/30 flex-shrink-0">
                <span className="material-symbols-rounded text-[24px] text-warning">notifications</span>
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-on-surface">Notificaciones In-App</h3>
                <p className="mt-1 text-sm text-on-surface-variant">Ver notificaciones en la campana del navbar</p>
              </div>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings?.in_app_notifications || false}
                  onChange={(e) => handleToggle('in_app_notifications', e.target.checked)}
                  className="h-5 w-5 rounded border-outline-variant/30 text-secondary accent-secondary focus:ring-2 focus:ring-secondary/30 focus:ring-offset-2"
                />
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Email Notifications */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-tertiary-container/30 flex-shrink-0">
                <span className="material-symbols-rounded text-[24px] text-tertiary">mail</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base font-semibold text-on-surface">Notificaciones por Email</h3>
                  <span className="rounded-full bg-warning-container/30 px-2 py-0.5 text-xs font-medium text-warning">
                    En desarrollo
                  </span>
                </div>
                <p className="text-sm text-on-surface-variant">Recibir resumen diario por correo electrónico</p>
              </div>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings?.email_notifications || false}
                  onChange={(e) => handleToggle('email_notifications', e.target.checked)}
                  className="h-5 w-5 rounded border-outline-variant/30 text-secondary accent-secondary focus:ring-2 focus:ring-secondary/30 focus:ring-offset-2"
                />
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Telegram Notifications */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-container/30 flex-shrink-0">
                <span className="material-symbols-rounded text-[24px] text-primary">send</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base font-semibold text-on-surface">Notificaciones por Telegram</h3>
                  <span className="rounded-full bg-warning-container/30 px-2 py-0.5 text-xs font-medium text-warning">
                    En desarrollo
                  </span>
                </div>
                <p className="text-sm text-on-surface-variant">Recibir mensajes instantáneos por Telegram</p>
              </div>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings?.telegram_notifications || false}
                  onChange={(e) => handleToggle('telegram_notifications', e.target.checked)}
                  className="h-5 w-5 rounded border-outline-variant/30 text-secondary accent-secondary focus:ring-2 focus:ring-secondary/30 focus:ring-offset-2"
                />
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Daily Summary Time */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-error-container/20 flex-shrink-0">
                <span className="material-symbols-rounded text-[24px] text-error">schedule</span>
              </div>
              <div className="flex-1">
                <h3 className="mb-1 text-base font-semibold text-on-surface">Hora del resumen diario</h3>
                <p className="mb-3 text-sm text-on-surface-variant">Hora preferida para recibir el resumen de sesiones del día</p>
                <input
                  type="time"
                  value={settings?.daily_summary_time?.substring(0, 5) || '08:00'}
                  onChange={(e) => handleTimeChange('daily_summary_time', e.target.value + ':00')}
                  className="block w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-on-surface focus:border-tertiary focus:outline-none focus:ring-2 focus:ring-tertiary/30 sm:text-sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Study Hours Range */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary-container/30 flex-shrink-0">
                <span className="material-symbols-rounded text-[24px] text-secondary">timer</span>
              </div>
              <div className="flex-1">
                <h3 className="mb-1 text-base font-semibold text-on-surface">Horario de estudio</h3>
                <p className="mb-3 text-sm text-on-surface-variant">Las sesiones se programarán dentro de este rango</p>
                <div className="flex items-center gap-3">
                  <div>
                    <label className="block text-xs font-medium text-on-surface-variant mb-1">Desde</label>
                    <input
                      type="time"
                      value={settings?.study_start_hour?.substring(0, 5) || '08:00'}
                      onChange={(e) => handleTimeChange('study_start_hour', e.target.value + ':00')}
                      className="block w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-on-surface focus:border-tertiary focus:outline-none focus:ring-2 focus:ring-tertiary/30 sm:text-sm"
                    />
                  </div>
                  <span className="mt-5 text-on-surface-variant/40">—</span>
                  <div>
                    <label className="block text-xs font-medium text-on-surface-variant mb-1">Hasta</label>
                    <input
                      type="time"
                      value={settings?.study_end_hour?.substring(0, 5) || '23:00'}
                      onChange={(e) => handleTimeChange('study_end_hour', e.target.value + ':00')}
                      className="block w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-on-surface focus:border-tertiary focus:outline-none focus:ring-2 focus:ring-tertiary/30 sm:text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Availability Link */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary-container/30 flex-shrink-0">
                <span className="material-symbols-rounded text-[24px] text-secondary">calendar_month</span>
              </div>
              <div className="flex-1">
                <h3 className="mb-1 text-base font-semibold text-on-surface">Disponibilidad Horaria</h3>
                <p className="mb-3 text-sm text-on-surface-variant">Definí tus horarios de estudio para mejorar la generación automática.</p>
                <a
                  href="/dashboard/settings/availability"
                  className="inline-flex items-center text-sm font-medium text-tertiary hover:text-tertiary-dim"
                >
                  Gestionar Disponibilidad &rarr;
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Google Calendar Sync */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-error-container/20 flex-shrink-0">
                <span className="material-symbols-rounded text-[24px] text-error">event</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base font-semibold text-on-surface">Google Calendar</h3>
                  {googleConnected && (
                    <span className="rounded-full bg-secondary-container/30 px-2 py-0.5 text-xs font-medium text-secondary">
                      Conectado
                    </span>
                  )}
                </div>
                <p className="text-sm text-on-surface-variant mb-3">
                  {googleConnected 
                    ? 'Tus sesiones se sincronizan automáticamente con Google Calendar'
                    : 'Conectá tu cuenta para sincronizar sesiones automáticamente'}
                </p>
                
                <div className="flex gap-2">
                  {!googleConnected ? (
                    <Button onClick={handleConnectGoogle}>
                      Conectar Google Calendar
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={handleSyncNow}
                        disabled={syncing}
                      >
                        {syncing ? 'Sincronizando...' : 'Sincronizar ahora'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleDisconnectGoogle}
                        className="border-error/30 text-error hover:bg-error-container/10"
                      >
                        Desconectar
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving}
            size="lg"
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </div>

      {/* Info sobre canales */}
      <Card className="mt-6 border-tertiary/20 bg-tertiary-container/10">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-tertiary-container/30 flex-shrink-0">
              <span className="material-symbols-rounded text-[20px] text-tertiary">info</span>
            </div>
            <div>
              <h3 className="mb-3 text-base font-semibold text-on-tertiary-container">Estado de los Canales</h3>
              <div className="space-y-2 text-sm text-on-tertiary-container/80">
                <div className="flex items-center gap-2">
                  <span className="font-medium">In-App:</span>
                  <span className="rounded-full bg-secondary-container/30 px-2 py-0.5 text-xs font-medium text-secondary">
                    Funcional
                  </span>
                  <span className="text-on-tertiary-container/60">Las notificaciones aparecen en la campana</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Email:</span>
                  <span className="rounded-full bg-warning-container/30 px-2 py-0.5 text-xs font-medium text-warning">
                    En desarrollo
                  </span>
                  <span className="text-on-tertiary-container/60">Arquitectura lista</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Telegram:</span>
                  <span className="rounded-full bg-warning-container/30 px-2 py-0.5 text-xs font-medium text-warning">
                    En desarrollo
                  </span>
                  <span className="text-on-tertiary-container/60">Arquitectura lista</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
