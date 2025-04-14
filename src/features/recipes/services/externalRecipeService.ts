import { supabase } from '@/lib/supabaseClient';
import { Recipe, RecipeInputData } from '@/types/recipeTypes';
import { createRecipe } from './recipeService';

// API Key de Spoonacular (en producción debería estar en variables de entorno)
const SPOONACULAR_API_KEY = '2334dd556d254f3e874d5a6f39359d0e';
const SPOONACULAR_BASE_URL = 'https://api.spoonacular.com';

export interface SpoonacularRecipe {
  id: number;
  title: string;
  image: string;
  imageType: string;
  servings: number;
  readyInMinutes: number;
  preparationMinutes?: number;
  cookingMinutes?: number;
  sourceUrl?: string;
  summary?: string;
  instructions?: string;
  analyzedInstructions?: Array<{
    name: string;
    steps: Array<{
      number: number;
      step: string;
      ingredients?: Array<{
        id: number;
        name: string;
      }>;
    }>;
  }>;
  extendedIngredients?: Array<{
    id: number;
    original: string;
    originalName?: string;
    name: string;
    amount: number;
    unit: string;
  }>;
  nutrition?: {
    nutrients: Array<{
      name: string;
      amount: number;
      unit: string;
    }>;
  };
  cuisines?: string[];
  dishTypes?: string[];
  diets?: string[];
}

export interface SearchSpoonacularRecipesParams {
  query?: string;
  cuisine?: string;
  diet?: string;
  includeIngredients?: string[];
  excludeIngredients?: string[];
  type?: string;
  maxReadyTime?: number;
  offset?: number;
  number?: number;
}

export interface SearchSpoonacularResult {
  results: SpoonacularRecipe[];
  totalResults: number;
  offset: number;
  number: number;
}

/**
 * Busca recetas en Spoonacular con los parámetros proporcionados
 */
