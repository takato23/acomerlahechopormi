// src/features/recipes/services/recipeService.ts
import { supabase } from '../../../lib/supabaseClient'; // Corregir ruta relativa
import type { Recipe, RecipeIngredient } from '../../../types/recipeTypes'; // Corregir ruta relativa
import { findOrCreateIngredient } from '../../ingredients/ingredientService'; // Importar servicio de ingredientes

// Añadir isBaseRecipe al tipo de entrada
export type RecipeInputData = Omit<Recipe, 'id' | 'created_at' | 'ingredients' | 'is_generated_base'> & {
  user_id?: string | null; // Hacer user_id opcional aquí también
  ingredients: Array<{ name: string; quantity: string | number | null; unit?: string | null }>;
  isBaseRecipe?: boolean; // Flag para indicar si es receta base generada
  tags?: string[] | null; // Tags/categorías predefinidas para la receta
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

// Tipo intermedio para la respuesta de Supabase con la relación
type RecipeWithIngredientsRaw = Omit<Recipe, 'ingredients' | 'instructions'> & {
  instructions: string | null; // Viene como string de la DB
  recipe_ingredients: RecipeIngredient[] | null;
};

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
    console.error("User ID es necesario para obtener recetas.");
    // Devolver estructura esperada incluso en error temprano
    return { data: [], hasMore: false };
  }
  let query = supabase
    .from('recipes')
    .select(`
      id,
      user_id,
      title,
      description,
      image_url,
      prep_time_minutes,
      cook_time_minutes,
      servings,
      is_favorite,
      instructions,
      created_at,
      recipe_ingredients (
        id,
        recipe_id,
        ingredient_name,
        quantity,
        unit,
        ingredient_id
      )
    `)
    .eq('user_id', userId);

  // Aplicar filtros dinámicamente
  if (filters.searchTerm) {
    query = query.ilike('title', `%${filters.searchTerm}%`);
  }
  if (filters.showOnlyFavorites) {
    query = query.eq('is_favorite', true);
  }

  // Filtro por Ingredientes (contiene al menos uno)
  if (filters.selectedIngredients && filters.selectedIngredients.length > 0) {
    // Necesitamos filtrar en la tabla relacionada. Esto puede ser complejo.
    // Una forma es usar .filter() si Supabase lo soporta bien en relaciones anidadas para 'in'
    // Nota: Esto requiere que los nombres coincidan exactamente.
    // Asegúrate de escapar las comillas simples en los nombres si es necesario.
    const ingredientNames = filters.selectedIngredients.map(name => name.replace(/'/g, "''"));
    // Usamos `or` para buscar recetas que tengan CUALQUIERA de los ingredientes seleccionados.
    // La sintaxis exacta puede variar, consultando la documentación de PostgREST/Supabase para filtros anidados.
    // Ejemplo tentativo usando 'or' y 'in' en la relación:
    query = query.filter('recipe_ingredients.ingredient_name', 'in', `(${ingredientNames.map(name => `'${name}'`).join(',')})`);
    // Alternativa si lo anterior no funciona o para buscar TODOS (más complejo, usualmente RPC):
    // Podrías necesitar una función RPC para una lógica de "contiene todos".
    console.log(`Applying ingredient filter (at least one): ${ingredientNames.join(', ')}`);
  }

  // Filtro por Tags (contiene todos los seleccionados)
  if (filters.selectedTags && filters.selectedTags.length > 0) {
    // Usar '@>' (contains array) para aprovechar el índice GIN
    query = query.filter('tags', '@>', filters.selectedTags);
    console.log(`Applying tags filter (contains all selected): ${filters.selectedTags.join(', ')}`);
  }

  // Aplicar ordenamiento dinámico basado en filters.sortOption
  const sortOption = filters.sortOption || 'created_at_desc'; // Default a más recientes
  let sortColumn: string = 'created_at';
  let sortAscending: boolean = false;

  switch (sortOption) {
    case 'created_at_asc':
      sortColumn = 'created_at';
      sortAscending = true;
      break;
    case 'title_asc':
      sortColumn = 'title';
      sortAscending = true;
      break;
    case 'title_desc':
      sortColumn = 'title';
      sortAscending = false;
      break;
    case 'created_at_desc': // Incluido el default
    default:
      sortColumn = 'created_at';
      sortAscending = false;
      break;
  }

  console.log(`Applying sort: column=${sortColumn}, ascending=${sortAscending}`);
  query = query.order(sortColumn, { ascending: sortAscending });

  // Aplicar paginación
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  console.log(`Applying range: from ${from} to ${to}`);
  query = query.range(from, to);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching recipes:', error);
    // Devolver estructura esperada en caso de error
    return { data: [], hasMore: false };
  }

  // Si data es null (puede pasar si no hay resultados), inicializar a array vacío
  const safeData = data || [];
  // Mapear los ingredientes al formato esperado por el tipo Recipe
  // Añadir tipo explícito al parámetro del map
  const recipesWithMappedIngredients = safeData.map((recipe: RecipeWithIngredientsRaw): Recipe => ({
    ...recipe,
    // Asegurarse de que recipe_ingredients sea un array y renombrar a ingredients
    ingredients: (recipe.recipe_ingredients || []) as RecipeIngredient[],
    // Convertir instructions (string) a string[]
    instructions: typeof recipe.instructions === 'string' ? recipe.instructions.split('\n').filter((line: string) => line.trim() !== '') : [],
  }));

  // Determinar si hay más páginas comparando la cantidad obtenida con el límite
  const hasMore = recipesWithMappedIngredients.length === limit;

  console.log(`Recipes fetched (Page ${page}, Limit ${limit}): ${recipesWithMappedIngredients.length} items. Has More: ${hasMore}`);
  return { data: recipesWithMappedIngredients, hasMore };
};

