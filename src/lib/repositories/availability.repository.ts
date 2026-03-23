import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export interface AvailabilitySlotRow {
  id: string;
  user_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_enabled: boolean;
}

export type AvailabilitySlotInsert = Omit<AvailabilitySlotRow, 'id'>;

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function findAvailabilityByUserId(
  userId: string,
): Promise<AvailabilitySlotRow[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('availability_slots')
    .select('*')
    .eq('user_id', userId)
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) {
    logger.error('Error fetching availability:', error);
    return [];
  }

  return (data ?? []) as AvailabilitySlotRow[];
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function deleteAvailabilityByUserId(
  userId: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('availability_slots')
    .delete()
    .eq('user_id', userId);

  if (error) {
    logger.error('Error clearing availability:', error);
    return { error: 'Error al eliminar disponibilidad' };
  }

  return { error: null };
}

export async function insertAvailabilitySlots(
  slots: AvailabilitySlotInsert[],
): Promise<{ error: string | null }> {
  if (slots.length === 0) {
    return { error: null };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('availability_slots')
    .insert(slots);

  if (error) {
    logger.error('Error inserting availability:', error);
    return { error: 'Error al guardar disponibilidad' };
  }

  return { error: null };
}

/**
 * Atomic replace: delete all user slots then insert new ones.
 * Used by updateAvailability and Google Calendar REPLACE import.
 */
export async function replaceAvailability(
  userId: string,
  slots: Array<Omit<AvailabilitySlotInsert, 'user_id'>>,
): Promise<{ error: string | null }> {
  const deleteResult = await deleteAvailabilityByUserId(userId);
  if (deleteResult.error) {
    return deleteResult;
  }

  if (slots.length === 0) {
    return { error: null };
  }

  const slotsWithUser: AvailabilitySlotInsert[] = slots.map((s) => ({
    ...s,
    user_id: userId,
  }));

  return insertAvailabilitySlots(slotsWithUser);
}
