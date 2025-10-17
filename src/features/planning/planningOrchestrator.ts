import { eachDayOfInterval, format, startOfWeek, endOfWeek, parseISO } from 'date-fns';
import type {
  MealType as GenerationMealType,
  BaseStrategy,
  StyleModifier,
  PreviousRecipeContext,
  GenerateRecipeForSlotOptions,
} from '@/features/recipes/generationService';
import { generateRecipeForSlot } from '@/features/recipes/generationService';
import * as planningService from './planningService';
import type {
  PlannedMeal,
  UpsertPlannedMealData,
  GenerationRequest,
  GenerationContext,
  PlanningPreferences,
} from './types';
import type { RecipeInputData } from '@/features/recipes/services/recipeService';
import { addRecipe } from '@/features/recipes/services/recipeService';
import { recipeImageProvider } from './services/recipeImageProvider';
import type { GeneratedRecipeData, Recipe } from '@/types/recipeTypes';

type OrchestratorMealType = 'Desayuno' | 'Almuerzo' | 'Cena' | 'Merienda';

interface InitializeWeekPlanParams {
  startDate: string;
  endDate: string;
}

interface GenerateWeekParams {
  userId: string;
  startDate: string;
  endDate: string;
  mealTypes: OrchestratorMealType[];
  baseStrategy: BaseStrategy;
  styleModifier: StyleModifier;
  previousContext?: PreviousRecipeContext[];
  generationRequest?: GenerationRequest;
  context: GenerationContext;
  existingMeals?: PlannedMeal[];
  userRecipes?: Recipe[];
  preferences: PlanningPreferences;
}

interface GenerateSlotPreviewParams {
  userId: string;
  date: string;
  mealType: OrchestratorMealType;
  generationRequest?: GenerationRequest;
  context: GenerationContext;
  preferences: PlanningPreferences;
  previousContext?: PreviousRecipeContext[];
}

interface ReplaceMealParams {
  userId: string;
  mealId: string;
  date: string;
  mealType: OrchestratorMealType;
  recipeData: GeneratedRecipeData;
  notes?: string | null;
  request?: GenerationRequest;
}

interface GenerationResult {
  createdMeals: number;
  failedSlots: Array<{ date: string; mealType: OrchestratorMealType; reason: string }>;
  warnings: string[];
}

interface CreateInitialPlanParams {
  userId: string;
  referenceDate: Date;
  preferences: Pick<PlanningPreferences, 'preferred_meal_types' | 'preferred_difficulty'> & {
    primaryGoal?: string;
  };
}

interface CustomMealsParams {
  userId: string;
  generationRequest: GenerationRequest;
  preferences: PlanningPreferences;
  context: GenerationContext;
  existingMeals?: PlannedMeal[];
  userRecipes?: Recipe[];
}

export async function initializeWeekPlan({ startDate, endDate }: InitializeWeekPlanParams) {
  return planningService.getPlannedMeals(startDate, endDate);
}

export async function generateCustomMeals({
  userId,
  generationRequest,
  preferences,
  context,
  existingMeals = [],
  userRecipes = [],
}: CustomMealsParams) {
  const orderedDays = [...generationRequest.selectedDays].sort();
  const startDate = orderedDays[0];
  const endDate = orderedDays[orderedDays.length - 1];

  const baseStrategy = mapObjectiveToStrategy(generationRequest.specificObjective, preferences);
  const styleModifier = mapObjectiveToStyle(generationRequest.specificObjective);

  const result = await generateWeekFromPreferences({
    userId,
    startDate,
    endDate,
    mealTypes: (generationRequest.selectedMealTypes.length
      ? generationRequest.selectedMealTypes
      : preferences.preferred_meal_types) as OrchestratorMealType[],
    baseStrategy,
    styleModifier,
    generationRequest: { ...generationRequest, selectedDays: orderedDays },
    context,
    existingMeals,
    userRecipes,
    preferences,
  });

  const persistedMeals = await planningService.getPlannedMeals(startDate, endDate);
  const filtered = persistedMeals.filter(
    (meal) =>
      orderedDays.includes(meal.plan_date) &&
      (generationRequest.selectedMealTypes.length
        ? generationRequest.selectedMealTypes.includes(meal.meal_type)
        : true),
  );

  return {
    meals: filtered,
    failedSlots: result.failedSlots,
    warnings: result.warnings,
  };
}

