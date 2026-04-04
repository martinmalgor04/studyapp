'use client';

import { useState } from 'react';
import { AvailabilitySlot } from '@/lib/validations/availability';

interface WeeklySchedulerProps {
  initialSlots: Array<{ day_of_week: number; start_time: string; end_time: string; is_enabled?: boolean }>;
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
        is_enabled: slot.is_enabled ?? true
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

  const updateSlot = (dayIndex: number, slotIndex: number, field: keyof AvailabilitySlot, value: string | boolean) => {
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
    } catch {
      setError('Error al guardar la disponibilidad');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Feedback Messages */}
      {success && (
        <div className="rounded-md bg-secondary-container/30 p-4 text-sm text-on-secondary-container">
          Disponibilidad guardada correctamente
        </div>
      )}
      {error && (
        <div className="rounded-md bg-error-container/20 p-4 text-sm text-on-error-container">
          {error}
        </div>
      )}

      {/* Days List */}
      <div className="space-y-4">
        {[1, 2, 3, 4, 5, 6, 0].map((dayIndex) => ( // Lunes a Domingo
          <div key={dayIndex} className="rounded-lg border border-outline-variant bg-surface-container-lowest p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-on-surface flex items-center gap-2">
                {DAYS[dayIndex]}
                <span className="text-xs font-normal text-on-surface-variant">
                  ({slotsByDay[dayIndex].length} franjas)
                </span>
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => copyToAllDays(dayIndex)}
                  className="text-xs text-tertiary hover:text-tertiary-dim"
                  title="Copiar a todos los días"
                >
                  Copiar a todos
                </button>
                <button
                  onClick={() => addSlot(dayIndex)}
                  className="text-xs bg-tertiary-container/30 text-tertiary px-2 py-1 rounded hover:bg-tertiary-container/50"
                >
                  + Agregar Horario
                </button>
              </div>
            </div>

            {slotsByDay[dayIndex].length === 0 ? (
              <p className="text-sm text-on-surface-variant italic">No disponible (Día libre)</p>
            ) : (
              <div className="space-y-2">
                {slotsByDay[dayIndex].map((slot, slotIndex) => (
                  <div key={slotIndex} className="flex items-center gap-3 bg-surface-container-low p-2 rounded-md">
                    <input
                      type="time"
                      value={slot.start_time}
                      onChange={(e) => updateSlot(dayIndex, slotIndex, 'start_time', e.target.value)}
                      className="rounded border border-outline-variant px-2 py-1 text-sm bg-surface-container-lowest text-on-surface"
                    />
                    <span className="text-on-surface-variant">→</span>
                    <input
                      type="time"
                      value={slot.end_time}
                      onChange={(e) => updateSlot(dayIndex, slotIndex, 'end_time', e.target.value)}
                      className="rounded border border-outline-variant px-2 py-1 text-sm bg-surface-container-lowest text-on-surface"
                    />
                    <button
                      onClick={() => removeSlot(dayIndex, slotIndex)}
                      className="ml-auto text-on-surface-variant hover:text-error"
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
          className="rounded-md bg-tertiary px-6 py-2.5 text-sm font-medium text-on-tertiary shadow-lg hover:bg-tertiary-dim disabled:opacity-50 transition-all"
        >
          {saving ? 'Guardando...' : 'Guardar Disponibilidad'}
        </button>
      </div>
    </div>
  );
}
