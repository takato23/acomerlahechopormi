import { supabase } from '../../lib/supabaseClient';
import { PantryItem, CreatePantryItemData, UpdatePantryItemData, Category } from './types';
import { findOrCreateIngredient, normalizeIngredientName } from '../ingredients/ingredientService';
import { inferCategory } from '../shopping-list/lib/categoryInference';

/**
 * Obtiene todos los items de la despensa para el usuario actual.
 */
export const getPantryItems = async (): Promise<PantryItem[]> => {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Usuario no autenticado");

  const { data, error } = await supabase
    .from('pantry_items')
    .select('*, is_favorite, ingredients(id, name, image_url), categories(id, name, icon_name)') // Especificar columnas y añadir nuevas
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map(item => ({
    ...item,
    // Mapear datos de ingredientes y categorías explícitamente
    ingredient: item.ingredients ? {
      id: item.ingredients.id, // Incluir ID si es necesario
      name: normalizeIngredientName(item.ingredients.name, item.quantity ?? 1),
      image_url: item.ingredients.image_url // Añadir image_url
    } : null,
    category: item.categories ? {
      id: item.categories.id, // Incluir ID si es necesario
      name: item.categories.name,
      icon_name: item.categories.icon_name // Añadir icon_name
      // Añadir color si se usa en la UI directamente desde aquí
    } : null,
    ingredients: undefined,
    categories: undefined
  }));
};

/**
 * Obtiene todas las categorías disponibles.
 */
export const getCategories = async (): Promise<Category[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  const orFilter = user ? `is_default.eq.true,user_id.eq.${user.id}` : 'is_default.eq.true';

  const { data, error } = await supabase
    .from('categories')
    .select('*, icon_name') // Añadir icon_name
    .or(orFilter)
    .order('is_default', { ascending: false })
    .order('order', { ascending: true });

  if (error) throw error;
  return data || [];
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
    })
    .select('*, is_favorite, ingredients(id, name, image_url), categories(id, name, icon_name)') // Especificar columnas y añadir nuevas
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
    .select('*, is_favorite, ingredients(id, name, image_url), categories(id, name, icon_name)') // Especificar columnas y añadir nuevas
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
 * Elimina múltiples items de la despensa.
 */
export const deleteMultiplePantryItems = async (itemIds: string[]): Promise<void> => {
  if (!itemIds?.length) return;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuario no autenticado");

  const { error } = await supabase
    .from('pantry_items')
    .delete()
    .in('id', itemIds)
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
    .select('*, is_favorite, ingredients(id, name, image_url), categories(id, name, icon_name)') // Especificar columnas y añadir nuevas
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
