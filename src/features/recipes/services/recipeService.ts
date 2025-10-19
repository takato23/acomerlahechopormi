import { supabase } from '@/lib/supabaseClient';
import type {
  Recipe,
  RecipeIngredient,
  RecipeInstructions,
  RecipeFilters,
} from '@/types/recipeTypes';
import { findOrCreateIngredient } from '@/features/ingredients/ingredientService';
import { normalizeQuantity, normalizeUnit, parseIntegerOrNull } from '@/utils/units';

// Tipo de entrada para añadir/actualizar recetas
export type RecipeInputData = Omit<
  Recipe,
  'id' | 'created_at' | 'recipe_ingredients' | 'instructions'
> & {
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
const generateCacheKey = (
  userId: string,
  filters: RecipeFilters,
  page: number,
  limit: number,
): string => {
  return `${userId}_${JSON.stringify(filters)}_${page}_${limit}`;
};

// Utilidad para verificar si la caché es válida
const isCacheValid = (cacheEntry: RecipeCache): boolean => {
  return Date.now() - cacheEntry.timestamp < CACHE_EXPIRY_MS;
};

// Funciones auxiliares para conversión de instrucciones
const instructionsToString = (
  instructions: RecipeInstructions | string | null | undefined,
): string => {
  if (Array.isArray(instructions)) {
    return instructions.filter((inst) => inst && inst.trim() !== '').join('\n');
  }
  if (typeof instructions === 'string') {
    return instructions.trim();
  }
  return '';
};

const instructionsToArray = (text: string | null): RecipeInstructions => {
  if (!text) return [];
  return text.split('\n').filter((line) => line && line.trim() !== '');
};

function mapDBDataToRecipe(dbData: any): Recipe {
  const { main_ingredients, mainIngredients, ...rest } = dbData;
  let parsedInstructions: RecipeInstructions = [];
  const rawInstructions = dbData.instructions;

  console.log(
    '[mapDBDataToRecipe] Raw instructions type:',
    typeof rawInstructions,
    'Value:',
    rawInstructions,
  );

  if (Array.isArray(rawInstructions)) {
    if (rawInstructions.every((item) => typeof item === 'string')) {
      parsedInstructions = rawInstructions.map((s) => s.trim()).filter((s) => s.length > 0);
      console.log('[mapDBDataToRecipe] Parsed as direct Array.');
    } else {
      console.warn(
        '[mapDBDataToRecipe] Raw data is array but contains non-string items:',
        rawInstructions,
      );
      // Intentar convertir a string si es posible, o filtrar no-strings
      parsedInstructions = rawInstructions
        .map((item) => String(item).trim())
        .filter((s) => s.length > 0);
    }
  } else if (typeof rawInstructions === 'string') {
    const trimmedInstructions = rawInstructions.trim();
    let parseSuccess = false;

    // Intentar parsear como JSON (primero como array, luego el formato doble escapado)
    if (trimmedInstructions.startsWith('[') && trimmedInstructions.endsWith(']')) {
      try {
        const potentiallyParsed = JSON.parse(trimmedInstructions);
        if (
          Array.isArray(potentiallyParsed) &&
          potentiallyParsed.every((item) => typeof item === 'string')
        ) {
          parsedInstructions = potentiallyParsed.map((s) => s.trim()).filter((s) => s.length > 0);
          parseSuccess = true;
          console.log('[mapDBDataToRecipe] Parsed as JSON Array string.');
        }
      } catch (e) {
        /* Ignorar error de parseo, intentará otros métodos */
      }
    }

    if (
      !parseSuccess &&
      trimmedInstructions.startsWith('{"[') &&
      trimmedInstructions.endsWith(']"}')
    ) {
      try {
        const jsonString = trimmedInstructions.slice(1, -1);
        const potentiallyParsed = JSON.parse(jsonString);
        if (
          Array.isArray(potentiallyParsed) &&
          potentiallyParsed.every((item) => typeof item === 'string')
        ) {
          parsedInstructions = potentiallyParsed.map((s) => s.trim()).filter((s) => s.length > 0);
          parseSuccess = true;
          console.log('[mapDBDataToRecipe] Parsed as double-escaped JSON Array string.');
        }
      } catch (e) {
        /* Ignorar error de parseo, intentará otros métodos */
      }
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
        parsedInstructions = stepsArray
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 0);
        console.log(`[mapDBDataToRecipe] Extracted instructions from object property 'steps'.`);
      } else {
        console.warn(`[mapDBDataToRecipe] Object property 'steps' contains non-string elements.`);
        parsedInstructions = stepsArray
          .map((item: any) => String(item).trim())
          .filter((s: string) => s.length > 0);
      }
    } else {
      console.warn(
        `[mapDBDataToRecipe] Could not find a valid 'steps' array property in the object. Using empty array.`,
      );
    }
  } else {
    console.log(
      '[mapDBDataToRecipe] Instructions are null, undefined, or unexpected type. Using empty array.',
    );
  }

  // Validación final (más robusta)
  if (!Array.isArray(parsedInstructions)) {
    console.error(
      '[mapDBDataToRecipe] CRITICAL: parsedInstructions is NOT an array after all parsing attempts! Type:',
      typeof parsedInstructions,
      'Value:',
      parsedInstructions,
      'Falling back to empty array.',
    );
    parsedInstructions = [];
  } else if (!parsedInstructions.every((item) => typeof item === 'string')) {
    console.warn(
      '[mapDBDataToRecipe] WARNING: parsedInstructions array contains non-string elements:',
      parsedInstructions,
      'Attempting to convert all to strings.',
    );
    parsedInstructions = parsedInstructions
      .map((item) => String(item).trim())
      .filter((s) => s.length > 0);
  }

  return {
    ...rest,
    recipe_ingredients: dbData.recipe_ingredients || [],
    instructions: parsedInstructions,
    nutritional_info: dbData.nutritional_info || null,
    mainIngredients: Array.isArray(mainIngredients)
      ? mainIngredients
      : Array.isArray(main_ingredients)
        ? main_ingredients
        : [],
    is_archived: dbData.is_archived ?? false,
    archived_at: dbData.archived_at ?? null,
  } as Recipe;
}

