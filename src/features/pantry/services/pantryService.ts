import { supabase } from '@/lib/supabaseClient';
import { PantryItem, CreatePantryItemData, UpdatePantryItemData } from '../types';
import { findOrCreateIngredient, normalizeIngredientName } from '@/features/ingredients/services/ingredientService';
import { inferCategory } from '@/features/shopping-list/lib/categoryInference';

/**
 * Obtiene los items de la despensa que están por debajo de un umbral determinado de stock.
 */
export async function fetchLowStockItems(threshold: number = 2): Promise<PantryItem[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  const { data, error } = await supabase
    .from('pantry_items')
    .select('*')
    .eq('user_id', user.id)
    .lte('quantity', threshold);

  if (error) throw error;
  return data || [];
}

/**
 * Obtiene todos los items de la despensa del usuario.
 */
export const getPantryItems = async (): Promise<PantryItem[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuario no autenticado");

  const { data, error } = await supabase
    .from('pantry_items')
    .select('*, ingredients(id, name, image_url), categories(id, name, icon_name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map(item => ({
    ...item,
    ingredient: item.ingredients ? {
      id: item.ingredients.id,
      name: normalizeIngredientName(item.ingredients.name, item.quantity ?? 1),
      image_url: item.ingredients.image_url
    } : null,
    category: item.categories ? {
      id: item.categories.id,
      name: item.categories.name,
      icon_name: item.categories.icon_name
    } : null,
    ingredients: undefined,
    categories: undefined
  }));
};

/**
 * Añade un nuevo item a la despensa.
 */
export const addPantryItem = async (itemData: CreatePantryItemData): Promise<PantryItem> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuario no autenticado");

  const ingredient = await findOrCreateIngredient(
    itemData.ingredient_name,
    itemData.quantity ?? 1
  );
  
  let finalCategoryId = itemData.category_id;
  if (!finalCategoryId && ingredient?.name) {
    try {
      const inferredCategory = await inferCategory(ingredient.name);
      if (inferredCategory) {
        finalCategoryId = inferredCategory;
      }
    } catch (error) {
      console.error("Error during category inference:", error);
    }
  }

  const { data, error } = await supabase
    .from('pantry_items')
    .insert({
      user_id: user.id,
      ingredient_id: ingredient.id,
      quantity: itemData.quantity ?? 1,
      unit: itemData.unit,
      category_id: finalCategoryId,
      expiry_date: itemData.expiry_date,
      notes: itemData.notes,
      min_stock: itemData.min_stock, // Asegurarse de incluir min_stock
    })
    .select('*, ingredients(id, name, image_url), categories(id, name, icon_name)')
    .single();

  if (error) throw error;
  if (!data) throw new Error("No se pudo crear el item");

  return {
    ...data,
    ingredient: data.ingredients ? {
      id: data.ingredients.id,
      name: normalizeIngredientName(data.ingredients.name, data.quantity ?? 1),
      image_url: data.ingredients.image_url
    } : null,
    category: data.categories ? {
      id: data.categories.id,
      name: data.categories.name,
      icon_name: data.categories.icon_name
    } : null,
    ingredients: undefined,
    categories: undefined
  };
};

/**
 * Actualiza un item existente.
 */
export const updatePantryItem = async (itemId: string, updateData: UpdatePantryItemData): Promise<PantryItem> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuario no autenticado");

  const { data, error } = await supabase
    .from('pantry_items')
    .update({
      ...updateData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', itemId)
    .eq('user_id', user.id)
    .select('*, ingredients(id, name, image_url), categories(id, name, icon_name)')
    .single();

  if (error) throw error;
  if (!data) throw new Error("Item no encontrado");

  return {
    ...data,
    ingredient: data.ingredients ? {
      id: data.ingredients.id,
      name: normalizeIngredientName(data.ingredients.name, data.quantity ?? 1),
      image_url: data.ingredients.image_url
    } : null,
    category: data.categories ? {
      id: data.categories.id,
      name: data.categories.name,
      icon_name: data.categories.icon_name
    } : null,
    ingredients: undefined,
    categories: undefined
  };
};

/**
 * Elimina un item de la despensa.
 */
export const deletePantryItem = async (itemId: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuario no autenticado");

  const { error } = await supabase
    .from('pantry_items')
    .delete()
    .eq('id', itemId)
    .eq('user_id', user.id);

  if (error) throw error;
};

/**
 * Cambia el estado de favorito de un item.
 */
export const toggleFavoritePantryItem = async (itemId: string, isFavorite: boolean): Promise<PantryItem | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuario no autenticado");

  const { data, error } = await supabase
    .from('pantry_items')
    .update({ is_favorite: isFavorite, updated_at: new Date().toISOString() })
    .eq('id', itemId)
    .eq('user_id', user.id)
    .select('*, ingredients(id, name, image_url), categories(id, name, icon_name)')
    .single();

  if (error) throw error;
  if (!data) return null;

  return {
    ...data,
    ingredient: data.ingredients ? {
      id: data.ingredients.id,
      name: normalizeIngredientName(data.ingredients.name, data.quantity ?? 1),
      image_url: data.ingredients.image_url
    } : null,
    category: data.categories ? {
      id: data.categories.id,
      name: data.categories.name,
      icon_name: data.categories.icon_name
    } : null,
    ingredients: undefined,
    categories: undefined
  };
};

/**
 * Elimina todos los items de la despensa.
 */
export const clearPantry = async (): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuario no autenticado");

  const { error } = await supabase
    .from('pantry_items')
    .delete()
    .eq('user_id', user.id);

  if (error) throw error;
};