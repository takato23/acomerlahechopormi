import { supabase } from '@/lib/supabaseClient';
import { ShoppingListItem } from '@/types/shoppingListTypes';
import { Recipe } from '@/types/recipeTypes';
import { 
  normalizeUnit, 
  parseQuantity, 
  convertUnits,
  normalizeIngredientName 
} from '@/lib/ingredientUtils';

export async function getShoppingListItems(): Promise<ShoppingListItem[]> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
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

export async function addItemsToShoppingList(items: Partial<ShoppingListItem>[]): Promise<ShoppingListItem[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  const itemsWithUserId = items.map(item => ({
    ...item,
    user_id: user.id
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
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
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
  updates: Partial<ShoppingListItem>
): Promise<ShoppingListItem> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  const { data, error } = await supabase
    .from('shopping_list_items')
    .update(updates)
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
  const { data: { user } } = await supabase.auth.getUser();
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
    console.error(`[shoppingListService] Error inesperado en deleteShoppingListItem para ${id}:`, error);
    throw error; // Re-lanzar para que el store lo maneje
  }
}

export async function clearPurchasedItems(): Promise<void> {
  console.log('[shoppingListService] Intentando limpiar items comprados');
  const { data: { user } } = await supabase.auth.getUser();
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('[shoppingListService] Usuario no autenticado al limpiar todo');
    throw new Error('Usuario no autenticado');
  }
  console.log(`[shoppingListService] Limpiando TODOS los items para usuario ${user.id}`);

  try {
    const { error } = await supabase
      .from('shopping_list_items')
      .delete()
      .eq('user_id', user.id);

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

export function calculateMissingRecipeIngredients(recipe: Recipe, currentItems: ShoppingListItem[]): Partial<ShoppingListItem>[] {
  if (!recipe.recipe_ingredients) return [];

  const requiredIngredients = recipe.recipe_ingredients.map(ri => ({
    ingredient_name: ri.ingredient_name,
    quantity: ri.quantity || 1,
    unit: normalizeUnit(ri.unit || ''),
  }));

  const currentIngredients = currentItems.map(item => ({
    ingredient_name: item.ingredient_name,
    quantity: item.quantity || 1,
    unit: normalizeUnit(item.unit || ''),
  }));

  const missingIngredients: Partial<ShoppingListItem>[] = [];

  for (const required of requiredIngredients) {
    const current = currentIngredients.find(
      ci => normalizeIngredientName(ci.ingredient_name) === normalizeIngredientName(required.ingredient_name)
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