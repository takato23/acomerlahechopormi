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
  category_id?: string;
  recipe_ingredients: RecipeIngredient[];
  category?: Category;
  tags?: string[];
  nutritional_info?: NutritionalInfo;
  source_api?: string;
  source_id?: string;
  is_shared?: boolean;
}

export interface RecipeFilters {
  searchTerm?: string;
  showOnlyFavorites?: boolean;
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
};

export type UpdateRecipeData = Partial<RecipeInputData> & {
  id: string;
};