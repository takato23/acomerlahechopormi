import {
  UserPreferences,
  UpdateUserPreferences,
  ComplexityLevel,
  DEFAULT_USER_PREFERENCES,
  isValidComplexityLevel,
  isValidTimeFormat,
  migrateOldPreferences,
  VALID_CUISINE_TYPES,
  CuisineType,
  PreferredMealTimes,
  MealType,
  UserObjectives
} from '@/types/userPreferences';

// Importar el cliente de Supabase centralizado
import { supabase } from '@/lib/supabaseClient';

// Función para detectar si usar datos mock
const shouldUseMockData = () => false;

const ensureObjectives = (objectives?: Partial<UserObjectives> | null): UserObjectives => ({
  primaryGoal: (objectives?.primaryGoal ?? null) as UserObjectives['primaryGoal'],
  weeklySavingsTarget: objectives?.weeklySavingsTarget ?? null,
  calorieTarget: objectives?.calorieTarget ?? null,
  householdBudget: objectives?.householdBudget ?? null
});

const coerceMealTimes = (value: unknown): PreferredMealTimes => {
  if (!value || typeof value !== 'object') return {};
  return Object.entries(value as Record<string, unknown>).reduce<PreferredMealTimes>((acc, [meal, time]) => {
    if (typeof time === 'string' && isValidTimeFormat(time)) {
      acc[meal as MealType] = time;
    }
    return acc;
  }, {});
};

const normalizeCuisinePreferences = (values: unknown): string[] => {
  if (!Array.isArray(values)) return [];
  const unique = new Set<string>();
  values.forEach(value => {
    if (typeof value === 'string' && value.trim().length > 0) {
      unique.add(value);
    }
  });
  return Array.from(unique);
};

/**
 * Servicio para gestionar las preferencias del usuario
 */
class PreferencesService {
  private static instance: PreferencesService;
  private preferencesCache: Map<string, UserPreferences> = new Map();

  private constructor() {}

  /**
   * Obtener instancia única del servicio
   */
  public static getInstance(): PreferencesService {
    if (!PreferencesService.instance) {
      PreferencesService.instance = new PreferencesService();
    }
    return PreferencesService.instance;
  }

  /**
   * Obtener preferencias de usuario
   * @param userId ID del usuario
   * @returns Preferencias del usuario o valores por defecto
   */
  async getUserPreferences(userId: string): Promise<UserPreferences> {
    // Intentar obtener del cache
    const cached = this.preferencesCache.get(userId);
    if (cached) return cached;

    if (shouldUseMockData()) {
      console.log('Using mock user preferences');
      const preferences = {
        ...DEFAULT_USER_PREFERENCES,
        cuisinePreferences: ['italiana', 'mediterránea'] as CuisineType[],
        dislikedIngredients: ['cebolla', 'ajo'],
        complexityPreference: 'medium' as ComplexityLevel,
        dietaryRestrictions: ['vegetariano']
      };
      this.preferencesCache.set(userId, preferences);
      return preferences;
    }

    // Obtener de Supabase
    const { data: profile, error } = await supabase
      .from('profiles')
      .select(`
        cuisine_preferences,
        disliked_ingredients,
        cooking_skill_level,
        preferred_meal_times,
        dietary_restrictions,
        max_calories,
        household_size,
        objectives,
        onboarding_completed_at
      `)
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user preferences:', error);
      return DEFAULT_USER_PREFERENCES;
    }

    // Convertir y validar datos
    const preferences: UserPreferences = {
      cuisinePreferences: normalizeCuisinePreferences(profile.cuisine_preferences),
      dislikedIngredients: Array.isArray(profile.disliked_ingredients)
        ? profile.disliked_ingredients
        : [],
      complexityPreference: isValidComplexityLevel(profile.cooking_skill_level)
        ? (profile.cooking_skill_level as ComplexityLevel)
        : 'medium',
      preferredMealTimes: coerceMealTimes(profile.preferred_meal_times),
      dietaryRestrictions: Array.isArray(profile.dietary_restrictions)
        ? profile.dietary_restrictions
        : [],
      maxCalories: typeof profile.max_calories === 'number' ? profile.max_calories : null,
      householdSize: typeof profile.household_size === 'number' && profile.household_size > 0
        ? profile.household_size
        : DEFAULT_USER_PREFERENCES.householdSize,
      objectives: ensureObjectives(profile.objectives),
      onboardingCompletedAt: profile.onboarding_completed_at ?? null
    };

