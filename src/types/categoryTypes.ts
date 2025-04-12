import { Database } from '@/lib/database.types';

export type Category = Database['public']['Tables']['categories']['Row'];

export interface CreateCategoryData {
  name: string;
  icon_name?: string | null;
}

export interface UpdateCategoryData {
  name?: string;
  icon_name?: string | null;
}

export interface CategoryState {
  categories: Category[];
  loading: boolean;
  error: string | null;
}

export type CategoryAction =
  | { type: 'SET_CATEGORIES'; payload: Category[] }
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'UPDATE_CATEGORY'; payload: Category }
  | { type: 'DELETE_CATEGORY'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET_STATE' };