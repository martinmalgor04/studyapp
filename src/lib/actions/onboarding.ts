'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

type Shift = 'MORNING' | 'AFTERNOON' | 'NIGHT';

const SHIFT_TEMPLATES: Record<Shift, { start: string; end: string }> = {
  MORNING: { start: '08:00:00', end: '12:00:00' },
  AFTERNOON: { start: '13:00:00', end: '17:00:00' },
  NIGHT: { start: '18:00:00', end: '22:00:00' },
};

export async function saveOnboardingAvailability(
  shifts: Shift[],
  includeWeekends: boolean
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'No autenticado' };
  }

  // Validar que se seleccionó al menos un turno
  if (shifts.length === 0) {
    return { error: 'Debes seleccionar al menos un turno' };
  }

  // Días de la semana: Lun-Vie o Lun-Dom
  const days = includeWeekends
    ? [1, 2, 3, 4, 5, 6, 0] // Lunes a Domingo
    : [1, 2, 3, 4, 5];       // Lunes a Viernes

  // Generar slots
  const slots: Array<{ user_id: string; day_of_week: number; start_time: string; end_time: string; is_enabled: boolean }> = [];
  for (const day of days) {
    for (const shift of shifts) {
      const template = SHIFT_TEMPLATES[shift];
      if (!template) {
        logger.warn(`Unknown shift: ${shift}`);
        continue;
      }
      
      slots.push({
        user_id: user.id,
        day_of_week: day,
        start_time: template.start,
        end_time: template.end,
        is_enabled: true,
      });
    }
  }

  // Guardar slots en availability_slots
  const { error: slotsError } = await supabase
    .from('availability_slots')
    .insert(slots);

  if (slotsError) {
    logger.error('Error saving availability slots:', slotsError);
    return { error: 'Error al guardar disponibilidad' };
  }

  // Marcar onboarding como completado en user_settings (UPSERT)
  const { error: settingsError } = await supabase
    .from('user_settings')
    .upsert({
      user_id: user.id,
      onboarding_completed: true,
      email_notifications: true,
      telegram_notifications: false,
      in_app_notifications: true,
      daily_summary_time: '08:00:00',
    }, {
      onConflict: 'user_id'
    });

  if (settingsError) {
    logger.error('Error upserting user_settings:', settingsError);
    return { error: 'Error al completar onboarding' };
  }

  revalidatePath('/dashboard');
  return { success: true, slotsCreated: slots.length };
}

export async function checkOnboardingStatus() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { completed: false };
  }

  const { data: settings } = await supabase
    .from('user_settings')
    .select('onboarding_completed')
    .eq('user_id', user.id)
    .single();

  return { completed: settings?.onboarding_completed || false };
}
