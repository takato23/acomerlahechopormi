import type { MealDifficulty, MealType } from '@/features/planning/types';

export interface RecipeSuggestion {
  name: string;
  description: string;
  estimatedTime?: string;
  difficulty?: 'fácil' | 'media' | 'difícil';
  ingredients?: string[];
}

export interface SuggestionResponse {
  suggestions: RecipeSuggestion[];
  error?: string;
}

export interface SuggestionPantryItem {
  ingredientId?: string | null;
  name: string;
  quantity?: number | null;
  unit?: string | null;
}

export interface SuggestionPreferences {
  difficulty?: MealDifficulty;
  maxPrepTime?: number;
  avoidIngredients?: string[];
  preferredTags?: string[];
}

export interface SuggestionRequest {
  mealType: MealType;
  pantryItems: SuggestionPantryItem[];
  dietary?: {
    vegetarian?: boolean;
    vegan?: boolean;
    glutenFree?: boolean;
    restrictions?: string[];
  };
  preferences?: SuggestionPreferences;
}
