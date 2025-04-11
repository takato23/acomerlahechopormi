import { supabase } from '@/lib/supabaseClient';
import { Profile } from '@/types/userTypes';

/**
 * Obtiene el perfil del usuario actual.
 * @returns Promise<Profile>
 * @throws Error si el usuario no está autenticado o si hay un error en la consulta
 */
export const fetchUserProfile = async (): Promise<Profile> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  const { data, error } = await supabase
    .from('profiles')
    .select()
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching profile:', error);
    throw new Error('No se pudo obtener el perfil del usuario');
  }

  if (!data) {
    // Si no existe el perfil, crear uno básico
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert([
        {
          id: user.id,
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (createError) {
      console.error('Error creating profile:', createError);
      throw new Error('No se pudo crear el perfil del usuario');
    }

    return newProfile;
  }

  return data;
};

/**
 * Actualiza el perfil del usuario.
 * @param updates Datos a actualizar en el perfil
 * @returns Promise<Profile>
 * @throws Error si el usuario no está autenticado o si hay un error en la actualización
 */
export const updateUserProfile = async (updates: Partial<Profile>): Promise<Profile> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating profile:', error);
    throw new Error('No se pudo actualizar el perfil');
  }

  if (!data) {
    throw new Error('No se encontró el perfil para actualizar');
  }

  return data;
};