type PersistenceIngredient = {
  ingredient_id: string;
  ingredient_name: string;
  quantity: number | null;
  unit: string | null;
};

const normalizeIngredientsForPersistence = async (
  ingredients: RecipeInputData['ingredients'],
): Promise<PersistenceIngredient[]> => {
  return Promise.all(
    ingredients
      .filter((ing) => ing.name && ing.name.trim().length > 0)
      .map(async (ing) => {
        const normalizedQuantity = normalizeQuantity(ing.quantity);
        const ingredientRecord = await findOrCreateIngredient(ing.name, normalizedQuantity ?? 1);
        return {
          ingredient_id: ingredientRecord.id,
          ingredient_name: ingredientRecord.name ?? ing.name.trim(),
          quantity: normalizedQuantity,
          unit: normalizeUnit(ing.unit),
        } satisfies PersistenceIngredient;
      }),
  );
};

const buildRecipePayload = (recipeInput: RecipeInputData) => {
  const instructionsArray = Array.isArray(recipeInput.instructions)
    ? recipeInput.instructions
    : instructionsToArray(
        typeof recipeInput.instructions === 'string' ? recipeInput.instructions : null,
      );

  return {
    title: recipeInput.title,
    description: recipeInput.description ?? null,
    instructions: instructionsArray,
    prep_time_minutes: parseIntegerOrNull(recipeInput.prep_time_minutes),
    cook_time_minutes: parseIntegerOrNull(recipeInput.cook_time_minutes),
    servings: parseIntegerOrNull(recipeInput.servings),
    image_url: recipeInput.image_url ?? null,
    tags: recipeInput.tags ?? [],
    main_ingredients: recipeInput.mainIngredients ?? [],
    is_generated_base: recipeInput.isBaseRecipe ?? false,
    is_public: recipeInput.is_public ?? false,
    nutritional_info: recipeInput.nutritional_info ?? null,
    is_archived: recipeInput.is_archived ?? false,
  };
};

const parseRpcRecipe = (rpcData: any): Recipe | null => {
  if (!rpcData) return null;
  const rawRecipe = rpcData.recipe ?? rpcData;
  if (rawRecipe && rawRecipe.id) {
    return mapDBDataToRecipe({
      ...rawRecipe,
      recipe_ingredients: rawRecipe.recipe_ingredients ?? [],
    });
  }
  return null;
};

