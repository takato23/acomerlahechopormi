import { supabase } from '@/lib/supabaseClient';
import type { UserProfile } from './userTypes';

const ALLOWED_DIETARY_VALUES = ['omnivore', 'vegetarian', 'vegan'];
const ALLOWED_DIFFICULTY_VALUES = ['easy', 'medium', 'hard'];

const MAX_USERNAME_LENGTH = 64;
const MAX_ALLERGIES_LENGTH = 500;

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
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error('Error getting user:', authError);
      return null;
    }

    if (!user || user.id !== userId) {
      console.warn('Attempted to access a profile without an active session or mismatched user.');
      return null;
    }

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select(
        'id, username, dietary_preference, allergies_restrictions, avatar_url, difficulty_preference, max_prep_time, gemini_api_key, excluded_ingredients, available_equipment',
      )
      .eq('id', userId)
      .single();

    if (profileError) {
      if (profileError.code !== 'PGRST116') {
        console.warn(
          `Error fetching profile for user ${userId} (but not PGRST116):`,
          profileError.message,
        );
      }
    }

    const baseProfile: UserProfile = {
      id: user.id,
      email: user.email ?? undefined,
      username: user.user_metadata?.username ?? null,
      dietary_preference: null,
      avatar_url: user.user_metadata?.avatar_url ?? null,
      difficulty_preference: null,
      max_prep_time: null,
      allergies_restrictions: null,
      gemini_api_key: null,
      excluded_ingredients: [],
      available_equipment: [],
    };

    if (!profileData) {
      return baseProfile;
    }

    return {
      ...baseProfile,
      username: profileData.username ?? baseProfile.username ?? null,
      dietary_preference: profileData.dietary_preference ?? null,
      allergies_restrictions: profileData.allergies_restrictions ?? null,
      avatar_url: profileData.avatar_url ?? baseProfile.avatar_url ?? null,
      difficulty_preference: profileData.difficulty_preference ?? null,
      max_prep_time: profileData.max_prep_time ?? null,
      gemini_api_key: profileData.gemini_api_key ?? null,
      excluded_ingredients: profileData.excluded_ingredients ?? [],
      available_equipment: profileData.available_equipment ?? [],
    };
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
// Ajustamos la firma para ser más flexible y permitir actualizar otros campos como avatar_url
export async function updateUserProfile(
  userId: string,
  profileData: Partial<Omit<UserProfile, 'id' | 'email'>>,
): Promise<boolean> {
  if (!userId) {
    console.error('updateUserProfile called without userId');
    return false;
  }

  if (!profileData || Object.keys(profileData).length === 0) {
    console.warn(`updateUserProfile called for user ${userId} with empty profileData.`);
    return true;
  }

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || user.id !== userId) {
      throw new Error('Usuario no autenticado');
    }

    const sanitizedData: Partial<Omit<UserProfile, 'id' | 'email'>> = {};

    if (profileData.username !== undefined) {
      const trimmed = profileData.username?.trim() || null;
      if (trimmed && trimmed.length > MAX_USERNAME_LENGTH) {
        throw new Error('El nombre de usuario es demasiado largo.');
      }
      sanitizedData.username = trimmed;
    }

    if (profileData.dietary_preference !== undefined) {
      if (
        profileData.dietary_preference !== null &&
        !ALLOWED_DIETARY_VALUES.includes(profileData.dietary_preference)
      ) {
        throw new Error('Preferencia dietética no permitida.');
      }
      sanitizedData.dietary_preference = profileData.dietary_preference;
    }

    if (profileData.difficulty_preference !== undefined) {
      if (
        profileData.difficulty_preference !== null &&
        !ALLOWED_DIFFICULTY_VALUES.includes(profileData.difficulty_preference)
      ) {
        throw new Error('Preferencia de dificultad no permitida.');
      }
      sanitizedData.difficulty_preference = profileData.difficulty_preference;
    }

    if (profileData.max_prep_time !== undefined) {
      const value = profileData.max_prep_time;
      sanitizedData.max_prep_time = typeof value === 'number' && value >= 0 ? value : null;
    }

    if (profileData.allergies_restrictions !== undefined) {
      const trimmed = profileData.allergies_restrictions?.trim() || null;
      if (trimmed && trimmed.length > MAX_ALLERGIES_LENGTH) {
        throw new Error('La descripción de alergias es demasiado larga.');
      }
      sanitizedData.allergies_restrictions = trimmed;
    }

    if (profileData.excluded_ingredients !== undefined) {
      sanitizedData.excluded_ingredients =
        profileData.excluded_ingredients
          ?.map((value) => value.trim())
          .filter((value) => value.length > 0) ?? [];
    }

    if (profileData.available_equipment !== undefined) {
      sanitizedData.available_equipment =
        profileData.available_equipment
          ?.map((value) => value.trim())
          .filter((value) => value.length > 0) ?? [];
    }

    if (profileData.avatar_url !== undefined) {
      sanitizedData.avatar_url = profileData.avatar_url;
    }

    if (profileData.gemini_api_key !== undefined) {
      sanitizedData.gemini_api_key = profileData.gemini_api_key;
    }

    if (Object.keys(sanitizedData).length === 0) {
      console.warn(
        `updateUserProfile called for user ${userId} but nothing remained after sanitization.`,
      );
      return true;
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update(sanitizedData)
      .eq('id', userId);

    if (updateError) {
      console.error(`Error updating profile for user ${userId}:`, updateError);
      throw new Error(updateError.message || 'No se pudo actualizar el perfil.');
    }

    console.log(`Profile updated successfully for user ${userId}:`, sanitizedData);
    return true;
  } catch (error) {
    console.error(`Unexpected error updating user profile for user ${userId}:`, error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('No se pudo actualizar el perfil.');
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
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
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
    const { data: urlData } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(filePath);

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
