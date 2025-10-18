import { Category } from './categoryTypes';

export type RecipeInstructions = string[];

export interface RecipeIngredient {
  id: string;
  recipe_id: string;
  ingredient_id?: string;
  ingredient_name: string;
  quantity?: number;
  unit?: string;
}

export interface NutritionalInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
}

export interface Recipe {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  instructions: RecipeInstructions;
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  servings?: number;
  image_url?: string;
  created_at: string;
  updated_at?: string;
  is_favorite: boolean;
  is_public: boolean;
  is_archived?: boolean;
  archived_at?: string | null;
  category_id?: string;
  recipe_ingredients: RecipeIngredient[];
  category?: Category;
  tags?: string[];
  mainIngredients?: string[];
  nutritional_info?: NutritionalInfo;
  source_api?: string;
  source_id?: string;
  is_shared?: boolean;
}

export interface RecipeFilters {
  searchTerm?: string;
  showOnlyFavorites?: boolean;
  showOnlyPublic?: boolean;
  quickRecipes?: boolean;  // Recetas que se preparan en menos de 30 min
  selectedIngredients?: string[];
  selectedTags?: string[];
  categoryId?: string | null;
  sortOption?: string;
  viewMode?: 'card' | 'list';
}

export interface GetRecipesResponse {
  data: Recipe[];
  hasMore: boolean;
  total?: number;
}

export type RecipeInputData = Omit<Recipe, 'id' | 'created_at' | 'recipe_ingredients' | 'instructions'> & {
  user_id?: string | null;
  ingredients: Array<{
    name: string;
    quantity: string | number | null;
    unit?: string | null;
  }>;
  instructions: RecipeInstructions | string | null;
  isBaseRecipe?: boolean;
  tags?: string[] | null;
  mainIngredients?: string[];
  nutritional_info?: NutritionalInfo;
  source_api?: string;
  source_id?: string;
  is_shared?: boolean;
  is_archived?: boolean;
};

export type UpdateRecipeData = Partial<RecipeInputData> & {
  id: string;
};

// Tipo para ingredientes con cantidad, usado en la generación
export interface IngredientWithAmount {
  name: string;
  quantity: number | string | null;
  unit?: string | null;
}

// Tipo que representa los datos de una receta generada por IA o API externa
// antes de ser convertida a la estructura Recipe completa
export interface GeneratedRecipeData {
  title: string;
  description?: string | null;
  ingredients: IngredientWithAmount[];
  instructions: RecipeInstructions | string; // Puede ser string o array
  prepTimeMinutes?: number | null;
  cookTimeMinutes?: number | null;
  servings?: number | null;
  mainIngredients?: string[];
  image_url?: string | null;
  nutritionalInfo?: NutritionalInfo | null; // Añadido
  // Otros campos que pueda devolver la IA/API
  tags?: string[];
  cuisineType?: string[];
  difficultyLevel?: string;
  cookingMethods?: string[];
  estimatedTime?: number;
  seasonalFlags?: string[];
  equipmentNeeded?: string[];
  source_api?: string; // Añadir para tracking
  source_id?: string;  // Añadir para tracking
}