export async function generateSlotPreview({
  userId,
  date,
  mealType,
  generationRequest,
  context,
  preferences,
  previousContext = [],
}: GenerateSlotPreviewParams): Promise<GeneratedRecipeData> {
  const slotDate = parseISO(`${date}T00:00:00`);
  const baseStrategy = mapObjectiveToStrategy(generationRequest?.specificObjective, preferences);
  const styleModifier = mapObjectiveToStyle(generationRequest?.specificObjective);

  const slotContext = buildSlotContext({
    date: slotDate,
    mealType,
    context,
    request: generationRequest,
  });

  const generation = await generateRecipeForSlot({
    userId,
    mealType: mealType as GenerationMealType,
    baseStrategy,
    styleModifier,
    nutritionalContext: slotContext.nutritionalContext,
    pantryContext: slotContext.pantryContext,
    objectiveContext: slotContext.objectiveContext,
    previousRecipesContext: previousContext,
    availableEquipment: context.userEquipment ?? [],
    calorieTarget: generationRequest?.calorieTarget,
    maxPrepTime: generationRequest?.maxPrepTime,
    specificObjective: generationRequest?.specificObjective,
    avoidIngredients: generationRequest?.avoidIngredients,
    prioritizeIngredients: generationRequest?.prioritizeIngredients,
    expiringIngredients: context.pantry_status.expiring_soon,
    dietaryMode: generationRequest?.dietaryMode,
    allergies: generationRequest?.avoidIngredients,
    dayOfWeek: slotContext.nutritionalContext.dayOfWeek,
    budgetLevel: generationRequest?.maxBudgetLevel ?? context.budgetConstraint,
    cuisinePreferences: preferencesCuisineList(preferences, generationRequest),
    season: context.season,
  });

  if ('error' in generation) {
    throw new Error(generation.error);
  }

  return generation;
}

export async function replaceMealWithGeneratedRecipe({
  userId,
  mealId,
  date,
  mealType,
  recipeData,
  notes,
  request,
}: ReplaceMealParams): Promise<PlannedMeal> {
  const savedRecipe = await persistGeneratedRecipe(userId, recipeData);
  const updatedMeal = await upsertMeal(
    {
      plan_date: date,
      meal_type: mealType,
      recipe_id: savedRecipe.id,
      custom_title: null,
      notes: notes ?? recipeData.description ?? null,
      status: 'confirmed',
      difficulty: (recipeData.difficultyLevel as UpsertPlannedMealData['difficulty']) ?? undefined,
      prep_time_minutes: recipeData.prepTimeMinutes ?? undefined,
      cook_time_minutes: recipeData.cookTimeMinutes ?? undefined,
      nutritional_info: recipeData.nutritionalInfo ?? undefined,
    },
    mealId,
  );

  if (!updatedMeal) {
    throw new Error('No se pudo actualizar la comida con la receta generada.');
  }

  if (request?.selectedDays && !request.selectedDays.includes(date)) {
    request.selectedDays.push(date);
  }

  return updatedMeal;
}