export async function searchSpoonacularRecipes(params: SearchSpoonacularRecipesParams): Promise<SearchSpoonacularResult> {
  console.log("[externalRecipeService] Buscando recetas en Spoonacular:", params);
  
  const queryParams = new URLSearchParams();
  queryParams.append('apiKey', SPOONACULAR_API_KEY);
  
  // Agregar parámetros de búsqueda si existen
  if (params.query) queryParams.append('query', params.query);
  if (params.cuisine) queryParams.append('cuisine', params.cuisine);
  if (params.diet) queryParams.append('diet', params.diet);
  if (params.includeIngredients?.length) 
    queryParams.append('includeIngredients', params.includeIngredients.join(','));
  if (params.excludeIngredients?.length) 
    queryParams.append('excludeIngredients', params.excludeIngredients.join(','));
  if (params.type) queryParams.append('type', params.type);
  if (params.maxReadyTime) queryParams.append('maxReadyTime', params.maxReadyTime.toString());
  
  // Paginación
  queryParams.append('offset', (params.offset || 0).toString());
  queryParams.append('number', (params.number || 10).toString());
  
  // Añadir información adicional que queremos recuperar
  queryParams.append('addRecipeInformation', 'true');
  queryParams.append('fillIngredients', 'true');
  
  try {
    const response = await fetch(`${SPOONACULAR_BASE_URL}/recipes/complexSearch?${queryParams.toString()}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("[externalRecipeService] Error en Spoonacular API:", errorData);
      throw new Error(`Error en Spoonacular API: ${errorData.message || response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("[externalRecipeService] Error buscando recetas:", error);
    throw error;
  }
}

/**
 * Obtiene los detalles completos de una receta de Spoonacular por su ID
 */
export async function getSpoonacularRecipeById(recipeId: number): Promise<SpoonacularRecipe> {
  console.log("[externalRecipeService] Obteniendo detalles de receta:", recipeId);
  
  const queryParams = new URLSearchParams();
  queryParams.append('apiKey', SPOONACULAR_API_KEY);
  queryParams.append('includeNutrition', 'true');
  
  try {
    const response = await fetch(`${SPOONACULAR_BASE_URL}/recipes/${recipeId}/information?${queryParams.toString()}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("[externalRecipeService] Error obteniendo receta:", errorData);
      throw new Error(`Error obteniendo receta: ${errorData.message || response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("[externalRecipeService] Error obteniendo receta:", error);
    throw error;
  }
}

/**
 * Convierte una receta de Spoonacular al formato de nuestra aplicación
 */
export function mapSpoonacularToRecipeInput(spoonRecipe: SpoonacularRecipe, userId: string): RecipeInputData {
  // Extraer instrucciones como array de strings
  let instructions: string[] = [];
  if (spoonRecipe.analyzedInstructions && spoonRecipe.analyzedInstructions.length > 0) {
    instructions = spoonRecipe.analyzedInstructions[0].steps.map(step => step.step);
  } else if (spoonRecipe.instructions) {
    // Dividir por párrafos si no hay instrucciones analizadas
    instructions = spoonRecipe.instructions
      .split(/\r?\n/)
      .filter(line => line.trim() !== '')
      .map(line => line.trim());
  }
  
  // Mapear ingredientes
  const ingredients = spoonRecipe.extendedIngredients?.map(ing => ({
    name: ing.name,
    quantity: ing.amount.toString(),
    unit: ing.unit || null
  })) || [];
  
  // Extraer tags de diversos campos
  const tags = [
    ...(spoonRecipe.cuisines || []),
    ...(spoonRecipe.dishTypes || []),
    ...(spoonRecipe.diets || [])
  ];
  
  // Crear objeto de receta
  return {
    user_id: userId,
    title: spoonRecipe.title,
    description: spoonRecipe.summary || "",
    prep_time_minutes: spoonRecipe.preparationMinutes || 0,
    cook_time_minutes: spoonRecipe.cookingMinutes || 0,
    servings: spoonRecipe.servings,
    image_url: spoonRecipe.image,
    instructions,
    ingredients,
    tags: tags.length > 0 ? tags : undefined,
    is_favorite: false,
    is_public: false,
    nutritional_info: spoonRecipe.nutrition ? extractNutritionalInfo(spoonRecipe.nutrition) : undefined,
    source_api: 'spoonacular',
    source_id: spoonRecipe.id.toString(),
    is_shared: true // Las recetas importadas se marcan como compartidas para que otros usuarios puedan verlas
  };
}

/**
 * Extrae información nutricional de una receta de Spoonacular
 */
function extractNutritionalInfo(nutrition: { nutrients: Array<{name: string; amount: number; unit: string}> }) {
  // Mapeo de nutrientes importantes
  const nutritionMap: Record<string, {amount: number; unit: string}> = {};
  
  // Extraer nutrientes que nos interesan
  for (const nutrient of nutrition.nutrients) {
    nutritionMap[nutrient.name.toLowerCase()] = {
      amount: nutrient.amount,
      unit: nutrient.unit
    };
  }
  
  return {
    calories: nutritionMap.calories?.amount || 0,
    protein: nutritionMap.protein?.amount || 0,
    carbs: nutritionMap.carbohydrates?.amount || 0,
    fat: nutritionMap.fat?.amount || 0,
    fiber: nutritionMap.fiber?.amount || 0,
    sugar: nutritionMap.sugar?.amount || 0
  };
}

/**
 * Importa una receta de Spoonacular a nuestra base de datos
 */
export async function importSpoonacularRecipe(spoonacularId: number, userId: string): Promise<Recipe> {
  try {
    // 1. Obtener datos completos de la receta
    const spoonRecipe = await getSpoonacularRecipeById(spoonacularId);
    
    // 2. Convertir a nuestro formato
    const recipeInput = mapSpoonacularToRecipeInput(spoonRecipe, userId);
    
    // 3. Guardar en nuestra base de datos
    const newRecipe = await createRecipe(recipeInput);
    
    return newRecipe;
  } catch (error) {
    console.error("[externalRecipeService] Error importando receta:", error);
    throw error;
  }
} 