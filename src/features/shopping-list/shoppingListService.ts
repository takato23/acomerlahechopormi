import { supabase } from '@/lib/supabaseClient';
import { getPlannedMeals } from '@/features/planning/planningService';
import { getRecipeById } from '@/features/recipes/services/recipeService';
import type { PlannedMeal } from '@/features/planning/types';
import type { ShoppingListItem, RawIngredientInfo, AggregatedIngredient } from './types';
import {
  normalizeUnit,
  parseQuantity,
  convertUnits,
  isBasicPantryIngredient,
  getDefaultUnitForIngredient,
  isImpreciseUnit,
} from '@/lib/ingredientUtils';
import type { Database } from '@/lib/database.types';
import { inferCategory } from './lib/categoryInference';
import { handleError } from '@/lib/errorHandler';
import { debugLogger } from '@/lib/utils';

const log = debugLogger('[shoppingListService]');

const SHOPPING_LIST_TABLE = 'shopping_list_items';
const PANTRY_TABLE = 'pantry_items';

type DBShoppingListRow = Database['public']['Tables']['shopping_list_items']['Row'];
type DBShoppingListInsert = Database['public']['Tables']['shopping_list_items']['Insert'];
type DBShoppingListUpdate = Database['public']['Tables']['shopping_list_items']['Update'];

type PantryRow = Pick<Database['public']['Tables']['pantry_items']['Row'], 'quantity' | 'unit'> & {
  ingredients:
    | Database['public']['Tables']['ingredients']['Row']
    | Database['public']['Tables']['ingredients']['Row'][]
    | null;
};

const resolveUnitForIngredient = (name: string, unit: string | null): string | null => {
  const normalized = normalizeUnit(unit);
  if (normalized && !isImpreciseUnit(normalized)) {
    return normalized;
  }

  const fallback = getDefaultUnitForIngredient(name);
  if (!fallback) return null;

  const normalizedFallback = normalizeUnit(fallback);
  if (!normalizedFallback || isImpreciseUnit(normalizedFallback)) {
    return null;
  }

  return normalizedFallback;
};


async function requireAuthUser() {
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();
  if (error) throw error;
  if (!user) throw new Error('Usuario no autenticado');
  return user;
}

function mapDbItemToUi(item: DBShoppingListRow): DBShoppingListRow {
  return {
    ...item,
    is_purchased: item.is_purchased ?? false,
    quantity: item.quantity ?? null,
    unit: item.unit ?? null,
    category_id: item.category_id ?? null,
    category_label: item.category_label ?? null,
    ingredient_id: item.ingredient_id ?? null,
    ingredient_name: item.ingredient_name ?? null,
    notes: item.notes ?? null
  };
}

