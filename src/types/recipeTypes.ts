// Definición de UUID como string para claridad, aunque TypeScript no tiene un tipo UUID nativo.
type UUID = string;

import { ComplexityLevel, CuisineType } from './userPreferences'; // Importar tipos necesarios
import { CookingMethod, SeasonFlag, NutritionalInfo } from './recipeRecommendationTypes'; // Importar tipos necesarios

/**
 * Representa un ingrediente específico dentro de una receta.
 */
export interface RecipeIngredient {
  id: UUID; // ID único de la entrada en la tabla recipe_ingredients
  recipe_id: UUID; // ID de la receta a la que pertenece
  ingredient_id: UUID | null; // ID del ingrediente general (de la tabla ingredients), puede ser null
  quantity: number | null; // Cantidad del ingrediente
  unit: string | null; // Unidad de medida (ej. "gramos", "tazas", "unidades")
  ingredient_name: string; // Nombre del ingrediente almacenado en la DB
  notes: string | null; // Notas adicionales (opcional)
}

/**
 * Representa una receta completa.
 */
export type RecipeInstructions = string[];
export type DBInstructions = string;

export interface Recipe {
  id: UUID; // ID único de la receta
  user_id: UUID | null; // ID del usuario (null si es generada base)
  title: string; // Título de la receta
  description: string | null; // Descripción opcional de la receta
  instructions: RecipeInstructions; // Instrucciones como array de pasos
  created_at: string | Date; // Fecha de creación (puede ser string ISO o Date)
  updated_at?: string | Date | null; // Fecha de última actualización (opcional)
  image_url: string | null; // URL de la imagen de la receta (opcional)
  prep_time_minutes: number | null; // Tiempo de preparación en minutos (opcional)
  cook_time_minutes: number | null; // Tiempo de cocción en minutos (opcional)
  servings: number | null; // Número de porciones (opcional)
  tags?: string[] | null; // Etiquetas o categorías de la receta (opcional)
  is_favorite?: boolean; // Indica si la receta está marcada como favorita (no siempre presente en la nueva DB)
  is_generated_base?: boolean; // Indica si es una receta base generada por IA
  category_id?: string | null; // Relación opcional con categorías personalizadas
  ingredients: RecipeIngredient[]; // Lista de ingredientes de la receta
  main_ingredients?: string[] | null; // Lista de ingredientes principales (cuando esté disponible)

  // Campos añadidos en la migración 036 (usar snake_case para coincidir con DB)
  cooking_methods?: CookingMethod[];
  difficulty_level?: ComplexityLevel;
  cuisine_type?: CuisineType[];
  estimated_time?: number | null; // Tiempo total estimado en minutos
  nutritional_info?: NutritionalInfo; // Información nutricional básica
  seasonal_flags?: SeasonFlag[]; // Temporadas recomendadas
  equipment_needed?: string[]; // Equipamiento necesario
}

/**
 * Representa la estructura de datos esperada de la API de generación de recetas (ej. Google).
 * Usar camelCase aquí es aceptable si la API externa lo usa.
 */
export interface GeneratedRecipeData {
  title: string;
  description: string | null;
  ingredients: {
    name: string;
    quantity: number | string | null; // Permite números o strings (ej. "al gusto")
    unit: string | null;
  }[];
  instructions: string[]; // Las instrucciones pueden venir como un array de pasos
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  servings: number | null;
  tags?: string[] | null;
  mainIngredients?: string[];
  // Añadir campos opcionales correspondientes a los nuevos campos de Recipe
  cookingMethods?: CookingMethod[];
  difficultyLevel?: ComplexityLevel;
  cuisineType?: CuisineType[];
  estimatedTime?: number | null;
  nutritionalInfo?: NutritionalInfo;
  seasonalFlags?: SeasonFlag[];
  equipmentNeeded?: string[];
  imageUrl?: string | null;
}

/**
 * Representa los datos necesarios para añadir/actualizar un ingrediente
 * en el formulario de creación/edición de recetas.
 */
export interface IngredientInput {
  ingredient_id: string; // ID del ingrediente seleccionado
  quantity: number | null;
  unit: string | null;
}
