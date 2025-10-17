// src/features/planning/types.ts

import type { Recipe } from '@/types/recipeTypes';
import type { PrimaryOnboardingGoal } from '@/types/userPreferences';

// Usar los valores exactos del enum de Supabase
export type MealType = 'Desayuno' | 'Almuerzo' | 'Merienda' | 'Cena';

// Estados del ciclo de vida de una comida planificada
export type MealStatus = 'draft' | 'confirmed' | 'executed' | 'skipped';

// Dificultad de preparación
export type MealDifficulty = 'simple' | 'medium' | 'complex';

// Información nutricional básica
export interface NutritionalInfo {
  calories?: number;
  protein?: number; // gramos
  carbs?: number; // gramos
  fat?: number; // gramos
  fiber?: number; // gramos
}

// Estado de ingredientes para una comida
export interface IngredientStatus {
  ingredient_name: string;
  available: boolean;
  quantity_needed: number;
  quantity_available: number;
  unit: string;
}

// Representa una comida planificada en la tabla planned_meals
export interface PlannedMeal {
  id: string; // UUID
  user_id: string; // UUID del usuario
  plan_date: string; // Fecha en formato YYYY-MM-DD (coincide con DB)
  meal_type: MealType;
  recipe_id: string | null; // UUID de la receta (si aplica)
  custom_title: string | null; // Texto libre (si no es receta)
  created_at: string; // Timestamp
  updated_at?: string; // Timestamp
  notes?: string | null; // Notas adicionales

  // Nuevos campos para funcionalidad extendida
  status?: MealStatus;
  difficulty?: MealDifficulty;
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  nutritional_info?: NutritionalInfo;
  ingredient_status?: IngredientStatus[];
  feasibility_score?: number;
  feasibility_notes?: string[];
  substitution_suggestions?: string[];
  cost_estimate?: number;
  equipment_warnings?: string[];
  nutritional_recommendations?: string[];
  executed_at?: string | null; // Cuando se marcó como preparada

  // Opcional: Incluir datos de la receta si se hace JOIN
  recipes?: {
    id: string;
    title: string;
    description: string | null;
    image_url: string | null;
    main_ingredients?: string[];
    tags?: string[];
    recipe_ingredients?: Array<{
      id?: string;
      ingredient_name?: string | null;
      quantity?: number | null;
      unit?: string | null;
    }>;
  } | null;
}

// Datos para crear/actualizar una comida planificada
export interface UpsertPlannedMealData {
  plan_date: string; // Coincide con DB
  meal_type: MealType;
  recipe_id?: string | null;
  custom_title?: string | null;
  notes?: string | null;
  status?: MealStatus;
  difficulty?: MealDifficulty;
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  nutritional_info?: NutritionalInfo;
}

// --- Estados de UI y Interacción ---

// Vista actual del planificador
export type PlanningView = 'week' | 'day' | 'templates' | 'dashboard';

// Modo de interacción
export type PlanningMode = 'view' | 'edit' | 'generate';

// Información para drag & drop
export interface DragMealData {
  meal: PlannedMeal;
  sourceDate: string;
  sourceMealType: MealType;
}

// --- Sistema de Plantillas Mejorado ---

export interface PlanningTemplate {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  category: TemplateCategory;
  is_public: boolean;
  template_data: TemplateData;
  usage_count: number;
  created_at: string;
  updated_at: string;
  isUserTemplate?: boolean;
}

export type TemplateCategory = 'personal' | 'healthy' | 'budget' | 'quick' | 'family' | 'seasonal' | 'diet';

export interface TemplateData {
  version: string; // Para compatibilidad futura
  meals: TemplateMeal[];
  metadata: {
    total_days: number;
    estimated_cost?: number;
    difficulty_level?: MealDifficulty;
    dietary_tags?: string[];
  };
}

export interface TemplateMeal {
  day_index: number; // 0 = Lunes, 1 = Martes, etc.
  meal_type: MealType;
  recipe_id?: string | null;
  custom_title?: string | null;
  notes?: string | null;
  difficulty?: MealDifficulty;
  prep_time_minutes?: number;
}

export interface SaveTemplateData {
  name: string;
  description?: string;
  category: TemplateCategory;
  is_public: boolean;
  meals: PlannedMeal[];
}

// --- Preferencias de Planificación ---

export interface PlanningPreferences {
  // Generación automática
  auto_generate: boolean;
  generation_frequency: 'daily' | 'weekly' | 'manual';

  // Preferencias de comidas
  preferred_meal_types: MealType[];
  preferred_difficulty: MealDifficulty;
  max_prep_time: number; // minutos
  max_cook_time: number; // minutos

  // Restricciones nutricionales
  target_calories_per_day?: number;
  dietary_restrictions: string[];
  allergies: string[];

  // Integración con pantry
  check_availability: boolean;
  auto_update_shopping_list: boolean;

  // Personalización
  favorite_cuisines: string[];
  disliked_ingredients: string[];

  // Contexto adicional
  available_equipment?: string[];
  meal_time_preferences?: Partial<Record<MealType, string>>;
  household_size?: number;
  primary_goal?: PrimaryOnboardingGoal | null;
}

