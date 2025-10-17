import { act, renderHook } from '@testing-library/react';
import { usePlanningStore } from '@/stores/planningStore';
import * as planningService from '@/features/planning/planningService';
import type { PlannedMeal } from '@/features/planning/types';
import type { UserProfile } from '@/features/user/userTypes';
import type { GeneratedRecipeData } from '@/types/recipeTypes';
import type { VisionInsightNormalized } from '@/types/vision';

// Mock de servicios externos
jest.mock('@/features/planning/planningService');
jest.mock('@/stores/pantryStore');
jest.mock('@/stores/recipeStore');
jest.mock('@/features/planning/services/recipeImageProvider', () => ({
  recipeImageProvider: {
    getImageUrl: jest.fn(async () => null),
  },
}));
const mockAddItem = jest.fn();
jest.mock('@/stores/shoppingListStore', () => {
  const mockStore = Object.assign(jest.fn(), {
    getState: jest.fn(() => ({
      addItem: mockAddItem,
    })),
  });
  return { useShoppingListStore: mockStore };
});

const mockPlanningService = planningService as jest.Mocked<typeof planningService>;

describe('usePlanningStore', () => {
  beforeEach(() => {
    // Limpiar el store antes de cada test
    const { result: store } = renderHook(() => usePlanningStore());
    act(() => {
      store.current.resetGeneration();
      store.current.cancelAlternativePreview();
    });

    // Resetear mocks
    jest.clearAllMocks();
  });

  describe('loadWeek', () => {
    it('should load week data successfully', async () => {
      const mockMeals: PlannedMeal[] = [
        {
          id: '1',
          user_id: 'user1',
          plan_date: '2024-01-01',
          meal_type: 'Almuerzo' as const,
          recipe_id: null,
          custom_title: null,
          created_at: '2024-01-01T00:00:00Z'
        }
      ];

      mockPlanningService.getPlannedMeals.mockResolvedValue(mockMeals);

      const { result: store } = renderHook(() => usePlanningStore());

      let loadResult;
      await act(async () => {
        loadResult = await store.current.loadWeek(new Date('2024-01-01'));
      });

      expect(mockPlanningService.getPlannedMeals).toHaveBeenCalledWith(
        '2023-12-25',
        '2023-12-31'
      );
      expect(store.current.plannedMeals).toHaveLength(1);
      expect(store.current.isLoading).toBe(false);
      expect(loadResult).toBeDefined();
    });

    it('should handle load week error', async () => {
      const errorMessage = 'Network error';
      mockPlanningService.getPlannedMeals.mockRejectedValue(new Error(errorMessage));

      const { result: store } = renderHook(() => usePlanningStore());

      await act(async () => {
        await store.current.loadWeek(new Date('2024-01-01'));
      });

      expect(store.current.error).toBe(`Network error`);
      expect(store.current.isLoading).toBe(false);
    });
  });

  describe('addMeal', () => {
    it('should add meal successfully', async () => {
      act(() => {
        usePlanningStore.setState({ plannedMeals: [] });
      });
      const newMeal: PlannedMeal = {
        id: 'new-meal',
        user_id: 'user1',
        plan_date: '2024-01-01',
        meal_type: 'Almuerzo' as const,
        recipe_id: null,
        custom_title: 'Nueva comida',
        created_at: '2024-01-01T00:00:00Z'
      };

      const mealData = {
        plan_date: '2024-01-01',
        meal_type: 'Almuerzo' as const,
        custom_title: 'Nueva comida'
      };

      mockPlanningService.upsertPlannedMeal.mockResolvedValue(newMeal);

      const { result: store } = renderHook(() => usePlanningStore());

      let addedMeal;
      await act(async () => {
        addedMeal = await store.current.addMeal(mealData);
      });

      expect(mockPlanningService.upsertPlannedMeal).toHaveBeenCalledWith(mealData);
      expect(addedMeal).toEqual(newMeal);
    });
  });

  describe('updateMeal', () => {
    it('should update meal successfully', async () => {
      const existingMeal: PlannedMeal = {
        id: 'meal-1',
        user_id: 'user1',
        plan_date: '2024-01-01',
        meal_type: 'Almuerzo' as const,
        recipe_id: null,
        custom_title: null,
        created_at: '2024-01-01T00:00:00Z'
      };

      const updatedMeal = {
        ...existingMeal,
        custom_title: 'Comida actualizada'
      };

      // Configurar estado inicial
      const { result: store } = renderHook(() => usePlanningStore());
      act(() => {
        store.current.plannedMeals = [existingMeal];
      });

      mockPlanningService.upsertPlannedMeal.mockResolvedValue(updatedMeal);

      await act(async () => {
        await store.current.updateMeal('meal-1', {
          plan_date: '2024-01-01',
          meal_type: 'Almuerzo' as const,
          custom_title: 'Comida actualizada'
        });
      });

      expect(mockPlanningService.upsertPlannedMeal).toHaveBeenCalledWith(
        expect.objectContaining({ custom_title: 'Comida actualizada' }),
        'meal-1'
      );
      expect(store.current.plannedMeals[0]).toEqual(
        expect.objectContaining({ id: 'meal-1' })
      );
    });
  });

  describe('applyVisionInsight', () => {
    it('creates a draft meal and records insight history', async () => {
      const insight: VisionInsightNormalized = {
        id: 'insight-123',
        hash: 'hash-123',
        status: 'completed',
        source: 'gemini',
        summary: 'Proponer cena con pollo y verduras al vapor',
        ingredients: [
          { name: 'Pollo', confidence: 0.92 },
          { name: 'Brócoli', confidence: 0.81 },
        ],
        recommendedActions: [
          {
            id: 'action-1',
            type: 'plan_meal',
            label: 'Planificar comida',
            confidence: 0.7,
            suggestedMealType: 'Cena',
          },
        ],
        capturedAt: new Date().toISOString(),
      };

      const createdMeal: PlannedMeal = {
        id: 'meal-generated',
        user_id: 'user-1',
        plan_date: '2025-01-10',
        meal_type: 'Cena',
        recipe_id: null,
        custom_title: 'Proponer cena con pollo y verduras al vapor',
        created_at: '2025-01-10T00:00:00Z',
        notes: 'Generado por visión',
      } as PlannedMeal;

      mockPlanningService.upsertPlannedMeal.mockResolvedValue(createdMeal);

      const { result: store } = renderHook(() => usePlanningStore());

      let response: PlannedMeal | null = null;
      await act(async () => {
        response = await store.current.applyVisionInsight({
          insight,
          date: new Date(2025, 0, 10),
        });
      });

      expect(mockPlanningService.upsertPlannedMeal).toHaveBeenCalledWith(
        expect.objectContaining({
          plan_date: '2025-01-10',
          meal_type: 'Cena',
          status: 'draft',
        }),
      );

      expect(response).toEqual(createdMeal);
      expect(store.current.visionHistory[0]).toEqual(
        expect.objectContaining({ insightId: 'insight-123', appliedMealId: 'meal-generated' }),
      );
    });
  });

  describe('deleteMeal', () => {
    it('should delete meal successfully', async () => {
      const mealToDelete: PlannedMeal = {
        id: 'meal-1',
        user_id: 'user1',
        plan_date: '2024-01-01',
        meal_type: 'Almuerzo' as const,
        recipe_id: null,
        custom_title: null,
        created_at: '2024-01-01T00:00:00Z'
      };

      // Configurar estado inicial
      const { result: store } = renderHook(() => usePlanningStore());
      act(() => {
        store.current.plannedMeals = [mealToDelete];
      });

      mockPlanningService.deletePlannedMeal.mockResolvedValue(true);

      let deleteResult;
      await act(async () => {
        deleteResult = await store.current.deleteMeal('meal-1');
      });

      expect(mockPlanningService.deletePlannedMeal).toHaveBeenCalledWith('meal-1');
      expect(store.current.plannedMeals).toHaveLength(0);
      expect(deleteResult).toBe(true);
    });
  });

  describe('addMissingIngredients', () => {
    it('adds missing items to shopping list', async () => {
      const mealWithMissing: PlannedMeal = {
        id: 'meal-1',
        user_id: 'user1',
        plan_date: '2024-01-01',
        meal_type: 'Almuerzo',
        recipe_id: null,
        custom_title: 'Ensalada fresca',
        created_at: '2024-01-01T00:00:00Z',
        ingredient_status: [
          {
            ingredient_name: 'Tomate',
            available: false,
            quantity_needed: 2,
            quantity_available: 0,
            unit: 'unidad',
          },
          {
            ingredient_name: 'Lechuga',
            available: true,
            quantity_needed: 1,
            quantity_available: 1,
            unit: 'unidad',
          },
        ],
      };

      const { result: store } = renderHook(() => usePlanningStore());
      act(() => {
        usePlanningStore.setState({ plannedMeals: [mealWithMissing] });
      });

      await act(async () => {
        await store.current.addMissingIngredients('meal-1');
      });

      expect(mockAddItem).toHaveBeenCalledTimes(1);
      expect(mockAddItem).toHaveBeenCalledWith({
        name: 'Tomate',
        quantity: 2,
        unit: 'unidad',
      });
    });
  });

  describe('alternative preview flow', () => {
    const baseMeal: PlannedMeal = {
      id: 'meal-1',
      user_id: 'user1',
      plan_date: '2024-01-01',
      meal_type: 'Almuerzo',
      recipe_id: 'recipe-1',
      custom_title: null,
      created_at: '2024-01-01T00:00:00Z',
      recipes: {
        id: 'recipe-1',
        title: 'Pollo al horno',
        description: null,
        image_url: null,
        recipe_ingredients: [],
      },
    };

    const previewMeal: PlannedMeal = {
      ...baseMeal,
      id: 'preview-meal',
      recipe_id: null,
      recipes: {
        id: 'preview-recipe',
        title: 'Quinoa bowl',
        description: 'Alternativa ligera',
        image_url: null,
        recipe_ingredients: [],
      },
    };

    const recipeData: GeneratedRecipeData = {
      title: 'Quinoa bowl',
      description: 'Alternativa ligera',
      ingredients: [
        {
          name: 'Quinoa',
          quantity: 1,
          unit: 'taza',
        },
      ],
      instructions: ['Cocinar la quinoa', 'Mezclar ingredientes'],
      prepTimeMinutes: 10,
      cookTimeMinutes: 20,
      servings: 2,
    };

    it('generates a preview without persisting changes', async () => {
      const { result: store } = renderHook(() => usePlanningStore());
      act(() => {
        usePlanningStore.setState({ plannedMeals: [baseMeal] });
      });

      const previewSpy = jest
        .spyOn(store.current.engine, 'generatePreviewForMeal')
        .mockResolvedValue({
          previewMeal,
          recipeData,
        });

      let generatedPreview: PlannedMeal | null = null;
      await act(async () => {
        generatedPreview = await store.current.generateAlternativePreview({
          userId: 'user1',
          mealId: 'meal-1',
        });
      });

      expect(previewSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user1',
          meal: expect.objectContaining({ id: 'meal-1' }),
        }),
      );
      expect(generatedPreview).toEqual(previewMeal);
      expect(store.current.preview.status).toBe('ready');
      expect(store.current.preview.previewMeal).toEqual(previewMeal);
      expect(store.current.plannedMeals[0]).toEqual(baseMeal);
      previewSpy.mockRestore();
    });

    it('applies the preview replacing the planned meal', async () => {
      const updatedMeal: PlannedMeal = {
        ...baseMeal,
        recipe_id: 'recipe-2',
        recipes: {
          id: 'recipe-2',
          title: 'Quinoa bowl',
          description: 'Alternativa ligera',
          image_url: null,
          recipe_ingredients: [],
        },
      };

      const { result: store } = renderHook(() => usePlanningStore());
      act(() => {
        usePlanningStore.setState({ plannedMeals: [baseMeal] });
      });

      const previewSpy = jest.spyOn(store.current.engine, 'generatePreviewForMeal').mockResolvedValue({
        previewMeal,
        recipeData,
      });

      await act(async () => {
        await store.current.generateAlternativePreview({
          userId: 'user1',
          mealId: 'meal-1',
        });
      });

      const confirmSpy = jest
        .spyOn(store.current.engine, 'applyPreviewToMeal')
        .mockResolvedValue(updatedMeal);

      let applyResult: boolean | undefined;
      await act(async () => {
        applyResult = await store.current.confirmAlternativePreview({ userId: 'user1' });
      });

      expect(confirmSpy).toHaveBeenCalledWith(
        expect.objectContaining({ mealId: 'meal-1', userId: 'user1' }),
      );
      expect(applyResult).toBe(true);
      expect(store.current.plannedMeals[0]).toEqual(updatedMeal);
      expect(store.current.preview.isOpen).toBe(false);
      expect(store.current.preview.status).toBe('idle');
      previewSpy.mockRestore();
      confirmSpy.mockRestore();
    });
  });
  describe('markMealExecuted', () => {
    it('should mark meal as executed', async () => {
      const meal: PlannedMeal = {
        id: 'meal-1',
        user_id: 'user1',
        plan_date: '2024-01-01',
        meal_type: 'Almuerzo' as const,
        recipe_id: null,
        custom_title: null,
        status: 'confirmed' as const,
        created_at: '2024-01-01T00:00:00Z'
      };

      // Configurar estado inicial
      const { result: store } = renderHook(() => usePlanningStore());
      act(() => {
        store.current.plannedMeals = [meal];
      });

      mockPlanningService.upsertPlannedMeal.mockResolvedValue({
        ...meal,
        status: 'executed' as const,
        executed_at: expect.any(String)
      });

      let success: boolean | null = null;
      await act(async () => {
        success = await store.current.markMealExecuted('meal-1');
      });

      expect(success).toBe(true);
      expect(mockPlanningService.upsertPlannedMeal).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'executed' as const,
          executed_at: expect.any(String)
        }),
        'meal-1'
      );
    });
  });

  describe('UI state management', () => {
    it('should update view correctly', () => {
      const { result: store } = renderHook(() => usePlanningStore());

      act(() => {
        store.current.setView('day');
      });

      expect(store.current.ui.currentView).toBe('day');
    });

    it('should update mode correctly', () => {
      const { result: store } = renderHook(() => usePlanningStore());

      act(() => {
        store.current.setMode('edit');
      });

      expect(store.current.ui.currentMode).toBe('edit');
    });
  });

  describe('generateWeeklyStats', () => {
    it('should generate weekly statistics', () => {
      const { result: store } = renderHook(() => usePlanningStore());

      const mockMeals: PlannedMeal[] = [
        {
          id: '1',
          user_id: 'user1',
          plan_date: '2024-01-01',
          meal_type: 'Almuerzo' as const,
          status: 'executed' as const,
          recipe_id: null,
          custom_title: null,
          created_at: '2024-01-01T00:00:00Z',
          nutritional_info: { calories: 500 }
        },
        {
          id: '2',
          user_id: 'user1',
          plan_date: '2024-01-01',
          meal_type: 'Cena' as const,
          status: 'confirmed' as const,
          recipe_id: null,
          custom_title: null,
          created_at: '2024-01-01T00:00:00Z',
          nutritional_info: { calories: 600 }
        }
      ];

      act(() => {
        store.current.plannedMeals = mockMeals;
        store.current.generateStats();
      });

      expect(store.current.stats).toBeDefined();
      expect(store.current.stats?.total_planned).toBe(2);
      expect(store.current.stats?.total_executed).toBe(1);
      expect(store.current.stats?.compliance_rate).toBe(50);
    });
  });

  describe('setUserProfile', () => {
    it('maps preferences and AI status from the user profile', async () => {
      const profile: UserProfile = {
        id: 'user-1',
        username: 'Test User',
        avatarUrl: null,
        geminiApiKey: 'user-key',
        dietaryRestrictions: ['vegetariano'],
        dislikedIngredients: ['coliflor'],
        preferredCuisines: ['Italiana'],
        cuisinePreferences: [],
        cookingSkillLevel: 'medium',
        preferredMealTimes: { breakfast: '0730', lunch: '1300' },
        maxCalories: 1900,
        householdSize: 2,
        onboardingCompletedAt: null,
        objectives: {
          primaryGoal: 'health',
          weeklySavingsTarget: null,
          calorieTarget: 1800,
          householdBudget: null,
        },
        excludedIngredients: ['maní'],
        availableEquipment: ['Horno'],
        preferences: null,
        createdAt: undefined,
        updatedAt: undefined,
        cuisine_preferences: [],
        preferred_meal_times: {},
        max_calories: null,
        household_size: 2,
        onboarding_completed_at: null,
        dietary_preference: null,
        difficulty_preference: 'medium',
        max_prep_time: 35,
        allergies_restrictions: null,
        avatar_url: null,
        gemini_api_key: null,
        excluded_ingredients: ['maní'],
        available_equipment: ['Horno'],
      };

      const { result: store } = renderHook(() => usePlanningStore());

      await act(async () => {
        store.current.setUserProfile(profile);
        await Promise.resolve();
      });

      const preferences = store.current.preferences;
      expect(preferences).toBeTruthy();
      expect(preferences?.dietary_restrictions).toEqual(expect.arrayContaining(['vegetariano']));
      expect(preferences?.disliked_ingredients).toEqual(expect.arrayContaining(['coliflor', 'maní']));
      expect(preferences?.preferred_meal_types).toEqual(expect.arrayContaining(['Desayuno', 'Almuerzo']));
      expect(preferences?.meal_time_preferences?.Desayuno).toBe('07:30');
      expect(preferences?.target_calories_per_day).toBe(1800);
      expect(preferences?.primary_goal).toBe('health');
      expect(store.current.aiStatus).toEqual(
        expect.objectContaining({ hasKey: true, source: 'user' }),
      );
    });
  });
});
