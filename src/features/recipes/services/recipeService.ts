// src/features/recipes/services/recipeService.ts
import { supabase } from '@/lib/supabaseClient';
import { handleError } from '@/lib/errorHandler';
import type { Recipe, RecipeIngredient, GeneratedRecipeData, RecipeInstructions } from '@/types/recipeTypes';
import { VALID_COOKING_METHODS } from '@/types/recipeRecommendationTypes';
import type { Database } from '@/lib/database.types';
import { findOrCreateIngredient } from '../../ingredients/ingredientService';
import { MOCK_RECIPES } from '@/lib/mockData';

// Función para detectar si usar datos mock
const shouldUseMockData = () => {
  return false; // Usar Supabase real
};

// Funciones auxiliares para conversión de instrucciones
const instructionsToString = (instructions: RecipeInstructions | string | null | undefined): string => {
  if (Array.isArray(instructions)) {
    return instructions.filter(inst => inst && inst.trim() !== '').join('\n');
  }
  if (typeof instructions === 'string') {
    return instructions.trim();
  }
  return '';
};

const instructionsToArray = (text: string | null): RecipeInstructions => {
  if (!text) return [];
  return text.split('\n').filter(line => line && line.trim() !== '');
};

// Tipo de entrada para añadir/actualizar recetas
export type RecipeInputData = Omit<Recipe, 'id' | 'created_at' | 'ingredients' | 'is_generated_base' | 'instructions' | 'main_ingredients'> & {
  user_id?: string | null;
  ingredients: Array<{ name: string; quantity: string | number | null; unit?: string | null }>;
  instructions: RecipeInstructions | string | null; // Permitir string o array como entrada
  isBaseRecipe?: boolean;
  tags?: string[] | null;
  mainIngredients?: string[]; // Usar camelCase para la entrada desde UI/Generación
};

// Importar tipo de filtros
import type { RecipeFilters } from '@/stores/recipeStore';

interface GetRecipesParams {
  userId: string;
  filters?: RecipeFilters;
  page?: number;
  limit?: number;
}

interface GetRecipesResult {
  data: Recipe[];
  hasMore: boolean;
}

type DbRecipeRow = Database['public']['Tables']['recipes']['Row'];
type DbRecipeIngredient = Database['public']['Tables']['recipe_ingredients']['Row'];

// Tipo intermedio para la respuesta de Supabase (usa snake_case y string para instructions)
type RecipeFromDB = DbRecipeRow & {
  recipe_ingredients: DbRecipeIngredient[] | null;
};

const normalizeCookingMethods = (value: unknown) => {
  if (!Array.isArray(value)) return undefined;
  return value.filter((method): method is typeof VALID_COOKING_METHODS[number] =>
    typeof method === 'string' && VALID_COOKING_METHODS.includes(method as typeof VALID_COOKING_METHODS[number])
  );
};

export const getEffectiveRecipeTotalTime = (recipe: Recipe): number | null => {
  const estimatedTime = typeof recipe.estimated_time === 'number' && !Number.isNaN(recipe.estimated_time)
    ? Math.max(0, recipe.estimated_time)
    : null;

  if (estimatedTime !== null) {
    return estimatedTime;
  }

  const prep = typeof recipe.prep_time_minutes === 'number' ? Math.max(0, recipe.prep_time_minutes) : null;
  const cook = typeof recipe.cook_time_minutes === 'number' ? Math.max(0, recipe.cook_time_minutes) : null;

  if (prep === null && cook === null) {
    return null;
  }

  return (prep ?? 0) + (cook ?? 0);
};

export const filterRecipesByMaxTime = (recipes: Recipe[], maxMinutes: number): Recipe[] => {
  if (!Number.isFinite(maxMinutes)) {
    return recipes;
  }
  const normalizedMax = Math.max(0, maxMinutes);
  return recipes.filter((recipe) => {
    const totalTime = getEffectiveRecipeTotalTime(recipe);
    if (totalTime === null) {
      return false;
    }
    return totalTime <= normalizedMax;
  });
};

/**
 * Convierte el formato de la DB al formato de la UI (Recipe)
 */
