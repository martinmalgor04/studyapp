'use client';

import { useState } from 'react';
import { AvailabilitySlot } from '@/lib/validations/availability';
import { AddSlotModal } from './add-slot-modal';
import { WEEKDAYS } from '@/lib/utils/calendar-helpers';

interface AvailabilityCalendarGridProps {
  slots: AvailabilitySlot[];
  onSlotsChange: (slots: AvailabilitySlot[]) => void;
}

export function AvailabilityCalendarGrid({ slots, onSlotsChange }: AvailabilityCalendarGridProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<{ slot: AvailabilitySlot; index: number } | null>(null);
  const [preselectedDay, setPreselectedDay] = useState<number | undefined>(undefined);

  const handleAddSlot = (dayIndex: number) => {
    setPreselectedDay(dayIndex);
    setEditingSlot(null);
    setIsModalOpen(true);
  };

  const handleEditSlot = (slot: AvailabilitySlot, index: number) => {
    setEditingSlot({ slot, index });
    setPreselectedDay(undefined);
    setIsModalOpen(true);
  };

  const handleSaveSlot = (slot: AvailabilitySlot) => {
    if (editingSlot !== null) {
      // Editar slot existente
      const newSlots = [...slots];
      newSlots[editingSlot.index] = slot;
      onSlotsChange(newSlots);
    } else {
      // Agregar nuevo slot
      onSlotsChange([...slots, slot]);
    }
  };

  const handleDeleteSlot = (index: number) => {
    if (confirm('¿Eliminar este horario?')) {
      const newSlots = slots.filter((_, i) => i !== index);
      onSlotsChange(newSlots);
    }
  };

  // Agrupar slots por día
  const slotsByDay: Record<number, AvailabilitySlot[]> = {};
  for (let i = 0; i <= 6; i++) slotsByDay[i] = [];
  slots.forEach((slot, index) => {
    if (slotsByDay[slot.day_of_week]) {
      slotsByDay[slot.day_of_week].push(slot);
    }
  });

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      {/* Grid Compacto: 7 Columnas (días) */}
      <div className="grid grid-cols-7 gap-3">
        {[1, 2, 3, 4, 5, 6, 0].map((dayIndex) => (
          <div key={dayIndex} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            {/* Header del día */}
            <div className="mb-3 text-center border-b border-gray-300 pb-2">
              <h3 className="text-sm font-semibold text-gray-900">
                {WEEKDAYS[dayIndex === 0 ? 6 : dayIndex - 1]}
              </h3>
              <button
                onClick={() => handleAddSlot(dayIndex)}
                className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                + Agregar
              </button>
            </div>

            {/* Bloques de disponibilidad */}
            <div className="space-y-2 min-h-[100px]">
              {slotsByDay[dayIndex]?.length === 0 ? (
                <p className="text-xs text-gray-400 text-center italic py-4">Sin horarios</p>
              ) : (
                slotsByDay[dayIndex]?.map((slot, slotIndex) => {
                  const globalIndex = slots.findIndex(
                    s => s.day_of_week === dayIndex && 
                         s.start_time === slot.start_time && 
                         s.end_time === slot.end_time
                  );

                  return (
                    <div
                      key={slotIndex}
                      onClick={() => handleEditSlot(slot, globalIndex)}
                      className="rounded-md bg-green-100 border border-green-400 p-2 cursor-pointer hover:bg-green-200 hover:shadow-sm transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-medium text-green-800">
                          {slot.start_time} - {slot.end_time}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSlot(globalIndex);
                          }}
                          className="text-green-700 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <AddSlotModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSlot(null);
          setPreselectedDay(undefined);
        }}
        onSave={handleSaveSlot}
        initialSlot={editingSlot?.slot || null}
        preselectedDay={preselectedDay}
      />
    </div>
  );
}
