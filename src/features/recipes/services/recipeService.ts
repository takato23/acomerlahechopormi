import { supabase } from '@/lib/supabaseClient';
import type { 
  Recipe, 
  RecipeIngredient, 
  RecipeInstructions,
  RecipeFilters,
} from '@/types/recipeTypes';
import { findOrCreateIngredient } from '@/features/ingredients/ingredientService';

// Tipo de entrada para añadir/actualizar recetas
export type RecipeInputData = Omit<Recipe, 'id' | 'created_at' | 'recipe_ingredients' | 'instructions'> & {
  user_id?: string | null;
  ingredients: Array<{ name: string; quantity: string | number | null; unit?: string | null }>;
  instructions: RecipeInstructions | string | null;
  isBaseRecipe?: boolean;
  tags?: string[] | null;
  mainIngredients?: string[];
  image_url?: string | null;
  nutritional_info?: string | null;
  source_api?: string | null;
  source_id?: string | null;
  is_shared?: boolean;
};

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

function mapDBDataToRecipe(dbData: any): Recipe {
  return {
    ...dbData,
    recipe_ingredients: dbData.recipe_ingredients || [],
    instructions: instructionsToArray(dbData.instructions),
    nutritional_info: dbData.nutritional_info || null,
    source_api: dbData.source_api || null,
    source_id: dbData.source_id || null,
    is_shared: dbData.is_shared || false
  };
}

export const getRecipes = async ({
  userId,
  filters = {},
  page = 1,
  limit = 12
}: GetRecipesParams): Promise<GetRecipesResult> => {
  if (!userId) {
    console.error("User ID es necesario para obtener recetas.");
    return { data: [], hasMore: false };
  }

  let query = supabase
    .from('recipes')
    .select(`
      id, user_id, title, description, image_url, prep_time_minutes, cook_time_minutes,
      servings, is_favorite, instructions, created_at, main_ingredients,
      recipe_ingredients ( id, recipe_id, ingredient_name, quantity, unit, ingredient_id )
    `)
    .eq('user_id', userId);

  // Aplicar filtros
  if (filters.searchTerm) {
    query = query.ilike('title', `%${filters.searchTerm}%`);
  }
  if (filters.showOnlyFavorites) {
    query = query.eq('is_favorite', true);
  }
  if (filters.selectedTags?.length) {
    query = query.contains('tags', filters.selectedTags);
  }
  if (filters.categoryId) {
    query = query.eq('category_id', filters.categoryId);
  }

  // Aplicar paginación
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query
    .order('created_at', { ascending: false })
    .range(from, to);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching recipes:', error);
    return { data: [], hasMore: false };
  }

  const recipes = (data || []).map(mapDBDataToRecipe);
  return { data: recipes, hasMore: recipes.length === limit };
};

export const getRecipeById = async (recipeId: string): Promise<Recipe | null> => {
  if (!recipeId) throw new Error("Se requiere ID de receta para obtener detalles.");

  const { data, error } = await supabase
    .from('recipes')
    .select(`
      *, 
      recipe_ingredients(*)
    `)
    .eq('id', recipeId)
    .single();

  if (error) {
    console.error(`Error fetching recipe ${recipeId}:`, error);
    return null;
  }

  return data ? mapDBDataToRecipe(data) : null;
};

