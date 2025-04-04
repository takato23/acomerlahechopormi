import { Recipe, RecipeIngredient } from '@/types/recipeTypes';
import { SuggestionContext, Suggestion } from './types';
import { supabase } from '@/lib/supabaseClient';

/**
 * Encuentra recetas que usen ingredientes de la despensa
 */
async function suggestFromPantry(
  pantryItems: Array<{ ingredient_id: string; name: string }>,
  allRecipes: Recipe[]
): Promise<Suggestion[]> {
  if (!pantryItems?.length || !allRecipes?.length) return [];

  const suggestions: Suggestion[] = [];
  const pantryIngredientIds = new Set(pantryItems.map(item => item.ingredient_id));

  for (const recipe of allRecipes) {
    if (!recipe.ingredients?.length) continue;

    const recipeIngredientsInPantry = recipe.ingredients.filter(
      (ingredient: RecipeIngredient) => ingredient.ingredient_id && pantryIngredientIds.has(ingredient.ingredient_id)
    );

    if (recipeIngredientsInPantry.length > 0) {
      const coverageRatio = recipeIngredientsInPantry.length / recipe.ingredients.length;
      if (coverageRatio >= 0.5) { // Al menos 50% de ingredientes disponibles
        suggestions.push({
          type: 'recipe',
          id: recipe.id,
          title: recipe.title,
          reason: `Usa ${recipeIngredientsInPantry.length} ingredientes de tu despensa`
        });
      }
    }
  }

  return suggestions
    .sort((a, b) => parseInt(b.reason?.split(' ')[1] || '0') - parseInt(a.reason?.split(' ')[1] || '0'))
    .slice(0, 3);
}

/**
 * Sugiere recetas favoritas
 */
async function suggestFromFavorites(
  favoriteRecipeIds: string[],
  allRecipes: Recipe[]
): Promise<Suggestion[]> {
  if (!favoriteRecipeIds?.length || !allRecipes?.length) return [];

  const suggestions: Suggestion[] = allRecipes
    .filter(recipe => favoriteRecipeIds.includes(recipe.id))
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
  allRecipes: Recipe[]
): Promise<Suggestion[]> {
  if (!planningHistory?.length || !allRecipes?.length) return [];

  const recipeMap = new Map(allRecipes.map(r => [r.id, r]));
  const suggestions: Suggestion[] = [];

  for (const history of planningHistory.sort((a, b) => b.count - a.count)) {
    const recipe = recipeMap.get(history.recipe_id);
    if (recipe) {
      suggestions.push({
        type: 'recipe' as const,
        id: recipe.id,
        title: recipe.title,
        reason: `🕒 Planificado ${history.count} veces`
      });
    }

    if (suggestions.length >= 2) break;
  }

  return suggestions;
}

/**
 * Obtiene sugerencias de comidas basadas en el contexto proporcionado
 */
export async function getSuggestions(context: SuggestionContext): Promise<Suggestion[]> {
  try {
    console.log('[getSuggestions] Starting with context:', {
      date: context.date,
      mealType: context.mealType,
      userId: context.userId,
      hasPantryItems: !!context.currentPantryItems?.length,
      hasFavorites: !!context.favoriteRecipeIds?.length,
      hasHistory: !!context.planningHistory?.length
    });

    // 1. Obtener todas las recetas una sola vez
    const { data: recipes, error } = await supabase
      .from('recipes')
      .select('*, ingredients(*)')
      .eq('user_id', context.userId); // Filtrar por usuario

    if (error) {
      console.error('[getSuggestions] Error fetching recipes:', error);
      throw error;
    }

    if (!recipes?.length) {
      console.log('[getSuggestions] No recipes found for user:', context.userId);
      return [];
    }

    console.log('[getSuggestions] Found recipes:', recipes.length);

    // 2. Obtener sugerencias de cada estrategia en paralelo
    console.log('[getSuggestions] Starting suggestion strategies...');

    const [pantryResults, favoritesResults, historyResults] = await Promise.all([
      suggestFromPantry(context.currentPantryItems || [], recipes).then(results => {
        console.log('[getSuggestions] Pantry suggestions:', results.length);
        return results;
      }),
      suggestFromFavorites(context.favoriteRecipeIds || [], recipes).then(results => {
        console.log('[getSuggestions] Favorite suggestions:', results.length);
        return results;
      }),
      suggestFromHistory(context.planningHistory || [], recipes).then(results => {
        console.log('[getSuggestions] History suggestions:', results.length);
        return results;
      })
    ]);

    // 3. Combinar y eliminar duplicados
    const seenIds = new Set<string>();
    const combinedSuggestions: Suggestion[] = [];

    function addUniqueSuggestions(suggestions: Suggestion[]) {
      for (const suggestion of suggestions) {
        if (suggestion.id && seenIds.has(suggestion.id)) continue;
        if (suggestion.id) seenIds.add(suggestion.id);
        combinedSuggestions.push(suggestion);
      }
    }

    // Priorizar favoritos, luego despensa, luego historial
    addUniqueSuggestions(favoritesResults);
    addUniqueSuggestions(pantryResults);
    addUniqueSuggestions(historyResults);

    const finalSuggestions = combinedSuggestions.slice(0, 5); // Máximo 5 sugerencias
    console.log('[getSuggestions] Final suggestions:', finalSuggestions.length);
    return finalSuggestions;
  } catch (error) {
    console.error('[getSuggestions] Error:', error);
    return [];
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
      date: new Date().toISOString().split('T')[0], // Usar fecha actual
      mealType: context.meal_type, // meal_type ya es compatible con MealType
      userId: userProfile.id,
      // No incluimos currentPantryItems, favoriteRecipeIds ni planningHistory por ahora
      // Si son necesarios, deberían venir en userProfile o consultarse aquí
    };

    // 2. Obtener sugerencias usando el sistema existente
    const suggestions = await getSuggestions(suggestionContext);
    
    // 3. Transformar Suggestion[] a MealAlternative[]
    return suggestions.map(suggestion => {
      if (suggestion.type === 'recipe' && suggestion.id) {
        return {
          type: 'recipe',
          id: suggestion.id,
          title: suggestion.title
        };
      } else {
        return {
          type: 'custom',
          text: suggestion.title
        };
      }
    });
  } catch (error) {
    console.error('Error en getMealAlternatives:', error);
    return [];
  }
}