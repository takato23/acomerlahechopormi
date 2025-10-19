export interface RecipeSuggestion {
  name: string;
  description: string;
  estimatedTime?: string;
  difficulty?: 'fácil' | 'media' | 'difícil';
  ingredients?: string[];
  id?: string;
  title?: string;
  reason?: string;
}

export interface SuggestionResponse {
  suggestions: RecipeSuggestion[];
  error?: string;
}

import type { PantryItem } from '@/features/pantry/types';
import type { PlannedMeal } from '@/features/planning/types';
import type { Recipe } from '@/types/recipeTypes';

export interface SuggestionContextSnapshot {
  pantryItems: PantryItem[];
  recipes: Recipe[];
  plannedMeals: PlannedMeal[];
}

export interface SuggestionRequest {
  pantryItems?: {
    name: string;
    quantity: number;
    unit?: string;
  }[];
  dietary?: {
    vegetarian?: boolean;
    vegan?: boolean;
    glutenFree?: boolean;
  };
  maxTime?: number; // en minutos
  mealType?: string; // Tipo de comida (Desayuno, Almuerzo, etc.)
  targetDate?: string; // Fecha sugerida para la planificación
  context?: Partial<SuggestionContextSnapshot>;
}

// Interfaz necesaria para SuggestionsPopover
export interface Suggestion {
  id?: string;
  title: string;
  description?: string;
  reason?: string;
  type?: 'recipe' | 'custom';
}
