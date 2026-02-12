'use client';

import { useState, useEffect } from 'react';
import { AvailabilitySlot } from '@/lib/validations/availability';
import { WEEKDAYS_FULL } from '@/lib/utils/calendar-helpers';

interface AddSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (slot: AvailabilitySlot) => void;
  initialSlot?: AvailabilitySlot | null;
  preselectedDay?: number;
}

export function AddSlotModal({ isOpen, onClose, onSave, initialSlot, preselectedDay }: AddSlotModalProps) {
  const [dayOfWeek, setDayOfWeek] = useState(preselectedDay ?? 1);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');
  const [error, setError] = useState<string | null>(null);

  // Resetear cuando se abre/cierra o cambia el slot inicial
  useEffect(() => {
    if (initialSlot) {
      setDayOfWeek(initialSlot.day_of_week);
      setStartTime(initialSlot.start_time);
      setEndTime(initialSlot.end_time);
    } else if (preselectedDay !== undefined) {
      setDayOfWeek(preselectedDay);
      setStartTime('09:00');
      setEndTime('11:00');
    }
    setError(null);
  }, [isOpen, initialSlot, preselectedDay]);

  const handleSave = () => {
    // Validación
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    const start = startHour * 60 + startMinute;
    const end = endHour * 60 + endMinute;

    if (start >= end) {
      setError('La hora de fin debe ser posterior a la de inicio');
      return;
    }

    onSave({
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
      is_enabled: true,
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black bg-opacity-30 transition-opacity" onClick={onClose} />

        {/* Modal */}
        <div className="relative z-50 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              {initialSlot ? 'Editar Horario' : 'Agregar Horario'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Día */}
            <div>
              <label htmlFor="day" className="block text-sm font-medium text-gray-700 mb-1">
                Día de la semana
              </label>
              <select
                id="day"
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(Number(e.target.value))}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              >
                <option value={1}>Lunes</option>
                <option value={2}>Martes</option>
                <option value={3}>Miércoles</option>
                <option value={4}>Jueves</option>
                <option value={5}>Viernes</option>
                <option value={6}>Sábado</option>
                <option value={0}>Domingo</option>
              </select>
            </div>

            {/* Hora inicio */}
            <div>
              <label htmlFor="start" className="block text-sm font-medium text-gray-700 mb-1">
                Hora de inicio
              </label>
              <input
                id="start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              />
            </div>

            {/* Hora fin */}
            <div>
              <label htmlFor="end" className="block text-sm font-medium text-gray-700 mb-1">
                Hora de fin
              </label>
              <input
                id="end"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              {initialSlot ? 'Actualizar' : 'Agregar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