/**
 * Obtiene una receta específica por su ID, incluyendo ingredientes.
 */
export const getRecipeById = async (recipeId: string): Promise<Recipe | null> => {
  if (!recipeId) return null;

  const { data, error } = await supabase
    .from('recipes')
    .select(`
      id,
      user_id,
      title,
      description,
      image_url,
      prep_time_minutes,
      cook_time_minutes,
      servings,
      is_favorite,
      instructions,
      created_at,
      recipe_ingredients (
        id,
        recipe_id,
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
   // Añadir aserción de tipo a 'data'
   const rawData = data as RecipeWithIngredientsRaw; // Usar el tipo definido arriba
   const recipeWithMappedIngredients: Recipe = {
     ...rawData,
     // Asegurarse de que recipe_ingredients sea un array y renombrar a ingredients
     ingredients: (rawData.recipe_ingredients || []) as RecipeIngredient[],
     // Convertir instructions (string) a string[]
     instructions: typeof rawData.instructions === 'string' ? rawData.instructions.split('\n').filter((line: string) => line.trim() !== '') : [],
   };

  return recipeWithMappedIngredients;
};


/**
 * Añade una nueva receta y sus ingredientes a la base de datos.
 */
export const addRecipe = async (recipeData: RecipeInputData): Promise<Recipe> => { // Cambiar tipo de retorno a Recipe completo
  console.log("Guardando receta:", recipeData);

  // Validar: Se necesita título. Se necesita user_id a menos que sea isBaseRecipe
  if (!recipeData.title || (!recipeData.user_id && !recipeData.isBaseRecipe)) {
    throw new Error("El título es obligatorio. Se requiere user_id si no es una receta base.");
  }

  // Construir el objeto a insertar basado en si es base o no
  const recipeToInsert = {
    user_id: recipeData.isBaseRecipe ? null : recipeData.user_id, // Null si es base
    title: recipeData.title,
    description: recipeData.description,
    instructions: Array.isArray(recipeData.instructions)
      ? (recipeData.instructions as string[]).join('\n')
      : recipeData.instructions,
    prep_time_minutes: recipeData.prep_time_minutes,
    cook_time_minutes: recipeData.cook_time_minutes,
    servings: recipeData.servings,
    is_generated_base: recipeData.isBaseRecipe || false, // Establecer el flag
    is_favorite: false, // Las recetas base no son favoritas por defecto
    tags: recipeData.tags || null, // Añadir tags
    // image_url se añadirá después
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
    console.log("Procesando ingredientes para obtener/crear IDs...");
    const ingredientsToInsertPromises = recipeData.ingredients.map(async (ing) => {
      if (!ing.name) {
        console.warn("Ingrediente sin nombre omitido:", ing);
        return null; // Omitir ingredientes sin nombre
      }
      const quantityValue = typeof ing.quantity === 'string' ? parseFloat(ing.quantity.replace(',', '.')) || 1 : (ing.quantity ?? 1);
      try {
        const foundOrCreatedIngredient = await findOrCreateIngredient(ing.name, quantityValue);
        return {
          recipe_id: newRecipe.id,
          ingredient_id: foundOrCreatedIngredient.id, // ID del ingrediente maestro
          ingredient_name: ing.name, // Nombre original proporcionado
          quantity: quantityValue === 1 && typeof ing.quantity !== 'number' ? null : quantityValue, // Guardar null si la cantidad era 1 por defecto y no numérica
          unit: ing.unit || null,
        };
      } catch (error) {
        console.error(`Error procesando ingrediente "${ing.name}":`, error);
        // Decidir si continuar o lanzar error. Por ahora, omitimos este ingrediente.
        return null;
      }
    });

    const resolvedIngredients = await Promise.all(ingredientsToInsertPromises);
    const validIngredientsToInsert = resolvedIngredients.filter(ing => ing !== null);

    if (validIngredientsToInsert.length > 0) {
        console.log("Insertando ingredientes con IDs:", validIngredientsToInsert);
        const { error: ingredientsError } = await supabase
          .from('recipe_ingredients')
          .insert(validIngredientsToInsert); // Insertar los objetos completos

        // Mover el manejo de errores DENTRO del if
        if (ingredientsError) {
          console.error('Error al insertar ingredientes:', ingredientsError);
          // Considerar si eliminar la receta principal si fallan los ingredientes (transacción?)
          throw new Error(`Error al guardar los ingredientes: ${ingredientsError.message}`);
        }
        console.log("Ingredientes guardados.");
    } else {
        console.log("No hay ingredientes válidos para insertar después del procesamiento.");
    }
    // Eliminar el bloque if (ingredientsError) duplicado/fuera de scope
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

    console.log(`Receta ${recipeId} eliminada.`); // Mover console.log aquí
}; // Llave de cierre correcta para deleteRecipe

// Renombrar updateRecipeFavoriteStatus a toggleRecipeFavorite para coincidir con el store
/**
 * Cambia el estado de favorito de una receta.
 */
export async function toggleRecipeFavorite(recipeId: string, isFavorite: boolean): Promise<Recipe | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuario no autenticado");

  const { data, error } = await supabase
    .from('recipes')
    .update({ is_favorite: isFavorite, updated_at: new Date().toISOString() }) // Añadir updated_at
    .eq('id', recipeId)
    .eq('user_id', user.id)
    .select('*') // Devolver receta completa para actualizar estado optimista si es necesario
    .single();

  if (error) {
    console.error("Error toggling recipe favorite:", error);
    if (error.code === 'PGRST116') {
        console.warn(`Recipe ${recipeId} not found or permission denied.`);
        return null;
    }
    throw error;
  }
  console.log(`Recipe ${recipeId} favorite status updated to ${isFavorite}`);
  return data; // Devolver la receta completa actualizada
}
// Eliminar llave extra


// TODO: Añadir función para updateRecipe

/**
 * Actualiza una receta existente y sus ingredientes.
 */
export const updateRecipe = async (recipeId: string, recipeData: Partial<RecipeInputData>): Promise<Recipe | null> => { // Asegurar tipo de retorno correcto
  console.log(`Actualizando receta ${recipeId}:`, recipeData);

  if (!recipeId) {
    throw new Error("El ID de la receta es obligatorio para actualizar.");
  }

  // Separar los datos de la receta de los ingredientes
  const { ingredients, instructions: instructionsArray, ...recipeFieldsToUpdate } = recipeData;

  // Preparar el payload para actualizar la tabla 'recipes'
  const updatePayload: { [key: string]: any } = { // Usar un tipo más flexible para el payload
      ...recipeFieldsToUpdate,
      updated_at: new Date().toISOString(),
      // Incluir tags solo si se proporcionan explícitamente en la actualización parcial
      ...(recipeData.tags !== undefined && { tags: recipeData.tags }),
  };

  // Convertir instructions a string si viene como array
  if (Array.isArray(instructionsArray)) {
      updatePayload.instructions = instructionsArray.filter(inst => inst.trim() !== '').join('\n');
  } else if (typeof instructionsArray === 'string') {
      // Si ya es string (aunque el tipo espera array), usarlo directamente
      updatePayload.instructions = instructionsArray;
  }


  // Eliminar user_id del payload si está presente, no se debe actualizar
  delete updatePayload.user_id;
  // Eliminar is_favorite si no se está actualizando explícitamente (para evitar sobreescribir)
  // A menos que el tipo RecipeInputData lo incluya como opcional
  // delete updatePayload.is_favorite; // Descomentar si es necesario

  // Actualizar los campos principales de la receta
  const { data: updatedRecipeData, error: recipeError } = await supabase
    .from('recipes')
    .update(updatePayload)
    .eq('id', recipeId)
    .select()
    .single();

  if (recipeError || !updatedRecipeData) {
    console.error(`Error al actualizar receta ${recipeId}:`, recipeError);
    throw new Error(`Error al actualizar la receta: ${recipeError?.message || 'Error desconocido'}`);
  }

  console.log(`Receta ${recipeId} actualizada (campos principales).`);

  // --- Lógica de actualización de ingredientes ---
  if (ingredients) { // Solo si se proporcionan ingredientes explícitamente
      console.log(`Actualizando ingredientes para receta ${recipeId}...`);
      // 1. Eliminar ingredientes existentes para esta receta
      const { error: deleteError } = await supabase
          .from('recipe_ingredients')
          .delete()
          .eq('recipe_id', recipeId);

      if (deleteError) {
          console.error(`Error eliminando ingredientes antiguos para ${recipeId}:`, deleteError);
          // Considerar si revertir o continuar con error parcial
          throw new Error(`Error al actualizar ingredientes (eliminación): ${deleteError.message}`);
      }

      // 2. Insertar los nuevos ingredientes (si hay alguno)
      if (ingredients.length > 0) {
          console.log("Procesando nuevos ingredientes para obtener/crear IDs...");
          const ingredientsToInsertPromises = ingredients.map(async (ing) => {
            if (!ing.name) {
              console.warn("Ingrediente sin nombre omitido en actualización:", ing);
              return null;
            }
            const quantityValue = typeof ing.quantity === 'string' ? parseFloat(ing.quantity.replace(',', '.')) || 1 : (ing.quantity ?? 1);
            try {
              const foundOrCreatedIngredient = await findOrCreateIngredient(ing.name, quantityValue);
              return {
                recipe_id: recipeId,
                ingredient_id: foundOrCreatedIngredient.id,
                ingredient_name: ing.name,
                quantity: quantityValue === 1 && typeof ing.quantity !== 'number' ? null : quantityValue,
                unit: ing.unit || null,
              };
            } catch (error) {
              console.error(`Error procesando ingrediente "${ing.name}" en actualización:`, error);
              return null;
            }
          });

          const resolvedIngredients = await Promise.all(ingredientsToInsertPromises);
          const validIngredientsToInsert = resolvedIngredients.filter(ing => ing !== null);

          if (validIngredientsToInsert.length > 0) {
              console.log("Insertando nuevos ingredientes con IDs:", validIngredientsToInsert);
              const { error: insertError } = await supabase
                .from('recipe_ingredients')
                .insert(validIngredientsToInsert); // Insertar objetos completos

              // Mover el manejo de errores DENTRO del if
              if (insertError) {
                  console.error(`Error insertando nuevos ingredientes para ${recipeId}:`, insertError);
                  // Considerar si revertir o continuar con error parcial
                  throw new Error(`Error al actualizar ingredientes (inserción): ${insertError.message}`);
              }
              console.log(`Ingredientes para receta ${recipeId} actualizados.`);
          } else {
              console.log("No hay ingredientes válidos para insertar en la actualización.");
          }
      } // Cierre del if (ingredients.length > 0)
  }
  // --- Fin Lógica de ingredientes ---


  // Devolver la receta actualizada. Para tenerla 100% completa con los nuevos
  // ingredientes, necesitaríamos volver a consultarla o construirla manualmente.
  // Hacemos un getRecipeById para asegurar que devolvemos el estado más reciente.
  const finalRecipe = await getRecipeById(recipeId);
  if (!finalRecipe) {
      // Esto no debería pasar si la actualización fue exitosa, pero es una salvaguarda
      console.error(`Error crítico: No se pudo recuperar la receta ${recipeId} después de actualizar.`);
      // Devolver null si no se pudo recuperar la receta final
      return null;
      // O lanzar un error más específico
      // throw new Error("No se pudo obtener la receta actualizada después de la operación.");
  }

  return finalRecipe;
}; // Llave de cierre final
