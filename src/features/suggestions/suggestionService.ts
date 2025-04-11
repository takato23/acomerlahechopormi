import { Recipe, RecipeIngredient } from '@/types/recipeTypes';
import { SuggestionRequest, RecipeSuggestion, SuggestionResponse } from './types'; // Tipos correctos
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
  if (!keywordSet) {
    console.log(`[isRecipeSuitableForMealType] No keywords found for meal type: ${mealType}`);
    return true; // Si no hay palabras clave definidas, aceptar todas las recetas
  }

  const searchText = `${recipe.title} ${recipe.description || ''}`.toLowerCase();
  console.log(`[isRecipeSuitableForMealType] Checking recipe: ${recipe.title}`);

  // 1. Verificar palabras clave prohibidas
  if (keywordSet.not?.some(keyword => searchText.includes(keyword.toLowerCase()))) {
    console.log(`[isRecipeSuitableForMealType] Recipe ${recipe.title} contains prohibited keywords`);
    return false;
  }

  // VERSIÓN MENOS RESTRICTIVA: No requerir ambas condiciones
  // Basta con que cumpla UNA de las dos condiciones

  // 2. Verificar si tiene palabras clave requeridas
  const hasRequiredKeyword = keywordSet.required.some(keyword => searchText.includes(keyword.toLowerCase()));
  
  // 3. Verificar si tiene palabras clave adicionales
  const hasAnyKeyword = keywordSet.any.some(keyword => searchText.includes(keyword.toLowerCase()));

  // Aceptar si tiene al menos un tipo de palabra clave
  const result = hasRequiredKeyword || hasAnyKeyword;

  // En modo depuración, muestra recetas aceptadas
  if (result) {
    console.log(`[isRecipeSuitableForMealType] Recipe '${recipe.title}' is suitable for ${mealType}: Required=${hasRequiredKeyword}, Any=${hasAnyKeyword}`);
  }

  return result;
}

/**
 * Encuentra la mejor receta utilizando ingredientes de la despensa
 */
async function findBestPantryRecipe(
  pantryItems: Array<{ ingredient_id: string; name: string }>,
  relevantRecipes: Recipe[],
  userId: string
): Promise<RecipeSuggestion | undefined> {
  console.log("[findBestPantryRecipe] Starting with", pantryItems.length, "pantry items and", relevantRecipes.length, "relevant recipes");
  
  if (!relevantRecipes?.length) {
    console.log("[findBestPantryRecipe] No relevant recipes available");
    return undefined;
  }

  // Si no hay ingredientes en la despensa, seleccionar una receta al azar
  if (!pantryItems?.length) {
    console.log("[findBestPantryRecipe] No pantry items available, selecting random recipe");
    const randomRecipe = relevantRecipes[Math.floor(Math.random() * relevantRecipes.length)];
    return {
      name: randomRecipe.title,
      description: randomRecipe.description || 'Una receta recomendada',
    };
  }

  const pantryIngredientIds = new Set(pantryItems.map(item => item.ingredient_id).filter(Boolean));
  const pantryIngredientNames = new Set(pantryItems.map(item => item.name.toLowerCase()));
  
  console.log("[findBestPantryRecipe] Pantry ingredient names:", Array.from(pantryIngredientNames));
  
  let bestRecipe: { recipe: Recipe; matchCount: number } | undefined;
  let bestUserRecipe: { recipe: Recipe; matchCount: number } | undefined;
  let bestBaseRecipe: { recipe: Recipe; matchCount: number } | undefined;

  for (const recipe of relevantRecipes) {
    if (!recipe.recipe_ingredients?.length) {
      console.log(`[findBestPantryRecipe] Recipe ${recipe.title} has no ingredients, skipping`);
      continue;
    }

    // Contar coincidencias por ID y por nombre para ser más flexible
    let matchCount = 0;
    for (const ingredient of recipe.recipe_ingredients) {
      if (!ingredient) continue;
      
      // Coincidencia por ID si está disponible
      if (ingredient.ingredient_id && pantryIngredientIds.has(ingredient.ingredient_id)) {
        matchCount++;
        continue;
      }
      
      // Coincidencia por nombre (como fallback)
      const ingredientName = ingredient.ingredient_name?.toLowerCase();
      if (ingredientName && pantryIngredientNames.has(ingredientName)) {
        matchCount++;
      }
    }

    if (matchCount > 0) {
      console.log(`[findBestPantryRecipe] Recipe ${recipe.title} matches ${matchCount}/${recipe.recipe_ingredients.length} pantry ingredients`);
    }

    if (recipe.user_id === userId) {
      if (!bestUserRecipe || matchCount > bestUserRecipe.matchCount) {
        bestUserRecipe = { recipe, matchCount };
      }
    } else if (recipe.is_public) {
      if (!bestBaseRecipe || matchCount > bestBaseRecipe.matchCount) {
        bestBaseRecipe = { recipe, matchCount };
      }
    }
  }

  bestRecipe = bestUserRecipe || bestBaseRecipe;

  // Si no se encontró ninguna coincidencia, seleccionar una receta aleatoria
  if (!bestRecipe) {
    console.log("[findBestPantryRecipe] No matching recipes found, selecting random recipe as fallback");
    const randomRecipe = relevantRecipes[Math.floor(Math.random() * relevantRecipes.length)];
    return {
      name: randomRecipe.title,
      description: randomRecipe.description || 'Una receta para probar',
    };
  }

  console.log(`[findBestPantryRecipe] Best recipe found: ${bestRecipe.recipe.title} with ${bestRecipe.matchCount} matches`);
  
  return {
    name: bestRecipe.recipe.title,
    description: bestRecipe.recipe.description || `Usa ${bestRecipe.matchCount} ingredientes de tu despensa`,
  };
}

