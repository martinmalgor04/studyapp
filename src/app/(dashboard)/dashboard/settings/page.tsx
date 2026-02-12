'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getUserSettings, updateUserSettings } from '@/lib/actions/notifications';
import { connectGoogleCalendar, disconnectGoogleCalendar, isGoogleCalendarConnected, syncSessionsToGoogleCalendar } from '@/lib/actions/google-calendar';

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const [settings, setSettings] = useState<any>(null);
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
    
    // Verificar si viene de OAuth callback
    const googleSuccess = searchParams?.get('google_connected');
    if (googleSuccess === 'true') {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
  }, [searchParams]);

  const handleToggle = (field: string, value: boolean) => {
    setSettings((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleConnectGoogle = async () => {
    try {
      await connectGoogleCalendar();
    } catch (err) {
      setError('Error al conectar con Google Calendar');
    }
  };

  const handleDisconnectGoogle = async () => {
    // @ts-ignore
    if (!confirm('¿Desconectar Google Calendar? Se eliminarán los eventos sincronizados.')) return;
    
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
    setSaving(true);
    setError(null);
    setSuccess(false);

    const result = await updateUserSettings({
      email_notifications: settings.email_notifications,
      telegram_notifications: settings.telegram_notifications,
      in_app_notifications: settings.in_app_notifications,
      daily_summary_time: settings.daily_summary_time,
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
        <div className="text-center text-gray-500">Cargando configuración...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
        <p className="mt-1 text-sm text-gray-600">Gestiona tus preferencias de notificaciones</p>
      </div>

      {success && (
        <div className="mb-6 rounded-md bg-green-50 p-4">
          <p className="text-sm text-green-800">Configuración guardada correctamente</p>
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        {/* In-App Notifications */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 flex-shrink-0">
              <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-gray-900">Notificaciones In-App</h3>
              <p className="mt-1 text-sm text-gray-600">Ver notificaciones en la campana del navbar</p>
            </div>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings?.in_app_notifications || false}
                onChange={(e) => handleToggle('in_app_notifications', e.target.checked)}
                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              />
            </label>
          </div>
        </div>

        {/* Email Notifications */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 flex-shrink-0">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base font-semibold text-gray-900">Notificaciones por Email</h3>
                <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800">
                  En desarrollo
                </span>
              </div>
              <p className="text-sm text-gray-600">Recibir resumen diario por correo electrónico</p>
            </div>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings?.email_notifications || false}
                onChange={(e) => handleToggle('email_notifications', e.target.checked)}
                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              />
            </label>
          </div>
        </div>

        {/* Telegram Notifications */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-100 flex-shrink-0">
              <svg className="h-6 w-6 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base font-semibold text-gray-900">Notificaciones por Telegram</h3>
                <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800">
                  En desarrollo
                </span>
              </div>
              <p className="text-sm text-gray-600">Recibir mensajes instantáneos por Telegram</p>
            </div>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings?.telegram_notifications || false}
                onChange={(e) => handleToggle('telegram_notifications', e.target.checked)}
                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              />
            </label>
          </div>
        </div>

        {/* Daily Summary Time */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pink-100 flex-shrink-0">
              <svg className="h-6 w-6 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="mb-1 text-base font-semibold text-gray-900">Hora del resumen diario</h3>
              <p className="mb-3 text-sm text-gray-600">Hora preferida para recibir el resumen de sesiones del día</p>
              <input
                type="time"
                value={settings?.daily_summary_time?.substring(0, 5) || '08:00'}
                onChange={(e) => handleToggle('daily_summary_time', e.target.value + ':00')}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>
        </div>

        {/* Availability Link */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 flex-shrink-0">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="mb-1 text-base font-semibold text-gray-900">Disponibilidad Horaria</h3>
              <p className="mb-3 text-sm text-gray-600">Definí tus horarios de estudio para mejorar la generación automática.</p>
              <a
                href="/dashboard/settings/availability"
                className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                Gestionar Disponibilidad &rarr;
              </a>
            </div>
          </div>
        </div>

        {/* Google Calendar Sync */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 flex-shrink-0">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base font-semibold text-gray-900">Google Calendar</h3>
                {googleConnected && (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                    Conectado
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-3">
                {googleConnected 
                  ? 'Tus sesiones se sincronizan automáticamente con Google Calendar'
                  : 'Conectá tu cuenta para sincronizar sesiones automáticamente'}
              </p>
              
              <div className="flex gap-2">
                {!googleConnected ? (
                  <button
                    onClick={handleConnectGoogle}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Conectar Google Calendar
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleSyncNow}
                      disabled={syncing}
                      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {syncing ? 'Sincronizando...' : 'Sincronizar ahora'}
                    </button>
                    <button
                      onClick={handleDisconnectGoogle}
                      className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      Desconectar
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>

      {/* Info sobre canales */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 flex-shrink-0">
            <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="mb-3 text-base font-semibold text-blue-900">Estado de los Canales</h3>
            <div className="space-y-2 text-sm text-blue-800">
              <div className="flex items-center gap-2">
                <span className="font-medium">In-App:</span>
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                  Funcional
                </span>
                <span className="text-blue-700">Las notificaciones aparecen en la campana</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Email:</span>
                <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800">
                  En desarrollo
                </span>
                <span className="text-blue-700">Arquitectura lista</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Telegram:</span>
                <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800">
                  En desarrollo
                </span>
                <span className="text-blue-700">Arquitectura lista</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
