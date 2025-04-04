import { MealType } from '@/features/planning/types';

export interface SuggestionContext {
  date: string;
  mealType: MealType;
  userId: string;
  currentPantryItems?: Array<{
    ingredient_id: string;
    name: string;
  }>;
  favoriteRecipeIds?: string[];
  planningHistory?: Array<{
    recipe_id: string;
    count: number;
  }>;
}

export interface Suggestion {
  type: 'recipe' | 'custom';
  id?: string;
  title: string;
  reason?: string;
}