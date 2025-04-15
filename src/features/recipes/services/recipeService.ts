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
  is_public?: boolean;
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

// Caché para recetas públicas - mejora rendimiento
interface RecipeCache {
  key: string;
  data: Recipe[];
  timestamp: number;
  hasMore: boolean;
}

// Caché con tiempo de expiración (5 minutos)
const CACHE_EXPIRY_MS = 5 * 60 * 1000;
const recipeCache: Record<string, RecipeCache> = {};

// Utilidad para generar clave de caché
const generateCacheKey = (userId: string, filters: RecipeFilters, page: number, limit: number): string => {
  return `${userId}_${JSON.stringify(filters)}_${page}_${limit}`;
};

// Utilidad para verificar si la caché es válida
const isCacheValid = (cacheEntry: RecipeCache): boolean => {
  return Date.now() - cacheEntry.timestamp < CACHE_EXPIRY_MS;
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

function mapDBDataToRecipe(dbData: any): Recipe {
  let parsedInstructions: RecipeInstructions = [];
  const rawInstructions = dbData.instructions;

  console.log('[mapDBDataToRecipe] Raw instructions type:', typeof rawInstructions, 'Value:', rawInstructions);

  if (Array.isArray(rawInstructions)) {
    if (rawInstructions.every(item => typeof item === 'string')) {
        parsedInstructions = rawInstructions.map(s => s.trim()).filter(s => s.length > 0);
        console.log('[mapDBDataToRecipe] Parsed as direct Array.');
    } else {
        console.warn('[mapDBDataToRecipe] Raw data is array but contains non-string items:', rawInstructions);
        // Intentar convertir a string si es posible, o filtrar no-strings
        parsedInstructions = rawInstructions
            .map(item => String(item).trim())
            .filter(s => s.length > 0);
    }
  } else if (typeof rawInstructions === 'string') {
    const trimmedInstructions = rawInstructions.trim();
    let parseSuccess = false;

    // Intentar parsear como JSON (primero como array, luego el formato doble escapado)
    if (trimmedInstructions.startsWith('[') && trimmedInstructions.endsWith(']')) {
      try {
        const potentiallyParsed = JSON.parse(trimmedInstructions);
        if (Array.isArray(potentiallyParsed) && potentiallyParsed.every(item => typeof item === 'string')) {
            parsedInstructions = potentiallyParsed.map(s => s.trim()).filter(s => s.length > 0);
            parseSuccess = true;
            console.log('[mapDBDataToRecipe] Parsed as JSON Array string.');
        }
      } catch (e) { /* Ignorar error de parseo, intentará otros métodos */ }
    } 
    
    if (!parseSuccess && trimmedInstructions.startsWith('{"[') && trimmedInstructions.endsWith(']"}')) {
         try {
            const jsonString = trimmedInstructions.slice(1, -1);
            const potentiallyParsed = JSON.parse(jsonString);
             if (Array.isArray(potentiallyParsed) && potentiallyParsed.every(item => typeof item === 'string')) {
                parsedInstructions = potentiallyParsed.map(s => s.trim()).filter(s => s.length > 0);
                parseSuccess = true;
                 console.log('[mapDBDataToRecipe] Parsed as double-escaped JSON Array string.');
             }
         } catch (e) { /* Ignorar error de parseo, intentará otros métodos */ }
    }

    // 3. Si no se pudo parsear como JSON, tratar como texto simple con saltos de línea
    if (!parseSuccess) {
      parsedInstructions = instructionsToArray(trimmedInstructions);
      console.log('[mapDBDataToRecipe] Parsed as simple string with newlines.');
    }
  } else if (typeof rawInstructions === 'object' && rawInstructions !== null) {
    console.warn('[mapDBDataToRecipe] Instructions are an object:', rawInstructions);
    // Acceso seguro y aserción de tipo para linter
    if ('steps' in rawInstructions && Array.isArray((rawInstructions as any).steps)) {
        const stepsArray = (rawInstructions as { steps: any[] }).steps;
        if (stepsArray.every((s: any) => typeof s === 'string')) {
            parsedInstructions = stepsArray.map((s: string) => s.trim()).filter((s: string) => s.length > 0);
            console.log(`[mapDBDataToRecipe] Extracted instructions from object property 'steps'.`);
        } else {
            console.warn(`[mapDBDataToRecipe] Object property 'steps' contains non-string elements.`);
            parsedInstructions = stepsArray.map((item: any) => String(item).trim()).filter((s: string) => s.length > 0);
        }
    } else {
      console.warn(`[mapDBDataToRecipe] Could not find a valid 'steps' array property in the object. Using empty array.`);
    }
  } else {
    console.log('[mapDBDataToRecipe] Instructions are null, undefined, or unexpected type. Using empty array.');
  }

  // Validación final (más robusta)
  if (!Array.isArray(parsedInstructions)) {
    console.error('[mapDBDataToRecipe] CRITICAL: parsedInstructions is NOT an array after all parsing attempts! Type:', typeof parsedInstructions, 'Value:', parsedInstructions, 'Falling back to empty array.');
    parsedInstructions = [];
  } else if (!parsedInstructions.every(item => typeof item === 'string')) {
     console.warn('[mapDBDataToRecipe] WARNING: parsedInstructions array contains non-string elements:', parsedInstructions, 'Attempting to convert all to strings.');
     parsedInstructions = parsedInstructions.map(item => String(item).trim()).filter(s => s.length > 0);
  }

  return {
    ...dbData,
    recipe_ingredients: dbData.recipe_ingredients || [],
    instructions: parsedInstructions, // Ahora debería ser siempre un array de strings válido
    nutritional_info: dbData.nutritional_info || null,
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

  // Generar clave de caché
  const cacheKey = generateCacheKey(userId, filters, page, limit);
  
  // Verificar si tenemos datos en caché válidos
  if (recipeCache[cacheKey] && isCacheValid(recipeCache[cacheKey])) {
    console.log("[recipeService] Usando datos en caché para", cacheKey);
    const { data, hasMore } = recipeCache[cacheKey];
    return { data, hasMore };
  }
  
  console.log("[recipeService] Cargando recetas desde la base de datos");

  // Optimización: Consulta separada para recetas personales (siempre mostradas)
  let query = supabase
    .from('recipes')
    .select(`
      id, user_id, title, description, image_url, prep_time_minutes, cook_time_minutes,
      servings, is_favorite, instructions, created_at, main_ingredients, is_public,
      recipe_ingredients ( id, recipe_id, ingredient_name, quantity, unit, ingredient_id )
    `);

  // Aplicar filtros básicos
  if (filters.showOnlyFavorites) {
    // Si sólo queremos favoritos, filtramos sólo por usuario (no mostramos públicas)
    query = query.eq('user_id', userId).eq('is_favorite', true);
  } else if (filters.showOnlyPublic) {
    // Si sólo queremos públicas, filtramos por is_public = true
    query = query.eq('is_public', true);
  } else {
    // Si no, mostramos recetas del usuario + recetas públicas
    query = query.or(`user_id.eq.${userId},is_public.eq.true`);
  }

  // Aplicar filtro de recetas rápidas (menos de 30 min total)
  if (filters.quickRecipes) {
    query = query.or('prep_time_minutes.lt.30,cook_time_minutes.lt.30');
    // También podríamos hacer un filtro más sofisticado con la suma de tiempos, 
    // pero requeriría una función o vista SQL personalizada
  }

  // Aplicar filtros adicionales
  if (filters.searchTerm) {
    query = query.ilike('title', `%${filters.searchTerm}%`);
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
  
  // Guardar en caché
  recipeCache[cacheKey] = {
    key: cacheKey,
    data: recipes,
    timestamp: Date.now(),
    hasMore: recipes.length === limit
  };
  
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
  const recipeDataForDB = {
    user_id: recipeInput.user_id,
    title: recipeInput.title,
    description: recipeInput.description,
    instructions: instructionsToString(recipeInput.instructions),
    prep_time_minutes: recipeInput.prep_time_minutes,
    cook_time_minutes: recipeInput.cook_time_minutes,
    servings: recipeInput.servings,
    is_generated_base: recipeInput.isBaseRecipe || false,
    is_favorite: false,
    is_public: recipeInput.is_public ?? false,
    tags: recipeInput.tags || [],
    main_ingredients: recipeInput.mainIngredients || [],
    image_url: recipeInput.image_url,
    nutritional_info: recipeInput.nutritional_info || null,
  };

  console.log('[recipeService] Entrando a createRecipe', recipeDataForDB);

  // Insertar la receta principal
  const { data: newRecipe, error: recipeError } = await supabase
    .from('recipes')
    .insert([recipeDataForDB])
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

    // Log del usuario autenticado antes del insert de ingredientes
    const { data: userData, error: userError } = await supabase.auth.getUser();
    console.log('[recipeService] Usuario actual antes de insertar ingredientes:', userData, userError);

    // Log extra: muestra el JWT para verificar el rol en jwt.io
    const session = await supabase.auth.getSession();
    console.log('[recipeService] COPIA ESTE JWT y pégalo en https://jwt.io para ver el claim "role":', session.data?.session?.access_token);

    // Log de los datos que se intentan insertar
    console.log('[recipeService] Datos que se intentan insertar en recipe_ingredients:', ingredientsToInsert);

    const { error: ingredientsError } = await supabase
      .from('recipe_ingredients')
      .insert(ingredientsToInsert);

    // Log del error completo de Supabase
    if (ingredientsError) {
      console.error('[recipeService] ERROR al insertar ingredientes en recipe_ingredients:', ingredientsError);
    }

    if (ingredientsError) throw ingredientsError;
  }

  // Invalidar caché después de crear una receta
  invalidateRecipeCache();

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

  // Invalidar caché después de actualizar una receta
  invalidateRecipeCache(recipeId);

  return mapDBDataToRecipe(updatedRecipe);
};

export const deleteRecipe = async (recipeId: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  try {
    console.log(`[recipeService] Intentando eliminar receta ${recipeId} para usuario ${user.id} usando RPC`);
    
    const { error } = await supabase.rpc(
      'delete_recipe_with_ingredients',
      { recipe_id_param: recipeId }
    );

    // La función SQL ahora termina silenciosamente si no encuentra la receta (NOT FOUND)
    // por lo que solo necesitamos manejar el error P0001 (Permiso Denegado)
    if (error) {
      console.error('[recipeService] Error al llamar a la función RPC delete_recipe_with_ingredients:', error);
      if (error.code === 'P0001') {
        throw new Error('No tienes permiso para eliminar esta receta.');
      }
      // Lanzar cualquier otro error inesperado de la RPC
      throw new Error(`Error inesperado de RPC: ${error.message || 'Detalles no disponibles'}`); 
    }
    
    console.log(`[recipeService] Llamada RPC para eliminar ${recipeId} completada (puede haber terminado silenciosamente si no se encontró)`);
    
  } catch (error) {
    console.error('[recipeService] Error en proceso de eliminación vía RPC:', error);
    if (error instanceof Error) {
        throw error; // Re-lanzar para el store/componente
    } else {
        throw new Error('Ocurrió un error desconocido durante la eliminación.');
    }
  } finally {
    // Invalidar caché siempre, incluso si falló o no se encontró
    console.log(`[recipeService] Invalidando caché para ${recipeId}`);
    invalidateRecipeCache(recipeId);
  }
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

  // Invalidar caché después de cambiar estado de favorito
  invalidateRecipeCache(recipeId);

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

  // Invalidar caché después de cambiar estado de público
  // Importante: Este cambio afecta a lo que otros usuarios pueden ver
  invalidateRecipeCache();

  return mapDBDataToRecipe(data);
};

// Función para invalidar caché (útil cuando se modifica una receta)
export const invalidateRecipeCache = (recipeId?: string): void => {
  if (recipeId) {
    // Invalidar solo entradas de caché que podrían contener esta receta
    Object.keys(recipeCache).forEach(key => {
      // Si tenemos el ID específico, podríamos verificar si está en la caché
      const cacheEntry = recipeCache[key];
      const hasRecipe = cacheEntry.data.some(recipe => recipe.id === recipeId);
      if (hasRecipe) {
        delete recipeCache[key];
      }
    });
  } else {
    // Invalidar toda la caché
    Object.keys(recipeCache).forEach(key => {
      delete recipeCache[key];
    });
  }
};
