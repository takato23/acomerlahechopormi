import { supabase } from '@/lib/supabaseClient';

export interface SimpleShoppingItem {
  id: string;
  name: string;
  is_checked: boolean;
  created_at: string;
  user_id?: string;
}

export interface SimpleShoppingItemInsert {
  name: string;
  is_checked?: boolean;
  user_id?: string;
}

const TABLE_NAME = 'simple_shopping_items';

// Obtener todos los elementos de la lista de compras
export async function getSimpleShoppingItems(): Promise<SimpleShoppingItem[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return [];
    
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('[simpleShoppingService] Error al obtener items:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('[simpleShoppingService] Error inesperado:', error);
    return [];
  }
}

// Añadir un nuevo elemento a la lista de compras
export async function addSimpleShoppingItem(name: string): Promise<SimpleShoppingItem | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;
    
    console.log('[simpleShoppingService] Añadiendo item para usuario:', user.id);
    
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert({
        name: name.trim(),
        user_id: user.id
      })
      .select()
      .single();
    
    if (error) {
      console.error('[simpleShoppingService] Error al insertar:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('[simpleShoppingService] Error inesperado:', error);
    return null;
  }
}

// Actualizar un elemento existente
export async function updateSimpleShoppingItem(id: string, is_checked: boolean): Promise<SimpleShoppingItem | null> {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update({ is_checked })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('[simpleShoppingService] Error al actualizar:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('[simpleShoppingService] Error inesperado:', error);
    return null;
  }
}

// Eliminar un elemento
export async function deleteSimpleShoppingItem(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('[simpleShoppingService] Error al eliminar:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('[simpleShoppingService] Error inesperado:', error);
    return false;
  }
}

// Eliminar elementos marcados
export async function clearCheckedItems(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return false;
    
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('user_id', user.id)
      .eq('is_checked', true);
    
    if (error) {
      console.error('[simpleShoppingService] Error al limpiar items marcados:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('[simpleShoppingService] Error inesperado:', error);
    return false;
  }
} 