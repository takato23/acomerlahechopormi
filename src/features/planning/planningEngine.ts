import { eachDayOfInterval, format, startOfWeek, endOfWeek, parseISO } from 'date-fns';
import type {
  PlannedMeal,
  MealType,
  MealStatus,
  MealDifficulty,
  NutritionalInfo,
  IngredientStatus,
  GenerationContext,
  GenerationProgress,
  PlanningPreferences,
  PlanningStats,
  WeeklyReport,
  GenerationRequest,
  GenerationValidationResult,
  GenerationConfig,
  NutritionalGoals,
  ShoppingListIntegration,
  ShoppingListItemSuggestion,
  CustomPlanResult,
} from './types';
import type { PantryItem } from '@/features/pantry/types';
import type { GeneratedRecipeData, Recipe } from '@/types/recipeTypes';
import type { UserProfile } from '@/features/user/userTypes';
import { generateCustomMeals, generateSlotPreview, replaceMealWithGeneratedRecipe } from './planningOrchestrator';
import type { PreviousRecipeContext } from '@/features/recipes/generationService';
import { calculateWeeklyNutrition, generateNutritionalRecommendations } from './utils/nutritionalCalculations';
import { inferCategory } from '@/features/shopping-list/lib/categoryInference';
import { recipeImageProvider } from './services/recipeImageProvider';

interface EnrichedMealContext {
  request?: GenerationRequest;
  preferences: PlanningPreferences;
  context: GenerationContext;
}

type OptimizationContext = EnrichedMealContext & {
  goals?: NutritionalGoals | null;
};

/**
 * Motor de planificación con capacidades avanzadas de generación
 */
export class PlanningEngine {
  private pantryItems: PantryItem[] = [];
  private userRecipes: Recipe[] = [];
  private userProfile: UserProfile | null = null;
  private generationConfig: GenerationConfig | null = null;
  private nutritionalGoals: NutritionalGoals | null = null;
  private shoppingIntegration: ShoppingListIntegration | null = null;

  updatePantryState(pantryItems: PantryItem[]): void {
    this.pantryItems = pantryItems;
  }

  updateUserRecipes(recipes: Recipe[]): void {
    this.userRecipes = recipes;
  }

  updateUserProfile(profile: UserProfile | null): void {
    this.userProfile = profile;
  }

  setGenerationConfig(config: GenerationConfig | null): void {
    this.generationConfig = config;
  }

  setNutritionalGoals(goals: NutritionalGoals | null): void {
    this.nutritionalGoals = goals;
  }

  setShoppingListIntegration(integration: ShoppingListIntegration | null): void {
    this.shoppingIntegration = integration;
  }

  /**
   * Genera una semana completa usando los defaults (compatibilidad)
   */
  async generateWeeklyPlan(
    userId: string,
    referenceDate: Date,
    preferences: PlanningPreferences,
    existingMeals: PlannedMeal[] = [],
    onProgress?: (progress: GenerationProgress) => void,
  ): Promise<PlannedMeal[]> {
    const selectedDays = eachDayOfInterval({
      start: startOfWeek(referenceDate, { weekStartsOn: 1 }),
      end: endOfWeek(referenceDate, { weekStartsOn: 1 }),
    }).map((day) => format(day, 'yyyy-MM-dd'));

    const defaultRequest: GenerationRequest = {
      selectedDays,
      selectedMealTypes: preferences.preferred_meal_types,
      calorieTarget: preferences.target_calories_per_day,
      maxPrepTime: preferences.max_prep_time,
      specificObjective: this.mapPreferencesToGoal(preferences),
      requireEquipment: this.userProfile?.availableEquipment ?? this.userProfile?.available_equipment ?? [],
      avoidIngredients: preferences.disliked_ingredients,
      prioritizeIngredients: this.extractPriorityPantryIngredients(),
      autoUsePantryOnly: preferences.check_availability,
      balanceMacrosAutomatically: true,
      considerSeason: true,
      maxBudgetLevel: 'medium',
    };

    const result = await this.generateCustomPlan(
      userId,
      defaultRequest,
      preferences,
      existingMeals,
      onProgress,
    );

    return result.meals;
  }

