'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import {
  upsertUserSettings,
  findOnboardingStatus,
} from '@/lib/repositories/user-settings.repository';
import { insertAvailabilitySlots } from '@/lib/repositories/availability.repository';

type Shift = 'MORNING' | 'AFTERNOON' | 'NIGHT';

const SHIFT_TEMPLATES: Record<Shift, { start: string; end: string }> = {
  MORNING: { start: '08:00:00', end: '12:00:00' },
  AFTERNOON: { start: '13:00:00', end: '17:00:00' },
  NIGHT: { start: '18:00:00', end: '22:00:00' },
};

export async function saveOnboardingAvailability(
  shifts: Shift[],
  includeWeekends: boolean,
  studyStartHour?: string,
  studyEndHour?: string,
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'No autenticado' };
  }

  if (shifts.length === 0) {
    return { error: 'Debes seleccionar al menos un turno' };
  }

  const days = includeWeekends
    ? [1, 2, 3, 4, 5, 6, 0]
    : [1, 2, 3, 4, 5];

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

  const slotsResult = await insertAvailabilitySlots(slots);
  if (slotsResult.error) {
    return { error: slotsResult.error };
  }

  const settingsResult = await upsertUserSettings(user.id, {
    onboarding_completed: true,
    email_notifications: true,
    telegram_notifications: false,
    in_app_notifications: true,
    daily_summary_time: '08:00:00',
    study_start_hour: studyStartHour ? `${studyStartHour}:00` : '08:00:00',
    study_end_hour: studyEndHour ? `${studyEndHour}:00` : '23:00:00',
  });

  if (settingsResult.error) {
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

  const completed = await findOnboardingStatus(user.id);
  return { completed };
}
