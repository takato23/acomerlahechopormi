import { create } from 'zustand';
import { addDays, format, startOfWeek, endOfWeek, parseISO } from 'date-fns';
import type {
  PlannedMeal,
  UpsertPlannedMealData,
  PlanningView,
  PlanningMode,
  DragMealData,
  MealType,
  PlanningPreferences,
  GenerationProgress,
  PlanningStats,
  WeeklyReport,
  GenerationRequest,
  GenerationConfig,
  NutritionalGoals,
  CustomPlanResult,
  GoalComparison,
  ShoppingListItemSuggestion,
  MealDifficulty,
  PlanningTemplate,
} from '@/features/planning/types';
import type { WeeklyNutrition } from '@/features/planning/types';
import type { UserProfile } from '@/features/user/userTypes';
import * as planningService from '@/features/planning/planningService';
import { PlanningEngine } from '@/features/planning/planningEngine';
import { calculateWeeklyNutrition, compareWithGoals } from '@/features/planning/utils/nutritionalCalculations';
import { usePantryStore } from './pantryStore';
import { useRecipeStore } from './recipeStore';
import { useShoppingListStore } from './shoppingListStore';
import type { GeneratedRecipeData } from '@/types/recipeTypes';
import type { VisionInsightNormalized } from '@/types/vision';
import { TemplateService } from '@/features/planning/services/templateService';
import { handleError } from '@/lib/errorHandler';

const GENERATION_CONFIG_KEY = 'planning:generationConfig';
const NUTRITIONAL_GOALS_KEY = 'planning:nutritionalGoals';
const LAST_REQUEST_KEY = 'planning:lastGenerationRequest';

interface UIState {
  currentView: PlanningView;
  currentMode: PlanningMode;
  selectedDate: Date | null;
  isDragging: boolean;
  dragData: DragMealData | null;
  showTemplatesPanel: boolean;
  showMealDetails: boolean;
  selectedMeal: PlannedMeal | null;
}

interface PreviewState {
  isOpen: boolean;
  status: 'idle' | 'loading' | 'ready' | 'error';
  baseMeal: PlannedMeal | null;
  previewMeal: PlannedMeal | null;
  recipeData: GeneratedRecipeData | null;
  request: GenerationRequest | null;
  error: string | null;
}

interface AiStatus {
  provider: 'gemini';
  hasKey: boolean;
  source: 'user' | 'env' | null;
}

interface PlanningState {
  plannedMeals: PlannedMeal[];
  isLoading: boolean;
  error: string | null;
  currentRange: { start: string | null; end: string | null };
  ui: UIState;
  preview: PreviewState;
  engine: PlanningEngine;
  generation: GenerationProgress;
  preferences: PlanningPreferences | null;
  generationConfig: GenerationConfig | null;
  lastGenerationRequest: GenerationRequest | null;
  nutritionalGoals: NutritionalGoals | null;
  templates: PlanningTemplate[];
  stats: PlanningStats | null;
  weeklyReport: WeeklyReport | null;
  aiStatus: AiStatus;

  loadWeek: (referenceDate: Date) => Promise<{ start: string; end: string } | null>;
  refreshCurrentRange: () => Promise<void>;
  addMeal: (data: UpsertPlannedMealData) => Promise<PlannedMeal | null>;
  updateMeal: (mealId: string, data: UpsertPlannedMealData) => Promise<PlannedMeal | null>;
  deleteMeal: (mealId: string) => Promise<boolean>;
  clearCurrentWeek: () => Promise<boolean>;
  addMissingIngredients: (mealId: string) => Promise<void>;

  generateWeek: (params: { userId: string; referenceDate: Date; preferences?: PlanningPreferences }) => Promise<void>;
  generateCustomMeals: (params: { userId: string; request: GenerationRequest }) => Promise<CustomPlanResult | null>;
  generateAlternativePreview: (params: { userId: string; mealId: string; request?: GenerationRequest }) => Promise<PlannedMeal | null>;
  confirmAlternativePreview: (params: { userId: string }) => Promise<boolean>;
  cancelAlternativePreview: () => void;

  saveGenerationConfig: (config: Partial<GenerationConfig>) => void;
  loadGenerationConfig: () => void;
  setNutritionalGoals: (goals: NutritionalGoals) => void;
  loadNutritionalGoals: () => void;
  setUserProfile: (profile: UserProfile | null) => void;
  generateShoppingListFromCurrentPlan: () => Promise<ShoppingListItemSuggestion[] | null>;
  repeatLastGeneration: (userId: string) => Promise<void>;

  setView: (view: PlanningView) => void;
  setMode: (mode: PlanningMode) => void;
  setSelectedDate: (date: Date | null) => void;
  startDrag: (data: DragMealData) => void;
  endDrag: () => void;
  moveMeal: (mealId: string, newDate: string, newMealType: string) => Promise<boolean>;