// Función para crear recetas
export const createRecipe = async (recipeInput: RecipeInputData): Promise<Recipe> => {
  console.log('[recipeService] Entrando a createRecipe', { title: recipeInput.title });
  if (!recipeInput.title || !recipeInput.user_id) {
    throw new Error("El título y user_id son obligatorios.");
  }

  // Preparar datos para insertar en la tabla 'recipes'
  const recipeToInsert = {
    user_id: recipeInput.user_id,
    title: recipeInput.title,
    description: recipeInput.description,
    instructions: instructionsToString(recipeInput.instructions),
    prep_time_minutes: recipeInput.prep_time_minutes,
    cook_time_minutes: recipeInput.cook_time_minutes,
    servings: recipeInput.servings,
    is_generated_base: recipeInput.isBaseRecipe || false,
    is_favorite: false,
    tags: recipeInput.tags || null,
    main_ingredients: recipeInput.mainIngredients || null,
    image_url: recipeInput.image_url,
    nutritional_info: recipeInput.nutritional_info || null,
    source_api: recipeInput.source_api || null,
    source_id: recipeInput.source_id || null,
    is_shared: recipeInput.is_shared || false
  };

  // Insertar la receta principal
  const { data: newRecipe, error: recipeError } = await supabase
    .from('recipes')
    .insert([recipeToInsert])
    .select('*, recipe_ingredients(*)')
    .single();

  if (recipeError) throw recipeError;
  if (!newRecipe) throw new Error('No se pudo crear la receta');

  // Insertar ingredientes
  console.log('[recipeService] Receta base creada, iniciando procesamiento de ingredientes...');
  if (recipeInput.ingredients?.length) {
    const ingredientsToInsert = await Promise.all(
      recipeInput.ingredients.map(async (ing, index) => {
        console.log(`[recipeService] Procesando ingrediente ${index + 1}: ${ing.name}`);
        const ingredient = await findOrCreateIngredient(ing.name);
        return {
          recipe_id: newRecipe.id,
          ingredient_id: ingredient.id,
          ingredient_name: ing.name,
          quantity: typeof ing.quantity === 'string' ? parseFloat(ing.quantity.replace(',', '.')) : ing.quantity,
          unit: ing.unit
        };
      })
    );

    const { error: ingredientsError } = await supabase
      .from('recipe_ingredients')
      .insert(ingredientsToInsert);

    if (ingredientsError) throw ingredientsError;
  }

  return mapDBDataToRecipe(newRecipe);
};

// Alias para mantener compatibilidad
export const addRecipe = createRecipe;

export const updateRecipe = async (recipeId: string, recipeInput: Partial<RecipeInputData>): Promise<Recipe> => {
  // Obtener usuario actual
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  const { ingredients, instructions, mainIngredients, ...recipeFieldsToUpdate } = recipeInput;

  // 1. Actualizar receta - asegurar que el usuario solo pueda actualizar sus propias recetas
  const { data: updatedRecipe, error: recipeError } = await supabase
    .from('recipes')
    .update({
      ...recipeFieldsToUpdate,
      instructions: instructionsToString(instructions),
      main_ingredients: mainIngredients,
      updated_at: new Date().toISOString()
    })
    .eq('id', recipeId)
    .eq('user_id', user.id) // Agregar filtro de user_id
    .select('*, recipe_ingredients(*)')
    .single();

  if (recipeError) throw recipeError;
  if (!updatedRecipe) throw new Error('Receta no encontrada o no tienes permisos para editarla');

  // 2. Actualizar ingredientes si se proporcionan
  if (ingredients) {
    await supabase
      .from('recipe_ingredients')
      .delete()
      .eq('recipe_id', recipeId);

    if (ingredients.length > 0) {
      const ingredientsToInsert = await Promise.all(
        ingredients.map(async (ing) => {
          const ingredient = await findOrCreateIngredient(ing.name);
          return {
            recipe_id: recipeId,
            ingredient_id: ingredient.id,
            ingredient_name: ing.name,
            quantity: typeof ing.quantity === 'string' ? parseFloat(ing.quantity.replace(',', '.')) : ing.quantity,
            unit: ing.unit
          };
        })
      );

      const { error: ingredientsError } = await supabase
        .from('recipe_ingredients')
        .insert(ingredientsToInsert);

      if (ingredientsError) throw ingredientsError;
    }
  }

  return mapDBDataToRecipe(updatedRecipe);
};

export const deleteRecipe = async (recipeId: string): Promise<void> => {
  if (!recipeId) throw new Error("Se requiere ID de receta para eliminar.");

  // Obtener usuario actual
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  const { error } = await supabase
    .from('recipes')
    .delete()
    .eq('id', recipeId)
    .eq('user_id', user.id); // Asegurar que solo se eliminen recetas propias

  if (error) throw error;
};

export const toggleRecipeFavorite = async (recipeId: string, isFavorite: boolean): Promise<Recipe> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  const { data, error } = await supabase
    .from('recipes')
    .update({ is_favorite: isFavorite })
    .eq('id', recipeId)
    .eq('user_id', user.id)
    .select('*, recipe_ingredients(*)')
    .single();

  if (error) throw error;
  if (!data) throw new Error('Receta no encontrada');

  return mapDBDataToRecipe(data);
};

export const toggleRecipePublic = async (recipeId: string, isPublic: boolean): Promise<Recipe> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  const { data, error } = await supabase
    .from('recipes')
    .update({ is_public: isPublic })
    .eq('id', recipeId)
    .eq('user_id', user.id)
    .select('*, recipe_ingredients(*)')
    .single();

  if (error) throw error;
  if (!data) throw new Error('Receta no encontrada');

  return mapDBDataToRecipe(data);
};