  /**
   * Genera un plan personalizado con contexto enriquecido
   */
  async generateCustomPlan(
    userId: string,
    generationRequest: GenerationRequest,
    preferences: PlanningPreferences,
    existingMeals: PlannedMeal[] = [],
    onProgress?: (progress: GenerationProgress) => void,
  ): Promise<CustomPlanResult> {
    const validation = this.validateGenerationRequest(generationRequest);
    if (!validation.isValid) {
      throw new Error(validation.errors.join('. '));
    }

    onProgress?.({
      status: 'analyzing',
      current_step: 'Analizando tus preferencias y datos personales...',
      progress: 10,
      meals_generated: 0,
      errors: [],
      warnings: validation.warnings,
    });

    const orderedDays = [...generationRequest.selectedDays].sort();
    const referenceDate = parseISO(orderedDays[0]);
    const context = await this.buildGenerationContext(
      userId,
      referenceDate,
      preferences,
      { ...generationRequest, selectedDays: orderedDays },
    );

    onProgress?.({
      status: 'generating',
      current_step: 'Generando propuestas de comidas personalizadas...',
      progress: 40,
      meals_generated: 0,
      errors: [],
      warnings: validation.warnings,
    });

    const generationResult = await generateCustomMeals({
      userId,
      generationRequest,
      preferences,
      context,
      existingMeals,
      userRecipes: this.userRecipes,
    });

    onProgress?.({
      status: 'optimizing',
      current_step: 'Enriqueciendo y optimizando el plan...',
      progress: 70,
      meals_generated: generationResult.meals.length,
      errors: [],
      warnings: [...validation.warnings, ...generationResult.warnings],
    });

    const enrichedMeals = await this.enrichMealsWithData(
      generationResult.meals,
      preferences,
      generationRequest,
      context,
    );

    const optimizedMeals = this.optimizePlan(enrichedMeals, {
      request: generationRequest,
      preferences,
      context,
      goals: this.nutritionalGoals,
    });

    let shoppingListSuggestions: ShoppingListItemSuggestion[] | undefined;
    if (this.shoppingIntegration?.autoAddMissingIngredients) {
      shoppingListSuggestions = await this.generateShoppingListFromPlan(optimizedMeals);
    }

    onProgress?.({
      status: 'complete',
      current_step: 'Plan personalizado listo',
      progress: 100,
      meals_generated: optimizedMeals.length,
      errors: [],
      warnings: [...validation.warnings, ...generationResult.warnings],
    });

    return {
      meals: optimizedMeals,
      failedSlots: generationResult.failedSlots,
      warnings: [...validation.warnings, ...generationResult.warnings],
      validation,
      shoppingListSuggestions,
    };
  }

  async generatePreviewForMeal(params: {
    userId: string;
    meal: PlannedMeal;
    preferences: PlanningPreferences;
    request?: GenerationRequest;
    existingMeals?: PlannedMeal[];
  }): Promise<{ previewMeal: PlannedMeal; recipeData: GeneratedRecipeData }> {
    const { userId, meal, preferences, request, existingMeals = [] } = params;
    const normalizedRequest: GenerationRequest = {
      selectedDays: request?.selectedDays?.length ? request.selectedDays : [meal.plan_date],
      selectedMealTypes: request?.selectedMealTypes?.length ? request.selectedMealTypes : [meal.meal_type],
      calorieTarget: request?.calorieTarget,
      specificObjective: request?.specificObjective,
      prioritizeIngredients: request?.prioritizeIngredients,
      avoidIngredients: request?.avoidIngredients,
      maxPrepTime: request?.maxPrepTime ?? preferences.max_prep_time,
      requireEquipment: request?.requireEquipment,
      dietaryMode: request?.dietaryMode,
      autoUsePantryOnly: request?.autoUsePantryOnly ?? preferences.check_availability,
      balanceMacrosAutomatically: request?.balanceMacrosAutomatically ?? true,
      cuisineVariety: request?.cuisineVariety ?? preferences.favorite_cuisines,
      creativityLevel: request?.creativityLevel ?? 60,
      avoidRepeatingMainIngredients: request?.avoidRepeatingMainIngredients ?? true,
      considerSeason: request?.considerSeason ?? true,
      maxBudgetLevel: request?.maxBudgetLevel ?? 'medium',
    };

    const context = await this.buildGenerationContext(
      userId,
      parseISO(meal.plan_date),
      preferences,
      normalizedRequest,
    );

    const previousContext = this.buildPreviousContext(existingMeals, meal.id);

    const recipeData = await generateSlotPreview({
      userId,
      date: meal.plan_date,
      mealType: meal.meal_type,
      generationRequest: normalizedRequest,
      context,
      preferences,
      previousContext,
    });

    if (!recipeData.imageUrl) {
      try {
        const generatedImage = await recipeImageProvider.getImageUrl({
          title: recipeData.title,
          ingredients: recipeData.ingredients.map((ingredient) => ingredient.name),
        });
        if (generatedImage) {
          recipeData.imageUrl = generatedImage;
        }
      } catch (error) {
        console.warn('[PlanningEngine] No se pudo obtener imagen para la vista previa', error);
      }
    }

    const previewMeal = this.buildPreviewMeal(meal, recipeData);
    const [enrichedPreview] = await this.enrichMealsWithData(
      [previewMeal],
      preferences,
      normalizedRequest,
      context,
    );

    return {
      previewMeal: enrichedPreview,
      recipeData,
    };
  }

