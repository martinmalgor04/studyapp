'use client';

import { useState } from 'react';
import { TimeSlot } from '@/lib/services/availability-importer.service';
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

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

  const slotsByDay = slots.reduce((acc, slot) => {
    if (!acc[slot.day_of_week]) {
      acc[slot.day_of_week] = [];
    }
    acc[slot.day_of_week].push(slot);
    return acc;
  }, {} as Record<number, TimeSlot[]>);

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open) onCancel(); }}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col p-0">
        {/* Header */}
        <div className="p-6 border-b border-outline-variant/20">
          <h2 className="font-headline text-xl text-on-surface">
            Horarios detectados en tu Google Calendar
          </h2>
          <p className="mt-2 text-sm text-on-surface-variant">
            Encontramos {slots.length} horarios libres. Revisá y confirmá para importarlos.
          </p>

          {stats && (
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="bg-tertiary-container/30 p-4 rounded-xl">
                <div className="text-2xl font-bold text-on-tertiary-container">{stats.total}</div>
                <div className="text-xs text-on-tertiary-container/80">Slots detectados</div>
              </div>
              <div className="bg-secondary-container/30 p-4 rounded-xl">
                <div className="text-2xl font-bold text-on-secondary-container">{stats.valid}</div>
                <div className="text-xs text-on-secondary-container/80">Válidos (&ge;30min)</div>
              </div>
              <div className="bg-primary-container/30 p-4 rounded-xl">
                <div className="text-2xl font-bold text-on-primary-container">{stats.discarded}</div>
                <div className="text-xs text-on-primary-container/80">Descartados (&lt;30min)</div>
              </div>
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-y-auto p-6">
          {existingSlots && existingSlots.length > 0 && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="border border-outline-variant/20 rounded-xl p-3 bg-surface-container-low">
                <h4 className="text-sm font-headline text-on-surface-variant mb-2">Horarios Actuales</h4>
                <p className="text-xs text-on-surface-variant/80">{existingSlots.length} slots configurados</p>
              </div>
              <div className="border border-tertiary/20 rounded-xl p-3 bg-tertiary-container/20">
                <h4 className="text-sm font-headline text-on-tertiary-container mb-2">Horarios Nuevos</h4>
                <p className="text-xs text-on-tertiary-container/80">{slots.length} slots detectados</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {Object.entries(slotsByDay)
              .sort(([dayA], [dayB]) => Number(dayA) - Number(dayB))
              .map(([dayOfWeek, daySlots]) => (
                <div key={dayOfWeek} className="border border-outline-variant/20 rounded-xl p-4">
                  <h3 className="font-headline text-on-surface mb-3">
                    {DAY_NAMES[Number(dayOfWeek)]}
                  </h3>
                  <div className="space-y-2">
                    {daySlots.map((slot, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 py-2 px-3 bg-tertiary-container/20 rounded-lg"
                      >
                        <div className="flex-1">
                          <span className="text-sm font-medium text-on-tertiary-container">
                            {slot.start_time} - {slot.end_time}
                          </span>
                          <span className="ml-2 text-xs text-on-tertiary-container/80">
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

        {showStrategyOption && (
          <div className="px-6 py-4 border-t border-outline-variant/20 bg-surface-container-low">
            <label className="block text-sm font-headline text-on-surface mb-3">
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
                  className="h-4 w-4 text-tertiary focus:ring-tertiary"
                />
                <div>
                  <span className="text-sm font-medium text-on-surface">
                    Reemplazar mis horarios actuales
                  </span>
                  <p className="text-xs text-on-surface-variant">
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
                  className="h-4 w-4 text-tertiary focus:ring-tertiary"
                />
                <div>
                  <span className="text-sm font-medium text-on-surface">
                    Combinar con mis horarios actuales
                  </span>
                  <p className="text-xs text-on-surface-variant">
                    Mantiene tus horarios existentes y agrega los nuevos
                  </p>
                </div>
              </label>
            </div>
          </div>
        )}

        <DialogFooter className="p-6 border-t border-outline-variant/20 bg-surface-container-low">
          <Button variant="ghost" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading ? 'Importando...' : 'Confirmar e Importar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
