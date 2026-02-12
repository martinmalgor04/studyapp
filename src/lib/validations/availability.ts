import { z } from 'zod';

// Regex para formato HH:MM
const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

export const availabilitySlotSchema = z.object({
  day_of_week: z.number().int().min(0).max(6),
  start_time: z.string().regex(timeRegex, 'Formato de hora inválido (HH:MM)'),
  end_time: z.string().regex(timeRegex, 'Formato de hora inválido (HH:MM)'),
  is_enabled: z.boolean().default(true),
}).refine((data) => {
  const [startHour, startMinute] = data.start_time.split(':').map(Number);
  const [endHour, endMinute] = data.end_time.split(':').map(Number);
  const start = startHour * 60 + startMinute;
  const end = endHour * 60 + endMinute;
  return start < end;
}, {
  message: 'La hora de fin debe ser posterior a la de inicio',
  path: ['end_time'],
});

export const updateAvailabilitySchema = z.object({
  slots: z.array(availabilitySlotSchema),
});

export type AvailabilitySlot = z.infer<typeof availabilitySlotSchema>;
export type UpdateAvailabilityInput = z.infer<typeof updateAvailabilitySchema>;
