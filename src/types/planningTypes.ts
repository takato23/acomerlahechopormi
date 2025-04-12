import { Recipe } from './recipeTypes';

export type MealType = 'Desayuno' | 'Almuerzo' | 'Merienda' | 'Cena';

export interface RecipeIngredient {
  id: string;
  recipe_id: string;
  ingredient_id?: string;
  ingredient_name: string;
  quantity?: number;
  unit?: string;
}

export interface RecipeWithIngredients extends Omit<Recipe, 'recipe_ingredients'> {
  recipe_ingredients: RecipeIngredient[];
}

export interface MealPlanEntry {
  id: string;
  user_id: string;
  recipe_id: string;
  plan_date: string;
  meal_type: MealType;
  custom_meal_name?: string;
  created_at: string;
  recipe?: RecipeWithIngredients | null;
}

export interface MealPlanEntryWithRecipe extends Omit<MealPlanEntry, 'recipe'> {
  recipe: RecipeWithIngredients | null;
}

export interface UpsertPlannedMealData {
  recipe_id?: string;
  plan_date: string;
  meal_type: MealType;
  custom_meal_name?: string;
}