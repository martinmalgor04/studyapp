'use client';

import { useState } from 'react';
import { rescheduleSession, updateSessionStatus } from '@/lib/actions/sessions';

interface RescheduleDialogProps {
  isOpen: boolean;
  session: {
    id: string;
    topic?: { name: string } | null;
    subject?: { name: string } | null;
    scheduled_at: string;
    duration?: number;
    number?: number;
    attempts?: number;
  } | null;
  onClose: () => void;
  onSuccess: () => void;
}

// Opciones rápidas de reagendado
function getQuickOptions() {
  const now = new Date();
  
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);

  const in2Days = new Date(now);
  in2Days.setDate(in2Days.getDate() + 2);
  in2Days.setHours(9, 0, 0, 0);

  const nextMonday = new Date(now);
  nextMonday.setDate(nextMonday.getDate() + ((8 - nextMonday.getDay()) % 7 || 7));
  nextMonday.setHours(9, 0, 0, 0);

  return [
    { label: 'Manana', date: tomorrow },
    { label: 'En 2 dias', date: in2Days },
    { label: 'Proximo lunes', date: nextMonday },
  ];
}

export function RescheduleDialog({ isOpen, session, onClose, onSuccess }: RescheduleDialogProps) {
  const [newDate, setNewDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'quick' | 'custom'>('quick');

  if (!isOpen || !session) return null;

  const attempts = session.attempts || 0;
  const maxAttemptsReached = attempts >= 2;
  const quickOptions = getQuickOptions();

  const handleReschedule = async (dateStr: string) => {
    setError(null);
    setLoading(true);

    const result = await rescheduleSession(session.id, dateStr);
    
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      onSuccess();
      onClose();
      setNewDate('');
      setMode('quick');
    }
  };

  const handleQuickOption = (date: Date) => {
    handleReschedule(date.toISOString());
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate) return;
    handleReschedule(new Date(newDate).toISOString());
  };

  const handleAbandon = async () => {
    setLoading(true);
    await updateSessionStatus(session.id, 'ABANDONED');
    onSuccess();
    onClose();
  };

  const handleClose = () => {
    onClose();
    setNewDate('');
    setError(null);
    setMode('quick');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black bg-opacity-30 transition-opacity" onClick={handleClose} />

        {/* Dialog */}
        <div className="relative z-50 mx-4 w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Reagendar Sesion</h3>
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Info de la sesion */}
          <div className="rounded-lg bg-gray-50 p-4 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span>{session.subject?.name ?? 'Sin materia'} - {session.topic?.name ?? 'Sin tema'}</span>
              {session.number && <span className="text-gray-500">R{session.number}</span>}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
              <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Programada: {new Date(session.scheduled_at).toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' })}</span>
            </div>
            {attempts > 0 && (
              <div className="mt-2 text-xs text-gray-500">
                Reagendada {attempts} {attempts === 1 ? 'vez' : 'veces'}
              </div>
            )}
          </div>

          {/* Warning de intentos */}
          {maxAttemptsReached && (
            <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-4">
              <div className="flex items-start gap-3">
                <svg className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-red-800">
                    Esta sesion ya fue reagendada {attempts} veces.
                  </p>
                  <p className="text-sm text-red-700 mt-1">
                    Considerá abandonarla o completarla parcialmente.
                  </p>
                  <button
                    onClick={handleAbandon}
                    disabled={loading}
                    className="mt-2 rounded-md bg-red-100 px-3 py-1.5 text-xs font-medium text-red-800 hover:bg-red-200 disabled:opacity-50"
                  >
                    Abandonar sesion
                  </button>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Toggle Quick/Custom */}
          <div className="mb-4 flex rounded-md bg-gray-100 p-1">
            <button
              onClick={() => setMode('quick')}
              className={`flex-1 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                mode === 'quick' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Opciones rapidas
            </button>
            <button
              onClick={() => setMode('custom')}
              className={`flex-1 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                mode === 'custom' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Fecha personalizada
            </button>
          </div>

          {/* Quick Options */}
          {mode === 'quick' && (
            <div className="space-y-2">
              {quickOptions.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickOption(option.date)}
                  disabled={loading}
                  className="w-full rounded-lg border border-gray-200 bg-white p-4 text-left transition-all hover:border-blue-300 hover:shadow-sm disabled:opacity-50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{option.label}</p>
                      <p className="text-xs text-gray-600">
                        {option.date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })} - 09:00
                      </p>
                    </div>
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Custom Date */}
          {mode === 'custom' && (
            <form onSubmit={handleCustomSubmit} className="space-y-4">
              <div>
                <label htmlFor="new-date" className="block text-sm font-medium text-gray-700 mb-1">
                  Nueva fecha y hora
                </label>
                <input
                  id="new-date"
                  type="datetime-local"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  required
                  min={new Date().toISOString().slice(0, 16)}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !newDate}
                className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Reagendando...' : 'Confirmar fecha'}
              </button>
            </form>
          )}

          {/* Cancel */}
          <button
            onClick={handleClose}
            className="mt-4 w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
