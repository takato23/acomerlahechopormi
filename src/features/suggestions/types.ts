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

export interface SuggestionResponse {
  pantrySuggestion?: Suggestion;
  discoverySuggestion?: Suggestion;
  pendingShoppingListCheck?: {
    recipeId: string;
    ingredientsCount: number;
  };
}

export interface IngredientMatch {
  matched: boolean;
  reason?: string;
  missingQuantity?: number;
  unit?: string;
}

export interface MissingIngredient {
  name: string;
  quantity: number;
  unit: string;
  recipeId?: string;
}