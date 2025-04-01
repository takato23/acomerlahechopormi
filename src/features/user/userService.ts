import { supabase } from '@/lib/supabaseClient';
import type { UserProfile } from './userTypes';

/**
 * Nombre del bucket de Supabase Storage utilizado para los avatares.
 * @constant {string}
 */
const AVATAR_BUCKET = 'avatars'; 

/**
 * Obtiene el perfil completo del usuario autenticado actualmente.
 * Combina datos de `auth.users` y la tabla `profiles`.
 * Si no existe un perfil en la tabla `profiles`, devuelve los datos básicos de auth.
 * @async
 * @function getUserProfile
 * @returns {Promise<UserProfile | null>} Una promesa que resuelve al perfil del usuario o null si no está autenticado o hay un error irrecuperable.
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!userId) {
    console.error('getUserProfile called without userId');
    return null;
  }
  try {
    // Obtener el perfil de la tabla 'profiles' seleccionando campos específicos
    // Nota: 'email' no suele estar en 'profiles', se omite aquí. Ajustar si es necesario.
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, dietary_preference, avatar_url, difficulty_preference, max_prep_time, allergies_restrictions, gemini_api_key') // Seleccionar explícitamente
      .eq('id', userId) // Usar userId del parámetro
      .single();

    if (profileError) {
      // Código 'PGRST116' significa "Not Found"
      if (profileError.code !== 'PGRST116') {
         console.warn(`Error fetching profile for user ${userId} (but not PGRST116):`, profileError.message);
      }
      // Si no se encuentra el perfil o hay otro error no fatal, devolver null.
      return null;
    }

    // Si se encontró el perfil, construir el objeto UserProfile
    // Asignar null a email ya que no se obtiene de 'profiles'
    const userProfile: UserProfile = {
      id: profileData.id,
      email: undefined, // Email no está en la tabla profiles, usar undefined según el tipo.
      username: profileData.username || null,
      dietary_preference: profileData.dietary_preference || null,
      avatar_url: profileData.avatar_url || null,
      difficulty_preference: profileData.difficulty_preference || null,
      max_prep_time: profileData.max_prep_time || null,
      allergies_restrictions: profileData.allergies_restrictions || null,
      gemini_api_key: profileData.gemini_api_key || null, // Incluir gemini_api_key
    };
    return userProfile;

  } catch (error) {
    console.error(`Unexpected error fetching user profile for user ${userId}:`, error);
    return null;
  }
}

/**
 * Actualiza los datos del perfil del usuario autenticado en la tabla 'profiles'.
 * No permite actualizar 'id' ni 'email'.
 * @async
 * @function updateUserProfile
 * @param {Partial<Omit<UserProfile, 'id' | 'email'>>} profileData - Un objeto con los campos a actualizar.
 * @returns {Promise<boolean>} Una promesa que resuelve a `true` si la actualización fue exitosa, `false` en caso contrario.
 */
// Ajustamos la firma para ser más flexible y permitir actualizar otros campos como avatar_url
export async function updateUserProfile(userId: string, profileData: Partial<Omit<UserProfile, 'id' | 'email'>>): Promise<boolean> {
   if (!userId) {
     console.error('updateUserProfile called without userId');
     return false;
   }
   // Validar que profileData no esté vacío
   if (!profileData || Object.keys(profileData).length === 0) {
       console.warn(`updateUserProfile called for user ${userId} with empty profileData.`);
       // Devolver true si no hay nada que hacer.
       return true;
   }
   // No necesitamos la validación estricta de 'gemini_api_key' aquí
   // ya que Omit<> maneja los campos no permitidos (id, email).

   try {
    // Usar el userId proporcionado.
    // Asegurarse de no intentar actualizar id o email (Omit ya lo hace)
    const updateData = { ...profileData }; // Copia para seguridad

    // Si no hay datos para actualizar (esto no debería pasar por la validación anterior, pero por si acaso)
    if (Object.keys(updateData).length === 0) {
        console.warn(`updateUserProfile called for user ${userId} with effectively no data to update after potential filtering.`);
        return true;
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId); // Usar el userId del parámetro

    if (updateError) {
      console.error(`Error updating profile for user ${userId}:`, updateError);
      return false;
    }

    console.log(`Profile updated successfully for user ${userId}:`, updateData);
    return true;

  } catch (error) {
    console.error(`Unexpected error updating user profile for user ${userId}:`, error);
    return false;
  }
}

/**
 * Sube un nuevo archivo de avatar para el usuario actual a Supabase Storage.
 * Genera un nombre de archivo único y actualiza la `avatar_url` en el perfil del usuario.
 * @async
 * @function uploadAvatar
 * @param {File} file - El archivo de imagen a subir (jpeg, png, webp). Se recomienda validar tipo/tamaño antes de llamar.
 * @returns {Promise<string | null>} La URL pública del avatar subido o null si falla.
 * @throws {Error} Si el usuario no está autenticado o si falla la subida o la obtención de la URL pública.
 */
export async function uploadAvatar(file: File): Promise<string | null> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Usuario no autenticado.');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`; 

    // Subir archivo
    const { error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600', 
        upsert: true, 
      });

    if (uploadError) {
      console.error('Error uploading avatar:', uploadError);
      throw uploadError; // Lanzar error para manejo externo
    }

    // Obtener URL pública
     const { data: urlData } = supabase.storage
      .from(AVATAR_BUCKET)
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
       console.error('Could not get public URL for uploaded avatar');
       // Considerar eliminar el archivo subido si no se obtiene URL
       // await supabase.storage.from(AVATAR_BUCKET).remove([filePath]); 
       throw new Error('No se pudo obtener la URL pública del avatar.');
    }
    
    const publicUrl = urlData.publicUrl;

    // Actualizar perfil
    // Pasar userId a updateUserProfile
    const profileUpdated = await updateUserProfile(user.id, { avatar_url: publicUrl });

    if (!profileUpdated) {
      console.warn('Avatar uploaded but failed to update profile URL.');
      // Considerar eliminar el archivo subido si falla la actualización del perfil
      // await supabase.storage.from(AVATAR_BUCKET).remove([filePath]);
      throw new Error('Avatar subido, pero no se pudo actualizar el perfil.');
    }

    console.log('Avatar uploaded and profile updated:', publicUrl);
    return publicUrl;

  } catch (error) {
    console.error('Error in uploadAvatar process:', error);
    // Devolver null para indicar fallo al llamador
    return null; 
  }
}