function mapDBDataToRecipe(dbData: RecipeFromDB): Recipe {
  const ingredients = (dbData.recipe_ingredients || []).map((ingredient) => ({
    ...ingredient,
    notes: ingredient.notes ?? null
  })) as RecipeIngredient[];

  const cookingMethods = normalizeCookingMethods((dbData as Record<string, unknown>).cooking_methods);

  return {
    id: dbData.id,
    user_id: dbData.user_id,
    title: dbData.title,
    description: dbData.description,
    instructions: instructionsToArray(dbData.instructions),
    created_at: dbData.created_at,
    updated_at: dbData.updated_at ?? null,
    image_url: dbData.image_url ?? null,
    prep_time_minutes: dbData.prep_time_minutes ?? null,
    cook_time_minutes: dbData.cook_time_minutes ?? null,
    servings: dbData.servings ?? null,
    tags: dbData.tags ?? null,
    is_favorite: (dbData as DbRecipeRow & { is_favorite?: boolean }).is_favorite ?? false,
    category_id: (dbData as DbRecipeRow & { category_id?: string | null }).category_id ?? null,
    ingredients,
    main_ingredients: (dbData as DbRecipeRow & { main_ingredients?: string[] | null }).main_ingredients ?? null,
    is_generated_base: (dbData as DbRecipeRow & { is_generated_base?: boolean }).is_generated_base ?? undefined,
    cooking_methods: cookingMethods,
    difficulty_level: (dbData as DbRecipeRow & { difficulty_level?: Recipe['difficulty_level'] }).difficulty_level,
    cuisine_type: (dbData as DbRecipeRow & { cuisine_type?: Recipe['cuisine_type'] }).cuisine_type,
    estimated_time: (dbData as DbRecipeRow & { estimated_time?: Recipe['estimated_time'] }).estimated_time ?? null,
    nutritional_info: (dbData as DbRecipeRow & { nutritional_info?: Recipe['nutritional_info'] }).nutritional_info,
    seasonal_flags: (dbData as DbRecipeRow & { seasonal_flags?: Recipe['seasonal_flags'] }).seasonal_flags,
    equipment_needed: (dbData as DbRecipeRow & { equipment_needed?: Recipe['equipment_needed'] }).equipment_needed
  };
}

/**
 * Obtiene las recetas para un usuario específico, aplicando filtros y paginación.
 */
