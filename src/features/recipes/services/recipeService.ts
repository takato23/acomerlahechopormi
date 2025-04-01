// src/features/recipes/services/recipeService.ts
import { supabase } from '@/lib/supabaseClient';
import type { Recipe, RecipeIngredient } from '@/types/recipeTypes';

type RecipeInputData = Omit<Recipe, 'id' | 'created_at' | 'ingredients'> & {
  user_id: string;
  ingredients: Array<{ name: string; quantity: string | number | null; unit?: string | null }>;
};

/**
 * Obtiene todas las recetas para un usuario específico.
 */
export const getRecipes = async (userId: string): Promise<Recipe[]> => {
  if (!userId) {
    console.error("User ID es necesario para obtener recetas.");
    return [];
  }
  const { data, error } = await supabase
    .from('recipes')
    .select(`
      *,
      recipe_ingredients (
        id,
        ingredient_name,
        quantity,
        unit,
        ingredient_id
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching recipes:', error);
    throw new Error(`Error al obtener recetas: ${error.message}`);
  }

  // Mapear los ingredientes al formato esperado por el tipo Recipe
  const recipesWithMappedIngredients = data.map(recipe => ({
    ...recipe,
    // Asegurarse de que recipe_ingredients sea un array, incluso si viene null/undefined de la DB
    ingredients: (recipe.recipe_ingredients || []) as RecipeIngredient[], // Renombrar y asegurar tipo
  }));

  console.log("Recipes fetched:", recipesWithMappedIngredients);
  return recipesWithMappedIngredients;
};

/**
 * Obtiene una receta específica por su ID, incluyendo ingredientes.
 */
export const getRecipeById = async (recipeId: string): Promise<Recipe | null> => {
  if (!recipeId) return null;

  const { data, error } = await supabase
    .from('recipes')
    .select(`
      *,
      recipe_ingredients (
        id,
        ingredient_name,
        quantity,
        unit,
        ingredient_id
      )
    `)
    .eq('id', recipeId)
    .single();

  if (error) {
    console.error(`Error fetching recipe ${recipeId}:`, error);
    // Podrías querer manejar el error 'No rows found' de forma diferente si es necesario
    if (error.code === 'PGRST116') { // Código para 'No rows found'
        return null;
    }
    throw new Error(`Error al obtener la receta: ${error.message}`);
  }

   if (!data) return null;

   // Mapear ingredientes
   const recipeWithMappedIngredients = {
     ...data,
     // Asegurarse de que recipe_ingredients sea un array, incluso si viene null/undefined de la DB
     ingredients: (data.recipe_ingredients || []) as RecipeIngredient[],
   };

  return recipeWithMappedIngredients;
};


/**
 * Añade una nueva receta y sus ingredientes a la base de datos.
 */
export const addRecipe = async (recipeData: RecipeInputData): Promise<Recipe> => { // Cambiar tipo de retorno a Recipe completo
  console.log("Guardando receta:", recipeData);

  if (!recipeData.title || !recipeData.user_id) {
    throw new Error("El título y el ID de usuario son obligatorios.");
  }

  const recipeToInsert = {
    user_id: recipeData.user_id,
    title: recipeData.title,
    description: recipeData.description,
    instructions: Array.isArray(recipeData.instructions)
      ? (recipeData.instructions as string[]).join('\n')
      : recipeData.instructions,
    prep_time_minutes: recipeData.prep_time_minutes,
    cook_time_minutes: recipeData.cook_time_minutes,
    servings: recipeData.servings,
    // image_url se añadirá después de llamar a la Edge Function
    // tags: recipeData.tags, // Asumiendo que no viene de RecipeInputData por ahora
  };

  const { data: newRecipe, error: recipeError } = await supabase
    .from('recipes')
    .insert(recipeToInsert)
    .select()
    .single();

  if (recipeError || !newRecipe) {
    console.error('Error al insertar receta:', recipeError);
    throw new Error(`Error al guardar la receta: ${recipeError?.message || 'Error desconocido'}`);
  }

  console.log("Receta principal guardada (sin imagen aún), ID:", newRecipe.id);

  // --- Llamar a Edge Function para generar imagen ---
  let imageUrl: string | null = null;
  try {
    console.log(`Invocando Edge Function 'generate-recipe-image' para: ${newRecipe.title}`);
    const { data: functionData, error: functionError } = await supabase.functions.invoke(
      'generate-recipe-image',
      { body: { recipeTitle: newRecipe.title } }
    );

    if (functionError) {
      throw functionError;
    }

    imageUrl = functionData?.imageUrl; // Asumiendo que la función devuelve { imageUrl: '...' }
    console.log("Imagen generada, URL/Data:", imageUrl);

    // --- Actualizar receta con la URL de la imagen ---
    if (imageUrl) {
      const { data: updatedRecipe, error: updateError } = await supabase
        .from('recipes')
        .update({ image_url: imageUrl })
        .eq('id', newRecipe.id)
        .select() // Devolver la fila actualizada
        .single();

      if (updateError) {
        throw updateError;
      }
      if (updatedRecipe) {
         console.log("Receta actualizada con image_url.");
         // Sobrescribir newRecipe con la versión actualizada que incluye la imagen
         Object.assign(newRecipe, updatedRecipe);
      }
    } else {
        console.warn("La Edge Function no devolvió una imageUrl.");
    }

  } catch (error) {
    // No detener el proceso si falla la generación/actualización de imagen, solo loguear
    console.error('Error al generar o guardar imagen para la receta:', error);
    // Opcional: podrías querer notificar al usuario de alguna manera
  }
  // --- Fin de generación de imagen ---

  if (recipeData.ingredients && recipeData.ingredients.length > 0) {
    const ingredientsToInsert = recipeData.ingredients.map(ing => ({
      recipe_id: newRecipe.id,
      ingredient_name: ing.name,
      quantity: typeof ing.quantity === 'string' ? parseFloat(ing.quantity.replace(',', '.')) || null : ing.quantity,
      unit: ing.unit || null,
      // NOTA: Falta ingredient_id si la tabla recipe_ingredients lo requiere.
      // Se necesitaría buscar el ID basado en ing.name o modificar la estructura/flujo.
    }));

    console.log("Insertando ingredientes:", ingredientsToInsert);

    // Especificar columnas explícitamente en el insert
    const { error: ingredientsError } = await supabase
      .from('recipe_ingredients')
      // .insert(ingredientsToInsert); // Versión anterior
      .insert(ingredientsToInsert.map(ing => ({
          recipe_id: ing.recipe_id,
          ingredient_name: ing.ingredient_name,
          quantity: ing.quantity,
          unit: ing.unit
      }))); // Mapear explícitamente a un objeto con las columnas

    if (ingredientsError) {
      console.error('Error al insertar ingredientes:', ingredientsError);
      // Considerar si eliminar la receta principal si fallan los ingredientes (transacción?)
      throw new Error(`Error al guardar los ingredientes: ${ingredientsError.message}`);
    }
    console.log("Ingredientes guardados.");
  }

  // Devolver la receta completa (puede o no tener image_url si la función falló)
  // Necesitamos añadir los ingredientes al objeto devuelto si queremos el tipo Recipe completo
  // Por simplicidad, podemos seguir devolviendo Omit<Recipe, 'ingredients'> o ajustar
  // Aquí devolvemos la receta actualizada (con o sin imagen) pero sin los ingredientes detallados
  // Para devolver Recipe completo, necesitaríamos re-leer los ingredientes o añadirlos manualmente
  return newRecipe as Recipe; // Castear temporalmente si estamos seguros que tiene los campos necesarios
};

/**
 * Elimina una receta por su ID.
 */
export const deleteRecipe = async (recipeId: string): Promise<void> => {
    if (!recipeId) {
        throw new Error("Se requiere ID de receta para eliminar.");
    }

    // Supabase maneja la eliminación en cascada de recipe_ingredients si está configurada la FK
    const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', recipeId);

    if (error) {
        console.error(`Error deleting recipe ${recipeId}:`, error);
        throw new Error(`Error al eliminar la receta: ${error.message}`);
    }

    console.log(`Receta ${recipeId} eliminada.`);
};


// TODO: Añadir función para updateRecipe