const createRecipeWithRpc = async (recipeInput: RecipeInputData): Promise<Recipe> => {
  const recipePayload = buildRecipePayload(recipeInput);
  const ingredientsPayload = await normalizeIngredientsForPersistence(recipeInput.ingredients);

  const { data, error } = await supabase.rpc('create_recipe_with_ingredients', {
    recipe_payload: { ...recipePayload, user_id: recipeInput.user_id },
    ingredients_payload: ingredientsPayload,
  });

  if (error) {
    throw error;
  }

  const recipeFromRpc = parseRpcRecipe(data);
  if (recipeFromRpc) {
    return recipeFromRpc;
  }

  const createdId = data?.id ?? data?.recipe_id ?? data?.recipe?.id;
  if (!createdId) {
    throw new Error('La transacción no devolvió el identificador de la receta creada.');
  }

  const createdRecipe = await getRecipeById(createdId);
  if (!createdRecipe) {
    throw new Error('No se pudo recuperar la receta creada tras la transacción.');
  }

  return createdRecipe;
};

const createRecipeLegacy = async (recipeInput: RecipeInputData): Promise<Recipe> => {
  const recipePayload = buildRecipePayload(recipeInput);

  const { data: newRecipe, error: recipeError } = await supabase
    .from('recipes')
    .insert([
      {
        user_id: recipeInput.user_id,
        title: recipePayload.title,
        description: recipePayload.description,
        instructions: instructionsToString(recipePayload.instructions),
        prep_time_minutes: recipePayload.prep_time_minutes,
        cook_time_minutes: recipePayload.cook_time_minutes,
        servings: recipePayload.servings,
        image_url: recipePayload.image_url,
        tags: recipePayload.tags,
        main_ingredients: recipePayload.main_ingredients,
        is_generated_base: recipePayload.is_generated_base,
        is_public: recipePayload.is_public,
        nutritional_info: recipePayload.nutritional_info,
        is_archived: recipePayload.is_archived,
      },
    ])
    .select('id')
    .single();

  if (recipeError) throw recipeError;
  if (!newRecipe) throw new Error('No se pudo crear la receta');

  if (recipeInput.ingredients?.length) {
    const ingredientsToInsert = await normalizeIngredientsForPersistence(recipeInput.ingredients);
    const { error: ingredientsError } = await supabase.from('recipe_ingredients').insert(
      ingredientsToInsert.map((ing) => ({
        ...ing,
        recipe_id: newRecipe.id,
      })),
    );

    if (ingredientsError) throw ingredientsError;
  }

  const createdRecipe = await getRecipeById(newRecipe.id);
  if (!createdRecipe) {
    throw new Error('No se pudo cargar la receta creada.');
  }

  return createdRecipe;
};

const updateRecipeWithRpc = async (
  recipeId: string,
  recipeInput: Partial<RecipeInputData>,
): Promise<Recipe> => {
  const recipePayload = buildUpdatePayload(recipeInput);
  const ingredientsPayload = recipeInput.ingredients
    ? await normalizeIngredientsForPersistence(recipeInput.ingredients)
    : undefined;

  const { data, error } = await supabase.rpc('update_recipe_with_ingredients', {
    recipe_id: recipeId,
    recipe_payload: recipePayload,
    ingredients_payload: ingredientsPayload,
  });

  if (error) {
    throw error;
  }

  const updatedRecipe = parseRpcRecipe(data);
  if (updatedRecipe) {
    return updatedRecipe;
  }

  const fetched = await getRecipeById(recipeId);
  if (!fetched) {
    throw new Error('No se pudo recuperar la receta actualizada.');
  }

  return fetched;
};

const updateRecipeLegacy = async (
  recipeId: string,
  recipeInput: Partial<RecipeInputData>,
): Promise<Recipe> => {
  const recipePayload = buildUpdatePayload(recipeInput);

  const { data: updatedRecipe, error: recipeError } = await supabase
    .from('recipes')
    .update({
      ...recipePayload,
      instructions:
        recipePayload.instructions !== undefined
          ? instructionsToString(recipePayload.instructions)
          : undefined,
      updated_at: new Date().toISOString(),
    })
    .eq('id', recipeId)
    .select('id')
    .single();

  if (recipeError) throw recipeError;
  if (!updatedRecipe) throw new Error('Receta no encontrada o sin permisos.');

  if (recipeInput.ingredients) {
    await supabase.from('recipe_ingredients').delete().eq('recipe_id', recipeId);

    if (recipeInput.ingredients.length > 0) {
      const ingredientsToInsert = await normalizeIngredientsForPersistence(recipeInput.ingredients);
      const { error: ingredientsError } = await supabase.from('recipe_ingredients').insert(
        ingredientsToInsert.map((ing) => ({
          ...ing,
          recipe_id: recipeId,
        })),
      );

      if (ingredientsError) throw ingredientsError;
    }
  }

  const fetched = await getRecipeById(recipeId);
  if (!fetched) {
    throw new Error('No se pudo recuperar la receta actualizada.');
  }

  return fetched;
};

