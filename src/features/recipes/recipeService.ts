import { supabase } from '@/lib/supabaseClient';
// Usar 'any' temporalmente hasta que database.types.ts esté disponible
// import type { Recipe, RecipeIngredient, UpsertRecipeData } from './recipeTypes';
type Recipe = any; 
type RecipeIngredient = any;
type UpsertRecipeData = any;

/** @constant {string} RECIPES_TABLE - Nombre de la tabla de recetas en Supabase. */
const RECIPES_TABLE = 'recipes';
/** @constant {string} INGREDIENTS_TABLE - Nombre de la tabla de ingredientes de recetas en Supabase. */
const INGREDIENTS_TABLE = 'recipe_ingredients';

/**
 * Obtiene las recetas del usuario actual, opcionalmente filtrando por favoritas.
 * Incluye los ingredientes asociados a cada receta.
 * @async
 * @function getRecipes
 * @param {boolean} [onlyFavorites=false] - Si es true, devuelve solo las recetas marcadas como favoritas.
 * @returns {Promise<Recipe[]>} Una promesa que resuelve a un array de recetas (con sus ingredientes).
 * @throws {Error} Si el usuario no está autenticado o si ocurre un error en la consulta.
 */
export const getRecipes = async (onlyFavorites = false): Promise<Recipe[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  let query = supabase
    .from(RECIPES_TABLE)
    .select(`
      *,
      recipe_ingredients (*)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (onlyFavorites) {
    // Asumiendo que la columna se llama 'is_favorite'
    query = query.eq('is_favorite', true); 
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching recipes:', error);
    throw new Error('No se pudieron cargar las recetas.');
  }

  // Asegurar que recipe_ingredients sea siempre un array
  return data?.map(recipe => ({
    ...recipe,
    recipe_ingredients: recipe.recipe_ingredients || [],
  })) || [];
};

/**
 * Obtiene una receta específica por su ID, incluyendo sus ingredientes.
 * Verifica que la receta pertenezca al usuario autenticado.
 * @async
 * @function getRecipeById
 * @param {string} recipeId - El ID de la receta a obtener.
 * @returns {Promise<Recipe | null>} Una promesa que resuelve a la receta encontrada o null si no existe, no pertenece al usuario o hay un error.
 * @throws {Error} Si el usuario no está autenticado.
 */
export const getRecipeById = async (recipeId: string): Promise<Recipe | null> => {
   const { data: { user } } = await supabase.auth.getUser();
   if (!user) throw new Error('Usuario no autenticado');

   const { data, error } = await supabase
    .from(RECIPES_TABLE)
    .select(`
      *,
      recipe_ingredients (*)
    `)
    .eq('id', recipeId)
    .eq('user_id', user.id) // Asegurar que pertenece al usuario
    .single();

  if (error) {
    // 'PGRST116' indica "Not Found", no es un error crítico en este contexto.
    if (error.code !== 'PGRST116') {
       console.error('Error fetching recipe by ID:', error);
       // Podríamos lanzar un error aquí si quisiéramos ser más estrictos
    }
    return null; // Devolver null si no se encuentra o hay otro error
  }
  
   // Asegurar que recipe_ingredients sea siempre un array
   return data ? { ...data, recipe_ingredients: data.recipe_ingredients || [] } : null;
};

/**
 * Crea una nueva receta y sus ingredientes asociados en Supabase.
 * @async
 * @function createRecipe
 * @param {Omit<UpsertRecipeData, 'ingredients'>} recipeData - Datos principales de la receta (sin id, user_id, created_at, ingredients).
 * @param {Omit<RecipeIngredient, 'id' | 'recipe_id'>[]} ingredients - Array de objetos de ingredientes a crear.
 * @returns {Promise<Recipe>} La receta recién creada (con ingredientes simulados si se añadieron).
 * @throws {Error} Si el usuario no está autenticado o si falla la creación de la receta o sus ingredientes.
 */
export const createRecipe = async (recipeData: Omit<UpsertRecipeData, 'ingredients'>, ingredients: Omit<RecipeIngredient, 'id' | 'recipe_id'>[]): Promise<Recipe> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  // 1. Insertar la receta principal
  const { data: newRecipe, error: recipeError } = await supabase
    .from(RECIPES_TABLE)
    .insert({ ...recipeData, user_id: user.id })
    .select()
    .single();

  if (recipeError || !newRecipe) {
    console.error('Error creating recipe:', recipeError);
    throw new Error('No se pudo crear la receta.');
  }

  // 2. Preparar y insertar los ingredientes asociados
  let createdIngredients: RecipeIngredient[] = [];
  if (ingredients && ingredients.length > 0) {
    const ingredientsToInsert = ingredients.map(ing => ({
      ...ing,
      recipe_id: newRecipe.id,
      // user_id: user.id // No es necesario si RLS se basa en recipe_id->recipes.user_id
    }));

    const { error: ingredientsError } = await supabase
      .from(INGREDIENTS_TABLE)
      .insert(ingredientsToInsert);

    if (ingredientsError) {
      console.error('Error creating recipe ingredients:', ingredientsError);
      // Rollback manual: eliminar la receta creada si fallan los ingredientes
      try {
         await supabase.from(RECIPES_TABLE).delete().eq('id', newRecipe.id);
         console.log(`Rolled back recipe creation for id: ${newRecipe.id}`);
      } catch (rollbackError) {
         console.error(`Failed to rollback recipe creation for id: ${newRecipe.id}`, rollbackError);
      }
      throw new Error('No se pudieron guardar los ingredientes de la receta.');
    }
     // Simular IDs para los ingredientes devueltos (insert no los devuelve por defecto)
     createdIngredients = ingredientsToInsert.map(ing => ({...ing, id: crypto.randomUUID()})); 
  }

  return { ...newRecipe, recipe_ingredients: createdIngredients }; 
};


/**
 * Actualiza una receta existente y sus ingredientes asociados.
 * Utiliza una estrategia de borrar y recrear para los ingredientes por simplicidad.
 * @async
 * @function updateRecipe
 * @param {string} recipeId - El ID de la receta a actualizar.
 * @param {Omit<UpsertRecipeData, 'ingredients'>} recipeData - Datos principales de la receta a actualizar.
 * @param {Omit<RecipeIngredient, 'id' | 'recipe_id'>[]} ingredients - El array COMPLETO y ACTUALIZADO de ingredientes.
 * @returns {Promise<Recipe>} La receta actualizada (con ingredientes simulados si se añadieron).
 * @throws {Error} Si el usuario no está autenticado, si la receta no se encuentra/no pertenece al usuario, o si falla la actualización/borrado/inserción.
 */
export const updateRecipe = async (recipeId: string, recipeData: Omit<UpsertRecipeData, 'ingredients'>, ingredients: Omit<RecipeIngredient, 'id' | 'recipe_id'>[]): Promise<Recipe> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  // 1. Actualizar la receta principal
  const { data: updatedRecipe, error: recipeError } = await supabase
    .from(RECIPES_TABLE)
    .update({ ...recipeData })
    .eq('id', recipeId)
    .eq('user_id', user.id) // Asegurar propiedad
    .select()
    .single();

  if (recipeError || !updatedRecipe) {
    console.error('Error updating recipe:', recipeError);
    throw new Error('No se pudo actualizar la receta (¿no encontrada o sin permiso?).');
  }

  // 2. Borrar ingredientes existentes asociados a la receta
  const { error: deleteError } = await supabase
    .from(INGREDIENTS_TABLE)
    .delete()
    .eq('recipe_id', recipeId);

  // Loggear error pero continuar, la receta principal ya se actualizó.
  // Podría considerarse una transacción si Supabase lo soportara fácilmente en el cliente.
  if (deleteError) {
    console.error('Error deleting old ingredients (continuing anyway):', deleteError);
    // No lanzar error aquí para permitir que al menos la receta se actualice
  }

  // 3. Insertar los nuevos ingredientes si existen
  let createdIngredients: RecipeIngredient[] = [];
  if (ingredients && ingredients.length > 0) {
    const ingredientsToInsert = ingredients.map(ing => ({
      ...ing,
      recipe_id: recipeId,
    }));

    const { error: insertError } = await supabase
      .from(INGREDIENTS_TABLE)
      .insert(ingredientsToInsert);

    if (insertError) {
      console.error('Error inserting new ingredients (recipe updated, but ingredients failed):', insertError);
      // No lanzar error aquí, pero loggear la inconsistencia.
    } else {
       createdIngredients = ingredientsToInsert.map(ing => ({...ing, id: crypto.randomUUID()})); 
    }
  }

  return { ...updatedRecipe, recipe_ingredients: createdIngredients }; 
};


/**
 * Elimina una receta y sus ingredientes asociados (si la FK está configurada con ON DELETE CASCADE).
 * Verifica la propiedad de la receta antes de eliminar.
 * @async
 * @function deleteRecipe
 * @param {string} recipeId - El ID de la receta a eliminar.
 * @returns {Promise<void>}
 * @throws {Error} Si el usuario no está autenticado, si la receta no pertenece al usuario o si falla la eliminación.
 */
export const deleteRecipe = async (recipeId: string): Promise<void> => {
   const { data: { user } } = await supabase.auth.getUser();
   if (!user) throw new Error('Usuario no autenticado');

  // Asumiendo ON DELETE CASCADE en la FK de recipe_ingredients->recipes
  const { error } = await supabase
    .from(RECIPES_TABLE)
    .delete()
    .eq('id', recipeId)
    .eq('user_id', user.id); // Asegurar propiedad

  if (error) {
    console.error('Error deleting recipe:', error);
    throw new Error('No se pudo eliminar la receta.');
  }
};

/**
 * Marca o desmarca una receta como favorita actualizando el campo 'is_favorite'.
 * Verifica la propiedad de la receta.
 * @async
 * @function setRecipeFavoriteStatus
 * @param {string} recipeId - El ID de la receta.
 * @param {boolean} isFavorite - El nuevo estado de favorito (true/false).
 * @returns {Promise<boolean>} `true` si la operación fue exitosa, `false` en caso contrario.
 */
export const setRecipeFavoriteStatus = async (recipeId: string, isFavorite: boolean): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('Error setting favorite: User not authenticated');
    return false;
  }

  const { error } = await supabase
    .from(RECIPES_TABLE)
    .update({ is_favorite: isFavorite }) 
    .eq('id', recipeId)
    .eq('user_id', user.id); // Asegurar propiedad

  if (error) {
    console.error('Error updating favorite status:', error);
    return false;
  }
  return true;
};