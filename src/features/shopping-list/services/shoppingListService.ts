import { supabase } from '@/lib/supabaseClient';
import { ShoppingListItem } from '@/types/shoppingListTypes';
import { Recipe } from '@/types/recipeTypes';
import { normalizeUnit, normalizeIngredientName } from '@/lib/ingredientUtils';
import { getPlannedMeals } from '@/features/planning/planningService';
import type { PlannedMeal } from '@/features/planning/types';
import { getCategoryForItem, mapLabelToCategoryKey } from '../utils/categorization';
import type { Database } from '@/lib/database.types';

type ShoppingListInsert = Database['public']['Tables']['shopping_list_items']['Insert'];

type AggregatedRequirement = {
  key: string;
  ingredientId: string | null;
  ingredientName: string;
  nameKey: string;
  totalQuantity: number | null;
  unit: string | null;
  recipeTitles: Set<string>;
  category: string | null;
};

type PantryStockEntry = {
  key: string;
  nameKey: string;
  quantity: number | null;
  unit: string | null;
  category: string | null;
};

const UNIT_CONVERSIONS: Record<string, Record<string, number>> = {
  kg: { g: 1000 },
  g: { kg: 0.001 },
  l: { ml: 1000 },
  ml: { l: 0.001 },
};

const buildNameKey = (name: string | null | undefined): string => {
  if (!name) return '';
  return normalizeIngredientName(name).toLowerCase();
};

const buildIngredientKey = (ingredientId: string | null | undefined, nameKey: string): string => {
  return ingredientId ? `id:${ingredientId}` : `name:${nameKey}`;
};

const tryConvertQuantity = (
  amount: number | null | undefined,
  fromUnit: string | null | undefined,
  toUnit: string | null | undefined,
): number | null => {
  if (amount === null || amount === undefined) return null;
  if (!fromUnit || !toUnit) return amount;

  const normalizedFrom = normalizeUnit(fromUnit);
  const normalizedTo = normalizeUnit(toUnit);

  if (normalizedFrom === normalizedTo) {
    return amount;
  }

  if (normalizedFrom === 'un' || normalizedTo === 'un') {
    return amount;
  }

  const conversion = UNIT_CONVERSIONS[normalizedFrom]?.[normalizedTo];
  if (conversion !== undefined) {
    return amount * conversion;
  }

  const inverse = UNIT_CONVERSIONS[normalizedTo]?.[normalizedFrom];
  if (inverse !== undefined) {
    return amount / inverse;
  }

  return null;
};

const formatMissingQuantity = (quantity: number | null): number | null => {
  if (quantity === null) return null;
  const rounded = Number(quantity.toFixed(3));
  return rounded <= 0 ? 0 : rounded;
};

const aggregateRecipeIngredients = (
  plannedMeals: PlannedMeal[],
  ingredients: Array<{
    recipe_id: string;
    ingredient_id: string | null;
    ingredient_name: string | null;
    quantity: number | null;
    unit: string | null;
  }>,
): Map<string, AggregatedRequirement> => {
  const recipeTitleMap = new Map<string, string>();
  plannedMeals.forEach((meal) => {
    if (meal.recipe_id) {
      const title = meal.recipes?.title || meal.custom_meal_name || 'Receta sin título';
      recipeTitleMap.set(meal.recipe_id, title);
    }
  });

  const aggregated = new Map<string, AggregatedRequirement>();

  for (const ingredient of ingredients) {
    const ingredientName = ingredient.ingredient_name?.trim();
    if (!ingredientName) continue;

    const nameKey = buildNameKey(ingredientName);
    const key = buildIngredientKey(ingredient.ingredient_id, nameKey);
    const normalizedUnit = ingredient.unit ? normalizeUnit(ingredient.unit) : null;
    const quantity = typeof ingredient.quantity === 'number' ? ingredient.quantity : null;
    const recipeTitle = ingredient.recipe_id ? recipeTitleMap.get(ingredient.recipe_id) : undefined;

    let entry = aggregated.get(key);
    if (!entry) {
      entry = {
        key,
        ingredientId: ingredient.ingredient_id,
        ingredientName,
        nameKey,
        totalQuantity: quantity,
        unit: normalizedUnit,
        recipeTitles: new Set<string>(),
        category: getCategoryForItem(ingredientName),
      };
      aggregated.set(key, entry);
    } else {
      if (entry.totalQuantity === null || quantity === null) {
        entry.totalQuantity = null;
      } else if (entry.unit && normalizedUnit && entry.unit !== normalizedUnit) {
        const converted = tryConvertQuantity(quantity, normalizedUnit, entry.unit);
        if (converted === null) {
          entry.totalQuantity = null;
        } else {
          entry.totalQuantity += converted;
        }
      } else {
        entry.totalQuantity = (entry.totalQuantity ?? 0) + quantity;
        if (!entry.unit && normalizedUnit) {
          entry.unit = normalizedUnit;
        }
      }

      if (!entry.unit && normalizedUnit) {
        entry.unit = normalizedUnit;
      }
    }

    if (recipeTitle) {
      entry.recipeTitles.add(recipeTitle);
    }
  }

  return aggregated;
};