  async applyPreviewToMeal(params: {
    userId: string;
    mealId: string;
    planDate: string;
    mealType: MealType;
    recipeData: GeneratedRecipeData;
    preferences: PlanningPreferences;
    request?: GenerationRequest;
  }): Promise<PlannedMeal> {
    const { userId, mealId, planDate, mealType, recipeData, preferences, request } = params;
    const updatedMeal = await replaceMealWithGeneratedRecipe({
      userId,
      mealId,
      date: planDate,
      mealType,
      recipeData,
      notes: recipeData.description,
      request,
    });

    const enriched = await this.enrichMeal(updatedMeal, preferences, request);
    return enriched ?? updatedMeal;
  }

  /**
   * Valida una solicitud de generación personalizada
   */
  validateGenerationRequest(request: GenerationRequest): GenerationValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!request.selectedDays?.length) {
      errors.push('Selecciona al menos un día para generar comidas.');
    }

    if (!request.selectedMealTypes?.length) {
      errors.push('Selecciona al menos un tipo de comida.');
    }

    if (request.calorieTarget && (request.calorieTarget < 800 || request.calorieTarget > 5000)) {
      errors.push('El objetivo calórico debe estar entre 800 y 5000 kcal.');
    }

    if (request.maxPrepTime && (request.maxPrepTime < 10 || request.maxPrepTime > 240)) {
      warnings.push('El tiempo máximo de preparación es poco realista, se ajustará automáticamente.');
    }

    if (request.creativityLevel && (request.creativityLevel < 0 || request.creativityLevel > 100)) {
      warnings.push('El nivel de creatividad debe estar entre 0 y 100, se normalizará.');
    }

    if (request.prioritizeIngredients && request.avoidIngredients) {
      const conflicts = request.prioritizeIngredients.filter((item) =>
        request.avoidIngredients?.includes(item),
      );
      if (conflicts.length) {
        warnings.push(
          `Algunos ingredientes están en ambas listas (priorizar/evitar): ${conflicts.join(', ')}`,
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Genera una lista de compras basada en el plan actual
   */
  async generateShoppingListFromPlan(meals: PlannedMeal[]): Promise<ShoppingListItemSuggestion[]> {
    const suggestions: ShoppingListItemSuggestion[] = [];

    const groupedByIngredient = new Map<
      string,
      { total: number; unit: string; linkedMeals: string[] }
    >();

    meals.forEach((meal) => {
      const mealName = meal.recipes?.title ?? meal.custom_title ?? 'Comida personalizada';
      meal.ingredient_status?.forEach((status) => {
        if (status.available) return;
        const key = `${status.ingredient_name}:${status.unit}`;
        const current = groupedByIngredient.get(key) ?? {
          total: 0,
          unit: status.unit,
          linkedMeals: [],
        };
        current.total += Math.max(
          0,
          (status.quantity_needed ?? 0) - (status.quantity_available ?? 0),
        );
        if (!current.linkedMeals.includes(mealName)) {
          current.linkedMeals.push(mealName);
        }
        groupedByIngredient.set(key, current);
      });
    });

    for (const [key, value] of groupedByIngredient.entries()) {
      const [ingredientName] = key.split(':');
      const category = this.shoppingIntegration?.groupByCategory
        ? await this.safeInferCategory(ingredientName)
        : undefined;
      const estimatedCost = this.shoppingIntegration?.estimateCosts
        ? this.estimateIngredientCost(ingredientName, value.total)
        : undefined;
      suggestions.push({
        ingredient_name: ingredientName,
        quantity: Number(value.total.toFixed(2)),
        unit: value.unit,
        linkedMeals: value.linkedMeals,
        category: category ?? undefined,
        estimatedCost,
      });
    }

    return suggestions;
  }

  /**
   * Enriquecer comidas con información contextual
   */
  async enrichMealsWithData(
    meals: PlannedMeal[],
    preferences: PlanningPreferences,
    request?: GenerationRequest,
    context?: GenerationContext,
  ): Promise<PlannedMeal[]> {
    if (!meals.length) return meals;

    const enrichedContext: EnrichedMealContext = {
      request,
      preferences,
      context: context ?? (await this.buildGenerationContext(
        meals[0].user_id,
        parseISO(meals[0].plan_date),
        preferences,
        request,
      )),
    };

    return meals.map((meal) => this.enrichMealInstance(meal, enrichedContext));
  }

  async enrichMeal(
    meal: PlannedMeal,
    preferences: PlanningPreferences,
    request?: GenerationRequest,
    context?: GenerationContext,
  ): Promise<PlannedMeal> {
    const [enriched] = await this.enrichMealsWithData([meal], preferences, request, context);
    return enriched ?? meal;
  }

  /**
   * Genera estadísticas semanales
   */
  generateWeeklyStats(meals: PlannedMeal[]): PlanningStats {
    const executedMeals = meals.filter((meal) => meal.status === 'executed');
    const totalPlanned = meals.length;

    const totalPrepTime = meals
      .filter((meal) => meal.prep_time_minutes)
      .reduce((sum, meal) => sum + (meal.prep_time_minutes || 0), 0);

    const avgPrepTime = meals.length ? totalPrepTime / meals.length : 0;

    const totalCalories = meals.reduce(
      (sum, meal) => sum + (meal.nutritional_info?.calories ?? 0),
      0,
    );

    return {
      total_planned: totalPlanned,
      total_executed: executedMeals.length,
      compliance_rate: totalPlanned ? (executedMeals.length / totalPlanned) * 100 : 0,
      avg_prep_time: Math.round(avgPrepTime),
      total_calories: Math.round(totalCalories),
      cost_savings: 0,
      waste_reduction: 0,
    };
  }

  /**
   * Genera un reporte semanal completo
   */
  generateWeeklyReport(weekStart: Date, meals: PlannedMeal[]): WeeklyReport {
    const stats = this.generateWeeklyStats(meals);
    const nutrition = calculateWeeklyNutrition(meals);
    const suggestions = generateNutritionalRecommendations(meals, this.nutritionalGoals ?? {
      dailyCalories: 2000,
      proteinGrams: 100,
      carbsGrams: 250,
      fatGrams: 70,
      fiberGrams: 25,
      restrictions: [],
    });

    const ingredientCount: Record<string, number> = {};
    meals.forEach((meal) => {
      meal.recipes?.recipe_ingredients?.forEach((ingredient) => {
        const name = ingredient.ingredient_name || '';
        if (!name) return;
        ingredientCount[name] = (ingredientCount[name] ?? 0) + 1;
      });
    });

    const mostUsedIngredients = Object.entries(ingredientCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name]) => name);

    const mealCount: Record<string, number> = {};
    meals.forEach((meal) => {
      const mealName = meal.recipes?.title ?? meal.custom_title ?? '';
      if (!mealName) return;
      mealCount[mealName] = (mealCount[mealName] ?? 0) + 1;
    });

    const favoriteMeals = Object.entries(mealCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([name]) => name);

    return {
      week_start: format(weekStart, 'yyyy-MM-dd'),
      stats,
      most_used_ingredients: mostUsedIngredients,
      favorite_meals: favoriteMeals,
      suggestions: [...suggestions, `Promedio calórico diario: ${Math.round(nutrition.averages.calories ?? 0)} kcal`],
    };
  }

  analyzeWeeklyNutrition(meals: PlannedMeal[]): {
    total_calories: number;
    avg_daily_calories: number;
    protein_avg: number;
    carbs_avg: number;
    fat_avg: number;
    nutritional_score: 'excellent' | 'good' | 'fair' | 'poor';
    recommendations: string[];
  } {
    const weekly = calculateWeeklyNutrition(meals);
    const daysCount = weekly.days.length || 1;

    const totalCalories = weekly.totals.calories ?? 0;
    const totalProtein = weekly.totals.protein ?? 0;
    const totalCarbs = weekly.totals.carbs ?? 0;
    const totalFat = weekly.totals.fat ?? 0;

    const avgCalories = totalCalories / daysCount;
    const avgProtein = totalProtein / daysCount;
    const avgCarbs = totalCarbs / daysCount;
    const avgFat = totalFat / daysCount;

    let nutritionalScore: 'excellent' | 'good' | 'fair' | 'poor' = 'good';
    if (avgCalories < 800 || avgCalories > 3000) {
      nutritionalScore = 'fair';
    } else if (avgCalories >= 1800 && avgCalories <= 2400) {
      nutritionalScore = 'excellent';
    }

    return {
      total_calories: totalCalories,
      avg_daily_calories: Math.round(avgCalories),
      protein_avg: Math.round(avgProtein),
      carbs_avg: Math.round(avgCarbs),
      fat_avg: Math.round(avgFat),
      nutritional_score: nutritionalScore,
      recommendations: [],
    };
  }

  generateShoppingListFromMeals(meals: PlannedMeal[]): Array<{
    ingredient_name: string;
    quantity_needed: number;
    unit: string;
    meal_names: string[];
  }> {
    const missing = new Map<string, {
      ingredient_name: string;
      quantity_needed: number;
      unit: string;
      meal_names: string[];
    }>();

    meals.forEach((meal) => {
      const availability = this.checkIngredientAvailability(meal);
      availability.forEach((status) => {
        const deficit = (status.quantity_needed ?? 0) - (status.quantity_available ?? 0);
        if (deficit <= 0) return;
        const key = `${status.ingredient_name ?? ''}|${status.unit ?? ''}`;
        const current = missing.get(key) ?? {
          ingredient_name: status.ingredient_name ?? '',
          quantity_needed: 0,
          unit: status.unit ?? '',
          meal_names: [],
        };
        current.quantity_needed += deficit;
        const mealName = meal.recipes?.title ?? meal.custom_title ?? 'Comida planificada';
        if (mealName && !current.meal_names.includes(mealName)) {
          current.meal_names.push(mealName);
        }
        missing.set(key, current);
      });
    });

    return Array.from(missing.values());
  }

  /**
   * Optimiza el plan considerando objetivos y restricciones
   */
  private optimizePlan(
    meals: PlannedMeal[],
    optimizationContext: OptimizationContext,
  ): PlannedMeal[] {
    const { goals, request, preferences } = optimizationContext;
    const mealsByDay = this.groupMealsByDay(meals);

    Object.entries(mealsByDay).forEach(([date, dayMeals]) => {
      const totalPrepTime = dayMeals.reduce(
        (time, meal) => time + (meal.prep_time_minutes ?? meal.cook_time_minutes ?? 0),
        0,
      );

      if (request?.maxPrepTime && totalPrepTime > request.maxPrepTime) {
        dayMeals.forEach((meal) => {
          meal.notes = this.appendNote(
            meal.notes,
            'Sugerencia: dividir preparación para cumplir el tiempo máximo configurado.',
          );
        });
      }

      const calories = dayMeals.reduce(
        (sum, meal) => sum + (meal.nutritional_info?.calories ?? 0),
        0,
      );

      const goalCalories =
        request?.calorieTarget ?? goals?.dailyCalories ?? preferences.target_calories_per_day ?? 2000;

      if (calories < goalCalories * 0.8) {
        dayMeals.forEach((meal) => {
          meal.nutritional_recommendations = [
            ...(meal.nutritional_recommendations ?? []),
            'Considera añadir una guarnición rica en proteínas o grasas saludables para acercarte al objetivo calórico.',
          ];
        });
      }
    });

    return meals.sort((a, b) => a.plan_date.localeCompare(b.plan_date));
  }

  /**
   * Enriquecer una comida individual
   */
  private enrichMealInstance(meal: PlannedMeal, enrichedContext: EnrichedMealContext): PlannedMeal {
    const ingredientStatus = this.checkIngredientAvailability(meal);
    const nutritionalInfo = this.calculateNutritionalInfo(meal);
    const userEquipment = this.userProfile?.availableEquipment ?? this.userProfile?.available_equipment ?? [];
    const requiredEquipment = (meal.recipes as any)?.equipment_needed ?? [];
    const equipmentWarnings = requiredEquipment.filter(
      (equipment: string) => !userEquipment.includes(equipment),
    );

    const feasibilityScore = this.calculateFeasibilityScore({
      meal,
      ingredientStatus,
      equipmentWarnings,
      request: enrichedContext.request,
    });

    const substitutionSuggestions = this.buildSubstitutionSuggestions(ingredientStatus);
    const costEstimate = this.estimateMealCost(ingredientStatus);
    const nutritionalRecommendations = this.buildMealNutritionalRecommendations(nutritionalInfo);

    return {
      ...meal,
      status: meal.status ?? ('confirmed' as MealStatus),
      ingredient_status: ingredientStatus,
      nutritional_info: nutritionalInfo,
      feasibility_score: feasibilityScore,
      feasibility_notes: this.buildFeasibilityNotes(equipmentWarnings, ingredientStatus),
      substitution_suggestions: substitutionSuggestions,
      cost_estimate: costEstimate,
      equipment_warnings: equipmentWarnings,
      nutritional_recommendations: nutritionalRecommendations,
    };
  }

  private async buildGenerationContext(
    userId: string,
    referenceDate: Date,
    preferences: PlanningPreferences,
    request?: GenerationRequest,
  ): Promise<GenerationContext> {
    const season = this.getSeasonForDate(referenceDate);
    const profile = this.userProfile;
    const pantryStatus = this.getPantrySnapshot(request);

    return {
      user_profile: {
        objectives: profile?.objectives?.primaryGoal ? [profile.objectives.primaryGoal] : ['eat_better'],
        cooking_skill: preferences.preferred_difficulty,
        time_available: request?.maxPrepTime ?? preferences.max_prep_time,
        budget_level: request?.maxBudgetLevel ?? 'medium',
      },
      pantry_status: pantryStatus,
      previous_meals: [],
      weather: undefined,
      day_of_week: referenceDate.getDay(),
      season,
      userEquipment: profile?.availableEquipment ?? profile?.available_equipment ?? [],
      calorieGoal:
        request?.calorieTarget ??
        preferences.target_calories_per_day ??
        this.nutritionalGoals?.dailyCalories,
      specificObjective: request?.specificObjective,
      seasonalPreference: season,
      budgetConstraint: request?.maxBudgetLevel ?? 'medium',
      timeConstraint: request?.maxPrepTime ?? preferences.max_prep_time,
    };
  }

  private getPantrySnapshot(request?: GenerationRequest) {
    const servingIngredients = this.pantryItems.map((item) => item.ingredient_name ?? '').filter(Boolean);

    const expiringSoon = this.pantryItems
      .filter((item) => {
        if (!item.expiry_date) return false;
        const expiry = parseISO(item.expiry_date);
        const diff = (expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        return diff <= 5;
      })
      .map((item) => item.ingredient_name ?? '')
      .filter(Boolean);

    const prioritized = request?.prioritizeIngredients ?? [];

    return {
      available_ingredients: servingIngredients,
      low_stock_items: this.pantryItems
        .filter((item) => (item.quantity ?? 0) < 2)
        .map((item) => item.ingredient_name ?? '')
        .filter(Boolean),
      expiring_soon: expiringSoon,
      prioritized,
    };
  }

  private calculateFeasibilityScore(params: {
    meal: PlannedMeal;
    ingredientStatus: IngredientStatus[];
    equipmentWarnings: string[];
    request?: GenerationRequest;
  }): number {
    const { ingredientStatus, equipmentWarnings, request } = params;
    let score = 100;

    const missingIngredients = ingredientStatus.filter((status) => !status.available);
    score -= missingIngredients.length * 10;

    score -= equipmentWarnings.length * 15;

    if (request?.maxPrepTime && params.meal.prep_time_minutes) {
      if ((params.meal.prep_time_minutes ?? 0) > request.maxPrepTime) {
        score -= 20;
      }
    }

    if (params.meal.nutritional_info?.calories && request?.calorieTarget) {
      const diff = Math.abs(params.meal.nutritional_info.calories - request.calorieTarget);
      if (diff > request.calorieTarget * 0.25) {
        score -= 10;
      }
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private buildFeasibilityNotes(
    equipmentWarnings: string[],
    ingredientStatus: IngredientStatus[],
  ): string[] {
    const notes: string[] = [];
    if (ingredientStatus.some((status) => !status.available)) {
      notes.push('Faltan ingredientes, considera agregar sustituciones o comprar los faltantes.');
    }
    if (equipmentWarnings.length) {
      notes.push(`Revisa equipamiento requerido: ${equipmentWarnings.join(', ')}.`);
    }
    return notes;
  }

  private buildSubstitutionSuggestions(ingredientStatus: IngredientStatus[]): string[] {
    const suggestions: string[] = [];
    ingredientStatus
      .filter((status) => !status.available)
      .forEach((status) => {
        suggestions.push(
          `Sustituye ${status.ingredient_name} por una alternativa similar disponible en tu despensa.`,
        );
      });
    return suggestions;
  }

  private estimateMealCost(ingredientStatus: IngredientStatus[]): number | undefined {
    const missing = ingredientStatus.filter((status) => !status.available);
    if (!missing.length) return 0;
    const estimated = missing.reduce((sum, item) => {
      const base = 3; // valor promedio unitario
      const quantityFactor = Math.max(1, item.quantity_needed - item.quantity_available);
      return sum + base * quantityFactor;
    }, 0);
    return Number(estimated.toFixed(2));
  }

  private estimateIngredientCost(ingredientName: string, quantity: number): number | undefined {
    if (!quantity) return undefined;
    const normalized = ingredientName.toLowerCase();
    const costBaseline =
      normalized.includes('carne') || normalized.includes('salmón')
        ? 8
        : normalized.includes('queso') || normalized.includes('lácteo')
          ? 5
          : 2.5;
    return Number((costBaseline * Math.max(1, quantity)).toFixed(2));
  }

  private buildMealNutritionalRecommendations(info?: NutritionalInfo): string[] {
    if (!info) return [];
    const recommendations: string[] = [];

    if ((info.protein ?? 0) < 20) {
      recommendations.push('Añade una fuente adicional de proteínas para equilibrar la comida.');
    }

    if ((info.fiber ?? 0) < 5) {
      recommendations.push('Considera incorporar vegetales o legumbres para aumentar la fibra.');
    }

    if ((info.fat ?? 0) > 30) {
      recommendations.push('Reduce grasas saturadas usando aceites saludables o porciones más pequeñas.');
    }

    return recommendations;
  }

  /**
   * Verifica disponibilidad de ingredientes
   */
  checkIngredientAvailability(meal: PlannedMeal): IngredientStatus[] {
    if (!meal.recipes?.recipe_ingredients) return meal.ingredient_status ?? [];

    return meal.recipes.recipe_ingredients.map((ingredient) => {
      const pantryItem = this.pantryItems.find(
        (item) => item.ingredient_name?.toLowerCase() === ingredient.ingredient_name?.toLowerCase(),
      );

      const needed = ingredient.quantity ?? 0;
      const available = pantryItem?.quantity ?? 0;

      return {
        ingredient_name: ingredient.ingredient_name ?? '',
        available: available >= needed,
        quantity_needed: needed,
        quantity_available: available,
        unit: ingredient.unit ?? pantryItem?.unit ?? '',
      };
    });
  }

  private buildPreviewMeal(baseMeal: PlannedMeal, recipe: GeneratedRecipeData): PlannedMeal {
    const previewId = this.generatePreviewId(baseMeal.id);
    return {
      ...baseMeal,
      id: previewId,
      recipe_id: null,
      custom_title: null,
      status: 'draft',
      difficulty: (recipe.difficultyLevel as MealDifficulty | undefined) ?? baseMeal.difficulty,
      prep_time_minutes: recipe.prepTimeMinutes ?? undefined,
      cook_time_minutes: recipe.cookTimeMinutes ?? undefined,
      nutritional_info: recipe.nutritionalInfo ?? undefined,
      recipes: {
        id: `preview-recipe-${previewId}`,
        title: recipe.title,
        description: recipe.description,
        image_url: recipe.imageUrl ?? null,
        main_ingredients: recipe.mainIngredients ?? undefined,
        tags: recipe.tags ?? undefined,
        recipe_ingredients: recipe.ingredients.map((ingredient, index) => ({
          id: `preview-ing-${index}`,
          ingredient_name: ingredient.name,
          quantity: typeof ingredient.quantity === 'number' ? ingredient.quantity : null,
          unit: ingredient.unit ?? null,
        })),
      },
    };
  }

  private generatePreviewId(baseId: string): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return `preview-${crypto.randomUUID()}`;
    }
    return `preview-${baseId}-${Date.now()}`;
  }

  private buildPreviousContext(meals: PlannedMeal[], excludeMealId?: string): PreviousRecipeContext[] {
    return meals
      .filter((item) => item.id !== excludeMealId && item.recipe_id && (item.recipes?.title || item.custom_title))
      .map((item) => ({
        mealType: item.meal_type as PreviousRecipeContext['mealType'],
        recipeId: item.recipe_id as string,
        title: item.recipes?.title ?? item.custom_title ?? 'Comida generada',
        mainIngredients: item.recipes?.main_ingredients ?? undefined,
      }));
  }

  /**
   * Calcula información nutricional básica
   */
  calculateNutritionalInfo(meal: PlannedMeal): NutritionalInfo | undefined {
    if (meal.nutritional_info) return meal.nutritional_info;
    if (!meal.recipes?.recipe_ingredients) return undefined;

    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalFiber = 0;

    meal.recipes.recipe_ingredients.forEach((ingredient) => {
      const quantity = ingredient.quantity ?? 0;
      const name = ingredient.ingredient_name?.toLowerCase() ?? '';

      if (name.includes('pollo') || name.includes('carne')) {
        totalCalories += quantity * 2.5;
        totalProtein += quantity * 0.25;
        totalFat += quantity * 0.15;
      } else if (name.includes('arroz') || name.includes('pasta')) {
        totalCalories += quantity * 3.5;
        totalCarbs += quantity * 0.75;
      } else if (name.includes('verdura') || name.includes('ensalada') || name.includes('veg')) {
        totalCalories += quantity * 0.5;
        totalFiber += quantity * 0.05;
      }
    });

    return {
      calories: Math.round(totalCalories),
      protein: Math.round(totalProtein),
      carbs: Math.round(totalCarbs),
      fat: Math.round(totalFat),
      fiber: Math.round(totalFiber),
    };
  }

  private async safeInferCategory(name: string): Promise<string | null> {
    try {
      return await inferCategory(name);
    } catch (error) {
      console.warn('[PlanningEngine] No se pudo inferir categoría', error);
      return null;
    }
  }

  private mapPreferencesToGoal(preferences: PlanningPreferences): string {
    if (preferences.favorite_cuisines.length > 0) return 'Aprender a cocinar';
    if (preferences.max_prep_time < 30) return 'Ahorrar tiempo';
    if (preferences.auto_update_shopping_list) return 'Ahorrar dinero';
    return 'Comer saludable';
  }

  private extractPriorityPantryIngredients(): string[] {
    return this.pantryItems
      .filter((item) => (item.quantity ?? 0) > 0)
      .slice(0, 10)
      .map((item) => item.ingredient_name ?? '')
      .filter(Boolean);
  }

  private appendNote(notes: string | null | undefined, message: string): string {
    const existing = notes ?? '';
    return existing.includes(message) ? existing : `${existing} ${message}`.trim();
  }

  private groupMealsByDay(meals: PlannedMeal[]): Record<string, PlannedMeal[]> {
    return meals.reduce<Record<string, PlannedMeal[]>>((acc, meal) => {
      if (!acc[meal.plan_date]) {
        acc[meal.plan_date] = [];
      }
      acc[meal.plan_date].push(meal);
      return acc;
    }, {});
  }

  private getSeasonForDate(date: Date): 'spring' | 'summer' | 'fall' | 'winter' {
    const month = date.getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }
}
