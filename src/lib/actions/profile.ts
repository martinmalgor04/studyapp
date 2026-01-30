'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateUserName(name: string) {
  const supabase = await createClient();
  
  const { error } = await supabase.auth.updateUser({
    data: { name }
  });
  
  if (error) {
    return { error: error.message };
  }
  
  revalidatePath('/dashboard/profile');
  revalidatePath('/dashboard', 'layout');
  return { success: true };
}

export async function updatePassword(newPassword: string) {
  const supabase = await createClient();
  
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  });
  
  if (error) {
    return { error: error.message };
  }
  
  return { success: true };
}

export async function deleteUserAccount() {
  const supabase = await createClient();
  
  // Get user ID
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: 'Usuario no encontrado' };
  }
  
  // Delete from public.users first (cascade will handle related data)
  const { error: deleteError } = await supabase
    .from('users')
    .delete()
    .eq('id', user.id);
  
  if (deleteError) {
    return { error: deleteError.message };
  }
  
  // Sign out
  await supabase.auth.signOut();
  
  return { success: true };
}
