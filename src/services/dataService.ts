import { supabase } from '@/lib/supabaseClient';
import { Category } from '@/types/categoryTypes';

/**
 * Servicio central para funcionalidades compartidas
 * Actúa como punto único de acceso para operaciones comunes
 */

/** 
 * Obtiene todas las categorías disponibles
 */
export async function getCategories(): Promise<Category[]> {
  try {
    console.log('[DataService] Fetching categories...');
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) throw error;

    console.log('[DataService] Categories fetched:', data);
    return data || [];
  } catch (error) {
    console.error('[DataService] Error fetching categories:', error);
    throw error;
  }
}

/**
 * Obtiene una categoría por su ID
 */
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
    console.error('[DataService] Error fetching category by id:', error);
    throw error;
  }
}

// Exportar todas las funciones del servicio de datos desde aquí
export default {
  getCategories,
  getCategoryById,
};