export async function generateWeekFromPreferences({
  userId,
  startDate,
  endDate,
  mealTypes,
  baseStrategy,
  styleModifier,
  previousContext = [],
  generationRequest,
  context,
  existingMeals = [],
  userRecipes = [],
  preferences,
}: GenerateWeekParams): Promise<GenerationResult> {
  const activeContext: GenerationContext = context ?? {
    user_profile: {
      objectives: ['health'],
      cooking_skill: preferences?.preferred_difficulty ?? 'medium',
      time_available: 60,
      budget_level: 'medium',
    },
    pantry_status: {
      available_ingredients: [],
      low_stock_items: [],
      expiring_soon: [],
    },
    previous_meals: [],
    day_of_week: 0,
    season: getCurrentSeason(),
    userEquipment: [],
    calorieGoal: preferences?.target_calories_per_day ?? 2000,
    specificObjective: undefined,
    seasonalPreference: getCurrentSeason(),
    budgetConstraint: (preferences as any)?.auto_update_shopping_list ? 'low' : 'medium',
    timeConstraint: (preferences as any)?.max_prep_time ?? 60,
  };
  const days = eachDayOfInterval({
    start: parseISO(`${startDate}T00:00:00`),
    end: parseISO(`${endDate}T00:00:00`),
  });

  const selectedDateSet = new Set(generationRequest?.selectedDays ?? []);
  const usedMeals = new Set(existingMeals.map((meal) => `${meal.plan_date}-${meal.meal_type}`));

  let createdMeals = 0;
  const failedSlots: GenerationResult['failedSlots'] = [];
  const warnings: string[] = [];

  const mealsToGenerate = Array.isArray(mealTypes) && mealTypes.length
    ? mealTypes
    : preferences?.preferred_meal_types ?? ['Desayuno', 'Almuerzo', 'Cena'];

  for (const day of days) {
    const dateStr = format(day, 'yyyy-MM-dd');
    if (selectedDateSet.size && !selectedDateSet.has(dateStr)) {
      continue;
    }

    const prettyDay = day.toLocaleDateString('es-AR', { weekday: 'long' });
    for (const meal of mealsToGenerate) {
      const key = `${dateStr}-${meal}`;
      if (usedMeals.has(key)) continue;

      const slotContext = buildSlotContext({
        date: day,
        mealType: meal,
        context: activeContext,
        request: generationRequest,
      });

      const generationOptions: GenerateRecipeForSlotOptions = {
        userId,
        mealType: meal as GenerationMealType,
        baseStrategy,
        styleModifier,
        nutritionalContext: slotContext.nutritionalContext,
        pantryContext: slotContext.pantryContext,
        objectiveContext: slotContext.objectiveContext,
        previousRecipesContext: previousContext,
        availableEquipment: activeContext.userEquipment ?? [],
        calorieTarget: generationRequest?.calorieTarget,
        maxPrepTime: generationRequest?.maxPrepTime,
        specificObjective: generationRequest?.specificObjective,
        avoidIngredients: generationRequest?.avoidIngredients,
        prioritizeIngredients: generationRequest?.prioritizeIngredients,
        expiringIngredients: activeContext.pantry_status.expiring_soon,
        dietaryMode: generationRequest?.dietaryMode,
        allergies: activeContext.user_profile.objectives.includes('health')
          ? activeContext.pantry_status.low_stock_items
          : undefined,
        dayOfWeek: prettyDay,
        budgetLevel: generationRequest?.maxBudgetLevel ?? activeContext.user_profile.budget_level,
        cuisinePreferences: preferencesCuisineList(preferences, generationRequest),
      };

      const generation = await generateRecipeForSlot(generationOptions);

      if ('error' in generation) {
        failedSlots.push({ date: dateStr, mealType: meal, reason: generation.error });
        previousContext = previousContext.filter((ctx) => ctx.mealType !== meal);
        continue;
      }

      const savedRecipe = await persistGeneratedRecipe(userId, generation);
      await upsertMeal({
        plan_date: dateStr,
        meal_type: meal,
        recipe_id: savedRecipe.id,
        notes: generation.description ?? slotContext.objectiveContext.summary,
      });
      createdMeals += 1;
      usedMeals.add(key);

      previousContext = [
        ...previousContext,
        {
          mealType: meal,
          recipeId: savedRecipe.id,
          title: savedRecipe.title,
          mainIngredients: savedRecipe.main_ingredients ?? undefined,
        },
      ];
    }
  }

  if (failedSlots.length && !generationRequest?.selectedMealTypes?.length) {
    warnings.push(
      'Algunas comidas no pudieron generarse automáticamente. Se agregaron alternativas personalizadas.',
    );
  }

  if (failedSlots.length > 0) {
    await provideFallbackMeals(userId, failedSlots, generationRequest, context);
  }

  return { createdMeals, failedSlots, warnings };
}