const buildPantryStockMaps = (
  pantryItems: Array<{
    ingredient_id: string | null;
    name: string | null;
    quantity: number | null;
    unit: string | null;
    categories?: { name: string | null } | null;
  }>,
): { byKey: Map<string, PantryStockEntry>; byName: Map<string, PantryStockEntry> } => {
  const byKey = new Map<string, PantryStockEntry>();
  const byName = new Map<string, PantryStockEntry>();

  pantryItems.forEach((item) => {
    const ingredientName = item.name?.trim();
    if (!ingredientName) return;

    const nameKey = buildNameKey(ingredientName);
    const key = buildIngredientKey(item.ingredient_id, nameKey);
    const normalizedUnit = item.unit ? normalizeUnit(item.unit) : null;
    const categoryName = item.categories?.name ?? null;
    const categoryKey = categoryName ? (mapLabelToCategoryKey(categoryName) ?? categoryName) : null;

    const entry = byKey.get(key) || byName.get(nameKey);
    if (entry) {
      if (entry.quantity === null || item.quantity === null) {
        entry.quantity = null;
      } else if (entry.unit && normalizedUnit && entry.unit !== normalizedUnit) {
        const converted = tryConvertQuantity(item.quantity, normalizedUnit, entry.unit);
        if (converted === null) {
          entry.quantity = null;
        } else {
          entry.quantity += converted;
        }
      } else {
        entry.quantity = (entry.quantity ?? 0) + (item.quantity ?? 0);
        if (!entry.unit && normalizedUnit) {
          entry.unit = normalizedUnit;
        }
      }

      if (!entry.unit && normalizedUnit) {
        entry.unit = normalizedUnit;
      }

      if (!entry.category && categoryKey) {
        entry.category = categoryKey;
      }
    } else {
      const stockEntry: PantryStockEntry = {
        key,
        nameKey,
        quantity: item.quantity,
        unit: normalizedUnit,
        category: categoryKey,
      };
      byKey.set(key, stockEntry);
      byName.set(nameKey, stockEntry);
    }
  });

  return { byKey, byName };
};

