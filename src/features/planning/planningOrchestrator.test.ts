import { createInitialPlan, generateWeekFromPreferences } from './planningOrchestrator';
import { generateRecipeForSlot } from '@/features/recipes/generationService';
import { addRecipe } from '@/features/recipes/services/recipeService';
import * as planningService from './planningService';

jest.mock('@/features/recipes/generationService', () => ({
  generateRecipeForSlot: jest.fn()
}));

jest.mock('@/features/recipes/services/recipeService', () => ({
  addRecipe: jest.fn()
}));

jest.mock('./planningService', () => ({
  getPlannedMeals: jest.fn(),
  upsertPlannedMeal: jest.fn(),
  deletePlannedMealsInRange: jest.fn()
}));

const mockGeneratedRecipe = {
  title: 'Pasta rápida',
  description: 'Receta test',
  ingredients: [{ name: 'Pasta', quantity: 200, unit: 'g' }],
  instructions: ['Hervir agua', 'Cocinar pasta'],
  prepTimeMinutes: 10,
  cookTimeMinutes: 15,
  servings: 2,
  mainIngredients: ['Pasta']
};

const baseGenerationContext = {
  user_profile: {
    objectives: ['health'],
    cooking_skill: 'medium' as const,
    time_available: 45,
    budget_level: 'medium' as const
  },
  pantry_status: {
    available_ingredients: [],
    low_stock_items: [],
    expiring_soon: []
  },
  previous_meals: [],
  day_of_week: 1,
  season: 'spring' as const,
  userEquipment: [],
  budgetConstraint: 'medium' as const,
  timeConstraint: 45,
  calorieGoal: 2000
};

describe('planningOrchestrator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (planningService.getPlannedMeals as jest.Mock).mockResolvedValue([]);
    (addRecipe as jest.Mock).mockResolvedValue({
      id: 'recipe-1',
      title: mockGeneratedRecipe.title,
      main_ingredients: mockGeneratedRecipe.mainIngredients
    });
    (planningService.upsertPlannedMeal as jest.Mock).mockResolvedValue(null);
  });

  it('crea plan inicial con recetas generadas', async () => {
    (generateRecipeForSlot as jest.Mock).mockResolvedValue(mockGeneratedRecipe);

    const result = await createInitialPlan({
      userId: 'user-123',
      referenceDate: new Date('2025-10-13'),
      preferences: {
        preferred_meal_types: ['Almuerzo'],
        preferred_difficulty: 'medium',
        primaryGoal: 'eat_better'
      }
    });

    expect(generateRecipeForSlot).toHaveBeenCalled();
    expect(addRecipe).toHaveBeenCalled();
    expect(planningService.upsertPlannedMeal).toHaveBeenCalled();
    expect(result.createdMeals).toBeGreaterThan(0);
  });

  it('registra comidas personalizadas cuando la generación falla', async () => {
    (generateRecipeForSlot as jest.Mock)
      .mockResolvedValueOnce({ error: 'no-api-key' })
      .mockResolvedValue(mockGeneratedRecipe);

    const result = await generateWeekFromPreferences({
      userId: 'user-123',
      startDate: '2025-10-13',
      endDate: '2025-10-13',
      mealTypes: ['Desayuno'],
      baseStrategy: 'creacion-equilibrada',
      styleModifier: null,
      existingMeals: [],
      context: { ...baseGenerationContext },
      preferences: {
        preferred_meal_types: ['Desayuno'],
        preferred_difficulty: 'medium',
        max_prep_time: 45,
        auto_update_shopping_list: false
      } as any
    });

    expect(result.failedSlots.length).toBeGreaterThanOrEqual(1);
  });
});
