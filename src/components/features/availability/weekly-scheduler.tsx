'use client';

import { useState } from 'react';
import { AvailabilitySlot } from '@/lib/validations/availability';

interface WeeklySchedulerProps {
  initialSlots: any[];
  onSave: (slots: AvailabilitySlot[]) => Promise<void>;
}

const DAYS = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];

export function WeeklyScheduler({ initialSlots, onSave }: WeeklySchedulerProps) {
  // Estado local transformado: Mapa de día -> array de slots
  const [slotsByDay, setSlotsByDay] = useState<Record<number, AvailabilitySlot[]>>(() => {
    const map: Record<number, AvailabilitySlot[]> = {};
    // Inicializar días vacíos
    for (let i = 0; i < 7; i++) map[i] = [];
    
    // Llenar con datos iniciales
    initialSlots.forEach(slot => {
      if (!map[slot.day_of_week]) map[slot.day_of_week] = [];
      map[slot.day_of_week].push({
        day_of_week: slot.day_of_week,
        start_time: slot.start_time.substring(0, 5), // HH:MM
        end_time: slot.end_time.substring(0, 5),     // HH:MM
        is_enabled: slot.is_enabled
      });
    });
    return map;
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const addSlot = (dayIndex: number) => {
    setSlotsByDay(prev => ({
      ...prev,
      [dayIndex]: [
        ...prev[dayIndex],
        { day_of_week: dayIndex, start_time: '09:00', end_time: '11:00', is_enabled: true }
      ]
    }));
  };

  const removeSlot = (dayIndex: number, slotIndex: number) => {
    setSlotsByDay(prev => ({
      ...prev,
      [dayIndex]: prev[dayIndex].filter((_, i) => i !== slotIndex)
    }));
  };

  const updateSlot = (dayIndex: number, slotIndex: number, field: keyof AvailabilitySlot, value: any) => {
    setSlotsByDay(prev => {
      const newSlots = [...prev[dayIndex]];
      newSlots[slotIndex] = { ...newSlots[slotIndex], [field]: value };
      return { ...prev, [dayIndex]: newSlots };
    });
  };

  const copyToAllDays = (sourceDayIndex: number) => {
    if (!confirm(`¿Copiar el horario de ${DAYS[sourceDayIndex]} a todos los demás días?`)) return;
    
    const sourceSlots = slotsByDay[sourceDayIndex];
    setSlotsByDay(prev => {
      const newMap = { ...prev };
      for (let i = 0; i < 7; i++) {
        if (i !== sourceDayIndex) {
          newMap[i] = sourceSlots.map(s => ({ ...s, day_of_week: i }));
        }
      }
      return newMap;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      // Aplanar el mapa a un array
      const allSlots = Object.values(slotsByDay).flat();
      await onSave(allSlots);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Error al guardar la disponibilidad');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Feedback Messages */}
      {success && (
        <div className="rounded-md bg-green-50 p-4 text-sm text-green-800">
          Disponibilidad guardada correctamente
        </div>
      )}
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Days List */}
      <div className="space-y-4">
        {[1, 2, 3, 4, 5, 6, 0].map((dayIndex) => ( // Lunes a Domingo
          <div key={dayIndex} className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                {DAYS[dayIndex]}
                <span className="text-xs font-normal text-gray-500">
                  ({slotsByDay[dayIndex].length} franjas)
                </span>
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => copyToAllDays(dayIndex)}
                  className="text-xs text-blue-600 hover:text-blue-700"
                  title="Copiar a todos los días"
                >
                  Copiar a todos
                </button>
                <button
                  onClick={() => addSlot(dayIndex)}
                  className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100"
                >
                  + Agregar Horario
                </button>
              </div>
            </div>

            {slotsByDay[dayIndex].length === 0 ? (
              <p className="text-sm text-gray-400 italic">No disponible (Día libre)</p>
            ) : (
              <div className="space-y-2">
                {slotsByDay[dayIndex].map((slot, slotIndex) => (
                  <div key={slotIndex} className="flex items-center gap-3 bg-gray-50 p-2 rounded-md">
                    <input
                      type="time"
                      value={slot.start_time}
                      onChange={(e) => updateSlot(dayIndex, slotIndex, 'start_time', e.target.value)}
                      className="rounded border border-gray-300 px-2 py-1 text-sm"
                    />
                    <span className="text-gray-400">→</span>
                    <input
                      type="time"
                      value={slot.end_time}
                      onChange={(e) => updateSlot(dayIndex, slotIndex, 'end_time', e.target.value)}
                      className="rounded border border-gray-300 px-2 py-1 text-sm"
                    />
                    <button
                      onClick={() => removeSlot(dayIndex, slotIndex)}
                      className="ml-auto text-gray-400 hover:text-red-500"
                      title="Eliminar franja"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Save Button */}
      <div className="flex justify-end sticky bottom-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg hover:bg-blue-700 disabled:opacity-50 transition-all"
        >
          {saving ? 'Guardando...' : 'Guardar Disponibilidad'}
        </button>
      </div>
    </div>
  );
}