const buildUpdatePayload = (recipeInput: Partial<RecipeInputData>) => {
  const payload: Record<string, any> = {};
  if (recipeInput.title !== undefined) payload.title = recipeInput.title;
  if (recipeInput.description !== undefined) payload.description = recipeInput.description ?? null;
  if (recipeInput.instructions !== undefined) {
    payload.instructions = Array.isArray(recipeInput.instructions)
      ? recipeInput.instructions
      : instructionsToArray(
          typeof recipeInput.instructions === 'string' ? recipeInput.instructions : null,
        );
  }
  if (recipeInput.prep_time_minutes !== undefined) {
    payload.prep_time_minutes = parseIntegerOrNull(recipeInput.prep_time_minutes);
  }
  if (recipeInput.cook_time_minutes !== undefined) {
    payload.cook_time_minutes = parseIntegerOrNull(recipeInput.cook_time_minutes);
  }
  if (recipeInput.servings !== undefined) {
    payload.servings = parseIntegerOrNull(recipeInput.servings);
  }
  if (recipeInput.image_url !== undefined) {
    payload.image_url = recipeInput.image_url ?? null;
  }
  if (recipeInput.tags !== undefined) {
    payload.tags = recipeInput.tags ?? [];
  }
  if (recipeInput.mainIngredients !== undefined) {
    payload.main_ingredients = recipeInput.mainIngredients ?? [];
  }
  if (recipeInput.isBaseRecipe !== undefined) {
    payload.is_generated_base = recipeInput.isBaseRecipe ?? false;
  }
  if (recipeInput.is_public !== undefined) {
    payload.is_public = recipeInput.is_public ?? false;
  }
  if (recipeInput.nutritional_info !== undefined) {
    payload.nutritional_info = recipeInput.nutritional_info ?? null;
  }
  if (recipeInput.is_archived !== undefined) {
    payload.is_archived = recipeInput.is_archived ?? false;
  }
  return payload;
};