    // Guardar en cache
    this.preferencesCache.set(userId, preferences);
    return preferences;
  }

  /**
   * Actualizar preferencias de usuario
   * @param userId ID del usuario
   * @param updates Cambios a aplicar
   */
  async updatePreferences(
    userId: string,
    updates: UpdateUserPreferences
  ): Promise<UserPreferences> {
    // Validar actualizaciones
    const validatedUpdates = this.validatePreferenceUpdates(updates);

    // Migrar campos antiguos si existen manteniendo los valores ya validados
    const migratedUpdates: UpdateUserPreferences = {
      ...validatedUpdates,
      ...migrateOldPreferences(validatedUpdates)
    };

    // Actualizar en Supabase
    const payload: Record<string, unknown> = {};

    if (migratedUpdates.cuisinePreferences !== undefined) {
      payload.cuisine_preferences = migratedUpdates.cuisinePreferences;
    }
    if (migratedUpdates.dislikedIngredients !== undefined) {
      payload.disliked_ingredients = migratedUpdates.dislikedIngredients;
    }
    if (migratedUpdates.complexityPreference !== undefined) {
      payload.cooking_skill_level = migratedUpdates.complexityPreference;
    }
    if (migratedUpdates.preferredMealTimes !== undefined) {
      payload.preferred_meal_times = migratedUpdates.preferredMealTimes;
    }
    if (migratedUpdates.dietaryRestrictions !== undefined) {
      payload.dietary_restrictions = migratedUpdates.dietaryRestrictions;
    }
    if (migratedUpdates.maxCalories !== undefined) {
      payload.max_calories = migratedUpdates.maxCalories;
    }
    if (migratedUpdates.householdSize !== undefined) {
      payload.household_size = migratedUpdates.householdSize;
    }
    if (migratedUpdates.objectives !== undefined) {
      payload.objectives = ensureObjectives(migratedUpdates.objectives);
    }
    if (migratedUpdates.onboardingCompletedAt !== undefined) {
      payload.onboarding_completed_at = migratedUpdates.onboardingCompletedAt;
    }

    if (Object.keys(payload).length === 0) {
      return this.getUserPreferences(userId);
    }

    const { error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', userId);

    if (error) {
      console.error('Error updating user preferences:', error);
      throw new Error('Failed to update preferences');
    }

    // Actualizar cache
    const currentPrefs = await this.getUserPreferences(userId);
    const newPrefs: UserPreferences = {
      ...currentPrefs,
      ...migratedUpdates,
      objectives: migratedUpdates.objectives
        ? ensureObjectives(migratedUpdates.objectives)
        : currentPrefs.objectives
    };
    this.preferencesCache.set(userId, newPrefs);

    return newPrefs;
  }

  /**
   * Limpiar preferencias de usuario
   * @param userId ID del usuario
   */
  async resetPreferences(userId: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({
        cuisine_preferences: DEFAULT_USER_PREFERENCES.cuisinePreferences,
        disliked_ingredients: DEFAULT_USER_PREFERENCES.dislikedIngredients,
        cooking_skill_level: DEFAULT_USER_PREFERENCES.complexityPreference,
        preferred_meal_times: DEFAULT_USER_PREFERENCES.preferredMealTimes,
        dietary_restrictions: DEFAULT_USER_PREFERENCES.dietaryRestrictions,
        max_calories: DEFAULT_USER_PREFERENCES.maxCalories,
        household_size: DEFAULT_USER_PREFERENCES.householdSize,
        objectives: DEFAULT_USER_PREFERENCES.objectives,
        onboarding_completed_at: DEFAULT_USER_PREFERENCES.onboardingCompletedAt
      })
      .eq('id', userId);

    if (error) {
      console.error('Error resetting user preferences:', error);
      throw new Error('Failed to reset preferences');
    }

    // Limpiar cache
    this.preferencesCache.delete(userId);
  }

  /**
   * Validar actualizaciones de preferencias
   */
  private validatePreferenceUpdates(
    updates: UpdateUserPreferences
  ): UpdateUserPreferences {
    const validated: UpdateUserPreferences = {};

    if (updates.cuisinePreferences) {
      const filtered = updates.cuisinePreferences.filter(
        (c: string): c is CuisineType => VALID_CUISINE_TYPES.includes(c as CuisineType)
      );
      validated.cuisinePreferences = Array.from(new Set(filtered));
    }

    if (updates.complexityPreference) {
      validated.complexityPreference = isValidComplexityLevel(updates.complexityPreference)
        ? updates.complexityPreference
        : 'medium';
    }

    if (updates.preferredMealTimes) {
      validated.preferredMealTimes = Object.entries(updates.preferredMealTimes)
        .reduce<PreferredMealTimes>((acc, [meal, time]) => {
          if (typeof time === 'string' && isValidTimeFormat(time)) {
            acc[meal as MealType] = time;
          }
          return acc;
        }, {});
    }

    if (updates.dislikedIngredients) {
      validated.dislikedIngredients = Array.from(new Set(updates.dislikedIngredients));
    }

    if (updates.dietaryRestrictions) {
      validated.dietaryRestrictions = Array.from(new Set(updates.dietaryRestrictions));
    }

    if (updates.maxCalories !== undefined) {
      const numeric =
        typeof updates.maxCalories === 'number' && updates.maxCalories > 0
          ? Math.round(updates.maxCalories)
          : null;
      validated.maxCalories = numeric;
    }

    if (updates.householdSize !== undefined) {
      const value = Number(updates.householdSize);
      validated.householdSize = Number.isInteger(value) && value > 0 ? value : 1;
    }

    if (updates.objectives) {
      validated.objectives = ensureObjectives(updates.objectives);
    }

    if (updates.onboardingCompletedAt !== undefined) {
      validated.onboardingCompletedAt = updates.onboardingCompletedAt;
    }

    return validated;
  }

  /**
   * Limpiar cache de preferencias
   * @param userId ID del usuario (opcional, si no se provee limpia todo el cache)
   */
  public clearCache(userId?: string): void {
    if (userId) {
      this.preferencesCache.delete(userId);
    } else {
      this.preferencesCache.clear();
    }
  }
}

// Exportar instancia única
export const preferencesService = PreferencesService.getInstance();
