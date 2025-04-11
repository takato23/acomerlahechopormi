// Tipos para el sistema de recomendaciones de recetas
// Referencias: recipe_generation_enhancement_plan.md

import { ComplexityLevel, MealType } from './userPreferences'; // Importar MealType

/**
 * Entrada en el historial de recetas
 */
export interface RecipeHistoryEntry {
  id: string;
  userId: string;
  recipeId: string;
  plannedDate: Date;
  mealType: MealType;
  wasCooked: boolean;
  rating?: number | null; // Permitir null para compatibilidad con DB
  notes?: string | null; // Permitir null para compatibilidad con DB
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Tipos de cocina válidos
 */
export const VALID_CUISINE_TYPES = [
  'italiana', 'mexicana', 'china', 'japonesa', 'tailandesa',
  'india', 'mediterránea', 'francesa', 'española', 'americana',
  'argentina', 'peruana', 'brasileña', 'vegetariana', 'vegana',
  'sin_gluten', 'fusión'
] as const;

export type CuisineType = typeof VALID_CUISINE_TYPES[number];

/**
 * Tipos de métodos de cocción válidos
 */
export const VALID_COOKING_METHODS = [
  'hornear', 'freír', 'hervir', 'asar', 'saltear',
  'vapor', 'microondas', 'presión', 'grill', 'slow_cooker',
  'sin_cocción', 'aire_caliente'
] as const;

export type CookingMethod = typeof VALID_COOKING_METHODS[number];

/**
 * Tipos de métricas de variedad
 */
export type MetricType =
  | 'protein_rotation'
  | 'cuisine_variety'
  | 'cooking_method'
  | 'ingredient_usage'
  | 'meal_type_balance';

/**
 * Métrica de variedad
 */
export interface VarietyMetric {
  id: string;
  userId: string;
  metricType: MetricType;
  lastUsed: Record<string, string>;
  frequencyCount: Record<string, number>;
  updatedAt: Date;
}

/**
 * Información nutricional básica
 */
export interface NutritionalInfo {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
}

/**
 * Temporadas del año
 */
export type SeasonFlag = 'primavera' | 'verano' | 'otoño' | 'invierno' | 'todo_el_año';

/**
 * Detalles de receta
 */
export interface RecipeDetails {
  title: string;
  cuisine_type?: CuisineType[];
  cooking_methods?: CookingMethod[];
  main_ingredients?: string[];
  nutritionalInfo?: NutritionalInfo;
  seasonalFlags?: SeasonFlag[];
  equipmentNeeded?: string[];
}

/**
 * Entrada de historial con detalles
 */
export interface RecipeHistoryEntryWithDetails extends RecipeHistoryEntry {
  recipeDetails?: RecipeDetails;
}

/**
 * Criterios de búsqueda para recetas
 */
export interface RecipeSearchCriteria {
  difficulty?: ComplexityLevel;
  maxTime?: number;
  cuisineTypes?: CuisineType[];
  cookingMethods?: CookingMethod[];
  seasonalFlag?: SeasonFlag;
  excludeIngredients?: string[];
  preferredEquipment?: string[];
  mealType?: MealType; // Hacer opcional
}

/**
 * Métricas de variedad para un plan semanal
 */
export interface WeeklyVarietyMetrics {
  proteinRotation: number;
  cuisineVariety: number;
  methodVariety: number;
  overallScore: number;
}

/**
 * Tipo para respuestas de conteo de recetas de Supabase
 */
export interface RecipeCountResult {
  recipe_id: string;
  count: string | number;
}

/**
 * Utilidades para cálculo de métricas
 */
export function calculateVarietyScore(
  frequencies: Record<string, number>,
  totalItems: number
): number {
  if (totalItems === 0) return 1;

  const values = Object.values(frequencies);
  if (values.length === 0) return 1; // Evitar división por cero si no hay elementos

  const maxFreq = Math.max(...values);
  const idealFreq = totalItems / values.length;

  const deviation = values.reduce(
    (sum, freq) => sum + Math.abs(freq - idealFreq),
    0
  );

  // Normalizar desviación para que esté entre 0 y 1
  // Máxima desviación posible es 2 * totalItems * (1 - 1/N)
  const maxPossibleDeviation = 2 * totalItems * (1 - 1 / values.length);
  if (maxPossibleDeviation === 0) return 1; // Si solo hay un tipo de item

  return Math.max(0, 1 - (deviation / maxPossibleDeviation));
}


/**
 * Validadores
 */
export const isValidRating = (rating: number): boolean => {
  return Number.isInteger(rating) && rating >= 1 && rating <= 5;
};

export const isValidMetricType = (type: string): type is MetricType => {
  return [
    'protein_rotation', 'cuisine_variety', 'cooking_method',
    'ingredient_usage', 'meal_type_balance'
  ].includes(type);
};

export const isValidCookingMethod = (method: string): method is CookingMethod => {
  return VALID_COOKING_METHODS.includes(method as CookingMethod);
};

export const isValidCuisineType = (cuisine: string): cuisine is CuisineType => {
  return VALID_CUISINE_TYPES.includes(cuisine as CuisineType);
};

/**
 * Constantes
 */
export const VARIETY_THRESHOLDS = {
  MIN_DAYS_BETWEEN_REPEAT: 3,
  MAX_SAME_CUISINE_PER_WEEK: 3,
  MIN_DIFFERENT_METHODS_PER_WEEK: 4,
} as const;