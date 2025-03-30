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
export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.error('Error getting user:', authError);
      return null;
    }
    if (!user) {
      // No hay usuario logueado
      return null;
    }

    // Intentar obtener el perfil de la tabla 'profiles'
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single(); 

    if (profileError) {
      // Código 'PGRST116' significa "Not Found", lo cual es esperado si el perfil no se ha creado aún.
      if (profileError.code !== 'PGRST116') {
         console.warn('Error fetching profile (but not PGRST116):', profileError.message);
      }
      // Devolver datos básicos del usuario de auth si no hay perfil en la tabla 'profiles'
      return { 
        id: user.id, 
        email: user.email,
        // Asegurarse de que los campos opcionales sean null por defecto si no hay perfil
        username: null,
        dietary_preference: null,
        avatar_url: null,
        difficulty_preference: null,
        max_prep_time: null,
        allergies_restrictions: null,
       }; 
    }

    // Combinar datos de auth y profile, asegurando valores null por defecto
    const combinedProfile: UserProfile = {
      id: user.id,
      email: user.email,
      username: profileData?.username || null,
      dietary_preference: profileData?.dietary_preference || null,
      avatar_url: profileData?.avatar_url || null,
      difficulty_preference: profileData?.difficulty_preference || null,
      max_prep_time: profileData?.max_prep_time || null,
      allergies_restrictions: profileData?.allergies_restrictions || null,
      // Añadir cualquier otro campo de profileData aquí
      // ...profileData // Cuidado si profileData tiene campos extra no definidos en UserProfile
    };
    return combinedProfile;

  } catch (error) {
    console.error('Unexpected error fetching user profile:', error);
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
export async function updateUserProfile(profileData: Partial<Omit<UserProfile, 'id' | 'email'>>): Promise<boolean> {
   try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Error getting user or no user logged in:', authError);
      return false;
    }

    // Asegurarse de no intentar actualizar id o email directamente en profiles
    // Usamos una copia para no modificar el objeto original si se reutiliza
    const updateData = { ...profileData };
    // delete (updateData as any).id; // No necesario por Omit, pero como doble seguro
    // delete (updateData as any).email;

    // Si no hay datos para actualizar después de quitar id/email (aunque Omit ya lo hace)
    if (Object.keys(updateData).length === 0) {
        console.warn("updateUserProfile called with no data to update.");
        return true; // Considerar éxito si no hay nada que hacer? O false? True parece más seguro.
    }


    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return false;
    }

    console.log('Profile updated successfully for user:', user.id, updateData);
    return true;

  } catch (error) {
    console.error('Unexpected error updating user profile:', error);
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
    const profileUpdated = await updateUserProfile({ avatar_url: publicUrl });

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