// Configuración persistente y peticiones de generación personalizada

export interface GenerationRequest {
  selectedDays: string[]; // ISO dates YYYY-MM-DD
  selectedMealTypes: MealType[];
  calorieTarget?: number;
  specificObjective?: string;
  prioritizeIngredients?: string[];
  avoidIngredients?: string[];
  maxPrepTime?: number;
  requireEquipment?: string[];
  dietaryMode?: string;
  autoUsePantryOnly?: boolean;
  balanceMacrosAutomatically?: boolean;
  cuisineVariety?: string[];
  creativityLevel?: number; // 0-100
  avoidRepeatingMainIngredients?: boolean;
  considerSeason?: boolean;
  maxBudgetLevel?: 'low' | 'medium' | 'high';
}

export interface GenerationConfig {
  defaultMealTypes: MealType[];
  defaultCalorieTarget?: number;
  autoGenerateOnSunday: boolean;
  notifyMissingIngredients: boolean;
  defaultSpecificObjective?: string;
  defaultDietaryMode?: string;
  autoAddMissingIngredients?: boolean;
  groupByCategory?: boolean;
  estimateCosts?: boolean;
}

export interface NutritionalGoals {
  dailyCalories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  fiberGrams: number;
  restrictions: string[];
}

export interface ShoppingListIntegration {
  autoAddMissingIngredients: boolean;
  groupByCategory: boolean;
  estimateCosts: boolean;
  suggestAlternatives: boolean;
}

// --- Generación IA Mejorada ---

export interface GenerationContext {
  user_profile: {
    objectives: string[];
    cooking_skill: MealDifficulty;
    time_available: number;
    budget_level: 'low' | 'medium' | 'high';
  };
  pantry_status: {
    available_ingredients: string[];
    low_stock_items: string[];
    expiring_soon: string[];
  };
  previous_meals: PlannedMeal[];
  weather?: {
    temperature: number;
    condition: string;
  };
  userEquipment?: string[];
  calorieGoal?: number;
  specificObjective?: string;
  seasonalPreference?: 'spring' | 'summer' | 'fall' | 'winter';
  budgetConstraint?: 'low' | 'medium' | 'high';
  timeConstraint?: number;
  day_of_week: number;
  season: 'spring' | 'summer' | 'fall' | 'winter';
}

// --- Estados de Generación ---

export interface GenerationProgress {
  status: 'idle' | 'analyzing' | 'generating' | 'optimizing' | 'complete' | 'error';
  current_step: string;
  progress: number; // 0-100
  meals_generated: number;
  errors: string[];
  warnings?: string[];
}

// --- Tipos para Sugerencias de Alternativas ---

export interface MealAlternativeRequestContext {
  meal_type: MealType;
  recipe_id?: string | null;
  custom_title?: string | null;
  available_ingredients?: string[];
  dietary_restrictions?: string[];
}

export type MealAlternative =
  | { type: 'recipe'; id: string; title: string; confidence: number; reason: string }
  | { type: 'custom'; text: string; confidence: number; reason: string };

// --- Estadísticas y Analytics ---

export interface PlanningStats {
  total_planned: number;
  total_executed: number;
  compliance_rate: number; // porcentaje
  avg_prep_time: number;
  total_calories: number;
  cost_savings: number;
  waste_reduction: number;
}

export interface WeeklyReport {
  week_start: string;
  stats: PlanningStats;
  most_used_ingredients: string[];
  favorite_meals: string[];
  suggestions: string[];
}

// --- Analítica nutricional avanzada ---

export interface DailyNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  date: string;
}

export interface WeeklyNutrition {
  days: DailyNutrition[];
  averages: NutritionalInfo;
  totals: NutritionalInfo;
  variability: number;
}

export interface GoalComparison {
  status: 'on-track' | 'over' | 'under';
  percentage: number;
  difference: number;
  recommendation?: string;
}

export interface MacroDistribution {
  proteinPercent: number;
  carbsPercent: number;
  fatPercent: number;
  evaluation: 'balanced' | 'high-protein' | 'high-carb' | 'high-fat';
}

export interface VarietyScore {
  score: number;
  uniqueIngredients: number;
  repeatedIngredients: string[];
  suggestions: string[];
}

export interface CalorieBalance {
  daily: { date: string; balance: number }[];
  weeklyBalance: number;
  status: 'deficit' | 'balanced' | 'surplus';
  adjustmentSuggestions: string[];
}

// --- Validaciones y listas de compras ---

export interface GenerationValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ShoppingListItemSuggestion {
  ingredient_name: string;
  quantity: number;
  unit?: string;
  category?: string;
  linkedMeals: string[];
  estimatedCost?: number;
  suggestions?: string[];
}

export interface CustomPlanResult {
  meals: PlannedMeal[];
  failedSlots: Array<{ date: string; mealType: MealType; reason: string }>;
  warnings: string[];
  validation: GenerationValidationResult;
  shoppingListSuggestions?: ShoppingListItemSuggestion[];
}
