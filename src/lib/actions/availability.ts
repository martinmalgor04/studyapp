'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { 
  updateAvailabilitySchema, 
  type UpdateAvailabilityInput
} from '@/lib/validations/availability';
import { getAvailabilityImporterService } from '@/lib/services/availability-importer.service';
import { findGoogleTokens } from '@/lib/repositories/user-settings.repository';
import {
  findAvailabilityByUserId,
  deleteAvailabilityByUserId,
  insertAvailabilitySlots,
  replaceAvailability,
  type AvailabilitySlotRow,
} from '@/lib/repositories/availability.repository';

export async function getAvailability(): Promise<AvailabilitySlotRow[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  return findAvailabilityByUserId(user.id);
}

export async function updateAvailability(input: UpdateAvailabilityInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'No autenticado' };
  }

  const validation = updateAvailabilitySchema.safeParse(input);
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  const result = await replaceAvailability(user.id, input.slots);
  if (result.error) {
    return { error: result.error };
  }

  revalidatePath('/dashboard/settings/availability');
  return { success: true };
}

export async function importAvailabilityFromGoogleCalendar(
  strategy: 'REPLACE' | 'MERGE' = 'REPLACE'
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'No autenticado' };
  }

  const tokens = await findGoogleTokens(user.id);
  if (!tokens) {
    return { error: 'Google Calendar no conectado. Conectá tu cuenta primero.' };
  }

  try {
    const importer = getAvailabilityImporterService();
    const detectedSlots = await importer.importFromGoogleCalendar(tokens, {
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      minSlotDuration: 30,
    });

    if (detectedSlots.length === 0) {
      return { 
        error: 'No se detectaron horarios libres en tu calendario. Configurá manualmente tus horarios disponibles.' 
      };
    }

    if (strategy === 'REPLACE') {
      const deleteResult = await deleteAvailabilityByUserId(user.id);
      if (deleteResult.error) {
        return { error: 'Error al actualizar disponibilidad' };
      }
    }

    if (strategy === 'MERGE') {
      const existingSlots = await findAvailabilityByUserId(user.id);

      if (existingSlots.length > 0) {
        const newSlots = detectedSlots.filter(detected => {
          return !existingSlots.some(existing =>
            existing.day_of_week === detected.day_of_week &&
            existing.start_time === detected.start_time &&
            existing.end_time === detected.end_time
          );
        });

        detectedSlots.length = 0;
        detectedSlots.push(...newSlots);
      }
    }

    const slotsToInsert = detectedSlots.map(slot => ({
      user_id: user.id,
      day_of_week: slot.day_of_week,
      start_time: slot.start_time,
      end_time: slot.end_time,
      is_enabled: slot.is_enabled,
    }));

    const insertResult = await insertAvailabilitySlots(slotsToInsert);
    if (insertResult.error) {
      return { error: insertResult.error };
    }

    revalidatePath('/dashboard/settings/availability');
    revalidatePath('/onboarding');
    
    return { 
      success: true, 
      slotsImported: detectedSlots.length,
      message: `${detectedSlots.length} horarios detectados e importados exitosamente`
    };
  } catch (error) {
    logger.error('Error importing from Google Calendar:', error);
    return { error: 'Error al importar desde Google Calendar' };
  }
}

/**
 * Preview de disponibilidad desde Google Calendar sin guardar.
 * Retorna slots detectados, estadísticas y slots existentes para comparación.
 */
export async function previewAvailabilityFromGoogleCalendar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'No autenticado' };
  }

  const tokens = await findGoogleTokens(user.id);
  if (!tokens) {
    return { error: 'Google Calendar no conectado. Conectá tu cuenta primero.' };
  }

  try {
    const importer = getAvailabilityImporterService();
    const allDetectedSlots = await importer.importFromGoogleCalendar(tokens, {
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      minSlotDuration: 30,
    });

    const validSlots = allDetectedSlots;
    const totalSlots = allDetectedSlots.length;
    const discardedSlots = 0;

    const totalHours = validSlots.reduce((acc, slot) => {
      const [startHour, startMin] = slot.start_time.split(':').map(Number);
      const [endHour, endMin] = slot.end_time.split(':').map(Number);
      const durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
      return acc + (durationMinutes / 60);
    }, 0);

    const existingSlotsData = await findAvailabilityByUserId(user.id);
    const existingSlots = existingSlotsData.map(slot => ({
      day_of_week: slot.day_of_week,
      start_time: slot.start_time.substring(0, 5),
      end_time: slot.end_time.substring(0, 5),
      is_enabled: slot.is_enabled,
    }));

    return {
      detectedSlots: validSlots,
      existingSlots,
      stats: {
        total: totalSlots,
        valid: validSlots.length,
        discarded: discardedSlots,
        totalHours: Math.round(totalHours * 10) / 10,
      },
    };
  } catch (error) {
    logger.error('Error previewing from Google Calendar:', error);
    return { error: 'Error al obtener preview desde Google Calendar' };
  }
}