export async function createInitialPlan({ userId, referenceDate, preferences }: CreateInitialPlanParams) {
  const weekStart = format(startOfWeek(referenceDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const weekEnd = format(endOfWeek(referenceDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');

  const baseStrategy: BaseStrategy =
    preferences.primaryGoal === 'save_money' ? 'foco-despensa' : 'creacion-equilibrada';
  const styleModifier: StyleModifier =
    preferences.primaryGoal === 'save_time'
      ? 'rapido'
      : preferences.primaryGoal === 'health'
        ? 'saludable'
        : null;

  const existingMeals = await planningService.getPlannedMeals(weekStart, weekEnd);

  const result = await generateWeekFromPreferences({
    userId,
    startDate: weekStart,
    endDate: weekEnd,
    mealTypes: preferences.preferred_meal_types as OrchestratorMealType[],
    baseStrategy,
    styleModifier,
    context: {
      user_profile: {
        objectives: [preferences.primaryGoal ?? 'health'],
        cooking_skill: preferences.preferred_difficulty,
        time_available: (preferences as any).max_prep_time,
        budget_level: (preferences as any).auto_update_shopping_list ? 'low' : 'medium',
      },
      pantry_status: {
        available_ingredients: [],
        low_stock_items: [],
        expiring_soon: [],
      },
      previous_meals: existingMeals,
      day_of_week: referenceDate.getDay(),
      season: getCurrentSeason(),
    },
    existingMeals,
    preferences: preferences as PlanningPreferences,
  });

  return {
    ...result,
    weekStart,
    weekEnd,
  };
}

async function persistGeneratedRecipe(userId: string, recipe: GeneratedRecipeData) {
  const candidateImage =
    recipe.imageUrl ??
    (await recipeImageProvider.getImageUrl({
      title: recipe.title,
      ingredients: recipe.ingredients.map((ingredient) => ingredient.name),
    }));

  if (candidateImage) {
    recipe.imageUrl = candidateImage;
  }

  const recipeInput: RecipeInputData = {
    user_id: userId,
    title: recipe.title,
    description: recipe.description ?? null,
    ingredients: recipe.ingredients.map((ingredient) => ({
      name: ingredient.name,
      quantity: typeof ingredient.quantity === 'number' ? ingredient.quantity : null,
      unit: ingredient.unit ?? null,
    })),
    instructions: recipe.instructions ?? [],
    prep_time_minutes: recipe.prepTimeMinutes ?? null,
    cook_time_minutes: recipe.cookTimeMinutes ?? null,
    servings: recipe.servings ?? null,
    mainIngredients: recipe.mainIngredients,
    tags: recipe.tags ?? null,
    isBaseRecipe: true,
    image_url: recipe.imageUrl ?? null,
    is_favorite: false,
    difficulty_level: recipe.difficultyLevel ?? undefined,
    cuisine_type: recipe.cuisineType ?? undefined,
    estimated_time: recipe.estimatedTime ?? null,
    nutritional_info: recipe.nutritionalInfo ?? undefined,
    seasonal_flags: recipe.seasonalFlags ?? undefined,
    equipment_needed: recipe.equipmentNeeded ?? undefined,
  };

  return addRecipe(recipeInput);
}

async function upsertMeal(data: UpsertPlannedMealData, existingMealId?: string) {
  return planningService.upsertPlannedMeal(data, existingMealId);
}

function buildSlotContext({
  date,
  mealType,
  context,
  request,
}: {
  date: Date;
  mealType: OrchestratorMealType;
  context: GenerationContext;
  request?: GenerationRequest;
}) {
  const dayName = date.toLocaleDateString('es-AR', { weekday: 'long' });

  const rawObjectives = context.user_profile?.objectives;
  const objectivesArray = Array.isArray(rawObjectives)
    ? rawObjectives
    : rawObjectives && typeof rawObjectives === 'object' && 'primaryGoal' in (rawObjectives as any)
      ? [(rawObjectives as any).primaryGoal].filter(Boolean)
      : [];

  const nutritionalContext = {
    dayOfWeek: dayName,
    mealType,
    calorieTarget: request?.calorieTarget ?? context.calorieGoal,
    macroTargets: request?.balanceMacrosAutomatically
      ? {
          protein: objectivesArray.includes('health') ? 120 : 90,
          carbs: 220,
          fat: 60,
        }
      : undefined,
    dietaryRestrictions: request?.dietaryMode ? [request.dietaryMode] : [],
    allergies: request?.avoidIngredients ?? [],
    maxPrepTime: request?.maxPrepTime ?? context.timeConstraint,
    budgetLevel: request?.maxBudgetLevel ?? context.budgetConstraint,
    availableEquipment: context.userEquipment ?? [],
    seasonalIngredients: context.pantry_status.expiring_soon,
    expiringIngredients: context.pantry_status.expiring_soon,
  };

  const pantryContext = {
    available: context.pantry_status.available_ingredients,
    prioritized: request?.prioritizeIngredients ?? context.pantry_status.low_stock_items,
    expiringSoon: context.pantry_status.expiring_soon,
    autoUsePantryOnly: request?.autoUsePantryOnly ?? false,
  };

  const objectiveContext = {
    specificObjective: request?.specificObjective,
    summary: buildObjectiveSummary(request?.specificObjective, dayName, mealType),
    creativityLevel: request?.creativityLevel ?? 50,
    avoidRepeatingMainIngredients: request?.avoidRepeatingMainIngredients ?? true,
    considerSeason: request?.considerSeason ?? true,
  };

  return { nutritionalContext, pantryContext, objectiveContext };
}

function buildObjectiveSummary(
  specificObjective: string | undefined,
  dayName: string,
  mealType: string,
) {
  switch (specificObjective) {
    case 'Ahorrar dinero':
      return `${dayName} ${mealType}: Prioriza ingredientes económicos y que ya tengas disponible.`;
    case 'Ahorrar tiempo':
      return `${dayName} ${mealType}: Recetas rápidas con menos de 30 minutos de preparación.`;
    case 'Usar ingredientes de despensa':
      return `${dayName} ${mealType}: Maximiza el uso de ingredientes disponibles y próximos a vencer.`;
    case 'Aprender a cocinar':
      return `${dayName} ${mealType}: Introduce técnicas nuevas pero manejables paso a paso.`;
    default:
      return `${dayName} ${mealType}: Plan equilibrado y variado con foco en salud integral.`;
  }
}

function preferencesCuisineList(
  preferences?: PlanningPreferences,
  request?: GenerationRequest,
): string[] | undefined {
  if (request?.cuisineVariety?.length) return request.cuisineVariety;
  if (preferences?.favorite_cuisines?.length) return preferences.favorite_cuisines;
  return undefined;
}

async function provideFallbackMeals(
  userId: string,
  failedSlots: GenerationResult['failedSlots'],
  request: GenerationRequest | undefined,
  context: GenerationContext,
) {
  for (const slot of failedSlots) {
    const mealData: UpsertPlannedMealData = {
      plan_date: slot.date,
      meal_type: slot.mealType,
      custom_title: `Comida adaptable (${slot.mealType})`,
      notes: buildFallbackNotes(slot.reason, request, context),
    };
    await upsertMeal(mealData);
  }
}

function buildFallbackNotes(
  reason: string,
  request: GenerationRequest | undefined,
  context: GenerationContext,
): string {
  const restrictions = request?.avoidIngredients?.length
    ? `Evitar: ${request.avoidIngredients.join(', ')}.`
    : '';
  const equipmentList = context?.userEquipment ?? [];
  const equipment = equipmentList.length
    ? `Equipamiento disponible: ${equipmentList.join(', ')}.`
    : '';
  return `Fallback automático: ${reason}. ${restrictions} ${equipment}`.trim();
}

function mapObjectiveToStrategy(objective: string | undefined, preferences: PlanningPreferences): BaseStrategy {
  if (objective === 'Ahorrar dinero') return 'foco-despensa';
  if (objective === 'Ahorrar tiempo') return 'variedad-maxima';
  if (objective === 'Usar ingredientes de despensa') return 'foco-despensa';
  return (preferences as any).auto_update_shopping_list ? 'foco-despensa' : 'creacion-equilibrada';
}

function mapObjectiveToStyle(objective: string | undefined): StyleModifier {
  if (objective === 'Ahorrar tiempo') return 'rapido';
  if (objective === 'Comer saludable') return 'saludable';
  if (objective === 'Aprender a cocinar') return 'creativo';
  if (objective === 'Ahorrar dinero') return 'cocina-especifica';
  return null;
}

function getCurrentSeason(): 'spring' | 'summer' | 'fall' | 'winter' {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'fall';
  return 'winter';
}
