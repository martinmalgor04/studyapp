'use client';

import { useState } from 'react';
import { rescheduleSession } from '@/lib/actions/sessions';

interface RescheduleDialogProps {
  isOpen: boolean;
  session: {
    id: string;
    topic: { name: string };
    subject: { name: string };
    scheduled_at: string;
    attempts?: number;
  } | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function RescheduleDialog({ isOpen, session, onClose, onSuccess }: RescheduleDialogProps) {
  const [newDate, setNewDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !session) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await rescheduleSession(session.id, newDate);
    
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      onSuccess();
      onClose();
      setNewDate('');
    }
  };

  const attempts = session.attempts || 0;
  const showWarning = attempts >= 2;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900">Reagendar Sesión</h3>
        
        <div className="mt-4 space-y-2 text-sm text-gray-700">
          <p>
            <strong>Materia:</strong> {session.subject.name}
          </p>
          <p>
            <strong>Tema:</strong> {session.topic.name}
          </p>
          <p>
            <strong>Sesión actual:</strong>{' '}
            {new Date(session.scheduled_at).toLocaleString('es-AR')}
          </p>
        </div>

        {showWarning && (
          <div className="mt-4 rounded-md bg-orange-50 border border-orange-200 p-3">
            <p className="text-sm text-orange-800">
              ⚠️ Esta sesión ya fue reagendada {attempts} veces. Considerá marcarla como abandonada si no podés completarla.
            </p>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-md bg-red-50 p-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="new-date" className="block text-sm font-medium text-gray-700">
              Nueva Fecha y Hora
            </label>
            <input
              id="new-date"
              type="datetime-local"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              required
              min={new Date().toISOString().slice(0, 16)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                onClose();
                setNewDate('');
                setError(null);
              }}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !newDate}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Reagendando...' : 'Confirmar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
