import { createClient } from '@supabase/supabase-js';
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
  MealType
} from '@/types/userPreferences';

// Inicializar cliente de Supabase
import { getSupabaseUrl, getSupabaseAnonKey } from '@/utils/getSupabaseEnv';
const supabaseUrl = getSupabaseUrl();
const supabaseAnonKey = getSupabaseAnonKey();

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Anon Key is missing. Check .env file.");
  throw new Error("Supabase URL and Anon Key must be available");
}

// Usar opciones simples sin headers explícitos
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  }
});

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
    if (!userId) {
      console.warn('Se intentó obtener preferencias sin proporcionar userId');
      return DEFAULT_USER_PREFERENCES;
    }

    // Intentar obtener del cache
    const cached = this.preferencesCache.get(userId);
    if (cached) {
      return cached;
    }
    
    try {
      // Obtener de Supabase
      const { data: profile, error } = await supabaseClient
        .from('profiles')
        .select(`
          id,
          dietary_restrictions,
          disliked_ingredients,
          complexity_preference,
          preferred_meal_times
        `)
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user preferences:', error);
        return DEFAULT_USER_PREFERENCES;
      }

      // Si no hay perfil o faltan campos, usar valores predeterminados
      if (!profile) {
        return DEFAULT_USER_PREFERENCES;
      }

      // Convertir y validar datos
      const preferences: UserPreferences = {
        // Empezar con valores predeterminados
        ...DEFAULT_USER_PREFERENCES,
        
        // Sobrescribir con datos del perfil si existen
        dislikedIngredients: Array.isArray(profile.disliked_ingredients)
          ? profile.disliked_ingredients
          : DEFAULT_USER_PREFERENCES.dislikedIngredients,
        
        complexityPreference: isValidComplexityLevel(profile.complexity_preference)
          ? profile.complexity_preference
          : DEFAULT_USER_PREFERENCES.complexityPreference,
        
        preferredMealTimes: typeof profile.preferred_meal_times === 'object' && profile.preferred_meal_times
          ? Object.entries(profile.preferred_meal_times).reduce<PreferredMealTimes>((acc, [meal, time]) => {
              if (typeof time === 'string' && isValidTimeFormat(time)) {
                acc[meal as MealType] = time;
              }
              return acc;
            }, {})
          : DEFAULT_USER_PREFERENCES.preferredMealTimes,
        
        dietaryRestrictions: Array.isArray(profile.dietary_restrictions)
          ? profile.dietary_restrictions
          : DEFAULT_USER_PREFERENCES.dietaryRestrictions,
        
        // La API puede no tener estos campos si no han sido migrados
        cuisinePreferences: DEFAULT_USER_PREFERENCES.cuisinePreferences,
      };

      // Guardar en cache
      this.preferencesCache.set(userId, preferences);
      return preferences;
    } catch (error) {
      console.error('Error inesperado obteniendo preferencias:', error);
      return DEFAULT_USER_PREFERENCES;
    }
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
    if (!userId) {
      throw new Error('Se requiere userId para actualizar preferencias');
    }

    // Validar actualizaciones
    const validatedUpdates = this.validatePreferenceUpdates(updates);

    // Migrar campos antiguos si existen
    const migratedUpdates = migrateOldPreferences(validatedUpdates);

    // Construir objeto de actualización con solo los campos existentes
    const updateObj: Record<string, any> = {};
    
    if (migratedUpdates.dislikedIngredients !== undefined) {
      updateObj.disliked_ingredients = migratedUpdates.dislikedIngredients;
    }
    
    if (migratedUpdates.complexityPreference !== undefined) {
      updateObj.complexity_preference = migratedUpdates.complexityPreference;
    }
    
    if (migratedUpdates.preferredMealTimes !== undefined) {
      updateObj.preferred_meal_times = migratedUpdates.preferredMealTimes;
    }
    
    if (migratedUpdates.dietaryRestrictions !== undefined) {
      updateObj.dietary_restrictions = migratedUpdates.dietaryRestrictions;
    }
    
    // Solo intentar actualizar si hay campos que actualizar
    if (Object.keys(updateObj).length > 0) {
      try {
        // Actualizar en Supabase
        const { error } = await supabaseClient
          .from('profiles')
          .update(updateObj)
          .eq('id', userId);

        if (error) {
          console.error('Error updating user preferences:', error);
          throw new Error('Error al actualizar preferencias: ' + error.message);
        }
      } catch (error) {
        console.error('Error updating preferences:', error);
        throw new Error('Falló la actualización de preferencias');
      }
    }

    // Actualizar cache
    const currentPrefs = await this.getUserPreferences(userId);
    const newPrefs = {
      ...currentPrefs,
      ...migratedUpdates
    };
    this.preferencesCache.set(userId, newPrefs);

    return newPrefs;
  }

  /**
   * Limpiar preferencias de usuario
   * @param userId ID del usuario
   */
  async resetPreferences(userId: string): Promise<void> {
    if (!userId) {
      throw new Error('Se requiere userId para reiniciar preferencias');
    }

    try {
      const { error } = await supabaseClient
        .from('profiles')
        .update({
          disliked_ingredients: DEFAULT_USER_PREFERENCES.dislikedIngredients,
          complexity_preference: DEFAULT_USER_PREFERENCES.complexityPreference,
          preferred_meal_times: DEFAULT_USER_PREFERENCES.preferredMealTimes,
          dietary_restrictions: DEFAULT_USER_PREFERENCES.dietaryRestrictions
        })
        .eq('id', userId);

      if (error) {
        console.error('Error resetting user preferences:', error);
        throw new Error('Falló el reinicio de preferencias: ' + error.message);
      }

      // Limpiar cache
      this.preferencesCache.delete(userId);
    } catch (error) {
      console.error('Error resetting preferences:', error);
      throw new Error('Falló el reinicio de preferencias');
    }
  }

  /**
   * Validar actualizaciones de preferencias
   */
  private validatePreferenceUpdates(
    updates: UpdateUserPreferences
  ): UpdateUserPreferences {
    const validated: UpdateUserPreferences = {};

    if (updates.cuisinePreferences) {
      validated.cuisinePreferences = updates.cuisinePreferences.filter(
        (c: string): c is CuisineType => VALID_CUISINE_TYPES.includes(c as CuisineType)
      );
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