export async function getShoppingListItems(): Promise<DBShoppingListRow[]> {
  const user = await requireAuthUser();
  const { data, error } = await supabase
    .from(SHOPPING_LIST_TABLE)
    .select('*')
    .eq('user_id', user.id)
    .order('is_purchased', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(mapDbItemToUi);
}

export interface AddShoppingListItemInput {
  name: string;
  quantity?: number | null;
  unit?: string | null;
  is_purchased?: boolean;
}

export async function addShoppingListItem(input: AddShoppingListItemInput): Promise<DBShoppingListRow | null> {
  const user = await requireAuthUser();

  const payload: DBShoppingListInsert = {
    user_id: user.id,
    name: input.name.trim(),
    quantity: input.quantity ?? null,
    unit: input.unit ?? null,
    is_purchased: input.is_purchased ?? false
  };

  const { data, error } = await supabase
    .from(SHOPPING_LIST_TABLE)
    .insert(payload)
    .select('*')
    .single();

  if (error) throw error;
  return data ? mapDbItemToUi(data) : null;
}

export async function updateShoppingListItem(
  itemId: string,
  updates: DBShoppingListUpdate
): Promise<DBShoppingListRow | null> {
  const user = await requireAuthUser();
  const payload: DBShoppingListUpdate = {
    ...updates,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from(SHOPPING_LIST_TABLE)
    .update(payload)
    .eq('id', itemId)
    .eq('user_id', user.id)
    .select('*')
    .single();

  if (error) throw error;
  return data ? mapDbItemToUi(data) : null;
}

export async function deleteShoppingListItem(itemId: string): Promise<void> {
  const user = await requireAuthUser();
  const { error } = await supabase
    .from(SHOPPING_LIST_TABLE)
    .delete()
    .eq('id', itemId)
    .eq('user_id', user.id);

  if (error) throw error;
}

export async function clearPurchasedItems(): Promise<void> {
  const user = await requireAuthUser();
  const { error } = await supabase
    .from(SHOPPING_LIST_TABLE)
    .delete()
    .eq('user_id', user.id)
    .eq('is_purchased', true);

  if (error) throw error;
}

export async function clearAllItems(): Promise<void> {
  const user = await requireAuthUser();
  const { error } = await supabase.from(SHOPPING_LIST_TABLE).delete().eq('user_id', user.id);
  if (error) throw error;
}

async function fetchRecipesForMeals(meals: PlannedMeal[]) {
  const recipeIds = [...new Set(meals.map((meal) => meal.recipe_id).filter((id): id is string => Boolean(id)))];
  const recipes = await Promise.all(recipeIds.map((id) => getRecipeById(id)));
  return recipeIds.reduce<Map<string, NonNullable<typeof recipes[number]>>>((acc, id, index) => {
    const recipe = recipes[index];
    if (recipe) {
      acc.set(id, recipe);
    }
    return acc;
  }, new Map());
}

function aggregateIngredients(rawIngredients: RawIngredientInfo[]): Map<string, AggregatedIngredient> {
  const aggregated = new Map<string, AggregatedIngredient>();

  rawIngredients.forEach((raw) => {
    const originalName = raw.name?.trim();
    if (!originalName) return;
    if (isBasicPantryIngredient(originalName)) return;

    const normalizedName = originalName.toLowerCase();
    const quantityValue = parseQuantity(raw.quantity);
    const resolvedUnit = resolveUnitForIngredient(originalName, raw.unit);
    const existing = aggregated.get(normalizedName);

    if (existing) {
      if (quantityValue !== null) {
        if (existing.totalQuantity !== null) {
          if (existing.unit && resolvedUnit && existing.unit !== resolvedUnit) {
            const converted = convertUnits(quantityValue, resolvedUnit, existing.unit);
            if (converted !== null) {
              existing.totalQuantity += converted;
            } else {
              existing.totalQuantity = null;
              existing.unit = null;
            }
          } else {
            const targetUnit = existing.unit ?? resolvedUnit;
            if (!existing.unit && targetUnit) {
              existing.unit = targetUnit;
            }
            existing.totalQuantity += quantityValue;
          }
        } else if (existing.unit && resolvedUnit && existing.unit !== resolvedUnit) {
          // Ya es null, mantener inconsistencia capturada
          existing.totalQuantity = null;
        }
      }

      if (!existing.unit && resolvedUnit) {
        existing.unit = resolvedUnit;
      }

      if (raw.recipeName && !existing.recipeSources.includes(raw.recipeName)) {
        existing.recipeSources.push(raw.recipeName);
      }
      return;
    }

    aggregated.set(normalizedName, {
      name: originalName,
      totalQuantity: quantityValue,
      unit: resolvedUnit,
      recipeSources: raw.recipeName ? [raw.recipeName] : []
    });
  });

  return aggregated;
}

async function fetchPantryStock(userId: string): Promise<Map<string, { quantity: number | null; unit: string | null }>> {
  const { data, error } = await supabase
    .from(PANTRY_TABLE)
    .select('quantity, unit, ingredients ( name )')
    .eq('user_id', userId);

  if (error) {
    handleError(error, {
      component: 'shoppingListService',
      action: 'fetchPantryStock',
      severity: 'low',
      userId
    });
    return new Map();
  }

  const stock = new Map<string, { quantity: number | null; unit: string | null }>();

  (data as PantryRow[] | null)?.forEach((item) => {
    const ingredientName = Array.isArray(item.ingredients)
      ? item.ingredients[0]?.name?.trim()
      : item.ingredients?.name?.trim();
    if (!ingredientName) return;
    if (isBasicPantryIngredient(ingredientName)) return;
    const key = ingredientName.toLowerCase();
    const normalizedUnit = resolveUnitForIngredient(ingredientName, item.unit);
    const quantity = parseQuantity(item.quantity);
    const existing = stock.get(key);

    if (existing) {
      if (existing.quantity !== null && quantity !== null) {
        if (!existing.unit || !normalizedUnit || existing.unit === normalizedUnit) {
          existing.quantity += quantity;
          if (!existing.unit && normalizedUnit) {
            existing.unit = normalizedUnit;
          }
        } else {
          const converted = convertUnits(quantity, normalizedUnit, existing.unit);
          if (converted !== null) {
            existing.quantity += converted;
          } else {
            existing.quantity = null;
            existing.unit = null;
          }
        }
      } else {
        existing.quantity = null;
      }
    } else {
      stock.set(key, { quantity, unit: normalizedUnit });
    }
  });

  return stock;
}

function computeFinalList(
  aggregated: Map<string, AggregatedIngredient>,
  pantryStock: Map<string, { quantity: number | null; unit: string | null }>
): AggregatedIngredient[] {
  const result: AggregatedIngredient[] = [];

  aggregated.forEach((item, key) => {
    const stock = pantryStock.get(key);
    let missingQuantity = item.totalQuantity;

    if (stock && missingQuantity !== null && stock.quantity !== null) {
      if (!item.unit || !stock.unit || item.unit === stock.unit || item.unit === 'unidad') {
        missingQuantity = Math.max(missingQuantity - stock.quantity, 0);
      } else {
        const converted = convertUnits(stock.quantity, stock.unit, item.unit);
        if (converted !== null) {
          missingQuantity = Math.max(missingQuantity - converted, 0);
        }
      }
    }

    if (missingQuantity === null || missingQuantity > 0) {
      result.push({
        name: item.name,
        totalQuantity: missingQuantity,
        unit: item.unit && !isImpreciseUnit(item.unit) ? item.unit : null,
        recipeSources: item.recipeSources
      });
    }
  });

  return result.sort((a, b) => a.name.localeCompare(b.name));
}

interface PersistableIngredient extends AggregatedIngredient {
  categoryId: string | null;
  categoryLabel: string | null;
}

const formatCategoryLabel = (categoryId: string): string => {
  return categoryId
    .split(/[_-\s]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
};

async function enrichWithCategories(userId: string, items: AggregatedIngredient[]): Promise<PersistableIngredient[]> {
  if (!items.length) {
    return [];
  }

  const inferred = await Promise.all(
    items.map(async (item) => {
      try {
        const categoryId = await inferCategory(item.name);
        return {
          ...item,
          categoryId,
        };
      } catch (error) {
        handleError(error, {
          component: 'shoppingListService',
          action: 'inferCategory',
          severity: 'low',
          metadata: { ingredient: item.name },
          userId,
        });
        return {
          ...item,
          categoryId: null,
        };
      }
    })
  );

  const categoryIds = Array.from(new Set(inferred.map((item) => item.categoryId).filter(Boolean))) as string[];
  const categoryLabels = new Map<string, string>();

  if (categoryIds.length) {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name')
      .in('id', categoryIds);

    if (error) {
      handleError(error, {
        component: 'shoppingListService',
        action: 'fetchCategories',
        severity: 'low',
        metadata: { categoryIds },
        userId,
      });
    } else {
      (data ?? []).forEach((category) => {
        if (category?.id) {
          categoryLabels.set(category.id, category.name ?? formatCategoryLabel(category.id));
        }
      });
    }
  }

  return inferred.map((item) => ({
    ...item,
    categoryId: item.categoryId,
    categoryLabel: item.categoryId ? categoryLabels.get(item.categoryId) ?? formatCategoryLabel(item.categoryId) : null,
  }));
}

async function syncShoppingListWithDB(userId: string, items: PersistableIngredient[]) {
  const { error: deleteError } = await supabase
    .from(SHOPPING_LIST_TABLE)
    .delete()
    .eq('user_id', userId)
    .eq('is_purchased', false);

  if (deleteError) {
    handleError(deleteError, {
      component: 'shoppingListService',
      action: 'clearPreviousList',
      severity: 'medium',
      userId,
    });
    throw new Error('No se pudo limpiar la lista de compras anterior.');
  }

  if (!items.length) return;

  const payloads: DBShoppingListInsert[] = items.map((item) => ({
    user_id: userId,
    name: item.name,
    quantity: item.totalQuantity,
    unit: item.unit,
    is_purchased: false,
    category_id: item.categoryId,
    category_label: item.categoryLabel,
    ingredient_name: item.name
  }));

  const { error: insertError } = await supabase.from(SHOPPING_LIST_TABLE).insert(payloads);
  if (insertError) {
    handleError(insertError, {
      component: 'shoppingListService',
      action: 'insertGeneratedList',
      severity: 'medium',
      userId,
      metadata: { items: items.length }
    });
    throw new Error('No se pudieron guardar los nuevos ítems de la lista.');
  }
}

export async function generateShoppingList(
  startDate: string,
  endDate: string,
  userId: string
): Promise<ShoppingListItem[]> {
  try {
    log('Generating shopping list', { startDate, endDate, userId });
    const meals = await getPlannedMeals(startDate, endDate);
    if (!meals.length) {
      return [];
    }

    const recipes = await fetchRecipesForMeals(meals);
    const rawIngredients: RawIngredientInfo[] = [];

    meals.forEach((meal) => {
      if (!meal.recipe_id) return;
      const recipe = recipes.get(meal.recipe_id);
      if (!recipe) return;

      recipe.ingredients.forEach((ingredient) => {
        const name = ingredient.ingredient_name?.trim();
        if (!name) return;
        rawIngredients.push({
          name,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          recipeName: recipe.title
        });
      });
    });

    if (!rawIngredients.length) {
      return [];
    }

    const aggregated = aggregateIngredients(rawIngredients);
    const pantryStock = await fetchPantryStock(userId);
    const finalItems = computeFinalList(aggregated, pantryStock);
    const categorizedItems = await enrichWithCategories(userId, finalItems);

    await syncShoppingListWithDB(userId, categorizedItems);

    return categorizedItems.map((item) => ({
      id: item.name,
      name: item.name,
      quantity: item.totalQuantity,
      unit: item.unit,
      isChecked: false,
      recipeSources: item.recipeSources
    }));
  } catch (error) {
    handleError(error, {
      component: 'shoppingListService',
      action: 'generateShoppingList',
      severity: 'medium',
      metadata: { startDate, endDate },
      userId,
    });
    throw error instanceof Error ? error : new Error('No se pudo generar la lista de compras.');
  }
}