export async function generateShoppingListFromPlanning(
  startDate: string,
  endDate: string,
): Promise<ShoppingListItem[]> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error('[shoppingListService] Error obteniendo usuario:', userError);
    throw new Error('Error de autenticación');
  }

  if (!user) {
    throw new Error('Usuario no autenticado');
  }

  const plannedMeals = await getPlannedMeals(startDate, endDate);
  if (plannedMeals.length === 0) {
    console.info('[shoppingListService] No hay comidas planificadas en el rango proporcionado.');
    return getShoppingListItems();
  }

  const recipeIds = Array.from(
    new Set(plannedMeals.map((meal) => meal.recipe_id).filter((id): id is string => Boolean(id))),
  );

  if (recipeIds.length === 0) {
    console.info(
      '[shoppingListService] No se encontraron recetas asociadas a las comidas planificadas.',
    );
    return getShoppingListItems();
  }

  const { data: recipeIngredients, error: ingredientsError } = await supabase
    .from('recipe_ingredients')
    .select('recipe_id, ingredient_id, ingredient_name, quantity, unit')
    .in('recipe_id', recipeIds);

  if (ingredientsError) {
    console.error(
      '[shoppingListService] Error al obtener ingredientes de recetas:',
      ingredientsError,
    );
    throw new Error('No se pudieron obtener los ingredientes de las recetas planificadas.');
  }

  if (!recipeIngredients || recipeIngredients.length === 0) {
    console.warn('[shoppingListService] Las recetas planificadas no poseen ingredientes.');
    return getShoppingListItems();
  }

  const aggregated = aggregateRecipeIngredients(plannedMeals, recipeIngredients);

  const { data: pantryItems, error: pantryError } = await supabase
    .from('pantry_items')
    .select('ingredient_id, name, quantity, unit, categories(name)')
    .eq('user_id', user.id);

  if (pantryError) {
    console.error('[shoppingListService] Error al obtener la despensa:', pantryError);
    throw new Error('No se pudieron obtener los items de la despensa.');
  }

  const { byKey: pantryByKey, byName: pantryByName } = buildPantryStockMaps(pantryItems || []);

  const missingItems = Array.from(aggregated.values())
    .map((entry) => {
      const pantryEntry = entry.ingredientId
        ? pantryByKey.get(entry.key)
        : pantryByName.get(entry.nameKey) || pantryByKey.get(entry.key);

      let availableQuantity = 0;
      if (pantryEntry && pantryEntry.quantity !== null && entry.totalQuantity !== null) {
        const converted = tryConvertQuantity(pantryEntry.quantity, pantryEntry.unit, entry.unit);
        if (converted === null) {
          availableQuantity = 0;
        } else {
          availableQuantity = converted;
        }
      }

      const requiredQuantity = entry.totalQuantity;
      const missingQuantity =
        requiredQuantity !== null
          ? formatMissingQuantity(requiredQuantity - availableQuantity)
          : null;

      const needsPurchase = missingQuantity === null || missingQuantity > 0;

      if (!needsPurchase) {
        return null;
      }

      const recipeSource =
        entry.recipeTitles.size > 0 ? Array.from(entry.recipeTitles).join(', ') : null;
      const category = entry.category || pantryEntry?.category || null;

      return {
        ingredient_name: entry.ingredientName,
        quantity: missingQuantity,
        unit: entry.unit,
        category,
        notes: recipeSource ? `Recetas: ${recipeSource}` : null,
        recipe_source: recipeSource,
      };
    })
    .filter(
      (
        item,
      ): item is {
        ingredient_name: string;
        quantity: number | null;
        unit: string | null;
        category: string | null;
        notes: string | null;
        recipe_source: string | null;
      } => Boolean(item),
    );

  const { data: existingItems, error: existingError } = await supabase
    .from('shopping_list_items')
    .select('*')
    .eq('user_id', user.id);

  if (existingError) {
    console.error('[shoppingListService] Error al obtener lista existente:', existingError);
    throw new Error('No se pudo obtener la lista de compras existente.');
  }

  const existingByName = new Map<string, ShoppingListItem>();
  (existingItems || []).forEach((item) => {
    existingByName.set(buildNameKey(item.ingredient_name), item);
  });

  const now = new Date().toISOString();
  const inserts: ShoppingListInsert[] = [];
  const updates: Array<{ id: string; values: Partial<ShoppingListItem> }> = [];

  missingItems.forEach((item) => {
    const nameKey = buildNameKey(item.ingredient_name);
    const existing = existingByName.get(nameKey);

    if (existing) {
      updates.push({
        id: existing.id,
        values: {
          quantity: item.quantity,
          unit: item.unit,
          category: item.category ?? existing.category ?? null,
          notes: item.notes ?? existing.notes ?? null,
          recipe_source: item.recipe_source ?? existing.recipe_source ?? null,
          is_checked: false,
          updated_at: now,
        },
      });
    } else {
      inserts.push({
        user_id: user.id,
        ingredient_name: item.ingredient_name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category,
        notes: item.notes,
        recipe_source: item.recipe_source,
        is_checked: false,
        created_at: now,
        updated_at: now,
      });
    }
  });

  if (updates.length > 0) {
    const updatePromises = updates.map((update) =>
      supabase
        .from('shopping_list_items')
        .update(update.values)
        .eq('id', update.id)
        .eq('user_id', user.id),
    );

    const updateResults = await Promise.all(updatePromises);
    const updateError = updateResults.find((result) => result.error);
    if (updateError && updateError.error) {
      console.error(
        '[shoppingListService] Error al actualizar ítems existentes:',
        updateError.error,
      );
      throw new Error('No se pudieron actualizar los ítems existentes de la lista de compras.');
    }
  }

  if (inserts.length > 0) {
    const { error: insertError } = await supabase.from('shopping_list_items').insert(inserts);

    if (insertError) {
      console.error('[shoppingListService] Error al insertar ítems faltantes:', insertError);
      throw new Error('No se pudieron guardar los nuevos ítems de la lista de compras.');
    }
  }

  const { data: refreshedItems, error: refreshError } = await supabase
    .from('shopping_list_items')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (refreshError) {
    console.error('[shoppingListService] Error al refrescar la lista:', refreshError);
    throw new Error('No se pudo recuperar la lista de compras actualizada.');
  }

  return refreshedItems || [];
}