export const getRecipes = async ({
  userId,
  filters = {},
  page = 1,
  limit = 12
}: GetRecipesParams): Promise<GetRecipesResult> => {
  if (!userId) {
    handleError(new Error("User ID es necesario para obtener recetas."), {
      component: 'recipeService',
      action: 'getRecipes',
      severity: 'medium'
    });
    return { data: [], hasMore: false };
  }

  if (shouldUseMockData()) {
    console.log('Using mock recipe data');

    let filteredRecipes = [...MOCK_RECIPES];

    // Aplicar filtros
    if (filters.searchTerm) {
      filteredRecipes = filteredRecipes.filter(recipe =>
        recipe.title.toLowerCase().includes(filters.searchTerm!.toLowerCase())
      );
    }
    if (filters.showOnlyFavorites) {
      filteredRecipes = filteredRecipes.filter(recipe => recipe.is_favorite);
    }
    if (filters.selectedIngredients && filters.selectedIngredients.length > 0) {
      filteredRecipes = filteredRecipes.filter(recipe =>
        recipe.ingredients.some(ing =>
          filters.selectedIngredients!.some(selected =>
            ing.ingredient_name.toLowerCase().includes(selected.toLowerCase())
          )
        )
      );
    }
    if (filters.selectedTags && filters.selectedTags.length > 0) {
      filteredRecipes = filteredRecipes.filter(recipe =>
        recipe.tags && filters.selectedTags!.some(tag => recipe.tags!.includes(tag))
      );
    }
    if (filters.categoryId) {
      filteredRecipes = filteredRecipes.filter(recipe => recipe.category_id === filters.categoryId);
    }
    if (filters.maxTotalTimeMinutes !== undefined && filters.maxTotalTimeMinutes !== null) {
      filteredRecipes = filterRecipesByMaxTime(filteredRecipes, filters.maxTotalTimeMinutes);
    }

    // Aplicar ordenamiento
    const sortOption = filters.sortOption || 'created_at_desc';
    filteredRecipes.sort((a, b) => {
      switch (sortOption) {
        case 'created_at_asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'title_asc':
          return a.title.localeCompare(b.title);
        case 'title_desc':
          return b.title.localeCompare(a.title);
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    // Aplicar paginación
    const from = (page - 1) * limit;
    const to = from + limit;
    const paginatedRecipes = filteredRecipes.slice(from, to);
    const hasMore = filteredRecipes.length > to;

    return { data: paginatedRecipes, hasMore };
  }

  const selectColumns = (includeEstimatedTime: boolean) => `
      id, user_id, title, description, image_url, prep_time_minutes, cook_time_minutes,
      servings, instructions, created_at, updated_at, category_id, tags${includeEstimatedTime ? ', estimated_time' : ''},
      recipe_ingredients ( id, recipe_id, ingredient_id, ingredient_name, quantity, unit, notes )
    `;

  const maxTotalTime = filters.maxTotalTimeMinutes ?? null;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const buildQuery = (includeEstimatedTime: boolean) => {
    let builtQuery = supabase
      .from('recipes')
      .select(selectColumns(includeEstimatedTime))
      .eq('user_id', userId);

    if (filters.searchTerm) builtQuery = builtQuery.ilike('title', `%${filters.searchTerm}%`);
    if (filters.showOnlyFavorites) builtQuery = builtQuery.eq('is_favorite', true);
    if (filters.selectedIngredients && filters.selectedIngredients.length > 0) {
      const ingredientNames = filters.selectedIngredients.map(name => name.replace(/'/g, "''"));
      builtQuery = builtQuery.filter('recipe_ingredients.ingredient_name', 'in', `(${ingredientNames.map(name => `'${name}'`).join(',')})`);
    }
    if (filters.selectedTags && filters.selectedTags.length > 0) builtQuery = builtQuery.filter('tags', '@>', filters.selectedTags);
    if (filters.categoryId) {
      builtQuery = builtQuery.eq('category_id', filters.categoryId);
    }

    const sortOption = filters.sortOption || 'created_at_desc';
    let sortColumn: string = 'created_at';
    let sortAscending: boolean = false;
    switch (sortOption) {
      case 'created_at_asc': sortColumn = 'created_at'; sortAscending = true; break;
      case 'title_asc': sortColumn = 'title'; sortAscending = true; break;
      case 'title_desc': sortColumn = 'title'; sortAscending = false; break;
      default: sortColumn = 'created_at'; sortAscending = false; break;
    }
    builtQuery = builtQuery.order(sortColumn, { ascending: sortAscending });

    if (maxTotalTime === null) {
      builtQuery = builtQuery.range(from, to);
    }

    return builtQuery;
  };

  let query = buildQuery(true);

  const { data, error } = await query;

  if (error?.code === '42703') {
    query = buildQuery(false);
    const fallbackResult = await query;
    if (fallbackResult.error) {
      handleError(fallbackResult.error, {
        component: 'recipeService',
        action: 'getRecipes',
        severity: 'high'
      });
      return { data: [], hasMore: false };
    }
    const fallbackData = fallbackResult.data || [];
    const fallbackRecipes = Array.isArray(fallbackData)
      ? fallbackData.map(dbRecipe => mapDBDataToRecipe(dbRecipe as unknown as RecipeFromDB))
      : [];

    if (maxTotalTime !== null) {
      const filteredRecipes = filterRecipesByMaxTime(fallbackRecipes, maxTotalTime);
      const pageStart = from;
      const pageEnd = pageStart + limit;
      const paginatedRecipes = filteredRecipes.slice(pageStart, pageEnd);
      const hasMoreFiltered = pageEnd < filteredRecipes.length;
      return { data: paginatedRecipes, hasMore: hasMoreFiltered };
    }

    const hasMoreFallback = fallbackRecipes.length === limit;
    return { data: fallbackRecipes, hasMore: hasMoreFallback };
  }

  if (error) {
    handleError(error, {
      component: 'recipeService',
      action: 'getRecipes',
      severity: 'high'
    });
    return { data: [], hasMore: false };
  }

  const safeData = data || [];
  const recipes = Array.isArray(safeData)
    ? safeData.map(dbRecipe => mapDBDataToRecipe(dbRecipe as unknown as RecipeFromDB))
    : [];

  if (maxTotalTime !== null) {
    const filteredRecipes = filterRecipesByMaxTime(recipes, maxTotalTime);
    const pageStart = from;
    const pageEnd = pageStart + limit;
    const paginatedRecipes = filteredRecipes.slice(pageStart, pageEnd);
    const hasMoreFiltered = pageEnd < filteredRecipes.length;
    return { data: paginatedRecipes, hasMore: hasMoreFiltered };
  }

  const hasMore = recipes.length === limit;
  return { data: recipes, hasMore };
};

/**
 * Obtiene una receta específica por su ID, incluyendo ingredientes.
 */
export const getRecipeById = async (recipeId: string): Promise<Recipe | null> => {
  if (!recipeId) return null;

  if (shouldUseMockData()) {
    console.log(`Using mock data for recipe ${recipeId}`);
    const recipe = MOCK_RECIPES.find(r => r.id === recipeId);
    return recipe || null;
  }

  const { data, error } = await supabase
    .from('recipes')
    .select(`
      id, user_id, title, description, image_url, prep_time_minutes, cook_time_minutes,
      servings, instructions, created_at, updated_at, tags,
      recipe_ingredients ( id, recipe_id, ingredient_id, ingredient_name, quantity, unit, notes )
    `)
    .eq('id', recipeId)
    .single();

  if (error) {
    handleError(error, {
      component: 'recipeService',
      action: 'getRecipeById',
      severity: 'high'
    });
    if (error.code === 'PGRST116') return null;
    throw new Error(`Error al obtener la receta: ${error.message}`);
  }

  if (!data) return null;

  return mapDBDataToRecipe(data as RecipeFromDB);
};


/**
 * Añade una nueva receta y sus ingredientes a la base de datos.
 */
export const addRecipe = async (recipeInput: RecipeInputData): Promise<Recipe> => {
  console.log("Guardando receta:", recipeInput);

  if (!recipeInput.title || !recipeInput.user_id) {
    throw new Error("El título y user_id son obligatorios.");
  }

  // Preparar datos para insertar en la tabla 'recipes'
  const recipeToInsert = {
    user_id: recipeInput.user_id,
    title: recipeInput.title,
    description: recipeInput.description,
    instructions: instructionsToString(recipeInput.instructions), // Convertir a string para DB
    prep_time_minutes: recipeInput.prep_time_minutes,
    cook_time_minutes: recipeInput.cook_time_minutes,
    servings: recipeInput.servings,
    tags: recipeInput.tags || null
  };

  // Insertar la receta principal
  const { data: newRecipeData, error: recipeError } = await supabase
    .from('recipes')
    .insert(recipeToInsert)
    .select(`*, recipe_ingredients ( * )`) // Seleccionar todo, incluyendo ingredientes (estarán vacíos inicialmente)
    .single();

  if (recipeError || !newRecipeData) {
    handleError(recipeError || new Error('Error al insertar receta'), {
      component: 'recipeService',
      action: 'addRecipe',
      severity: 'high'
    });
    throw new Error(`Error al guardar la receta: ${recipeError?.message || 'Error desconocido'}`);
  }

  let newRecipeDB = newRecipeData as RecipeFromDB; // Castear a tipo DB

  console.log("Receta principal guardada, ID:", newRecipeDB.id);

  // Procesar e insertar ingredientes asociados
  let insertedIngredients: RecipeIngredient[] = [];
  if (recipeInput.ingredients && recipeInput.ingredients.length > 0) {
    const ingredientsToInsertPromises = recipeInput.ingredients.map(async (ing) => {
      if (!ing.name) return null;
      const quantityValue = typeof ing.quantity === 'string' ? parseFloat(ing.quantity.replace(',', '.')) || 1 : (ing.quantity ?? 1);
      try {
        const found = await findOrCreateIngredient(ing.name, quantityValue);
        return {
          recipe_id: newRecipeDB.id,
          ingredient_id: found.id,
          ingredient_name: ing.name,
          quantity: quantityValue === 1 && typeof ing.quantity !== 'number' ? null : quantityValue,
          unit: ing.unit || null,
          notes: null
        };
      } catch (e) {
        handleError(e instanceof Error ? e : new Error(String(e)), {
          component: 'recipeService',
          action: 'processIngredient',
          severity: 'medium'
        });
        return null;
      }
    });

    const resolved = await Promise.all(ingredientsToInsertPromises);
    const validToInsert = resolved.filter((ing): ing is NonNullable<typeof ing> => ing !== null);

    if (validToInsert.length > 0) {
      const { data: insertedData, error: ingredientsError } = await supabase
        .from('recipe_ingredients')
        .insert(validToInsert)
        .select(); // Devolver los ingredientes insertados

      if (ingredientsError) {
        handleError(ingredientsError, {
          component: 'recipeService',
          action: 'addRecipeIngredients',
          severity: 'high'
        });
        // Considerar rollback o manejo de error
        throw new Error(`Error al guardar los ingredientes: ${ingredientsError.message}`);
      }
      insertedIngredients = (insertedData || []) as RecipeIngredient[];
      console.log("Ingredientes guardados:", insertedIngredients);
    }
  }

  // Asignar ingredientes insertados a la receta recuperada
  newRecipeDB.recipe_ingredients = insertedIngredients;

  if (!recipeInput.image_url) {
    try {
      // Enviar el objeto directamente como body, sin anidamiento extra
      const { data: funcData, error: funcError } = await supabase.functions.invoke(
        'generate-recipe-image',
        { body: { recipeTitle: newRecipeDB.title } }
      );
      if (funcError) throw funcError;
      const imageUrl = funcData?.imageUrl;
      if (imageUrl) {
        const { data: updatedImgData, error: imgUpdateError } = await supabase
          .from('recipes')
          .update({ image_url: imageUrl })
          .eq('id', newRecipeDB.id)
          .select('image_url')
          .single();
        if (imgUpdateError) throw imgUpdateError;
        if (updatedImgData) newRecipeDB.image_url = updatedImgData.image_url;
      }
    } catch (error) {
      handleError(error, {
        component: 'recipeService',
        action: 'generateAndSaveImage',
        severity: 'medium'
      });
    }
  }

  // Devolver la receta completa mapeada al tipo UI
  return mapDBDataToRecipe(newRecipeDB);
};

/**
 * Elimina una receta por su ID.
 */
export const deleteRecipe = async (recipeId: string): Promise<void> => {
    if (!recipeId) throw new Error("Se requiere ID de receta para eliminar.");
    const { error } = await supabase.from('recipes').delete().eq('id', recipeId);
    if (error) {
        handleError(error, {
          component: 'recipeService',
          action: 'deleteRecipe',
          severity: 'high'
        });
        throw new Error(`Error al eliminar la receta: ${error.message}`);
    }
    console.log(`Receta ${recipeId} eliminada.`);
};

/**
 * Cambia el estado de favorito de una receta.
 */
export async function toggleRecipeFavorite(recipeId: string, isFavorite: boolean): Promise<Recipe | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuario no autenticado");

  const { data, error } = await supabase
    .from('recipes')
    .update({ is_favorite: isFavorite, updated_at: new Date().toISOString() })
    .eq('id', recipeId)
    .eq('user_id', user.id)
    .select(`*, recipe_ingredients ( * )`) // Seleccionar todo para devolver completo
    .single();

  if (error) {
    handleError(error, {
      component: 'recipeService',
      action: 'toggleRecipeFavorite',
      severity: 'medium'
    });
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  console.log(`Recipe ${recipeId} favorite status updated to ${isFavorite}`);
  return mapDBDataToRecipe(data as RecipeFromDB); // Mapear al formato UI
}

/**
 * Obtiene la lista de categorías disponibles.
 */
export const getCategories = async (): Promise<{ id: string; name: string; icon: string | null }[]> => {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, icon, order')
    .order('order', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    handleError(error, {
      component: 'recipeService',
      action: 'getCategories',
      severity: 'medium'
    });
    throw new Error(`Error al obtener las categorías: ${error.message}`);
  }
  return (data || []) as { id: string; name: string; icon: string | null }[];
};


/**
 * Actualiza una receta existente y sus ingredientes.
 */
export const updateRecipe = async (recipeId: string, recipeInput: Partial<RecipeInputData>): Promise<Recipe | null> => {
  console.log(`Actualizando receta ${recipeId}:`, recipeInput);
  if (!recipeId) throw new Error("El ID de la receta es obligatorio para actualizar.");

  const { ingredients, instructions: instructionsInput, mainIngredients, ...recipeFieldsToUpdate } = recipeInput;

  const updatePayload: { [key: string]: any } = {
      ...recipeFieldsToUpdate,
      updated_at: new Date().toISOString(),
      ...(recipeInput.tags !== undefined && { tags: recipeInput.tags }),
      ...(mainIngredients !== undefined && { main_ingredients: mainIngredients }),
  };

  // Convertir instructions a string si se proporcionan
  if (instructionsInput !== undefined) {
      updatePayload.instructions = instructionsToString(instructionsInput);
  }

  delete updatePayload.user_id; // No actualizar user_id

  // Actualizar campos principales
  const { data: updatedRecipeData, error: recipeError } = await supabase
    .from('recipes')
    .update(updatePayload)
    .eq('id', recipeId)
    .select(`*, recipe_ingredients ( * )`) // Seleccionar todo para devolver completo
    .single();

  if (recipeError || !updatedRecipeData) {
    handleError(recipeError || new Error('Error al actualizar receta'), {
      component: 'recipeService',
      action: 'updateRecipe',
      severity: 'high'
    });
    throw new Error(`Error al actualizar la receta: ${recipeError?.message || 'Error desconocido'}`);
  }

  let updatedRecipeDB = updatedRecipeData as RecipeFromDB;

  // Actualizar ingredientes si se proporcionan
  if (ingredients) {
      const { error: deleteError } = await supabase
          .from('recipe_ingredients')
          .delete()
          .eq('recipe_id', recipeId);
      if (deleteError) throw new Error(`Error al actualizar ingredientes (eliminación): ${deleteError.message}`);

      if (ingredients.length > 0) {
          const ingredientsToInsertPromises = ingredients.map(async (ing) => {
            if (!ing.name) return null;
            const quantityValue = typeof ing.quantity === 'string' ? parseFloat(ing.quantity.replace(',', '.')) || 1 : (ing.quantity ?? 1);
            try {
              const found = await findOrCreateIngredient(ing.name, quantityValue);
              return { recipe_id: recipeId, ingredient_id: found.id, ingredient_name: ing.name, quantity: quantityValue, unit: ing.unit || null, notes: null };
            } catch (e) {
        handleError(e instanceof Error ? e : new Error(String(e)), {
          component: 'recipeService',
          action: 'processIngredient',
          severity: 'medium'
        });
        return null;
      }
          });
          const resolved = await Promise.all(ingredientsToInsertPromises);
          const validToInsert = resolved.filter((ing): ing is NonNullable<typeof ing> => ing !== null);
          if (validToInsert.length > 0) {
              const { data: insertedData, error: insertError } = await supabase.from('recipe_ingredients').insert(validToInsert).select();
              if (insertError) throw new Error(`Error al actualizar ingredientes (inserción): ${insertError.message}`);
              updatedRecipeDB.recipe_ingredients = (insertedData || []) as RecipeIngredient[];
          } else {
              updatedRecipeDB.recipe_ingredients = [];
          }
      } else {
          updatedRecipeDB.recipe_ingredients = [];
      }
  }

  // Devolver la receta completa mapeada al tipo UI
  return mapDBDataToRecipe(updatedRecipeDB);
};