export const getRecipes = async ({
  userId,
  filters = {},
  page = 1,
  limit = 12,
}: GetRecipesParams): Promise<GetRecipesResult> => {
  if (!userId) {
    console.error('User ID es necesario para obtener recetas.');
    return { data: [], hasMore: false };
  }

  // Generar clave de caché
  const cacheKey = generateCacheKey(userId, filters, page, limit);

  // Verificar si tenemos datos en caché válidos
  if (recipeCache[cacheKey] && isCacheValid(recipeCache[cacheKey])) {
    console.log('[recipeService] Usando datos en caché para', cacheKey);
    const { data, hasMore } = recipeCache[cacheKey];
    return { data, hasMore };
  }

  console.log('[recipeService] Cargando recetas desde la base de datos');

  // Optimización: Consulta separada para recetas personales (siempre mostradas)
  let query = supabase.from('recipes').select(`
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
  query = query.order('created_at', { ascending: false }).range(from, to);

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
    hasMore: recipes.length === limit,
  };

  return { data: recipes, hasMore: recipes.length === limit };
};

export const getRecipeById = async (recipeId: string): Promise<Recipe | null> => {
  if (!recipeId) throw new Error('Se requiere ID de receta para obtener detalles.');

  const { data, error } = await supabase
    .from('recipes')
    .select(
      `
      *, 
      recipe_ingredients(*)
    `,
    )
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
  if (!recipeInput.title || !recipeInput.user_id) {
    throw new Error('El título y user_id son obligatorios.');
  }

  try {
    const recipe = await createRecipeWithRpc(recipeInput);
    invalidateRecipeCache();
    return recipe;
  } catch (rpcError) {
    console.warn(
      '[recipeService] create_recipe_with_ingredients RPC falló, usando lógica legacy.',
      rpcError,
    );
    const recipe = await createRecipeLegacy(recipeInput);
    invalidateRecipeCache();
    return recipe;
  }
};

// Alias para mantener compatibilidad
export const addRecipe = createRecipe;

export const updateRecipe = async (
  recipeId: string,
  recipeInput: Partial<RecipeInputData>,
): Promise<Recipe> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  try {
    const recipe = await updateRecipeWithRpc(recipeId, recipeInput);
    invalidateRecipeCache(recipeId);
    return recipe;
  } catch (rpcError) {
    console.warn(
      '[recipeService] update_recipe_with_ingredients RPC falló, usando lógica legacy.',
      rpcError,
    );
    const recipe = await updateRecipeLegacy(recipeId, recipeInput);
    invalidateRecipeCache(recipeId);
    return recipe;
  }
};

export const archiveRecipe = async (recipeId: string, archive: boolean): Promise<Recipe> => {
  const updatePayload: Record<string, any> = {
    is_archived: archive,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('recipes')
    .update(updatePayload)
    .eq('id', recipeId)
    .select('*, recipe_ingredients(*)')
    .single();

  if (error) {
    throw error;
  }

  invalidateRecipeCache(recipeId);
  return mapDBDataToRecipe(data);
};

export const duplicateRecipe = async (
  recipeId: string,
  overrides: Partial<RecipeInputData> = {},
): Promise<Recipe> => {
  const original = await getRecipeById(recipeId);
  if (!original) {
    throw new Error('Receta original no encontrada.');
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Usuario no autenticado');
  }

  const overrideIngredients = overrides.ingredients?.map((ing) => ({
    name: 'name' in ing ? ing.name : (ing as any).ingredient_name,
    quantity: 'quantity' in ing ? (ing.quantity ?? null) : null,
    unit: 'unit' in ing ? (ing.unit ?? null) : null,
  }));

  const duplicatedInput: RecipeInputData = {
    user_id: user.id,
    title: overrides.title ?? `${original.title} (Copia)`,
    description: overrides.description ?? original.description ?? null,
    instructions: overrides.instructions ?? original.instructions,
    prep_time_minutes: overrides.prep_time_minutes ?? original.prep_time_minutes ?? null,
    cook_time_minutes: overrides.cook_time_minutes ?? original.cook_time_minutes ?? null,
    servings: overrides.servings ?? original.servings ?? null,
    image_url: overrides.image_url ?? original.image_url ?? null,
    tags: overrides.tags ?? original.tags ?? [],
    mainIngredients: overrides.mainIngredients ?? original.mainIngredients ?? [],
    nutritional_info: overrides.nutritional_info ?? original.nutritional_info ?? null,
    is_public: overrides.is_public ?? original.is_public ?? false,
    isBaseRecipe: overrides.isBaseRecipe ?? false,
    is_archived: false,
    ingredients:
      overrideIngredients ??
      original.recipe_ingredients.map((ing) => ({
        name: ing.ingredient_name,
        quantity: ing.quantity ?? null,
        unit: ing.unit ?? null,
      })),
  };

  return createRecipe(duplicatedInput);
};

export const deleteRecipe = async (recipeId: string): Promise<void> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  try {
    console.log(
      `[recipeService] Intentando eliminar receta ${recipeId} para usuario ${user.id} usando RPC`,
    );

    const { error } = await supabase.rpc('delete_recipe_with_ingredients', {
      recipe_id_param: recipeId,
    });

    // La función SQL ahora termina silenciosamente si no encuentra la receta (NOT FOUND)
    // por lo que solo necesitamos manejar el error P0001 (Permiso Denegado)
    if (error) {
      console.error(
        '[recipeService] Error al llamar a la función RPC delete_recipe_with_ingredients:',
        error,
      );
      if (error.code === 'P0001') {
        throw new Error('No tienes permiso para eliminar esta receta.');
      }
      // Lanzar cualquier otro error inesperado de la RPC
      throw new Error(`Error inesperado de RPC: ${error.message || 'Detalles no disponibles'}`);
    }

    console.log(
      `[recipeService] Llamada RPC para eliminar ${recipeId} completada (puede haber terminado silenciosamente si no se encontró)`,
    );
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

export const toggleRecipeFavorite = async (
  recipeId: string,
  isFavorite: boolean,
): Promise<Recipe> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
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
  const {
    data: { user },
  } = await supabase.auth.getUser();
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
    Object.keys(recipeCache).forEach((key) => {
      // Si tenemos el ID específico, podríamos verificar si está en la caché
      const cacheEntry = recipeCache[key];
      const hasRecipe = cacheEntry.data.some((recipe) => recipe.id === recipeId);
      if (hasRecipe) {
        delete recipeCache[key];
      }
    });
  } else {
    // Invalidar toda la caché
    Object.keys(recipeCache).forEach((key) => {
      delete recipeCache[key];
    });
  }
};
