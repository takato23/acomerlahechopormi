import { supabase } from '../../lib/supabaseClient';
import {
  PantryItem,
  CreatePantryItemData,
  UpdatePantryItemData,
  Category,
} from './types';
import {
  findOrCreateIngredient,
  normalizeIngredientName,
} from '../ingredients/ingredientService';
import { inferCategory } from '../shopping-list/lib/categoryInference';

const PANTRY_SELECT =
  '*, is_favorite, ingredients(id, name, image_url), categories(id, name, icon_name)';

const mapPantryRow = (row: any): PantryItem => ({
  ...row,
  ingredient: row.ingredients
    ? {
        id: row.ingredients.id,
        name: normalizeIngredientName(row.ingredients.name, row.quantity ?? 1),
        image_url: row.ingredients.image_url,
      }
    : null,
  category: row.categories
    ? {
        id: row.categories.id,
        name: row.categories.name,
        icon_name: row.categories.icon_name,
      }
    : null,
  ingredients: undefined,
  categories: undefined,
});

const getAuthenticatedUserId = async (): Promise<string> => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error('Usuario no autenticado');
  }
  return user.id;
};

const resolveUserId = async (explicitUserId?: string) => {
  if (explicitUserId) return explicitUserId;
  return getAuthenticatedUserId();
};

/**
 * Obtiene todos los items de la despensa para el usuario actual.
 */
export const getPantryItems = async (): Promise<PantryItem[]> => {
  const userId = await getAuthenticatedUserId();

  const { data, error } = await supabase
    .from('pantry_items')
    .select(PANTRY_SELECT)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[getPantryItems] Supabase error:', error);
    throw new Error('No se pudieron cargar los ítems de la despensa.');
  }

  return (data ?? []).map(mapPantryRow);
};

/**
 * Obtiene todas las categorías disponibles.
 */
export const getCategories = async (): Promise<Category[]> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const orFilter = user ? `is_default.eq.true,user_id.eq.${user.id}` : 'is_default.eq.true';

  const { data, error } = await supabase
    .from('categories')
    .select('*, icon_name')
    .or(orFilter)
    .order('is_default', { ascending: false })
    .order('order', { ascending: true });

  if (error) throw error;
  return data || [];
};

/**
 * Añade o actualiza un item en la despensa usando un upsert transaccional.
 */
export const addPantryItem = async (itemData: CreatePantryItemData): Promise<PantryItem> => {
  const userId = await resolveUserId(itemData.user_id);

  const ingredient = await findOrCreateIngredient(
    itemData.ingredient_name,
    itemData.quantity ?? 1,
  );

  let finalCategoryId = itemData.category_id ?? null;
  if (!finalCategoryId && ingredient?.name) {
    try {
      const inferredCategory = await inferCategory(ingredient.name);
      if (inferredCategory) {
        finalCategoryId = inferredCategory;
      }
    } catch (error) {
      console.error('[addPantryItem] Error inferring category:', error);
    }
  }

  const payload = {
    user_id: userId,
    ingredient_id: ingredient.id,
    quantity: itemData.quantity ?? 1,
    unit: itemData.unit ?? null,
    category_id: finalCategoryId,
    expiry_date: itemData.expiry_date ?? null,
    notes: itemData.notes ?? null,
    min_stock: itemData.min_stock ?? null,
  };

  const { data, error } = await supabase
    .from('pantry_items')
    .upsert(payload, {
      onConflict: 'user_id,ingredient_id,unit',
      ignoreDuplicates: false,
    })
    .select(PANTRY_SELECT)
    .single();

  if (error || !data) {
    console.error('[addPantryItem] Supabase upsert error:', error);
    throw new Error('No se pudo guardar el ítem en la despensa.');
  }

  return mapPantryRow(data);
};

/**
 * Actualiza un item existente.
 */
export const updatePantryItem = async (
  itemId: string,
  updateData: UpdatePantryItemData,
): Promise<PantryItem> => {
  const userId = await getAuthenticatedUserId();

  const { data, error } = await supabase
    .from('pantry_items')
    .update({
      ...updateData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', itemId)
    .eq('user_id', userId)
    .select(PANTRY_SELECT)
    .single();

  if (error || !data) {
    console.error('[updatePantryItem] Supabase error:', error);
    throw new Error('No se pudo actualizar el ítem.');
  }

  return mapPantryRow(data);
};

/**
 * Elimina un item de la despensa.
 */
export const deletePantryItem = async (itemId: string): Promise<void> => {
  const userId = await getAuthenticatedUserId();

  const { error } = await supabase
    .from('pantry_items')
    .delete()
    .eq('id', itemId)
    .eq('user_id', userId);

  if (error) {
    console.error('[deletePantryItem] Supabase error:', error);
    throw new Error('No se pudo eliminar el ítem.');
  }
};

/**
 * Elimina múltiples items de la despensa.
 */
export const deleteMultiplePantryItems = async (itemIds: string[]): Promise<void> => {
  if (!itemIds?.length) return;

  const userId = await getAuthenticatedUserId();

  const { error } = await supabase
    .from('pantry_items')
    .delete()
    .in('id', itemIds)
    .eq('user_id', userId);

  if (error) {
    console.error('[deleteMultiplePantryItems] Supabase error:', error);
    throw new Error('No se pudieron eliminar los ítems seleccionados.');
  }
};

/**
 * Cambia el estado de favorito de un item.
 */
export const toggleFavoritePantryItem = async (
  itemId: string,
  isFavorite: boolean,
): Promise<PantryItem | null> => {
  const userId = await getAuthenticatedUserId();

  const { data, error } = await supabase
    .from('pantry_items')
    .update({ is_favorite: isFavorite, updated_at: new Date().toISOString() })
    .eq('id', itemId)
    .eq('user_id', userId)
    .select(PANTRY_SELECT)
    .single();

  if (error) {
    console.error('[toggleFavoritePantryItem] Supabase error:', error);
    throw new Error('No se pudo actualizar el estado de favorito.');
  }

  if (!data) {
    return null;
  }

  return mapPantryRow(data);
};

/**
 * Elimina todos los items de la despensa del usuario.
 */
export const clearPantry = async (): Promise<void> => {
  const userId = await getAuthenticatedUserId();

  const { error } = await supabase
    .from('pantry_items')
    .delete()
    .eq('user_id', userId);

  if (error) {
    console.error('[clearPantry] Supabase error:', error);
    throw new Error('No se pudo vaciar la despensa.');
  }
};

/**
 * Obtiene los items que están por debajo de su nivel mínimo de stock.
 */
export const fetchLowStockItems = async (): Promise<PantryItem[]> => {
  const userId = await getAuthenticatedUserId();

  const { data, error } = await supabase
    .from('pantry_items')
    .select(PANTRY_SELECT)
    .eq('user_id', userId)
    .not('min_stock', 'is', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[fetchLowStockItems] Supabase error:', error);
    throw new Error('No se pudieron cargar los ítems con bajo stock.');
  }

  return (data ?? [])
    .map(mapPantryRow)
    .filter((item) =>
      item.min_stock !== null && item.min_stock !== undefined
        ? (typeof item.quantity === 'number' ? item.quantity : Number(item.quantity ?? 0)) <=
          (typeof item.min_stock === 'number' ? item.min_stock : Number(item.min_stock ?? 0))
        : false,
    );
};
