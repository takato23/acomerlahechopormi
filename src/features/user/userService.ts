import { supabase } from '@/lib/supabaseClient';
import type { UserProfile, UserProfileUpdate } from './userTypes';
import type { PreferredMealTimes, UserObjectives } from '@/types/userPreferences';

const AVATAR_BUCKET = 'avatars';

const toMealTimes = (value: unknown): PreferredMealTimes => {
  if (!value || typeof value !== 'object') return {};
  return Object.entries(value as Record<string, unknown>).reduce<PreferredMealTimes>((acc, [meal, time]) => {
    if (typeof time === 'string') {
      acc[meal as keyof PreferredMealTimes] = time;
    }
    return acc;
  }, {});
};

const toStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  const unique = new Set<string>();
  value.forEach(item => {
    if (typeof item === 'string' && item.trim().length > 0) {
      unique.add(item);
    }
  });
  return Array.from(unique);
};

const ensureObjectives = (value: unknown): UserObjectives => {
  if (!value || typeof value !== 'object') {
    return {
      primaryGoal: null,
      weeklySavingsTarget: null,
      calorieTarget: null,
      householdBudget: null
    };
  }

  const obj = value as Record<string, unknown>;
  return {
    primaryGoal: (obj.primaryGoal ?? null) as UserObjectives['primaryGoal'],
    weeklySavingsTarget: typeof obj.weeklySavingsTarget === 'number' ? obj.weeklySavingsTarget : null,
    calorieTarget: typeof obj.calorieTarget === 'number' ? obj.calorieTarget : null,
    householdBudget: typeof obj.householdBudget === 'number' ? obj.householdBudget : null
  };
};

const mapProfile = (row: Record<string, any>): UserProfile => {
  // Usar campos básicos que siempre existen
  const dietaryRestrictions = toStringArray(row.dietary_restrictions ?? row.dietaryRestrictions ?? []);
  const dislikedIngredients = toStringArray(row.disliked_ingredients ?? row.dislikedIngredients ?? []);
  const preferredCuisines = toStringArray(row.preferred_cuisines ?? row.preferredCuisines ?? []);
  const excludedIngredients = toStringArray(row.excluded_ingredients ?? row.excludedIngredients ?? []);
  const availableEquipment = toStringArray(row.available_equipment ?? row.availableEquipment ?? []);

  const profile: UserProfile = {
    id: row.id,
    username: row.username ?? null,
    avatarUrl: row.avatar_url ?? null,
    geminiApiKey: row.gemini_api_key ?? null,
    dietaryRestrictions,
    dislikedIngredients,
    preferredCuisines,
    cuisinePreferences: toStringArray(row.cuisine_preferences ?? row.cuisinePreferences ?? preferredCuisines),
    cookingSkillLevel: typeof row.cooking_skill_level === 'string' ? row.cooking_skill_level : null,
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
    // Campos opcionales con valores por defecto si no existen
    preferredMealTimes: toMealTimes(row.preferred_meal_times ?? row.preferredMealTimes ?? {}),
    maxCalories: typeof row.max_calories === 'number' ? row.max_calories : null,
    householdSize: typeof row.household_size === 'number' && row.household_size > 0 ? row.household_size : 1,
    onboardingCompletedAt: row.onboarding_completed_at ?? null,
    excludedIngredients,
    availableEquipment,
    cuisine_preferences: toStringArray(row.cuisine_preferences ?? row.cuisinePreferences ?? preferredCuisines),
    preferred_meal_times: toMealTimes(row.preferred_meal_times ?? row.preferredMealTimes ?? {}),
    max_calories: typeof row.max_calories === 'number' ? row.max_calories : null,
    household_size: typeof row.household_size === 'number' && row.household_size > 0 ? row.household_size : 1,
    onboarding_completed_at: row.onboarding_completed_at ?? null,
    objectives: ensureObjectives(row.objectives ?? {}),
    dietary_preference: row.dietary_preference ?? null,
    difficulty_preference: row.difficulty_preference ?? null,
    max_prep_time: typeof row.max_prep_time === 'number' ? row.max_prep_time : null,
    allergies_restrictions: row.allergies_restrictions ?? null,
    avatar_url: row.avatar_url ?? null,
    gemini_api_key: row.gemini_api_key ?? null,
    excluded_ingredients: excludedIngredients,
    available_equipment: availableEquipment
  };

  return profile;
};

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!userId) {
    console.error('getUserProfile called without userId');
    return null;
  }

  try {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

    if (error) {
      if (error.code !== 'PGRST116') {
        console.warn(`Error fetching profile for user ${userId}: ${error.message}`);
      }
      return null;
    }

    return mapProfile(data ?? {});
  } catch (err) {
    console.error(`Unexpected error fetching user profile for user ${userId}:`, err);
    return null;
  }
}