export async function getShoppingListItems(): Promise<ShoppingListItem[]> {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error('[shoppingListService] Error obteniendo usuario:', userError);
      throw new Error('Error de autenticación');
    }

    if (!user) {
      console.warn('[shoppingListService] Usuario no autenticado');
      return []; // Devolver array vacío en lugar de error
    }

    const { data, error } = await supabase
      .from('shopping_list_items')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[shoppingListService] Error al obtener items:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('[shoppingListService] Error inesperado en getShoppingListItems:', error);
    return []; // Devolver array vacío en caso de error
  }
}

export async function addItemsToShoppingList(
  items: Partial<ShoppingListItem>[],
): Promise<ShoppingListItem[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  const itemsWithUserId = items.map((item) => ({
    ...item,
    user_id: user.id,
  }));

  const { data, error } = await supabase
    .from('shopping_list_items')
    .insert(itemsWithUserId)
    .select();

  if (error) throw error;
  return data || [];
}

export async function addShoppingListItem(item: ShoppingListItem): Promise<ShoppingListItem> {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error('[shoppingListService] Error obteniendo usuario:', userError);
      throw new Error('Error de autenticación');
    }

    if (!user) {
      console.error('[shoppingListService] Usuario no autenticado al añadir item');
      throw new Error('Usuario no autenticado');
    }

    console.log('[shoppingListService] Añadiendo item para usuario:', user.id);
    console.log('[shoppingListService] Datos del item:', item);

    const { data, error } = await supabase
      .from('shopping_list_items')
      .insert({ ...item, user_id: user.id })
      .select()
      .single();

    if (error) {
      console.error('[shoppingListService] Error al insertar item:', error);
      throw error;
    }

    console.log('[shoppingListService] Item añadido correctamente:', data);
    return data;
  } catch (error) {
    console.error('[shoppingListService] Error inesperado en addShoppingListItem:', error);
    throw error; // Re-lanzar el error para que el llamador pueda manejarlo
  }
}

export async function updateShoppingListItem(
  id: string,
  updates: Partial<ShoppingListItem>,
): Promise<ShoppingListItem> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  const payload = {
    ...updates,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('shopping_list_items')
    .update(payload)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error('Item no encontrado');

  return data;
}

