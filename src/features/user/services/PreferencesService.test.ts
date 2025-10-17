const mockSupabase = {
  mockFrom: jest.fn()
};

jest.mock('@/lib/supabaseClient', () => {
  const mockFrom = jest.fn();
  return {
    supabase: {
      from: mockFrom
    },
    mockFrom
  };
});

const { mockFrom } = jest.requireMock('@/lib/supabaseClient');

import { preferencesService } from './PreferencesService';
import { DEFAULT_USER_PREFERENCES } from '@/types/userPreferences';

describe('PreferencesService', () => {
  beforeEach(() => {
    mockFrom.mockReset();
    preferencesService.clearCache();
  });

  describe('getUserPreferences', () => {
    it('returns mapped preferences from Supabase', async () => {
      const profileRow = {
        cuisine_preferences: ['italiana', 'mexicana'],
        disliked_ingredients: ['cebolla', 'ajo'],
        cooking_skill_level: 'complex',
        preferred_meal_times: { breakfast: '0700', dinner: '2030' },
        dietary_restrictions: ['vegetariano'],
        max_calories: 1800,
        household_size: 2,
        objectives: { primaryGoal: 'save_money', weeklySavingsTarget: 25 },
        onboarding_completed_at: '2025-10-10T18:00:00Z'
      };

      const mockSingle = jest.fn().mockResolvedValue({ data: profileRow, error: null });
      const mockEq = jest.fn(() => ({ single: mockSingle }));
      const mockSelect = jest.fn(() => ({ eq: mockEq }));
      mockFrom.mockImplementationOnce(() => ({ select: mockSelect }));

      const result = await preferencesService.getUserPreferences('user-1');

      expect(result).toMatchObject({
        cuisinePreferences: ['italiana', 'mexicana'],
        dislikedIngredients: ['cebolla', 'ajo'],
        complexityPreference: 'complex',
        preferredMealTimes: { breakfast: '0700', dinner: '2030' },
        dietaryRestrictions: ['vegetariano'],
        maxCalories: 1800,
        householdSize: 2,
        objectives: {
          primaryGoal: 'save_money',
          weeklySavingsTarget: 25,
          calorieTarget: null,
          householdBudget: null
        },
        onboardingCompletedAt: '2025-10-10T18:00:00Z'
      });

      // Segunda llamada debería usar cache y no volver a invocar select
      mockFrom.mockClear();
      const cached = await preferencesService.getUserPreferences('user-1');
      expect(cached).toEqual(result);
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('returns defaults on Supabase error', async () => {
      const mockSingle = jest.fn().mockResolvedValue({ data: null, error: new Error('db error') });
      const mockEq = jest.fn(() => ({ single: mockSingle }));
      const mockSelect = jest.fn(() => ({ eq: mockEq }));
      mockFrom.mockImplementationOnce(() => ({ select: mockSelect }));

      const result = await preferencesService.getUserPreferences('user-err');
      expect(result).toEqual(DEFAULT_USER_PREFERENCES);
    });
  });

  describe('updatePreferences', () => {
    it('normalizes updates and refreshes cache', async () => {
      const mockEqUpdate = jest.fn().mockResolvedValue({ error: null });
      const mockUpdate = jest.fn(() => ({ eq: mockEqUpdate }));
      mockFrom.mockImplementationOnce(() => ({ update: mockUpdate }));

      const mockSingle = jest.fn().mockResolvedValue({
        data: {
          cuisine_preferences: ['italiana', 'mexicana'],
          disliked_ingredients: ['ajo'],
          cooking_skill_level: 'medium',
          preferred_meal_times: { breakfast: '0800' },
          dietary_restrictions: ['vegetariano'],
          max_calories: 2000,
          household_size: 1,
          objectives: { primaryGoal: 'health', calorieTarget: 1900 },
          onboarding_completed_at: null
        },
        error: null
      });
      const mockEqSelect = jest.fn(() => ({ single: mockSingle }));
      const mockSelect = jest.fn(() => ({ eq: mockEqSelect }));
      mockFrom.mockImplementationOnce(() => ({ select: mockSelect }));

      const result = await preferencesService.updatePreferences('user-1', {
        cuisinePreferences: ['italiana', 'italiana', 'mexicana'],
        preferredMealTimes: { breakfast: '0800', lunch: '1300', dinner: '2500' },
        maxCalories: -50,
        householdSize: 0,
        objectives: { primaryGoal: 'health', calorieTarget: 1900 }
      });

      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
        cuisine_preferences: ['italiana', 'mexicana'],
        preferred_meal_times: { breakfast: '0800', lunch: '1300' },
        max_calories: null,
        household_size: 1,
        objectives: {
          primaryGoal: 'health',
          weeklySavingsTarget: null,
          calorieTarget: 1900,
          householdBudget: null
        }
      }));
      expect(mockEqUpdate).toHaveBeenCalledWith('id', 'user-1');

      expect(result).toMatchObject({
        cuisinePreferences: ['italiana', 'mexicana'],
        householdSize: 1,
        objectives: {
          primaryGoal: 'health',
          calorieTarget: 1900
        }
      });
    });

    it('returns current preferences when no valid payload provided', async () => {
      const mockSingle = jest.fn().mockResolvedValue({ data: null, error: new Error('fetch fail') });
      const mockEq = jest.fn(() => ({ single: mockSingle }));
      const mockSelect = jest.fn(() => ({ eq: mockEq }));
      mockFrom.mockImplementationOnce(() => ({ select: mockSelect }));

      const result = await preferencesService.updatePreferences('user-1', {});
      expect(result).toEqual(DEFAULT_USER_PREFERENCES);
    });
  });

  describe('resetPreferences', () => {
    it('resets stored preferences to defaults', async () => {
      const mockEq = jest.fn().mockResolvedValue({ error: null });
      const mockUpdate = jest.fn(() => ({ eq: mockEq }));
      mockFrom.mockImplementationOnce(() => ({ update: mockUpdate }));

      await preferencesService.resetPreferences('user-1');

      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
        cuisine_preferences: DEFAULT_USER_PREFERENCES.cuisinePreferences,
        household_size: DEFAULT_USER_PREFERENCES.householdSize,
        max_calories: DEFAULT_USER_PREFERENCES.maxCalories,
        objectives: DEFAULT_USER_PREFERENCES.objectives
      }));
      expect(mockEq).toHaveBeenCalledWith('id', 'user-1');
    });
  });
});
