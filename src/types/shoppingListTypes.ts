import { Database } from '@/lib/database.types';
import { Recipe } from './recipeTypes';
import { Category } from './categoryTypes';

export type ShoppingListItemRow = Database['public']['Tables']['shopping_list_items']['Row'];

export interface ShoppingListItem extends ShoppingListItemRow {
  recipes?: Pick<Recipe, 'id' | 'title' | 'description' | 'image_url'> | null;
  categories?: Category | null;
}

export interface CreateShoppingListItem {
  ingredient_name: string;
  quantity?: number | null;
  unit?: string | null;
  category_id?: string | null;
  notes?: string | null;
  recipe_id?: string | null;
}

export interface UpdateShoppingListItem {
  ingredient_name?: string;
  quantity?: number | null;
  unit?: string | null;
  category_id?: string | null;
  is_checked?: boolean;
  notes?: string | null;
  recipe_id?: string | null;
}

export interface ShoppingListState {
  items: ShoppingListItem[];
  loading: boolean;
  error: string | null;
  filters: ShoppingListFilters;
}

export interface ShoppingListFilters {
  showChecked: boolean;
  searchTerm: string;
  categories: string[];
  sortBy: 'created_at' | 'ingredient_name' | 'category';
  sortOrder: 'asc' | 'desc';
}

export type ShoppingListAction =
  | { type: 'SET_ITEMS'; payload: ShoppingListItem[] }
  | { type: 'ADD_ITEM'; payload: ShoppingListItem }
  | { type: 'UPDATE_ITEM'; payload: ShoppingListItem }
  | { type: 'DELETE_ITEM'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'UPDATE_FILTERS'; payload: Partial<ShoppingListFilters> }
  | { type: 'RESET_STATE' };