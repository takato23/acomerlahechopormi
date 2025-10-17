export type PrimaryGoal =
  | 'eat_better'
  | 'save_time'
  | 'save_money'
  | 'learn_cook'
  | 'other';

export type MealTimeKey = 'breakfast' | 'lunch' | 'snack' | 'dinner';

export type ComplexityLevel = 'simple' | 'medium' | 'complex';

export interface PantryDraftItem {
  id: string;
  ingredient_name: string;
  quantity: number | null;
  unit: string | null;
  category_id: string | null;
  notes?: string | null;
}

export interface QuantitativeObjectives {
  calorieTarget: number | null;
  weeklyBudget: number | null;
  householdSize: number | null;
}

export interface OnboardingDraft {
  primaryGoal: PrimaryGoal | null;
  dietaryPreferences: string[];
  allergies: string[];
  dislikedIngredients: string[];
  preferredMealTimes: Partial<Record<MealTimeKey, string>>;
  preferredComplexity: ComplexityLevel | null;
  maxCookingMinutes: number | null;
  initialPantryItems: PantryDraftItem[];
  quantitativeObjectives: QuantitativeObjectives;
  notes: string | null;
}

export type OnboardingStepId =
  | 'primaryGoal'
  | 'dietaryPreferences'
  | 'habits'
  | 'initialInventory'
  | 'quantObjectives'
  | 'confirmation';

export interface OnboardingStepDefinition {
  id: OnboardingStepId;
  title: string;
  description: string;
}
