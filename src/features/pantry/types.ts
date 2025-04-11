import { Ingredient } from '@/types/ingredientTypes';
import { Category } from '@/types/categoryTypes';

export interface PantryItem {
  id: string;
  user_id: string;
  ingredient_id: string;
  quantity: number;
  unit: string | null;
  min_stock?: number | null;
  expiry_date?: string | null;
  notes: string | null;
  category_id: string | null;
  is_favorite: boolean;
  created_at: string;
  updated_at?: string;
  ingredient?: Ingredient | null;
  category?: Category | null;
}

export interface CreatePantryItemData {
  ingredient_name: string;
  quantity: number;
  unit?: string | null;
  min_stock?: number | null;
  expiry_date?: string | null;
  notes?: string | null;
  category_id?: string | null;
}

export interface UpdatePantryItemData {
  quantity?: number;
  unit?: string | null;
  min_stock?: number | null;
  expiry_date?: string | null;
  notes?: string | null;
  category_id?: string | null;
  is_favorite?: boolean;
}

export interface PantryFilters {
  searchTerm?: string;
  categories?: string[];
  expiryRange?: {
    start: string;
    end: string;
  };
  lowStock?: boolean;
  favorites?: boolean;
}

export interface PantryState {
  items: PantryItem[];
  loading: boolean;
  error: string | null;
  filters: PantryFilters;
}