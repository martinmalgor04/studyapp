'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { 
  updateAvailabilitySchema, 
  type UpdateAvailabilityInput
} from '@/lib/validations/availability';
import { getAvailabilityImporterService } from '@/lib/services/availability-importer.service';

export async function getAvailability(): Promise<Array<{
  id: string;
  user_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_enabled: boolean;
}>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('availability_slots')
    .select('*')
    .eq('user_id', user.id)
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching availability:', error);
    return [];
  }

  return (data || []) as Array<{
    id: string;
    user_id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_enabled: boolean;
  }>;
}

export async function updateAvailability(input: UpdateAvailabilityInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'No autenticado' };
  }

  // Validar input
  const validation = updateAvailabilitySchema.safeParse(input);
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  // Estrategia: Eliminar todos los slots del usuario y crear los nuevos
  // Esto simplifica la lógica de actualización vs inserción vs eliminación
  
  // 1. Eliminar existentes
  const { error: deleteError } = await supabase
    .from('availability_slots')
    .delete()
    .eq('user_id', user.id);

  if (deleteError) {
    console.error('Error clearing availability:', deleteError);
    return { error: 'Error al actualizar disponibilidad' };
  }

  // 2. Insertar nuevos (si hay)
  if (input.slots.length > 0) {
    const slotsToInsert = input.slots.map(slot => ({
      user_id: user.id,
      day_of_week: slot.day_of_week,
      start_time: slot.start_time,
      end_time: slot.end_time,
      is_enabled: slot.is_enabled,
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: insertError } = await (supabase as any)
      .from('availability_slots')
      .insert(slotsToInsert);

    if (insertError) {
      console.error('Error inserting availability:', insertError);
      return { error: 'Error al guardar disponibilidad' };
    }
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

  // Obtener tokens de Google Calendar
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: settings } = await (supabase as any)
    .from('user_settings')
    .select('google_access_token, google_refresh_token, google_token_expiry')
    .eq('user_id', user.id)
    .single() as { data: { google_access_token?: string; google_refresh_token?: string; google_token_expiry?: string } | null };

  if (!settings?.google_access_token) {
    return { error: 'Google Calendar no conectado. Conectá tu cuenta primero.' };
  }

  const tokens = {
    access_token: settings.google_access_token,
    refresh_token: settings.google_refresh_token || undefined,
    expiry_date: settings.google_token_expiry
      ? new Date(settings.google_token_expiry).getTime()
      : undefined,
  };

  try {
    // Importar disponibilidad desde Google Calendar
    const importer = getAvailabilityImporterService();
    const detectedSlots = await importer.importFromGoogleCalendar(tokens, {
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // próximos 30 días
      minSlotDuration: 30,
    });

    if (detectedSlots.length === 0) {
      return { 
        error: 'No se detectaron horarios libres en tu calendario. Configurá manualmente tus horarios disponibles.' 
      };
    }

    // Si estrategia es REPLACE, eliminar slots existentes
    if (strategy === 'REPLACE') {
      const { error: deleteError } = await supabase
        .from('availability_slots')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('Error clearing availability:', deleteError);
        return { error: 'Error al actualizar disponibilidad' };
      }
    }

    // Si estrategia es MERGE, solo eliminar slots que se solapan
    if (strategy === 'MERGE') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existingSlots } = await (supabase as any)
        .from('availability_slots')
        .select('*')
        .eq('user_id', user.id) as { data: Array<{ day_of_week: number; start_time: string; end_time: string }> | null };

      if (existingSlots) {
        // Filtrar detectedSlots para excluir los que ya existen
        const newSlots = detectedSlots.filter(detected => {
          return !existingSlots.some(existing =>
            existing.day_of_week === detected.day_of_week &&
            existing.start_time === detected.start_time &&
            existing.end_time === detected.end_time
          );
        });

        // Usar solo los slots nuevos
        detectedSlots.length = 0;
        detectedSlots.push(...newSlots);
      }
    }

    // Insertar nuevos slots
    const slotsToInsert = detectedSlots.map(slot => ({
      user_id: user.id,
      day_of_week: slot.day_of_week,
      start_time: slot.start_time,
      end_time: slot.end_time,
      is_enabled: slot.is_enabled,
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: insertError } = await (supabase as any)
      .from('availability_slots')
      .insert(slotsToInsert);

    if (insertError) {
      console.error('Error inserting availability:', insertError);
      return { error: 'Error al guardar disponibilidad' };
    }

    revalidatePath('/dashboard/settings/availability');
    revalidatePath('/onboarding');
    
    return { 
      success: true, 
      slotsImported: detectedSlots.length,
      message: `${detectedSlots.length} horarios detectados e importados exitosamente`
    };
  } catch (error) {
    console.error('Error importing from Google Calendar:', error);
    return { error: 'Error al importar desde Google Calendar' };
  }
}