/**
 * Encuentra una receta "descubrimiento" diferente a la de despensa
 */
async function findDiscoveryRecipe(
  relevantRecipes: Recipe[],
  userId: string,
  excludeRecipeName?: string
): Promise<RecipeSuggestion | undefined> {
  console.log("[findDiscoveryRecipe] Iniciando búsqueda de receta de descubrimiento");
  
  if (!relevantRecipes?.length) {
    console.log("[findDiscoveryRecipe] No hay recetas relevantes");
    return undefined;
  }

  console.log(`[findDiscoveryRecipe] Buscando entre ${relevantRecipes.length} recetas, excluyendo: ${excludeRecipeName || 'ninguna'}`);

  // Filtrar recetas que no sean la excluida
  let availableRecipes = relevantRecipes
    .filter(recipe => recipe.title !== excludeRecipeName)
    .sort(() => Math.random() - 0.5);

  console.log(`[findDiscoveryRecipe] Después de filtrar por nombre, quedan ${availableRecipes.length} recetas`);

  // Si no hay suficientes recetas después de filtrar, usar todas
  if (availableRecipes.length < 2) {
    console.log("[findDiscoveryRecipe] Pocas recetas disponibles después de filtrar, usando todas las relevantes");
    availableRecipes = relevantRecipes.sort(() => Math.random() - 0.5);
  }

  // Si aún así no hay recetas, retornar undefined
  if (!availableRecipes.length) {
    console.log("[findDiscoveryRecipe] No se encontraron recetas disponibles después de todos los filtros");
    return undefined;
  }

  const recipe = availableRecipes[0];
  console.log(`[findDiscoveryRecipe] Receta seleccionada: ${recipe.title} (ID: ${recipe.id})`);

  return {
    name: recipe.title,
    description: recipe.description || 'Una receta diferente para probar',
    id: recipe.id,
    title: recipe.title,
    reason: 'Prueba algo diferente'
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
 * Implementación simplificada y robusta de getSuggestions
 * Esta función prioriza devolver resultados válidos sobre la lógica compleja
 */
export async function getSuggestions(context: SuggestionRequest): Promise<SuggestionResponse> {
  console.log('[getSuggestions] Starting with context:', context);
  
  try {
    // 1. Verificar autenticación de usuario
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('[getSuggestions] Authentication error:', authError);
      // Devolver sugerencias de emergencia para pruebas
      return createEmergencySuggestions('Error de autenticación');
    }
    
    const userId = user.id;
    console.log('[getSuggestions] User authenticated:', userId);
    
    // 2. Obtener todas las recetas disponibles (sin filtros iniciales)
    // Obtener recetas del usuario
    const { data: userRecipes, error: userRecipesError } = await supabase
      .from('recipes')
      .select('id, title, description, user_id, is_public, recipe_ingredients(id, ingredient_id, ingredient_name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
      
    if (userRecipesError) {
      console.error('[getSuggestions] Error fetching user recipes:', userRecipesError);
      // Continuar con un array vacío
    }
    
    // Obtener recetas públicas
    const { data: publicRecipes, error: publicRecipesError } = await supabase
      .from('recipes')
      .select('id, title, description, user_id, is_public, recipe_ingredients(id, ingredient_id, ingredient_name)')
      .eq('is_public', true)
      .neq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
      
    if (publicRecipesError) {
      console.error('[getSuggestions] Error fetching public recipes:', publicRecipesError);
      // Continuar con un array vacío
    }
    
    // Combinar todas las recetas
    const allRecipes = [
      ...(userRecipes || []),
      ...(publicRecipes || [])
    ];
    
    console.log(`[getSuggestions] Retrieved ${allRecipes.length} total recipes`);
    
    // Si no hay recetas, devolver sugerencias de emergencia
    if (allRecipes.length === 0) {
      console.warn('[getSuggestions] No recipes found in database');
      return createEmergencySuggestions('No se encontraron recetas');
    }
    
    // 3. Determinar tipo de comida adecuado
    const mealType = context.mealType || 'Almuerzo';  // Valor por defecto
    console.log(`[getSuggestions] Using meal type: ${mealType}`);
    
    // 4. Encontrar coincidencias con la despensa
    const pantryItemNames = new Set((context.pantryItems || []).map(item => item.name.toLowerCase()));
    console.log(`[getSuggestions] Pantry items: ${Array.from(pantryItemNames).join(', ')}`);
    
    // Calcular coincidencias para cada receta
    const recipesWithMatches = allRecipes.map(recipe => {
      const ingredients = recipe.recipe_ingredients || [];
      let matchCount = 0;
      
      // Contar ingredientes que coinciden con la despensa
      for (const ingredient of ingredients) {
        if (ingredient && ingredient.ingredient_name && 
            pantryItemNames.has(ingredient.ingredient_name.toLowerCase())) {
          matchCount++;
        }
      }
      
      return {
        ...recipe,
        matchCount,
        matchPercentage: ingredients.length ? (matchCount / ingredients.length) : 0
      };
    });
    
    // 5. Seleccionar receta para sugerencia de despensa
    // Ordenar por coincidencia y preferir recetas del usuario
    const sortedForPantry = [...recipesWithMatches].sort((a, b) => {
      // Primero por coincidencia
      if (b.matchCount !== a.matchCount) return b.matchCount - a.matchCount;
      // Luego preferir recetas del usuario
      if (a.user_id === userId && b.user_id !== userId) return -1;
      if (a.user_id !== userId && b.user_id === userId) return 1;
      // Por último, orden aleatorio
      return Math.random() - 0.5;
    });
    
    // Seleccionar la mejor receta para sugerencia de despensa
    const pantryRecipe = sortedForPantry[0];
    const pantryDescription = pantryRecipe.matchCount > 0 
      ? `Usa ${pantryRecipe.matchCount} ingredientes de tu despensa` 
      : 'Receta recomendada para ti';
    
    const pantrySuggestion: RecipeSuggestion = {
      id: pantryRecipe.id,
      name: pantryRecipe.title,
      title: pantryRecipe.title,
      description: pantryRecipe.description || '',
      reason: pantryDescription
    };
    
    console.log(`[getSuggestions] Pantry suggestion: ${pantrySuggestion.title}`);
    
    // 6. Seleccionar receta para sugerencia de descubrimiento
    // Filtrar para excluir la receta ya seleccionada y ordenar aleatoriamente
    const availableForDiscovery = recipesWithMatches
      .filter(r => r.id !== pantryRecipe.id)
      .sort(() => Math.random() - 0.5);
    
    // Si no hay otras recetas, usar la misma con mensaje diferente
    const discoveryRecipe = availableForDiscovery.length > 0 ? availableForDiscovery[0] : pantryRecipe;
    
    const discoverySuggestion: RecipeSuggestion = {
      id: discoveryRecipe.id,
      name: discoveryRecipe.title,
      title: discoveryRecipe.title,
      description: discoveryRecipe.description || '',
      reason: 'Prueba algo diferente'
    };
    
    console.log(`[getSuggestions] Discovery suggestion: ${discoverySuggestion.title}`);
    
    // 7. Retornar ambas sugerencias
    return {
      suggestions: [pantrySuggestion, discoverySuggestion]
    };
    
  } catch (error) {
    console.error('[getSuggestions] Unexpected error:', error);
    return createEmergencySuggestions('Error inesperado');
  }
}

/**
 * Crea sugerencias de emergencia cuando ocurre un error
 */
function createEmergencySuggestions(reason: string): SuggestionResponse {
  console.warn(`[getSuggestions] Creating emergency suggestions: ${reason}`);
  
  // Crear al menos dos sugerencias de emergencia
  const suggestions: RecipeSuggestion[] = [
    {
      id: 'emergency-1',
      name: 'Huevos revueltos',
      title: 'Huevos revueltos',
      description: 'Un clásico rápido y sencillo',
      reason: `Sugerencia de respaldo (${reason})`
    },
    {
      id: 'emergency-2',
      name: 'Sandwich de jamón y queso',
      title: 'Sandwich de jamón y queso',
      description: 'Opción fácil y deliciosa',
      reason: `Sugerencia de respaldo (${reason})`
    }
  ];
  
  return { suggestions };
}

/**
 * Obtiene alternativas de comidas basadas en el contexto y perfil del usuario
 * Esta función actúa como un wrapper sobre getSuggestions para mantener compatibilidad
 * con el código existente que espera getMealAlternatives
 */
export async function getMealAlternatives(
  context: import('@/features/planning/types').MealAlternativeRequestContext,
  userProfile?: { id: string } | null
): Promise<import('@/features/planning/types').MealAlternative[]> {
  try {
    if (!userProfile?.id) {
      console.log('[getMealAlternatives] No user profile provided, returning empty array');
      return [];
    }

    // Construir SuggestionRequest
    // Simplificación: Pasamos un array vacío por ahora para pantryItems
    const suggestionContext: SuggestionRequest = {
      pantryItems: [], // TODO: Obtener pantry items si es necesario
      // dietary: ...,
      // maxTime: ...
    };

    // Obtener sugerencias
    const response = await getSuggestions(suggestionContext);

    // Transformar SuggestionResponse a MealAlternative[]
    const alternatives: MealAlternative[] = [];
    const suggestions = response.suggestions;

    suggestions.forEach(suggestion => {
      // Mapear de RecipeSuggestion a MealAlternative
      if (suggestion) {
        alternatives.push({
          type: 'recipe', // Asumimos que todas son recetas por ahora
          id: suggestion.name, // Usar 'name' como ID temporal
          title: suggestion.name
        });
      }
      // No hay sugerencias 'custom' por ahora
    }); // Corregir cierre del forEach

    return alternatives;

  } catch (error) { // Corregir bloque catch
    console.error('Error en getMealAlternatives:', error);
    return [];
  } // Corregir bloque catch
}

async function getDiverseMealSuggestions(
  userId: string,
  filters: { mealType: string; days: string[]; styles: string[] },
  mode: 'optimizePantry' | 'flexibleSuggestions',
  history: string[]
): Promise<RecipeSuggestion[]> {
  // Obtener recetas base según los filtros del usuario
  let baseSuggestions = await getBaseSuggestions(userId, filters);

  // Filtrar recetas para evitar repeticiones
  let filteredSuggestions = baseSuggestions.filter(recipe => {
    return !history.includes(recipe.id);
  });

  // Balancear ingredientes principales
  let balancedSuggestions = balanceIngredients(filteredSuggestions);

  // Alternar estilos de cocina
  let diverseSuggestions = alternateCuisines(balancedSuggestions);

  // Aplicar lógica según el modo
  if (mode === 'optimizePantry') {
    return prioritizePantryIngredients(diverseSuggestions);
  } else if (mode === 'flexibleSuggestions') {
    return includeNewAndSurprisingRecipes(diverseSuggestions);
  }

  // Ajustar el mapeo de Recipe a RecipeSuggestion
  function mapToRecipeSuggestion(recipes: Recipe[]): RecipeSuggestion[] {
    return recipes.map(recipe => ({
      name: recipe.title,
      description: recipe.description || 'Una receta para probar',
      // Otros campos opcionales si es necesario
    }));
  }

  // Usar la función de mapeo donde sea necesario
  return mapToRecipeSuggestion(diverseSuggestions);
}

// Funciones auxiliares
async function getBaseSuggestions(userId: string, filters: { mealType: string; days: string[]; styles: string[] }): Promise<Recipe[]> {
  // Lógica para obtener recetas base
  // Aquí se puede implementar la lógica para obtener recetas desde la base de datos
  return [];
}

function balanceIngredients(suggestions: Recipe[]): Recipe[] {
  // Lógica para balancear ingredientes
  return suggestions;
}

function alternateCuisines(suggestions: Recipe[]): Recipe[] {
  // Lógica para alternar estilos de cocina
  return suggestions;
}

function prioritizePantryIngredients(suggestions: Recipe[]): RecipeSuggestion[] {
  // Lógica para priorizar ingredientes de la despensa
  return suggestions.map(recipe => ({
    name: recipe.title,
    description: recipe.description || 'Receta optimizada para tu despensa',
  }));
}

function includeNewAndSurprisingRecipes(suggestions: Recipe[]): RecipeSuggestion[] {
  // Lógica para incluir recetas nuevas y sorprendentes
  return suggestions.map(recipe => ({
    name: recipe.title,
    description: recipe.description || 'Una receta nueva para probar',
  }));
}