export async function updateUserProfile(userId: string, profileData: UserProfileUpdate): Promise<boolean> {
  if (!userId) {
    console.error('updateUserProfile called without userId');
    return false;
  }

  if (!profileData || Object.keys(profileData).length === 0) {
    return true;
  }

  const payload: Record<string, unknown> = {};

  if ('username' in profileData) payload.username = profileData.username ?? null;
  if ('avatarUrl' in profileData) payload.avatar_url = profileData.avatarUrl ?? null;
  if ('avatar_url' in profileData) payload.avatar_url = profileData.avatar_url ?? null;
  if ('geminiApiKey' in profileData) payload.gemini_api_key = profileData.geminiApiKey ?? null;
  if ('gemini_api_key' in profileData) payload.gemini_api_key = profileData.gemini_api_key ?? null;
  if ('cuisinePreferences' in profileData) payload.cuisine_preferences = profileData.cuisinePreferences ?? [];
  if ('dietaryRestrictions' in profileData) payload.dietary_restrictions = profileData.dietaryRestrictions ?? [];
  if ('dislikedIngredients' in profileData) payload.disliked_ingredients = profileData.dislikedIngredients ?? [];
  if ('preferredMealTimes' in profileData) payload.preferred_meal_times = profileData.preferredMealTimes ?? {};
  if ('maxCalories' in profileData) payload.max_calories = profileData.maxCalories ?? null;
  if ('householdSize' in profileData) payload.household_size = profileData.householdSize ?? 1;
  if ('onboardingCompletedAt' in profileData) payload.onboarding_completed_at = profileData.onboardingCompletedAt ?? null;
  if ('objectives' in profileData) payload.objectives = ensureObjectives(profileData.objectives ?? null);
  if ('cookingSkillLevel' in profileData) payload.cooking_skill_level = profileData.cookingSkillLevel ?? null;
  if ('dietary_preference' in profileData) payload.dietary_preference = profileData.dietary_preference ?? null;
  if ('difficulty_preference' in profileData) payload.difficulty_preference = profileData.difficulty_preference ?? null;
  if ('max_prep_time' in profileData) payload.max_prep_time = profileData.max_prep_time ?? null;
  if ('allergies_restrictions' in profileData) payload.allergies_restrictions = profileData.allergies_restrictions ?? null;
  if ('excludedIngredients' in profileData) payload.excluded_ingredients = profileData.excludedIngredients ?? [];
  if ('excluded_ingredients' in profileData) payload.excluded_ingredients = profileData.excluded_ingredients ?? [];
  if ('availableEquipment' in profileData) payload.available_equipment = profileData.availableEquipment ?? [];
  if ('available_equipment' in profileData) payload.available_equipment = profileData.available_equipment ?? [];

  if (Object.keys(payload).length === 0) {
    return true;
  }

  try {
    const { error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', userId);

    if (error) {
      console.error(`Error updating profile for user ${userId}:`, error);
      return false;
    }

    return true;
  } catch (err) {
    console.error(`Unexpected error updating user profile for user ${userId}:`, err);
    return false;
  }
}

export async function uploadAvatar(file: File): Promise<string | null> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Usuario no autenticado.');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('Error uploading avatar:', uploadError);
      throw uploadError;
    }

    const { data: urlData } = supabase.storage
      .from(AVATAR_BUCKET)
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      throw new Error('No se pudo obtener la URL pública del avatar.');
    }

    const profileUpdated = await updateUserProfile(user.id, { avatarUrl: urlData.publicUrl });

    if (!profileUpdated) {
      throw new Error('Avatar subido, pero no se pudo actualizar el perfil.');
    }

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error in uploadAvatar process:', error);
    return null;
  }
}
