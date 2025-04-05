import { Recipe, RecipeIngredient } from '@/types/recipeTypes';
import { SuggestionContext, Suggestion, SuggestionResponse } from './types';
import { MealAlternative } from '@/features/planning/types';
import { supabase } from '@/lib/supabaseClient';

/**
 * Estructura de palabras clave para cada tipo de comida
 */
interface MealTypeKeywords {
  required: string[];
  any: string[];
  not?: string[]; // Palabras clave que NO deberían aparecer
}

/**
 * Mapeo refinado de palabras clave por tipo de comida
 */
const MEAL_TYPE_KEYWORDS: Record<string, MealTypeKeywords> = {
  'Desayuno': {
    required: ['desayuno', 'breakfast'],
    any: ['tostada', 'huevo', 'café', 'cereal', 'avena', 'yogur', 'fruta', 'panqueque', 'batido', 'leche', 'mermelada', 'manteca', 'pan', 'medialunas', 'té'],
    not: ['almuerzo', 'cena', 'lunch', 'dinner']
  },
  'Almuerzo': {
    required: ['almuerzo', 'lunch', 'plato principal'],
    any: ['arroz', 'carne', 'pollo', 'pasta', 'pescado', 'guiso', 'milanesa', 'hamburguesa', 'tarta', 'verduras', 'ensalada', 'sopa', 'legumbres'],
    not: ['desayuno', 'merienda', 'breakfast']
  },
  'Merienda': {
    required: ['merienda', 'tea', 'snack'],
    any: ['té', 'galletas', 'budín', 'torta', 'mate', 'yogur', 'fruta', 'batido', 'café', 'sandwich', 'tostada', 'magdalenas', 'scones'],
    not: ['almuerzo', 'cena', 'lunch', 'dinner']
  },
  'Cena': {
    required: ['cena', 'dinner', 'plato principal'],
    any: ['sopa', 'pasta', 'carne', 'pollo', 'pescado', 'arroz', 'verduras', 'ensalada', 'guiso', 'milanesa', 'liviano', 'ligero'],
    not: ['desayuno', 'merienda', 'breakfast']
  }
};

/**
 * Determina si una receta es adecuada para un tipo de comida específico
 * basado en palabras clave en su título y descripción
 */
function isRecipeSuitableForMealType(recipe: Recipe, mealType: string): boolean {
  const keywordSet = MEAL_TYPE_KEYWORDS[mealType as keyof typeof MEAL_TYPE_KEYWORDS];
  if (!keywordSet) return false;

  const searchText = `${recipe.title} ${recipe.description || ''}`.toLowerCase();

  // 1. Verificar palabras clave prohibidas
  if (keywordSet.not?.some(keyword => searchText.includes(keyword.toLowerCase()))) {
    return false;
  }

  // 2. Debe tener al menos una palabra clave requerida
  const hasRequiredKeyword = keywordSet.required.some(keyword => searchText.includes(keyword.toLowerCase()));
  if (!hasRequiredKeyword) return false;

  // 3. Debe tener al menos una palabra clave adicional
  const hasAnyKeyword = keywordSet.any.some(keyword => searchText.includes(keyword.toLowerCase()));

  const result = hasRequiredKeyword && hasAnyKeyword;
  
  console.log(`[isRecipeSuitableForMealType]
    Recipe: "${recipe.title}"
    MealType: ${mealType}
    Text: "${searchText.substring(0, 50)}..."
    Required (${keywordSet.required.join(', ')}): ${hasRequiredKeyword}
    Any (matched): ${hasAnyKeyword}
    No prohibidas: ${!keywordSet.not?.some(k => searchText.includes(k.toLowerCase()))}
    Result: ${result}
  `);

  return result;
}

/**
 * Encuentra la mejor receta utilizando ingredientes de la despensa
 */