  markMealExecuted: (mealId: string) => Promise<boolean>;
  markMealSkipped: (mealId: string) => Promise<boolean>;
  updateMealStatus: (mealId: string, status: string) => Promise<boolean>;

  loadTemplates: () => Promise<void>;
  saveAsTemplate: (name: string, description?: string) => Promise<boolean>;
  applyTemplate: (templateId: string) => Promise<boolean>;

  generateStats: () => void;
  generateWeeklyReport: () => WeeklyReport | null;

  resetGeneration: () => void;
  syncWithPantry: () => Promise<void>;
  syncWithRecipes: () => void;

  weeklyNutritionalSummary: () => WeeklyNutrition | null;
  goalProgress: () => GoalComparison | null;
  missingIngredientsCount: () => number;
  estimatedWeeklyCost: () => number | null;
  visionHistory: Array<{ insightId: string; appliedMealId: string; appliedAt: string }>;
  applyVisionInsight: (params: { insight: VisionInsightNormalized; date?: Date; mealType?: MealType }) => Promise<PlannedMeal | null>;
}

const initialUIState: UIState = {
  currentView: 'week',
  currentMode: 'view',
  selectedDate: null,
  isDragging: false,
  dragData: null,
  showTemplatesPanel: false,
  showMealDetails: false,
  selectedMeal: null,
};

const initialGenerationState: GenerationProgress = {
  status: 'idle',
  current_step: '',
  progress: 0,
  meals_generated: 0,
  errors: [],
  warnings: [],
};

const initialPreviewState: PreviewState = {
  isOpen: false,
  status: 'idle',
  baseMeal: null,
  previewMeal: null,
  recipeData: null,
  request: null,
  error: null,
};

const defaultPreferences: PlanningPreferences = {
  auto_generate: false,
  generation_frequency: 'manual',
  preferred_meal_types: ['Desayuno', 'Almuerzo', 'Cena'],
  preferred_difficulty: 'medium',
  max_prep_time: 60,
  max_cook_time: 45,
  target_calories_per_day: undefined,
  dietary_restrictions: [],
  allergies: [],
  check_availability: true,
  auto_update_shopping_list: true,
  favorite_cuisines: [],
  disliked_ingredients: [],
  available_equipment: [],
  meal_time_preferences: {},
  household_size: 1,
  primary_goal: null,
};

