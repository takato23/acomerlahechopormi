import { supabase } from '@/lib/supabaseClient';
import { Category } from '@/types/categoryTypes';

export async function getCategories(): Promise<Category[]> {
  try {
    console.log('[CategoryService] Fetching categories...');
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) {
      console.error('[CategoryService] Error fetching categories:', error);
      throw error;
    }

    console.log('[CategoryService] Categories loaded:', data);
    return data || [];
  } catch (error) {
    console.error('[CategoryService] Error in getCategories:', error);
    throw error;
  }
}

export async function getCategoryById(id: string): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  if (!data) throw new Error('Category not found');

  return data;
}

export async function createCategory(name: string, iconName?: string): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .insert([{ name, icon_name: iconName }])
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error('Could not create category');

  return data;
}

export async function updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error('Category not found');

  return data;
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) throw error;
}