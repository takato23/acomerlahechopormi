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

export interface SuggestionRequest {
  pantryItems: {
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
}

// Interfaz necesaria para SuggestionsPopover
export interface Suggestion {
  id?: string;
  title: string;
  description?: string;
  reason?: string;
  type?: 'recipe' | 'custom';
}