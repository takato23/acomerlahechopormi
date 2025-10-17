import type { SupabaseClient } from '@supabase/supabase-js';
import { Recipe, RecipeIngredient } from '@/types/recipeTypes';
import { SuggestionRequest, RecipeSuggestion, SuggestionResponse, SuggestionPantryItem } from './types';
import { MealAlternative, MealAlternativeRequestContext } from '@/features/planning/types';
import { supabase } from '@/lib/supabaseClient';
import type { UserProfile } from '@/features/user/userTypes';

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
    any: ['arroz', 'carne', 'pollo', 'pasta', 'pescado', 'guiso', 'milanesa', 'hamburguesa', 'tarta', 'verduras', 'ensalada', 'sopa', 'legumbres', 'garbanzo'],
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

const MEAT_KEYWORDS = ['carne', 'pollo', 'cerdo', 'res', 'cordero', 'panceta', 'jamón', 'chorizo', 'tocino', 'pescado', 'atún', 'salmón', 'marisco'];
const ANIMAL_PRODUCT_KEYWORDS = ['huevo', 'queso', 'leche', 'manteca', 'miel', 'yogur', 'mantequilla'];
const GLUTEN_KEYWORDS = ['trigo', 'pan', 'harina', 'pasta', 'cebada', 'centeno', 'masa', 'galleta'];

const normalizeText = (value?: string | null) => value?.toLowerCase().trim() ?? '';
const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

const extractIngredientNames = (recipe: Recipe): string[] =>
  (recipe.ingredients ?? [])
    .map((ingredient) => normalizeText((ingredient as RecipeIngredient | undefined)?.ingredient_name))
    .filter(Boolean);

const matchesDietaryPreferences = (recipe: Recipe, request: SuggestionRequest, avoidList: Set<string>): boolean => {
  const ingredientNames = extractIngredientNames(recipe);

  if (avoidList.size && ingredientNames.some((name) => avoidList.has(name))) {
    return false;
  }

  if (request.dietary?.vegetarian && ingredientNames.some((name) => MEAT_KEYWORDS.includes(name))) {
    return false;
  }

  if (request.dietary?.vegan) {
    if (ingredientNames.some((name) => MEAT_KEYWORDS.includes(name) || ANIMAL_PRODUCT_KEYWORDS.includes(name))) {
      return false;
    }
  }

  if (request.dietary?.glutenFree && ingredientNames.some((name) => GLUTEN_KEYWORDS.includes(name))) {
    return false;
  }

  return true;
};

/**
 * Determina si una receta es adecuada para un tipo de comida específico
 * basado en palabras clave en su título y descripción
 */
function isRecipeSuitableForMealType(recipe: Recipe, mealType: string): boolean {
  const keywordSet = MEAL_TYPE_KEYWORDS[mealType as keyof typeof MEAL_TYPE_KEYWORDS];
  if (!keywordSet) return false;

  const searchText = `${recipe.title} ${recipe.description || ''}`.toLowerCase();
  const ingredientText = (recipe.ingredients ?? [])
    .map((ingredient) => normalizeText((ingredient as RecipeIngredient | undefined)?.ingredient_name))
    .join(' ');

  // 1. Verificar palabras clave prohibidas
  if (keywordSet.not?.some(keyword => searchText.includes(keyword.toLowerCase()))) {
    return false;
  }

  // 2. Debe tener al menos una palabra clave requerida
  const hasRequiredKeyword = keywordSet.required.some(keyword => searchText.includes(keyword.toLowerCase()));
  if (!hasRequiredKeyword) return false;

  // 3. Debe tener al menos una palabra clave adicional
  const hasAnyKeyword = keywordSet.any.some((keyword) => {
    const normalized = keyword.toLowerCase();
    return searchText.includes(normalized) || ingredientText.includes(normalized);
  });

  const result = hasRequiredKeyword && hasAnyKeyword;

  // console.log(`[isRecipeSuitableForMealType] ...`); // Log omitido por brevedad

  return result;
}

/**
 * Encuentra la mejor receta utilizando ingredientes de la despensa
 */
