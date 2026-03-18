'use client';

import { useState } from 'react';
import { TimeSlot } from '@/lib/services/availability-importer.service';

interface ImportPreviewDialogProps {
  slots: TimeSlot[];
  existingSlots?: TimeSlot[];
  stats?: {
    total: number;
    valid: number;
    discarded: number;
    totalHours: number;
  };
  onConfirm: (strategy: 'REPLACE' | 'MERGE') => Promise<void>;
  onCancel: () => void;
  showStrategyOption?: boolean;
}

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function calculateDuration(start: string, end: string): number {
  const [startHour, startMin] = start.split(':').map(Number);
  const [endHour, endMin] = end.split(':').map(Number);
  return (endHour * 60 + endMin) - (startHour * 60 + startMin);
}

export function ImportPreviewDialog({
  slots,
  existingSlots,
  stats,
  onConfirm,
  onCancel,
  showStrategyOption = false,
}: ImportPreviewDialogProps) {
  const [strategy, setStrategy] = useState<'REPLACE' | 'MERGE'>('REPLACE');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm(strategy);
    setLoading(false);
  };

  // Agrupar slots por día de semana
  const slotsByDay = slots.reduce((acc, slot) => {
    if (!acc[slot.day_of_week]) {
      acc[slot.day_of_week] = [];
    }
    acc[slot.day_of_week].push(slot);
    return acc;
  }, {} as Record<number, TimeSlot[]>);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-w-3xl w-full bg-white rounded-lg shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            Horarios detectados en tu Google Calendar
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Encontramos {slots.length} horarios libres. Revisá y confirmá para importarlos.
          </p>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
                <div className="text-xs text-blue-700">Slots detectados</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-900">{stats.valid}</div>
                <div className="text-xs text-green-700">Válidos (≥30min)</div>
              </div>
              <div className="bg-amber-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-amber-900">{stats.discarded}</div>
                <div className="text-xs text-amber-700">Descartados (&lt;30min)</div>
              </div>
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Comparación: Actual vs Importado */}
          {existingSlots && existingSlots.length > 0 && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="border rounded-lg p-3 bg-gray-50">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Horarios Actuales</h4>
                <p className="text-xs text-gray-600">{existingSlots.length} slots configurados</p>
              </div>
              <div className="border rounded-lg p-3 bg-blue-50">
                <h4 className="text-sm font-semibold text-blue-700 mb-2">Horarios Nuevos</h4>
                <p className="text-xs text-blue-600">{slots.length} slots detectados</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {Object.entries(slotsByDay)
              .sort(([dayA], [dayB]) => Number(dayA) - Number(dayB))
              .map(([dayOfWeek, daySlots]) => (
                <div key={dayOfWeek} className="border rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    {DAY_NAMES[Number(dayOfWeek)]}
                  </h3>
                  <div className="space-y-2">
                    {daySlots.map((slot, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 py-2 px-3 bg-blue-50 rounded-md"
                      >
                        <div className="flex-1">
                          <span className="text-sm font-medium text-blue-900">
                            {slot.start_time} - {slot.end_time}
                          </span>
                          <span className="ml-2 text-xs text-blue-700">
                            ({calculateDuration(slot.start_time, slot.end_time)} min)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Strategy Selection (solo para usuarios existentes) */}
        {showStrategyOption && (
          <div className="px-6 py-4 border-t border-b bg-gray-50">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              ¿Cómo querés importar estos horarios?
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="strategy"
                  value="REPLACE"
                  checked={strategy === 'REPLACE'}
                  onChange={() => setStrategy('REPLACE')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">
                    Reemplazar mis horarios actuales
                  </span>
                  <p className="text-xs text-gray-600">
                    Elimina tus horarios existentes y usa solo los detectados
                  </p>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="strategy"
                  value="MERGE"
                  checked={strategy === 'MERGE'}
                  onChange={() => setStrategy('MERGE')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">
                    Combinar con mis horarios actuales
                  </span>
                  <p className="text-xs text-gray-600">
                    Mantiene tus horarios existentes y agrega los nuevos
                  </p>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Importando...' : 'Confirmar e Importar'}
          </button>
        </div>
      </div>
    </div>
  );
}
