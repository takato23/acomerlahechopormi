import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { OnboardingPage } from './OnboardingPage';
import { useOnboardingStore } from './useOnboardingStore';
import * as onboardingService from '@/features/onboarding/onboardingService';
import * as planningOrchestrator from '@/features/planning/planningOrchestrator';
import * as shoppingListService from '@/features/shopping-list/shoppingListService';

jest.mock('@/features/auth/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-123' }, loading: false })
}));

jest.mock('@/features/onboarding/onboardingService', () => ({
  completeOnboardingFlow: jest.fn()
}));

jest.mock('@/features/planning/planningOrchestrator', () => ({
  createInitialPlan: jest.fn()
}));

jest.mock('@/features/shopping-list/shoppingListService', () => ({
  generateShoppingList: jest.fn()
}));

jest.mock('@/features/user/userService', () => ({
  getUserProfile: jest.fn().mockResolvedValue(null)
}));

jest.mock('@/features/shopping-list/lib/categoryInference', () => ({
  initializeCategories: jest.fn().mockResolvedValue(undefined),
  inferCategory: jest.fn().mockResolvedValue(null),
}));

jest.mock('@/lib/analytics');

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

jest.mock('./components/steps/PrimaryGoalStep', () => ({
  PrimaryGoalStep: ({ onComplete }: any) => (
    <button onClick={() => onComplete({ primaryGoal: 'eat_better', notes: null })}>next-primary</button>
  ),
}));

jest.mock('./components/steps/DietaryPreferencesStep', () => ({
  DietaryPreferencesStep: ({ onComplete }: any) => (
    <button onClick={() => onComplete({ dietaryPreferences: [], allergies: [], dislikedIngredients: [] })}>
      next-dietary
    </button>
  ),
}));

jest.mock('./components/steps/HabitsStep', () => ({
  HabitsStep: ({ onComplete }: any) => (
    <button
      onClick={() =>
        onComplete({
          preferredMealTimes: { breakfast: '08:00' },
          preferredComplexity: 'medium',
          maxCookingMinutes: 45,
        })
      }
    >
      next-habits
    </button>
  ),
}));

jest.mock('./components/steps/InitialInventoryStep', () => ({
  InitialInventoryStep: ({ onComplete }: any) => (
    <button onClick={() => onComplete()}>next-inventory</button>
  ),
}));

jest.mock('./components/steps/QuantObjectivesStep', () => ({
  QuantObjectivesStep: ({ onComplete }: any) => (
    <button onClick={() => onComplete({ calorieTarget: 1800, weeklyBudget: 1500, householdSize: 2 })}>
      next-quant
    </button>
  ),
}));

jest.mock('./components/steps/ConfirmationStep', () => ({
  ConfirmationStep: ({ onConfirm }: any) => (
    <button onClick={() => onConfirm()}>confirm</button>
  ),
}));

const renderOnboarding = () =>
  render(
    <MemoryRouter initialEntries={['/app/onboarding']}>
      <Routes>
        <Route path="/app/onboarding" element={<OnboardingPage />} />
      </Routes>
    </MemoryRouter>
  );

const mockCompleteOnboardingFlow = onboardingService.completeOnboardingFlow as jest.MockedFunction<
  typeof onboardingService.completeOnboardingFlow
>;
const mockCreateInitialPlan = planningOrchestrator.createInitialPlan as jest.MockedFunction<
  typeof planningOrchestrator.createInitialPlan
>;
const mockGenerateShoppingList = shoppingListService.generateShoppingList as jest.MockedFunction<
  typeof shoppingListService.generateShoppingList
>;

describe('OnboardingPage', () => {
  beforeEach(() => {
    useOnboardingStore.getState().clearPersistedDraft();
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('permite avanzar por los pasos básicos', async () => {
    renderOnboarding();

    fireEvent.click(await screen.findByText('next-primary'));
    fireEvent.click(await screen.findByText('next-dietary'));
    fireEvent.click(await screen.findByText('next-habits'));
    fireEvent.click(await screen.findByText('next-inventory'));
    fireEvent.click(await screen.findByText('next-quant'));

    await screen.findByText('confirm');
  });

  it('sincroniza datos y genera plan al confirmar', async () => {
    mockCompleteOnboardingFlow.mockResolvedValue({
      profileUpdated: true,
      pantryInserted: 1,
      pantryUpdated: 0,
      completedAt: new Date().toISOString()
    });

    mockCreateInitialPlan.mockResolvedValue({
      createdMeals: 5,
      failedSlots: [],
      weekStart: '2025-10-13',
      weekEnd: '2025-10-19',
      warnings: []
    });

    mockGenerateShoppingList.mockResolvedValue([]);

    renderOnboarding();

    fireEvent.click(await screen.findByText('next-primary'));
    fireEvent.click(await screen.findByText('next-dietary'));
    fireEvent.click(await screen.findByText('next-habits'));
    fireEvent.click(await screen.findByText('next-inventory'));
    fireEvent.click(await screen.findByText('next-quant'));
    fireEvent.click(await screen.findByText('confirm'));

    await waitFor(() => {
      expect(mockCompleteOnboardingFlow).toHaveBeenCalled();
      expect(mockCreateInitialPlan).toHaveBeenCalledWith({
        userId: 'user-123',
        referenceDate: expect.any(Date),
        preferences: expect.objectContaining({})
      });
      expect(mockGenerateShoppingList).toHaveBeenCalled();
    });
  });
});