async function findBestPantryRecipe(
  pantryItems: Array<{ ingredient_id: string; name: string }>,
  relevantRecipes: Recipe[], // Recibe recetas propias + base
  userId: string // Para priorizar las del usuario
): Promise<Suggestion | undefined> {
  // Usar relevantRecipes en la comprobación
  if (!pantryItems?.length || !relevantRecipes?.length) return undefined;

  const pantryIngredientIds = new Set(pantryItems.map(item => item.ingredient_id));
  let bestRecipe: { recipe: Recipe; matchCount: number } | undefined;

  let bestUserRecipe: { recipe: Recipe; matchCount: number } | undefined;
  let bestBaseRecipe: { recipe: Recipe; matchCount: number } | undefined;

  for (const recipe of relevantRecipes) {
    if (!recipe.ingredients?.length) continue;

    const matchCount = recipe.ingredients.reduce((count, ingredient) => {
      if (!ingredient) return count;
      if (ingredient.ingredient_id && pantryIngredientIds.has(ingredient.ingredient_id)) {
        return count + 1;
      }
      return count;
    }, 0);

    if (matchCount === 0) continue;

    // Separar y actualizar la mejor receta propia y la mejor receta base
    if (recipe.user_id === userId) {
      if (!bestUserRecipe || matchCount > bestUserRecipe.matchCount) {
        bestUserRecipe = { recipe, matchCount };
      }
    } else if (recipe.is_generated_base) {
      if (!bestBaseRecipe || matchCount > bestBaseRecipe.matchCount) {
        bestBaseRecipe = { recipe, matchCount };
      }
    }
  }

  // Priorizar la mejor receta del usuario, si existe
  bestRecipe = bestUserRecipe || bestBaseRecipe;

  if (!bestRecipe) return undefined;

  return {
    type: 'recipe',
    id: bestRecipe.recipe.id,
    title: bestRecipe.recipe.title,
    reason: `✨ Usa ${bestRecipe.matchCount} de ${bestRecipe.recipe.ingredients.length} ingredientes de tu despensa`
  };
}

/**
 * Encuentra una receta "descubrimiento" diferente a la de despensa
 */
async function findDiscoveryRecipe(
  relevantRecipes: Recipe[], // Recibe recetas propias + base
  userId: string, // Para filtrar las propias si es necesario
  excludeRecipeId?: string,
): Promise<Suggestion | undefined> {
   // Usar relevantRecipes en la comprobación
  if (!relevantRecipes?.length) return undefined;

  // Filtrar la receta excluida y mezclar aleatoriamente
  // Priorizar recetas base generadas que no sean del usuario y no sean la excluida
  const availableRecipes = relevantRecipes
    .filter(recipe => recipe.is_generated_base && recipe.id !== excludeRecipeId)
    .sort(() => Math.random() - 0.5);

  if (!availableRecipes.length) return undefined;

  const recipe = availableRecipes[0];
  return {
    type: 'recipe',
    id: recipe.id,
    title: recipe.title,
    reason: '🔍 Prueba algo diferente'
  };
}

/**
 * Sugiere recetas favoritas
 */
async function suggestFromFavorites(
  favoriteRecipeIds: string[],
  allRecipes: Recipe[],
  mealType: string
): Promise<Suggestion[]> {
  if (!favoriteRecipeIds?.length || !allRecipes?.length) return [];

  // Ya recibimos suitableRecipes filtradas
  const suggestions: Suggestion[] = allRecipes // Usar la lista ya filtrada
    .filter(recipe => favoriteRecipeIds.includes(recipe.id)) // Solo filtrar por ID favorito
    .map(recipe => ({
      type: 'recipe' as const,
      id: recipe.id,
      title: recipe.title,
      reason: '⭐ De tus favoritos'
    }));

  return suggestions.slice(0, 2);
}

/**
 * Sugiere recetas basadas en el historial de planificación
 */
async function suggestFromHistory(
  planningHistory: Array<{ recipe_id: string; count: number }>,
  allRecipes: Recipe[],
  mealType: string
): Promise<Suggestion[]> {
  if (!planningHistory?.length || !allRecipes?.length) return [];

  const suggestions: Suggestion[] = [];
  // Ya recibimos suitableRecipes filtradas
  const recipeMap = new Map(allRecipes.map(r => [r.id, r])); // Usar la lista ya filtrada

  // Ordenar historial por frecuencia
  for (const history of planningHistory.sort((a, b) => b.count - a.count)) {
    const recipe = recipeMap.get(history.recipe_id);
    // El filtro por tipo ya se hizo antes de llamar a esta función
    if (recipe) {
      suggestions.push({
        type: 'recipe' as const,
        id: recipe.id,
        title: recipe.title,
        reason: `🕒 Planificado ${history.count} veces`
      });
      if (suggestions.length >= 2) break;
    }
  }

  return suggestions;
}

/**
 * Obtiene sugerencias de comidas basadas en el contexto proporcionado
 */