export async function deleteShoppingListItem(id: string): Promise<void> {
  console.log(`[shoppingListService] Intentando eliminar item con ID: ${id}`);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    console.error('[shoppingListService] Usuario no autenticado al eliminar');
    throw new Error('Usuario no autenticado');
  }
  console.log(`[shoppingListService] Eliminando item ${id} para usuario ${user.id}`);

  try {
    const { error } = await supabase
      .from('shopping_list_items')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error(`[shoppingListService] Error de Supabase al eliminar item ${id}:`, error);
      throw error;
    }
    console.log(`[shoppingListService] Item ${id} eliminado exitosamente.`);
  } catch (error) {
    console.error(
      `[shoppingListService] Error inesperado en deleteShoppingListItem para ${id}:`,
      error,
    );
    throw error; // Re-lanzar para que el store lo maneje
  }
}

export async function clearPurchasedItems(): Promise<void> {
  console.log('[shoppingListService] Intentando limpiar items comprados');
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    console.error('[shoppingListService] Usuario no autenticado al limpiar comprados');
    throw new Error('Usuario no autenticado');
  }
  console.log(`[shoppingListService] Limpiando items comprados para usuario ${user.id}`);

  try {
    const { error } = await supabase
      .from('shopping_list_items')
      .delete()
      .eq('user_id', user.id)
      .eq('is_checked', true);

    if (error) {
      console.error('[shoppingListService] Error de Supabase al limpiar comprados:', error);
      throw error;
    }
    console.log('[shoppingListService] Items comprados limpiados exitosamente.');
  } catch (error) {
    console.error('[shoppingListService] Error inesperado en clearPurchasedItems:', error);
    throw error;
  }
}

export async function clearAllItems(): Promise<void> {
  console.log('[shoppingListService] Intentando limpiar TODOS los items');
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    console.error('[shoppingListService] Usuario no autenticado al limpiar todo');
    throw new Error('Usuario no autenticado');
  }
  console.log(`[shoppingListService] Limpiando TODOS los items para usuario ${user.id}`);

  try {
    const { error } = await supabase.from('shopping_list_items').delete().eq('user_id', user.id);

    if (error) {
      console.error('[shoppingListService] Error de Supabase al limpiar todo:', error);
      throw error;
    }
    console.log('[shoppingListService] TODOS los items limpiados exitosamente.');
  } catch (error) {
    console.error('[shoppingListService] Error inesperado en clearAllItems:', error);
    throw error;
  }
}

export function calculateMissingRecipeIngredients(
  recipe: Recipe,
  currentItems: ShoppingListItem[],
): Partial<ShoppingListItem>[] {
  if (!recipe.recipe_ingredients) return [];

  const requiredIngredients = recipe.recipe_ingredients.map((ri) => ({
    ingredient_name: ri.ingredient_name,
    quantity: ri.quantity || 1,
    unit: normalizeUnit(ri.unit || ''),
  }));

  const currentIngredients = currentItems.map((item) => ({
    ingredient_name: item.ingredient_name,
    quantity: item.quantity || 1,
    unit: normalizeUnit(item.unit || ''),
  }));

  const missingIngredients: Partial<ShoppingListItem>[] = [];

  for (const required of requiredIngredients) {
    const current = currentIngredients.find(
      (ci) =>
        normalizeIngredientName(ci.ingredient_name) ===
        normalizeIngredientName(required.ingredient_name),
    );

    if (!current) {
      missingIngredients.push({
        ingredient_name: required.ingredient_name,
        quantity: required.quantity,
        unit: required.unit,
        notes: `Para: ${recipe.title}`,
      });
      continue;
    }

    if (required.unit === current.unit) {
      const remainingQuantity = required.quantity - current.quantity;
      if (remainingQuantity > 0) {
        missingIngredients.push({
          ingredient_name: required.ingredient_name,
          quantity: remainingQuantity,
          unit: required.unit,
          notes: `Para: ${recipe.title}`,
        });
      }
    }
  }

  return missingIngredients;
}