async function findBestPantryRecipe(
  pantryItems: SuggestionPantryItem[],
  relevantRecipes: Recipe[],
  userId: string
): Promise<RecipeSuggestion | undefined> {
  if (!pantryItems?.length || !relevantRecipes?.length) return undefined;

  const pantryIngredientIds = new Set(
    pantryItems.map((item) => item.ingredientId).filter(Boolean) as string[],
  );
  const pantryNames = new Set(
    pantryItems
      .map((item) => normalizeText(item.name))
      .filter((name) => Boolean(name)),
  );

  let bestRecipe: { recipe: Recipe; matchCount: number } | undefined;
  let bestUserRecipe: { recipe: Recipe; matchCount: number } | undefined;
  let bestBaseRecipe: { recipe: Recipe; matchCount: number } | undefined;

  for (const recipe of relevantRecipes) {
    if (!recipe.ingredients?.length) continue;

    const matchCount = recipe.ingredients.reduce((count, ingredient) => {
      if (!ingredient) return count;
      const matchesById = ingredient.ingredient_id && pantryIngredientIds.has(ingredient.ingredient_id);
      const normalizedName = normalizeText(ingredient.ingredient_name);
      const matchesByName = normalizedName && pantryNames.has(normalizedName);
      if (matchesById || matchesByName) {
        return count + 1;
      }
      return count;
    }, 0);

    if (matchCount === 0) continue;

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

  bestRecipe = bestUserRecipe || bestBaseRecipe;

  if (!bestRecipe) return undefined;

  return {
    name: bestRecipe.recipe.title,
    description:
      bestRecipe.recipe.description ||
      `Usa ${bestRecipe.matchCount} ingredientes que ya tenés en tu despensa`,
    difficulty: (bestRecipe.recipe.difficulty_level as RecipeSuggestion['difficulty']) ?? undefined,
    ingredients:
      bestRecipe.recipe.ingredients?.map((ingredient) => ingredient?.ingredient_name || '').filter(Boolean) ?? [],
  };
}

/**
 * Encuentra una receta "descubrimiento" diferente a la de despensa
 */
async function findDiscoveryRecipe(
  relevantRecipes: Recipe[],
  userId: string,
  request: SuggestionRequest,
  avoidList: Set<string>,
  excludeRecipeName?: string,
): Promise<RecipeSuggestion | undefined> {
  if (!relevantRecipes?.length) return undefined;

  // Filtrar la receta excluida y mezclar aleatoriamente
  let availableRecipes = relevantRecipes
    .filter(recipe => recipe.is_generated_base && recipe.title !== excludeRecipeName)
    .filter(recipe => matchesDietaryPreferences(recipe, request, avoidList))
    .sort(() => Math.random() - 0.5);

  if (availableRecipes.length === 0) {
    availableRecipes = relevantRecipes
      .filter(recipe => recipe.user_id === userId && recipe.title !== excludeRecipeName)
      .filter(recipe => matchesDietaryPreferences(recipe, request, avoidList))
      .sort(() => Math.random() - 0.5);
  }

  if (!availableRecipes.length) return undefined;

  const recipe = availableRecipes[0];
  return {
    name: recipe.title,
    description: recipe.description || 'Una receta diferente para probar',
    difficulty: (recipe.difficulty_level as RecipeSuggestion['difficulty']) ?? undefined,
    ingredients: extractIngredientNames(recipe).filter(Boolean),
  };
}

/**
 * Sugiere recetas favoritas
 */
async function suggestFromFavorites(
  favoriteRecipeIds: string[],
  allRecipes: Recipe[],
  mealType: string // Mantener mealType si es necesario para filtrar allRecipes
): Promise<RecipeSuggestion[]> { // Devolver RecipeSuggestion
  if (!favoriteRecipeIds?.length || !allRecipes?.length) return [];

  // Filtrar primero por tipo de comida, luego por favorito
  const suitableFavorites = allRecipes
    .filter(recipe => isRecipeSuitableForMealType(recipe, mealType) && favoriteRecipeIds.includes(recipe.id));

  const suggestions: RecipeSuggestion[] = suitableFavorites
    .map(recipe => ({
      // Mapear a RecipeSuggestion
      name: recipe.title,
      description: recipe.description || 'De tus favoritos',
      // Otros campos opcionales
    }));

  return suggestions.slice(0, 2);
}

/**
 * Sugiere recetas basadas en el historial de planificación
 */
async function suggestFromHistory(
  planningHistory: Array<{ recipe_id: string; count: number }>,
  allRecipes: Recipe[],
  mealType: string // Mantener mealType si es necesario para filtrar allRecipes
): Promise<RecipeSuggestion[]> { // Devolver RecipeSuggestion
  if (!planningHistory?.length || !allRecipes?.length) return [];

  const suggestions: RecipeSuggestion[] = [];
  const recipeMap = new Map(allRecipes.map(r => [r.id, r]));

  // Ordenar historial por frecuencia
  for (const history of planningHistory.sort((a, b) => b.count - a.count)) {
    const recipe = recipeMap.get(history.recipe_id);
    // Filtrar por tipo de comida
    if (recipe && isRecipeSuitableForMealType(recipe, mealType)) {
      suggestions.push({
        // Mapear a RecipeSuggestion
        name: recipe.title,
        description: recipe.description || `Planificado ${history.count} veces`,
        // Otros campos opcionales
      });
      if (suggestions.length >= 2) break;
    }
  }

  return suggestions;
}

/**
 * Obtiene sugerencias de comidas basadas en el contexto proporcionado
 */
type SuggestionsOptions = {
  client?: SupabaseClient;
  userId?: string;
};

export async function getSuggestions(
  context: SuggestionRequest,
  options?: SuggestionsOptions,
): Promise<SuggestionResponse> {
  try {
    const client = options?.client ?? supabase;

    let resolvedUserId = options?.userId ?? null;
    if (!resolvedUserId) {
      const { data: authData, error: authError } = await client.auth.getUser();
      if (authError || !authData?.user) {
        console.error('[getSuggestions] User not authenticated or error fetching user:', authError);
        return { suggestions: [] };
      }
      resolvedUserId = authData.user.id;
    }

    const userId = resolvedUserId;

    const { data: userRecipesData, error: userError } = await client
      .from('recipes')
      .select('*, recipe_ingredients(*)')
      .eq('user_id', userId); // Usar userId obtenido

    if (userError) {
      console.error('[getSuggestions] Error fetching user recipes:', userError);
      throw userError;
    }

    // 1b. Obtener recetas base
    const { data: baseRecipesData, error: baseError } = await client
      .from('recipes')
      .select('*, recipe_ingredients(*)')
      .eq('is_generated_base', true);

    if (baseError) {
      console.error('[getSuggestions] Error fetching base recipes:', baseError);
      throw baseError;
    }

    // 1c. Combinar y eliminar duplicados
    const allRecipesMap = new Map<string, any>();
    (userRecipesData || []).forEach(recipe => allRecipesMap.set(recipe.id, recipe));
    (baseRecipesData || []).forEach(recipe => allRecipesMap.set(recipe.id, recipe));
    const recipes = Array.from(allRecipesMap.values());

    const mappedRecipes: Recipe[] = recipes.map((recipe: any) => ({
      ...recipe,
      user_id: recipe.user_id,
      is_generated_base: recipe.is_generated_base,
      ingredients: recipe.recipe_ingredients || [],
      instructions: typeof recipe.instructions === 'string' ? recipe.instructions.split('\n').filter((line: string) => line.trim() !== '') : [],
    }));

    const avoidList = new Set(
      [
        ...(context.preferences?.avoidIngredients ?? []),
        ...(context.dietary?.restrictions ?? []),
      ]
        .map((item) => normalizeText(item))
        .filter(Boolean),
    );

    const suitableRecipes = mappedRecipes.filter((recipe) => {
      if (!isRecipeSuitableForMealType(recipe, context.mealType)) return false;
      if (!matchesDietaryPreferences(recipe, context, avoidList)) return false;

      if (context.preferences?.difficulty && recipe.difficulty_level) {
        if (recipe.difficulty_level !== context.preferences.difficulty) {
          return false;
        }
      }

      if (context.preferences?.maxPrepTime) {
        const prepTime = recipe.prep_time_minutes ?? 0;
        const cookTime = recipe.cook_time_minutes ?? 0;
        const estimated = prepTime + cookTime;
        if (estimated && estimated > context.preferences.maxPrepTime) {
          return false;
        }
      }

      return true;
    });

    const pantrySuggestion = await findBestPantryRecipe(
      context.pantryItems,
      suitableRecipes,
      userId,
    );

    const discoverySuggestion = await findDiscoveryRecipe(
      suitableRecipes,
      userId,
      context,
      avoidList,
      pantrySuggestion?.name,
    );

    const suggestions = [pantrySuggestion, discoverySuggestion].filter(
      (suggestion): suggestion is RecipeSuggestion => Boolean(suggestion),
    );

    return { suggestions };
  } catch (error) { // Corregir bloque catch
    console.error('[getSuggestions] Error:', error);
    // Devolver array vacío en caso de error
    return { suggestions: [] };
  } // Corregir bloque catch
}

/**
 * Obtiene alternativas de comidas basadas en el contexto y perfil del usuario
 * Esta función actúa como un wrapper sobre getSuggestions para mantener compatibilidad
 * con el código existente que espera getMealAlternatives
 */
export async function getMealAlternatives(
  context: MealAlternativeRequestContext,
  userProfile?: Partial<UserProfile> | null,
  options?: SuggestionsOptions,
): Promise<MealAlternative[]> {
  try {
    if (!userProfile?.id) {
      console.log('[getMealAlternatives] No user profile provided, returning empty array');
      return [];
    }

    const client = options?.client ?? supabase;

    const { data: pantryData, error: pantryError } = await client
      .from('pantry_items')
      .select('ingredient_id, quantity, unit, ingredients ( name )')
      .eq('user_id', userProfile.id);

    if (pantryError) {
      console.error('[getMealAlternatives] Error fetching pantry items:', pantryError);
    }

    const pantryItems: SuggestionPantryItem[] = (pantryData ?? []).map((item: any) => ({
      ingredientId: item.ingredient_id ?? undefined,
      name: item.ingredients?.name ?? item.ingredient_name ?? 'Ingrediente',
      quantity: item.quantity ?? undefined,
      unit: item.unit ?? undefined,
    }));

    if (!pantryItems.length && context.available_ingredients?.length) {
      pantryItems.push(
        ...context.available_ingredients.map((name) => ({ name })),
      );
    }

    const dietaryPreference = userProfile.dietary_preference ?? null;
    const dietaryRestrictions = [
      ...(context.dietary_restrictions ?? []),
      ...(userProfile.dietaryRestrictions ?? []),
    ];

    const difficultyMap: Record<string, 'simple' | 'medium' | 'complex'> = {
      easy: 'simple',
      medium: 'medium',
      hard: 'complex',
    };

    const suggestionContext: SuggestionRequest = {
      mealType: context.meal_type,
      pantryItems,
      dietary: {
        vegetarian: dietaryPreference === 'vegetarian',
        vegan: dietaryPreference === 'vegan',
        glutenFree: dietaryRestrictions.some((item) => normalizeText(item).includes('gluten')),
        restrictions: dietaryRestrictions,
      },
      preferences: {
        difficulty: userProfile.difficulty_preference
          ? difficultyMap[userProfile.difficulty_preference]
          : undefined,
        maxPrepTime: userProfile.max_prep_time ?? undefined,
        avoidIngredients: [
          ...(userProfile.dislikedIngredients ?? []),
          ...(userProfile.excludedIngredients ?? []),
          ...(context.dietary_restrictions ?? []),
        ],
        preferredTags: userProfile.preferredCuisines ?? userProfile.cuisinePreferences ?? [],
      },
    };

    const response = await getSuggestions(suggestionContext, {
      client,
      userId: userProfile.id,
    });
    const suggestions = response.suggestions ?? [];

    const pantryNameSet = new Set(
      pantryItems.map((item) => normalizeText(item.name)).filter(Boolean),
    );
    const availableNameSet = new Set(
      (context.available_ingredients ?? []).map((name) => normalizeText(name)).filter(Boolean),
    );

    const alternatives: MealAlternative[] = suggestions.map((suggestion, index) => {
      const confidence = Math.max(0.4, 0.9 - index * 0.2);
      const ingredients = (suggestion.ingredients ?? []).map(normalizeText);
      const matched = ingredients.filter(
        (ingredient) => pantryNameSet.has(ingredient) || availableNameSet.has(ingredient),
      );

      let reason = suggestion.description?.trim() || 'Recomendación basada en tu despensa y preferencias.';
      if (matched.length) {
        const readable = matched
          .slice(0, 3)
          .map((item) => capitalize(item))
          .join(', ');
        reason = `Aprovechamos ${readable} que ya tenés disponible.`;
      }

      return {
        type: 'recipe' as const,
        id: suggestion.name,
        title: suggestion.name,
        confidence,
        reason,
      };
    });

    return alternatives;

  } catch (error) { // Corregir bloque catch
    console.error('Error en getMealAlternatives:', error);
    return [];
  } // Corregir bloque catch
}
