import { supabase } from '@/lib/supabaseClient';
import { Category } from '@/types/categoryTypes';

/**
 * Servicio para manejar operaciones relacionadas con categorías dentro del contexto de recetas
 */

export async function getCategories(): Promise<Category[]> {
  try {
    console.log('[CategoryService] Fetching categories...');
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) throw error;

    console.log('[CategoryService] Categories fetched:', data);
    return data || [];
  } catch (error) {
    console.error('[CategoryService] Error fetching categories:', error);
    throw error;
  }
}

export async function getCategoryById(id: string): Promise<Category | null> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[CategoryService] Error fetching category by id:', error);
    throw error;
  }
}