const computeWeekRange = (referenceDate: Date) => {
  const start = format(startOfWeek(referenceDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const end = format(endOfWeek(referenceDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  return { start, end };
};

const uniqueStringList = (...collections: Array<string[] | null | undefined>): string[] => {
  const set = new Set<string>();
  collections.forEach((collection) => {
    collection?.forEach((item) => {
      if (typeof item === 'string') {
        const trimmed = item.trim();
        if (trimmed.length > 0) {
          set.add(trimmed);
        }
      }
    });
  });
  return Array.from(set);
};

const englishToSpanishMealType: Record<string, MealType | undefined> = {
  breakfast: 'Desayuno',
  lunch: 'Almuerzo',
  dinner: 'Cena',
  snack: 'Merienda',
};

const normalizePreferredTime = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (/^\d{3}$/.test(trimmed)) {
    const padded = trimmed.padStart(4, '0');
    return `${padded.slice(0, 2)}:${padded.slice(2)}`;
  }
  if (/^\d{4}$/.test(trimmed)) {
    return `${trimmed.slice(0, 2)}:${trimmed.slice(2)}`;
  }
  if (/^\d{1,2}:\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  return undefined;
};

const extractMealPreferences = (
  preferred?: Record<string, unknown>,
): { schedule: Partial<Record<MealType, string>>; mealTypes: MealType[] } => {
  const schedule: Partial<Record<MealType, string>> = {};
  const mealTypes = new Set<MealType>();

  if (!preferred) {
    return { schedule, mealTypes: [] };
  }

  Object.entries(preferred).forEach(([key, value]) => {
    const mappedType = englishToSpanishMealType[key.toLowerCase()];
    if (!mappedType) return;
    const normalizedTime = normalizePreferredTime(value);
    if (normalizedTime) {
      schedule[mappedType] = normalizedTime;
    }
    mealTypes.add(mappedType);
  });

  return { schedule, mealTypes: Array.from(mealTypes) };
};

const resolveDifficultyFromProfile = (profile: UserProfile | null): MealDifficulty => {
  const rawDifficulty = profile?.difficulty_preference ?? profile?.cookingSkillLevel ?? '';
  const normalized = typeof rawDifficulty === 'string' ? rawDifficulty.toLowerCase() : '';

  if (['easy', 'simple', 'beginner', 'novice'].includes(normalized)) {
    return 'simple';
  }
  if (['hard', 'advanced', 'expert'].includes(normalized)) {
    return 'complex';
  }
  return 'medium';
};

const mapUserProfileToPreferences = (profile: UserProfile | null): PlanningPreferences => {
  if (!profile) {
    return { ...defaultPreferences };
  }

  const { schedule, mealTypes } = extractMealPreferences(
    (profile.preferredMealTimes ?? profile.preferred_meal_times ?? undefined) as Record<string, unknown>,
  );

  const preferredMealTypes = mealTypes.length ? mealTypes : defaultPreferences.preferred_meal_types;
  const favoriteCuisines = uniqueStringList(
    profile.preferredCuisines,
    profile.cuisinePreferences,
    profile.cuisine_preferences,
  );
  const dislikedIngredients = uniqueStringList(
    profile.dislikedIngredients,
    profile.excludedIngredients,
    profile.excluded_ingredients,
  );
  const dietaryRestrictions = uniqueStringList(
    profile.dietaryRestrictions,
    profile.dietary_preference ? [profile.dietary_preference] : undefined,
    profile.allergies_restrictions ? [profile.allergies_restrictions] : undefined,
  );
  const allergies = uniqueStringList(profile.excludedIngredients, profile.excluded_ingredients);

  const primaryGoal = profile.objectives?.primaryGoal ?? null;
  const targetCalories = profile.objectives?.calorieTarget ?? profile.maxCalories ?? profile.max_calories ?? undefined;

  const autoGenerate = primaryGoal === 'save_time';
  const generationFrequency: PlanningPreferences['generation_frequency'] = autoGenerate ? 'weekly' : 'manual';

  const resolvedMaxPrep = profile.max_prep_time ?? (primaryGoal === 'save_time' ? 30 : defaultPreferences.max_prep_time);
  const resolvedMaxCook = profile.max_prep_time
    ? Math.max(defaultPreferences.max_cook_time, profile.max_prep_time + 15)
    : defaultPreferences.max_cook_time;

  const availableEquipment = uniqueStringList(profile.availableEquipment, profile.available_equipment);

  return {
    ...defaultPreferences,
    auto_generate: autoGenerate,
    generation_frequency: generationFrequency,
    preferred_meal_types: preferredMealTypes,
    preferred_difficulty: resolveDifficultyFromProfile(profile),
    max_prep_time: resolvedMaxPrep,
    max_cook_time: resolvedMaxCook,
    target_calories_per_day: targetCalories ?? undefined,
    dietary_restrictions: dietaryRestrictions,
    allergies,
    check_availability: primaryGoal === 'save_money' ? true : defaultPreferences.check_availability,
    auto_update_shopping_list: primaryGoal === 'save_money' ? true : defaultPreferences.auto_update_shopping_list,
    favorite_cuisines: favoriteCuisines,
    disliked_ingredients: dislikedIngredients,
    available_equipment: availableEquipment,
    meal_time_preferences: schedule,
    household_size: Math.max(
      1,
      profile.householdSize ?? profile.household_size ?? defaultPreferences.household_size ?? 1,
    ),
    primary_goal: primaryGoal,
  };
};

const resolveGeminiEnvKey = (): string | null => {
  try {
    if (typeof process !== 'undefined' && process.env && typeof process.env.VITE_GEMINI_API_KEY === 'string') {
      return process.env.VITE_GEMINI_API_KEY;
    }
  } catch {
    // ignore
  }

  try {
    // eslint-disable-next-line no-new-func
    const meta = new Function('return (typeof import !== "undefined" && import.meta) ? import.meta : undefined;')();
    if (meta?.env?.VITE_GEMINI_API_KEY) {
      return meta.env.VITE_GEMINI_API_KEY as string;
    }
    return null;
  } catch {
    return null;
  }
};

const initialEnvGeminiKey = resolveGeminiEnvKey();

const initialAiStatus: AiStatus = {
  provider: 'gemini',
  hasKey: Boolean(initialEnvGeminiKey),
  source: initialEnvGeminiKey ? 'env' : null,
};

const sortMeals = (a: PlannedMeal, b: PlannedMeal) =>
  a.plan_date.localeCompare(b.plan_date) || a.meal_type.localeCompare(b.meal_type);

const persistToStorage = <T,>(key: string, value: T | null) => {
  if (typeof window === 'undefined') return;
  if (value === null) {
    window.localStorage.removeItem(key);
    return;
  }
  window.localStorage.setItem(key, JSON.stringify(value));
};

const readFromStorage = <T,>(key: string): T | null => {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn(`[planningStore] Unable to parse "${key}"`, error);
    return null;
  }
};

export const usePlanningStore = create<PlanningState>((set, get) => {
  const engine = new PlanningEngine();

  const loadPersistedConfig = () => {
    const storedConfig = readFromStorage<GenerationConfig>(GENERATION_CONFIG_KEY);
    if (storedConfig) {
      engine.setGenerationConfig(storedConfig);
      engine.setShoppingListIntegration({
        autoAddMissingIngredients: storedConfig.autoAddMissingIngredients ?? false,
        groupByCategory: storedConfig.groupByCategory ?? false,
        estimateCosts: storedConfig.estimateCosts ?? false,
        suggestAlternatives: true,
      });
    }
    const storedGoals = readFromStorage<NutritionalGoals>(NUTRITIONAL_GOALS_KEY);
    if (storedGoals) {
      engine.setNutritionalGoals(storedGoals);
    }
    const storedRequest = readFromStorage<GenerationRequest>(LAST_REQUEST_KEY);
    return { storedConfig, storedGoals, storedRequest };
  };

  const persisted = loadPersistedConfig();

  return {
    plannedMeals: [],
    isLoading: false,
    error: null,
    currentRange: { start: null, end: null },
    ui: initialUIState,
    preview: initialPreviewState,
    engine,
    generation: initialGenerationState,
    preferences: defaultPreferences,
    generationConfig: persisted.storedConfig ?? null,
    lastGenerationRequest: persisted.storedRequest ?? null,
    nutritionalGoals: persisted.storedGoals ?? null,
    templates: [],
    stats: null,
    weeklyReport: null,
    aiStatus: initialAiStatus,

    loadWeek: async (referenceDate) => {
      const { start, end } = computeWeekRange(referenceDate);
      set({ isLoading: true, error: null, currentRange: { start, end } });
      try {
        const meals = await planningService.getPlannedMeals(start, end);
        const enrichedMeals = await engine.enrichMealsWithData(
          meals,
          get().preferences || defaultPreferences,
        );
        const sorted = enrichedMeals.sort(sortMeals);
        set({ plannedMeals: sorted, isLoading: false });
        get().generateStats();
        return { start, end };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'No se pudo cargar la semana seleccionada.';
        set({ error: message, isLoading: false });
        return null;
      }
    },

    refreshCurrentRange: async () => {
      const { currentRange } = get();
      if (!currentRange.start || !currentRange.end) return;
      try {
        const meals = await planningService.getPlannedMeals(currentRange.start, currentRange.end);
        const enrichedMeals = await engine.enrichMealsWithData(
          meals,
          get().preferences || defaultPreferences,
        );
        set({ plannedMeals: enrichedMeals.sort(sortMeals) });
        get().generateStats();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'No se pudo actualizar la planificación.';
        set({ error: message });
      }
    },

    addMeal: async (data) => {
      try {
        const created = await planningService.upsertPlannedMeal(data);
        if (created) {
          let mealToStore = created;
          try {
            const preferences = get().preferences || defaultPreferences;
            const enrichedMeal = await engine.enrichMeal(created, preferences);
            mealToStore = enrichedMeal ?? created;
          } catch (enrichError) {
            console.warn('[planningStore] enrichMeal failed, using raw meal', enrichError);
          }
          set((state) => ({
            plannedMeals: [...state.plannedMeals, mealToStore].sort(sortMeals),
          }));
          get().generateStats();
        }
        return created;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'No se pudo registrar la comida.';
        set({ error: message });
        return null;
      }
    },

    updateMeal: async (mealId, data) => {
      try {
        const updated = await planningService.upsertPlannedMeal(data, mealId);
        if (updated) {
          const preferences = get().preferences || defaultPreferences;
          const enrichedMeal = await engine.enrichMeal(updated, preferences);
          set((state) => ({
            plannedMeals: state.plannedMeals
              .map((meal) => (meal.id === enrichedMeal.id ? enrichedMeal : meal))
              .sort(sortMeals),
          }));
          get().generateStats();
        }
        return updated;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'No se pudo actualizar la comida.';
        set({ error: message });
        return null;
      }
    },

    deleteMeal: async (mealId) => {
      const previous = get().plannedMeals;
      set((state) => ({ plannedMeals: state.plannedMeals.filter((meal) => meal.id !== mealId) }));
      try {
        await planningService.deletePlannedMeal(mealId);
        get().generateStats();
        return true;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'No se pudo eliminar la comida seleccionada.';
        set({ plannedMeals: previous, error: message });
        return false;
      }
    },

    clearCurrentWeek: async () => {
      const { currentRange, plannedMeals } = get();
      if (!currentRange.start || !currentRange.end) return false;
      set({ isLoading: true });
      try {
        await planningService.deletePlannedMealsInRange(currentRange.start, currentRange.end);
        set({
          plannedMeals: plannedMeals.filter(
            (meal) => meal.plan_date < currentRange.start! || meal.plan_date > currentRange.end!,
          ),
          isLoading: false,
          error: null,
        });
        get().generateStats();
        return true;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'No se pudo limpiar la semana actual.';
        set({ isLoading: false, error: message });
        return false;
      }
    },

    addMissingIngredients: async (mealId) => {
      const meal = get().plannedMeals.find((item) => item.id === mealId);
      if (!meal?.ingredient_status?.length) return;
      const missing = meal.ingredient_status.filter((status) => !status.available);
      if (!missing.length) return;

      const shoppingStore = useShoppingListStore.getState();
      await Promise.all(
        missing.map((ingredient) =>
          shoppingStore.addItem({
            name: ingredient.ingredient_name,
            quantity: Math.max(
              0,
              (ingredient.quantity_needed ?? 0) - (ingredient.quantity_available ?? 0),
            ),
            unit: ingredient.unit ?? null,
          }),
        ),
      );
    },

    generateWeek: async ({ userId, referenceDate, preferences }) => {
      await get().generateCustomMeals({
        userId,
        request: {
          selectedDays: eachDayArray(referenceDate).map((date) => format(date, 'yyyy-MM-dd')),
          selectedMealTypes:
            preferences?.preferred_meal_types ??
            get().preferences?.preferred_meal_types ??
            defaultPreferences.preferred_meal_types,
          calorieTarget:
            preferences?.target_calories_per_day ?? get().preferences?.target_calories_per_day,
          maxPrepTime: preferences?.max_prep_time ?? get().preferences?.max_prep_time,
          specificObjective: 'Comer saludable',
          autoUsePantryOnly: true,
          balanceMacrosAutomatically: true,
          considerSeason: true,
        },
      });
    },

    generateCustomMeals: async ({ userId, request }) => {
      const preferences = get().preferences || defaultPreferences;
      set({
        generation: {
          status: 'analyzing',
          current_step: 'Preparando generación...',
          progress: 10,
          meals_generated: 0,
          errors: [],
          warnings: [],
        },
      });

      try {
        const result = await engine.generateCustomPlan(
          userId,
          request,
          preferences,
          get().plannedMeals,
          (progress) => set({ generation: progress }),
        );

        const requestDays = new Set(request.selectedDays);
        const requestMealTypes = new Set(request.selectedMealTypes);
        const remainingMeals = get().plannedMeals.filter(
          (meal) =>
            !requestDays.has(meal.plan_date) || !requestMealTypes.has(meal.meal_type as any),
        );

        set({
          plannedMeals: [...remainingMeals, ...result.meals].sort(sortMeals),
          generation: {
            status: 'complete',
            current_step: 'Plan personalizado listo',
            progress: 100,
            meals_generated: result.meals.length,
            errors: result.failedSlots.map((slot) => slot.reason),
            warnings: result.warnings,
          },
          lastGenerationRequest: request,
        });

        persistToStorage(LAST_REQUEST_KEY, request);
        get().generateStats();

        if (result.shoppingListSuggestions?.length) {
          await persistShoppingSuggestions(result.shoppingListSuggestions);
        }

        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'No se pudo generar la semana.';
        set({
          generation: {
            status: 'error',
            current_step: 'Error en generación',
            progress: 100,
            meals_generated: 0,
            errors: [message],
            warnings: [],
          },
        });
        return null;
      }
    },

    generateAlternativePreview: async ({ userId, mealId, request }) => {
      const meal = get().plannedMeals.find((item) => item.id === mealId);
      if (!meal) {
        set({
          preview: {
            ...initialPreviewState,
            isOpen: true,
            status: 'error',
            error: 'No encontramos la comida seleccionada.',
          },
        });
        return null;
      }

      const preferences = get().preferences || defaultPreferences;
      const lastRequest = get().lastGenerationRequest;
      const effectiveRequest: GenerationRequest = {
        selectedDays: [meal.plan_date],
        selectedMealTypes: [meal.meal_type],
        calorieTarget:
          request?.calorieTarget ?? lastRequest?.calorieTarget ?? preferences.target_calories_per_day,
        specificObjective:
          request?.specificObjective ?? lastRequest?.specificObjective ?? 'Comer saludable',
        prioritizeIngredients: request?.prioritizeIngredients ?? lastRequest?.prioritizeIngredients,
        avoidIngredients:
          request?.avoidIngredients ?? lastRequest?.avoidIngredients ?? preferences.disliked_ingredients,
        maxPrepTime: request?.maxPrepTime ?? lastRequest?.maxPrepTime ?? preferences.max_prep_time,
        requireEquipment: request?.requireEquipment ?? lastRequest?.requireEquipment,
        dietaryMode: request?.dietaryMode ?? lastRequest?.dietaryMode,
        autoUsePantryOnly:
          request?.autoUsePantryOnly ?? lastRequest?.autoUsePantryOnly ?? preferences.check_availability,
        balanceMacrosAutomatically:
          request?.balanceMacrosAutomatically ??
          lastRequest?.balanceMacrosAutomatically ??
          true,
        cuisineVariety:
          request?.cuisineVariety ?? lastRequest?.cuisineVariety ?? preferences.favorite_cuisines,
        creativityLevel: request?.creativityLevel ?? lastRequest?.creativityLevel ?? 60,
        avoidRepeatingMainIngredients:
          request?.avoidRepeatingMainIngredients ??
          lastRequest?.avoidRepeatingMainIngredients ??
          true,
        considerSeason: request?.considerSeason ?? lastRequest?.considerSeason ?? true,
        maxBudgetLevel: request?.maxBudgetLevel ?? lastRequest?.maxBudgetLevel ?? 'medium',
      };

      set({
        preview: {
          ...initialPreviewState,
          isOpen: true,
          status: 'loading',
          baseMeal: meal,
          request: effectiveRequest,
        },
      });

      try {
        const result = await engine.generatePreviewForMeal({
          userId,
          meal,
          preferences,
          request: effectiveRequest,
          existingMeals: get().plannedMeals,
        });

        set({
          preview: {
            isOpen: true,
            status: 'ready',
            baseMeal: meal,
            previewMeal: result.previewMeal,
            recipeData: result.recipeData,
            request: effectiveRequest,
            error: null,
          },
        });

        return result.previewMeal;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'No se pudo generar la alternativa.';
        set({
          preview: {
            ...initialPreviewState,
            isOpen: true,
            status: 'error',
            baseMeal: meal,
            request: effectiveRequest,
            error: message,
          },
        });
        return null;
      }
    },

    confirmAlternativePreview: async ({ userId }) => {
      const { preview, preferences, plannedMeals } = get();
      if (!preview.baseMeal || !preview.recipeData) {
        return false;
      }

      set({
        preview: {
          ...preview,
          status: 'loading',
          error: null,
        },
      });

      try {
        const updatedMeal = await engine.applyPreviewToMeal({
          userId,
          mealId: preview.baseMeal.id,
          planDate: preview.baseMeal.plan_date,
          mealType: preview.baseMeal.meal_type,
          recipeData: preview.recipeData,
          preferences: preferences || defaultPreferences,
          request: preview.request ?? undefined,
        });

        set({
          plannedMeals: plannedMeals
            .map((meal) => (meal.id === preview.baseMeal?.id ? updatedMeal : meal))
            .sort(sortMeals),
          preview: initialPreviewState,
        });
        get().generateStats();
        return true;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'No se pudo aplicar la alternativa.';
        set({
          preview: {
            ...preview,
            status: 'error',
            error: message,
          },
        });
        return false;
      }
    },

    cancelAlternativePreview: () => {
      set({ preview: initialPreviewState });
    },

    saveGenerationConfig: (config) => {
      set((state) => {
        const merged = { ...(state.generationConfig ?? {}), ...config } as GenerationConfig;
        persistToStorage(GENERATION_CONFIG_KEY, merged);
        state.engine.setGenerationConfig(merged);
        state.engine.setShoppingListIntegration({
          autoAddMissingIngredients: merged.autoAddMissingIngredients ?? false,
          groupByCategory: merged.groupByCategory ?? false,
          estimateCosts: merged.estimateCosts ?? false,
          suggestAlternatives: true,
        });
        return { generationConfig: merged };
      });
    },

    loadGenerationConfig: () => {
      const stored = readFromStorage<GenerationConfig>(GENERATION_CONFIG_KEY);
      if (stored) {
        engine.setGenerationConfig(stored);
        engine.setShoppingListIntegration({
          autoAddMissingIngredients: stored.autoAddMissingIngredients ?? false,
          groupByCategory: stored.groupByCategory ?? false,
          estimateCosts: stored.estimateCosts ?? false,
          suggestAlternatives: true,
        });
        set({ generationConfig: stored });
      }
    },

    setNutritionalGoals: (goals) => {
      engine.setNutritionalGoals(goals);
      persistToStorage(NUTRITIONAL_GOALS_KEY, goals);
      set({ nutritionalGoals: goals });
    },

    loadNutritionalGoals: () => {
      const stored = readFromStorage<NutritionalGoals>(NUTRITIONAL_GOALS_KEY);
      if (stored) {
        engine.setNutritionalGoals(stored);
        set({ nutritionalGoals: stored });
      }
    },

    setUserProfile: (profile) => {
      engine.updateUserProfile(profile);
      const preferences = mapUserProfileToPreferences(profile);
      const userKey = profile?.geminiApiKey ?? profile?.gemini_api_key ?? null;
      const envKey = resolveGeminiEnvKey();
      const hasKey = Boolean(userKey || envKey);
      const source: AiStatus['source'] = userKey ? 'user' : envKey ? 'env' : null;

      set({
        preferences,
        aiStatus: {
          provider: 'gemini',
          hasKey,
          source,
        },
      });

      void (async () => {
        try {
          const currentMeals = get().plannedMeals;
          if (!currentMeals.length) return;
          const enrichedMeals = await engine.enrichMealsWithData(currentMeals, preferences);
          set({ plannedMeals: enrichedMeals.sort(sortMeals) });
          get().generateStats();
        } catch (error) {
          console.warn('[planningStore] No se pudieron actualizar las comidas con las nuevas preferencias', error);
        }
      })();
    },

    generateShoppingListFromCurrentPlan: async () => {
      try {
        const suggestions = await engine.generateShoppingListFromPlan(get().plannedMeals);
        await persistShoppingSuggestions(suggestions);
        return suggestions;
      } catch (error) {
        console.error('[planningStore] generateShoppingListFromCurrentPlan failed', error);
        return null;
      }
    },

    repeatLastGeneration: async (userId) => {
      const lastRequest = get().lastGenerationRequest;
      if (!lastRequest) return;
      await get().generateCustomMeals({ userId, request: lastRequest });
    },

    setView: (view) => set((state) => ({ ui: { ...state.ui, currentView: view } })),
    setMode: (mode) => set((state) => ({ ui: { ...state.ui, currentMode: mode } })),
    setSelectedDate: (date) => set((state) => ({ ui: { ...state.ui, selectedDate: date } })),

    startDrag: (data) => set((state) => ({ ui: { ...state.ui, isDragging: true, dragData: data } })),
    endDrag: () => set((state) => ({ ui: { ...state.ui, isDragging: false, dragData: null } })),

    moveMeal: async (mealId, newDate, newMealType) => {
      const meal = get().plannedMeals.find((m) => m.id === mealId);
      if (!meal) return false;
      try {
        await get().updateMeal(mealId, {
          ...meal,
          plan_date: newDate,
          meal_type: newMealType as any,
        });
        return true;
      } catch {
        return false;
      }
    },

    markMealExecuted: async (mealId) => get().updateMealStatus(mealId, 'executed'),
    markMealSkipped: async (mealId) => get().updateMealStatus(mealId, 'skipped'),

    updateMealStatus: async (mealId, status) => {
      const meal = get().plannedMeals.find((m) => m.id === mealId);
      if (!meal) return false;

      const updateData: Partial<PlannedMeal> = {
        status: status as any,
        ...(status === 'executed' ? { executed_at: new Date().toISOString() } : {}),
      };

      try {
        await get().updateMeal(mealId, { ...meal, ...updateData });
        return true;
      } catch {
        return false;
      }
    },

    loadTemplates: async () => {
      try {
        const [owned, shared] = await Promise.all([
          TemplateService.getUserTemplates(),
          TemplateService.getPublicTemplates(20),
        ]);
        set({ templates: [...owned, ...shared] });
      } catch (error) {
        handleError(error, {
          component: 'planningStore',
          action: 'loadTemplates',
          severity: 'low',
        });
      }
    },

    saveAsTemplate: async (name, description) => {
      const meals = get().plannedMeals;
      if (!meals.length) {
        return false;
      }

      try {
        await TemplateService.createTemplate({
          name,
          description,
          category: 'personal',
          is_public: false,
          meals,
        });

        // Recargar plantillas para incluir la nueva
        await get().loadTemplates();
        return true;
      } catch (error) {
        handleError(error, {
          component: 'planningStore',
          action: 'saveAsTemplate',
          severity: 'medium',
          metadata: { templateName: name },
        });
        return false;
      }
    },

    applyTemplate: async (templateId) => {
      const { currentRange, plannedMeals } = get();
      const baseStart = currentRange.start
        ? currentRange.start
        : format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
      const baseDate = parseISO(`${baseStart}T00:00:00`);

      set({ isLoading: true });

      try {
        const template = await TemplateService.getTemplateById(templateId);
        if (!template) {
          throw new Error('Plantilla no encontrada');
        }

        const maxDayIndex = template.template_data.meals.reduce(
          (acc, meal) => Math.max(acc, meal.day_index),
          0,
        );
        const totalDays = template.template_data.metadata.total_days ?? (maxDayIndex + 1);
        const rangeDays = Math.max(totalDays, maxDayIndex + 1);
        const baseEnd = format(addDays(baseDate, Math.max(rangeDays - 1, 0)), 'yyyy-MM-dd');

        await planningService.deletePlannedMealsInRange(baseStart, baseEnd);

        const createdMeals: PlannedMeal[] = [];
        for (const meal of template.template_data.meals) {
          const planDate = format(addDays(baseDate, meal.day_index), 'yyyy-MM-dd');
          const upsertData: UpsertPlannedMealData = {
            plan_date: planDate,
            meal_type: meal.meal_type,
            recipe_id: meal.recipe_id ?? null,
            custom_title: meal.recipe_id ? null : meal.custom_title ?? null,
            notes: meal.notes ?? null,
            status: 'confirmed',
            difficulty: meal.difficulty,
            prep_time_minutes: meal.prep_time_minutes,
          };

          const created = await planningService.upsertPlannedMeal(upsertData);
          if (created) {
            createdMeals.push(created);
          }
        }

        const preferences = get().preferences || defaultPreferences;
        const enriched = await get().engine.enrichMealsWithData(createdMeals, preferences);

        const remainingMeals = plannedMeals.filter(
          (meal) => meal.plan_date < baseStart || meal.plan_date > baseEnd,
        );

        set({
          plannedMeals: [...remainingMeals, ...enriched].sort(sortMeals),
          currentRange: { start: baseStart, end: baseEnd },
          isLoading: false,
          error: null,
        });
        get().generateStats();
        return true;
      } catch (error) {
        handleError(error, {
          component: 'planningStore',
          action: 'applyTemplate',
          severity: 'medium',
          metadata: { templateId },
        });
        set({ isLoading: false });
        return false;
      }
    },

    generateStats: () => {
      const { plannedMeals, engine } = get();
      const stats = engine.generateWeeklyStats(plannedMeals);
      set({ stats });
    },

    generateWeeklyReport: () => {
      const { plannedMeals, currentRange, engine } = get();
      if (!currentRange.start) return null;
      const weekStart = new Date(`${currentRange.start}T00:00:00`);
      const report = engine.generateWeeklyReport(weekStart, plannedMeals);
      set({ weeklyReport: report });
      return report;
    },

    resetGeneration: () => set({ generation: initialGenerationState }),

    syncWithPantry: async () => {
      try {
        const pantryItems = usePantryStore.getState().items;
        engine.updatePantryState(pantryItems);
        const { plannedMeals, preferences } = get();
        const enrichedMeals = await engine.enrichMealsWithData(
          plannedMeals,
          preferences || defaultPreferences,
        );
        set({ plannedMeals: enrichedMeals.sort(sortMeals) });
      } catch (error) {
        console.error('[planningStore] syncWithPantry failed', error);
      }
    },

    syncWithRecipes: () => {
      const recipes = useRecipeStore.getState().recipes;
      get().engine.updateUserRecipes(recipes);
    },

    weeklyNutritionalSummary: () => {
      const meals = get().plannedMeals;
      if (!meals.length) return null;
      return calculateWeeklyNutrition(meals);
    },

    goalProgress: () => {
      const goals = get().nutritionalGoals;
      if (!goals) return null;
      const weeklyNutrition = calculateWeeklyNutrition(get().plannedMeals);
      return compareWithGoals(weeklyNutrition.averages, goals);
    },

    missingIngredientsCount: () => {
      return get()
        .plannedMeals.flatMap((meal) => meal.ingredient_status ?? [])
        .filter((status) => !status.available).length;
    },

    estimatedWeeklyCost: () => {
      const total = get()
        .plannedMeals.map((meal) => meal.cost_estimate ?? 0)
        .reduce((acc, value) => acc + value, 0);
      return total > 0 ? Number(total.toFixed(2)) : null;
    },
    visionHistory: [],
    applyVisionInsight: async ({ insight, date, mealType }) => {
      try {
        const suggested = insight.recommendedActions?.find((action) => action.suggestedMealType)?.suggestedMealType as MealType | undefined;
        const resolvedMealType = mealType ?? suggested ?? 'Cena';
        const referenceDate = date ?? get().ui.selectedDate ?? new Date();
        const planDate = format(referenceDate, 'yyyy-MM-dd');

        const title = insight.summary?.trim().slice(0, 80) || 'Comida sugerida por visión';
        const ingredientSummary = insight.ingredients?.length
          ? `Ingredientes detectados: ${insight.ingredients.slice(0, 5).map((item) => item.name).join(', ')}`
          : null;
        const actionsSummary = insight.recommendedActions?.length
          ? `Acciones sugeridas: ${insight.recommendedActions.slice(0, 3).map((action) => action.label).join(', ')}`
          : null;

        const notes = [
          'Generado a partir de Gemini Vision.',
          ingredientSummary,
          actionsSummary,
        ]
          .filter(Boolean)
          .join('\n');

        const created = await get().addMeal({
          plan_date: planDate,
          meal_type: resolvedMealType,
          custom_title: title,
          notes,
          status: 'draft',
        });

        if (created) {
          set((state) => ({
            visionHistory: [
              {
                insightId: insight.id,
                appliedMealId: created.id,
                appliedAt: new Date().toISOString(),
              },
              ...state.visionHistory,
            ].slice(0, 20),
          }));
        }

        return created;
      } catch (error) {
        console.error('[planningStore] applyVisionInsight failed', error);
        return null;
      }
    },
  };
});

const persistShoppingSuggestions = async (suggestions: ShoppingListItemSuggestion[]) => {
  const shoppingStore = useShoppingListStore.getState();
  await Promise.all(
    suggestions.map((item) =>
      shoppingStore.addItem({
        name: item.ingredient_name,
        quantity: item.quantity,
        unit: item.unit ?? null,
      }),
    ),
  );
};

const eachDayArray = (referenceDate: Date) => {
  const { start, end } = computeWeekRange(referenceDate);
  const dates: Date[] = [];
  const current = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  while (current <= endDate) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
};
