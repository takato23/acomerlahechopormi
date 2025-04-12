import { Category } from '@/types/categoryTypes';
import { Ingredient } from '@/types/ingredientTypes';

export interface PantryItem {
  id: string;
  user_id: string;
  ingredient_id?: string;
  ingredient_name: string;
  quantity?: number;
  unit?: string;
  category_id?: string;
  expiry_date?: string;
  notes?: string;
  min_stock?: number;
  is_favorite?: boolean;
  created_at: string;
  updated_at?: string;
  ingredient?: Ingredient | null;
  category?: Category | null;
}

export interface CreatePantryItemData {
  ingredient_name: string;
  ingredient_id?: string;
  quantity?: number;
  unit?: string;
  category_id?: string;
  expiry_date?: string;
  notes?: string;
  min_stock?: number;
  is_favorite?: boolean;
}

export interface PantryFilters {
  searchTerm: string;
  categories: string[];
  lowStock: boolean;
  favorites: boolean;
}

export interface PantryState {
  items: PantryItem[];
  loading: boolean;
  error: string | null;
  filters: PantryFilters;
}