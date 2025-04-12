// Tipos para las preferencias de usuario mejoradas
// Referencias: recipe_generation_enhancement_plan.md

/**
 * Nivel de complejidad para recetas
 */
export type ComplexityLevel = 'simple' | 'medium' | 'complex';

/**
 * Tipo de comida
 */
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

/**
 * Formato de hora preferida
 * Ejemplo: "0730" para 7:30 AM, "1430" para 2:30 PM
 */
export type PreferredTimeFormat = string;

/**
 * Horarios preferidos para cada tipo de comida
 */
export interface PreferredMealTimes {
  breakfast?: PreferredTimeFormat;
  lunch?: PreferredTimeFormat;
  dinner?: PreferredTimeFormat;
  snack?: PreferredTimeFormat;
}

/**
 * Preferencias completas del usuario
 */
export interface UserPreferences {
  // Preferencias culinarias
  cuisinePreferences: string[]; // ['italiana', 'mexicana', etc.]
  dislikedIngredients: string[]; // Ingredientes a evitar
  complexityPreference: ComplexityLevel;
  preferredMealTimes: PreferredMealTimes;
  dietaryRestrictions: string[]; // ['vegetariano', 'sin_gluten', etc.]

  // Campos heredados (mantener compatibilidad)
  dietary_preference?: string | null; // Campo deprecado
  difficulty_preference?: string | null; // Campo deprecado
  max_prep_time?: number | null;
  allergies_restrictions?: string | null; // Campo deprecado
}

/**
 * Interface para actualizar preferencias
 * Hace todos los campos opcionales para actualizaciones parciales
 */
export type UpdateUserPreferences = Partial<UserPreferences>;

/**
 * Validadores de preferencias
 */
export const isValidComplexityLevel = (level: string): level is ComplexityLevel => {
  return ['simple', 'medium', 'complex'].includes(level);
};

export const isValidMealType = (type: string): type is MealType => {
  return ['breakfast', 'lunch', 'dinner', 'snack'].includes(type);
};

export const isValidTimeFormat = (time: string): boolean => {
  return /^([01][0-9]|2[0-3])[0-5][0-9]$/.test(time);
};

/**
 * Valores por defecto
 */
export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  cuisinePreferences: [],
  dislikedIngredients: [],
  complexityPreference: 'medium',
  preferredMealTimes: {},
  dietaryRestrictions: []
};

/**
 * Tipos de cocina válidos
 * Mantener sincronizado con la validación en base de datos
 */
export const VALID_CUISINE_TYPES = [
  'italiana',
  'mexicana',
  'china',
  'japonesa',
  'tailandesa',
  'india',
  'mediterránea',
  'francesa',
  'española',
  'americana',
  'argentina',
  'peruana',
  'brasileña',
  'vegetariana',
  'vegana',
  'sin_gluten',
  'fusión'
] as const;

export type CuisineType = typeof VALID_CUISINE_TYPES[number];

/**
 * Helper para convertir preferencias heredadas al nuevo formato
 */
export function migrateOldPreferences(oldPrefs: Partial<UserPreferences>): Partial<UserPreferences> {
  const newPrefs: Partial<UserPreferences> = {};

  if (oldPrefs.dietary_preference) {
    newPrefs.dietaryRestrictions = [oldPrefs.dietary_preference];
  }

  if (oldPrefs.allergies_restrictions) {
    newPrefs.dietaryRestrictions = [
      ...(newPrefs.dietaryRestrictions || []),
      oldPrefs.allergies_restrictions
    ];
  }

  if (oldPrefs.difficulty_preference) {
    newPrefs.complexityPreference = 
      isValidComplexityLevel(oldPrefs.difficulty_preference) 
        ? oldPrefs.difficulty_preference 
        : 'medium';
  }

  return newPrefs;
}