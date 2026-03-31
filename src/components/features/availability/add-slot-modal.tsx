'use client';

import { useState } from 'react';
import { AvailabilitySlot } from '@/lib/validations/availability';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface AddSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (slot: AvailabilitySlot) => void;
  initialSlot?: AvailabilitySlot | null;
  preselectedDay?: number;
}

export function AddSlotModal({ isOpen, onClose, onSave, initialSlot, preselectedDay }: AddSlotModalProps) {
  const getInitialDay = () => initialSlot?.day_of_week ?? preselectedDay ?? 1;
  const getInitialStart = () => initialSlot?.start_time ?? '09:00';
  const getInitialEnd = () => initialSlot?.end_time ?? '11:00';

  const [dayOfWeek, setDayOfWeek] = useState(getInitialDay);
  const [startTime, setStartTime] = useState(getInitialStart);
  const [endTime, setEndTime] = useState(getInitialEnd);
  const [error, setError] = useState<string | null>(null);

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setDayOfWeek(getInitialDay());
      setStartTime(getInitialStart());
      setEndTime(getInitialEnd());
      setError(null);
    }
  }

  const handleSave = () => {
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initialSlot ? 'Editar Horario' : 'Agregar Horario'}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="rounded-lg bg-error-container/20 border border-error/20 p-4">
            <p className="text-sm text-on-error-container">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="day" className="block text-sm font-headline text-on-surface mb-1.5">
              Día de la semana
            </label>
            <Select
              id="day"
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(Number(e.target.value))}
            >
              <option value={1}>Lunes</option>
              <option value={2}>Martes</option>
              <option value={3}>Miércoles</option>
              <option value={4}>Jueves</option>
              <option value={5}>Viernes</option>
              <option value={6}>Sábado</option>
              <option value={0}>Domingo</option>
            </Select>
          </div>

          <div>
            <label htmlFor="start" className="block text-sm font-headline text-on-surface mb-1.5">
              Hora de inicio
            </label>
            <Input
              id="start"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="end" className="block text-sm font-headline text-on-surface mb-1.5">
              Hora de fin
            </label>
            <Input
              id="end"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSave}>
            {initialSlot ? 'Actualizar' : 'Agregar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