export async function getSuggestions(context: SuggestionContext): Promise<SuggestionResponse> {
  try {
    console.log('[getSuggestions] Starting with context:', {
      date: context.date,
      mealType: context.mealType,
      userId: context.userId,
      hasPantryItems: !!context.currentPantryItems?.length
    });

    // 1. Obtener todas las recetas una sola vez
    // Modificar consulta para traer recetas propias Y recetas base
    const { data: recipes, error } = await supabase
      .from('recipes')
      .select('*, recipe_ingredients(*)')
      .or(`user_id.eq.${context.userId},is_generated_base.eq.true`);

    if (error) {
      console.error('[getSuggestions] Error fetching recipes:', error);
      throw error;
    }

    // Mapear y filtrar recetas adecuadas para el tipo de comida
    // Mapear incluyendo el nuevo flag y user_id nullable
    const mappedRecipes: Recipe[] = (recipes || []).map(recipe => ({
      ...recipe,
      user_id: recipe.user_id, // Asegurar que se mapea
      is_generated_base: recipe.is_generated_base, // Asegurar que se mapea
      ingredients: recipe.recipe_ingredients || [],
    }));

    const suitableRecipes = mappedRecipes.filter(recipe =>
      isRecipeSuitableForMealType(recipe, context.mealType)
    );

    console.log(`[getSuggestions] Found ${suitableRecipes.length} recipes suitable for ${context.mealType}`);

    // 2. Buscar la mejor receta usando ingredientes de la despensa
    // Pasar userId a findBestPantryRecipe para priorizar
    const pantrySuggestion = await findBestPantryRecipe(
      context.currentPantryItems || [],
      suitableRecipes,
      context.userId
    );

    // 3. Buscar una receta "descubrimiento" diferente
    // Pasar userId a findDiscoveryRecipe
    const discoverySuggestion = await findDiscoveryRecipe(
      suitableRecipes,
      context.userId,
      pantrySuggestion?.id
    );

    const response: SuggestionResponse = {
      pantrySuggestion,
      discoverySuggestion
    };

    console.log('[getSuggestions] Response:', {
      hasPantrySuggestion: !!pantrySuggestion,
      hasDiscoverySuggestion: !!discoverySuggestion
    });

    return response;
  } catch (error) {
    console.error('[getSuggestions] Error:', error);
    // Devolver objeto vacío en caso de error, compatible con SuggestionResponse
    return { pantrySuggestion: undefined, discoverySuggestion: undefined };
  }
}

/**
 * Obtiene alternativas de comidas basadas en el contexto y perfil del usuario
 * Esta función actúa como un wrapper sobre getSuggestions para mantener compatibilidad
 * con el código existente que espera getMealAlternatives
 */
/**
 * Obtiene alternativas de comidas basadas en el contexto y perfil del usuario
 */
export async function getMealAlternatives(
  context: import('@/features/planning/types').MealAlternativeRequestContext,
  userProfile?: { id: string } | null // Hacer userProfile opcional
): Promise<import('@/features/planning/types').MealAlternative[]> {
  try {
    // Si no hay perfil de usuario, retornar array vacío
    if (!userProfile?.id) {
      console.log('[getMealAlternatives] No user profile provided, returning empty array');
      return [];
    }

    // 1. Convertir MealAlternativeRequestContext a SuggestionContext
    const suggestionContext: SuggestionContext = {
      date: new Date().toISOString().split('T')[0],
      mealType: context.meal_type,
      userId: userProfile.id
      // Estos campos son opcionales en SuggestionContext
    };

    // 2. Obtener sugerencias usando el sistema actualizado
    const response = await getSuggestions(suggestionContext);
    
    // 3. Transformar SuggestionResponse a MealAlternative[]
    const alternatives: MealAlternative[] = [];
    const suggestions = [response.pantrySuggestion, response.discoverySuggestion];

    suggestions.forEach(suggestion => {
      if (suggestion && suggestion.type === 'recipe' && suggestion.id) {
        alternatives.push({
          type: 'recipe',
          id: suggestion.id,
          title: suggestion.title
        });
      } else if (suggestion) {
        // Manejar sugerencias 'custom' si las hubiera, aunque ahora no se generan
        alternatives.push({
          type: 'custom',
          text: suggestion.title
        });
      }
    });

    return alternatives;
    
  } catch (error) {
    console.error('Error en getMealAlternatives:', error);
    return [];
  }
}