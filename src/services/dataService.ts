import type { Category } from '@/types/categoryTypes';

import { supabaseRepository } from './supabaseRepository';

/**
 * Servicio central para funcionalidades compartidas
 * Actúa como punto único de acceso para operaciones comunes
 */

const categoriesTable = () => supabaseRepository.getClient().from('categories');

/**
 * Obtiene todas las categorías disponibles
 */
export async function getCategories(): Promise<Category[]> {
  try {
    console.log('[DataService] Fetching categories...');
    const data = await supabaseRepository.run<Category[]>(
      () => categoriesTable().select('*').order('name'),
      { fallback: [] }
    );

    console.log('[DataService] Categories fetched:', data);
    return data;
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
    const data = await supabaseRepository.run<Category | null>(
      () => categoriesTable().select('*').eq('id', id).maybeSingle(),
      { fallback: null }
    );

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
