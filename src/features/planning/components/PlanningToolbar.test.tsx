import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlanningToolbar } from './PlanningToolbar';
import { usePlanningStore } from '@/stores/planningStore';
import type { NutritionalGoals, PlannedMeal, PlanningStats } from '../types';

jest.mock('./GenerationConfigModal', () => ({
  GenerationConfigModal: () => null,
}));

jest.mock('./TemplatePanel', () => ({
  TemplatePanel: () => null,
}));

describe('PlanningToolbar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    usePlanningStore.setState(usePlanningStore.getInitialState(), true);
  });

  const buildMeal = (index: number, overrides: Partial<PlannedMeal> = {}): PlannedMeal => {
    const baseDate = overrides.plan_date ?? `2025-03-${String(10 + index).padStart(2, '0')}`;
    const baseMeal: PlannedMeal = {
      id: `meal-${index}`,
      user_id: 'user-123',
      plan_date: baseDate,
      meal_type: overrides.meal_type ?? 'Almuerzo',
      recipe_id: null,
      custom_title: overrides.custom_title ?? `Comida ${index}`,
      created_at: `${baseDate}T00:00:00.000Z`,
      nutritional_info: {
        calories: 700,
        protein: 35,
        carbs: 80,
        fat: 20,
        fiber: 10,
        ...(overrides.nutritional_info ?? {}),
      },
      ingredient_status: overrides.ingredient_status ?? [],
      ...overrides,
    };

    return baseMeal;
  };

  it('renders without triggering store subscription warnings or loops', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    render(<PlanningToolbar />);

    expect(screen.getByRole('button', { name: /Generar plan/i })).toBeInTheDocument();

    const errorMessages = errorSpy.mock.calls.map(([message]) => String(message));
    const warningMessages = warnSpy.mock.calls.map(([message]) => String(message));

    expect(errorMessages.some((message) => message.includes('Maximum update depth exceeded'))).toBe(false);
    expect(errorMessages.some((message) => message.includes('getSnapshot should be cached'))).toBe(false);
    expect(warningMessages.some((message) => message.includes('getSnapshot should be cached'))).toBe(false);

    errorSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it('disables AI-dependent actions and shows guidance when no Gemini key is available', () => {
    const initialState = usePlanningStore.getInitialState();
    usePlanningStore.setState(
      {
        ...initialState,
        aiStatus: { provider: 'gemini', hasKey: false, source: null },
        generation: { ...initialState.generation, status: 'idle', progress: 0 },
        plannedMeals: [],
        stats: null,
        nutritionalGoals: null,
      },
      true,
    );

    render(<PlanningToolbar />);

    const generateButton = screen.getByRole('button', { name: /Generar plan/i });
    expect(generateButton).toBeDisabled();
    expect(screen.getByText(/Agregá tu clave de Gemini/i)).toBeInTheDocument();
    expect(screen.getByText(/0 kcal/i)).toBeInTheDocument();
    expect(screen.queryByText(/completadas/i)).not.toBeInTheDocument();
  });

  it('surface weekly metrics and completion badge when the full week is planned', () => {
    const initialState = usePlanningStore.getInitialState();
    const plannedMeals: PlannedMeal[] = Array.from({ length: 7 }).map((_, index) =>
      buildMeal(index, {
        meal_type: 'Cena',
      }),
    );
    const stats: PlanningStats = {
      total_planned: 7,
      total_executed: 7,
      compliance_rate: 100,
      avg_prep_time: 35,
      total_calories: 4900,
      cost_savings: 120,
      waste_reduction: 40,
    };
    const goals: NutritionalGoals = {
      dailyCalories: 700,
      proteinGrams: 120,
      carbsGrams: 200,
      fatGrams: 70,
      fiberGrams: 30,
      restrictions: [],
    };

    usePlanningStore.setState(
      {
        ...initialState,
        plannedMeals,
        stats,
        nutritionalGoals: goals,
        generation: {
          ...initialState.generation,
          status: 'complete',
          current_step: 'Plan personalizado listo',
          progress: 100,
          meals_generated: plannedMeals.length,
        },
        aiStatus: { provider: 'gemini', hasKey: true, source: 'user' },
      },
      true,
    );

    render(<PlanningToolbar />);

    expect(screen.getByText('Plan listo')).toBeInTheDocument();
    expect(screen.getByText('✅ 7/7')).toBeInTheDocument();
    expect(screen.getByText(/🔥 700 kcal/i)).toBeInTheDocument();
  });

  it('handles rapid view switching without losing the active tab state', async () => {
    const initialState = usePlanningStore.getInitialState();
    usePlanningStore.setState(
      {
        ...initialState,
        aiStatus: { provider: 'gemini', hasKey: true, source: 'user' },
        ui: { ...initialState.ui, currentView: 'week' },
      },
      true,
    );

    const setViewSpy = jest.spyOn(usePlanningStore.getState(), 'setView');
    const user = userEvent.setup();

    render(<PlanningToolbar />);

    const weekButton = screen.getByText('Semana', { selector: 'button' }) as HTMLButtonElement;
    const dayButton = screen.getByText(/Día/i, { selector: 'button' }) as HTMLButtonElement;
    const dashboardButton = screen.getByText(/Dashboard/i, { selector: 'button' }) as HTMLButtonElement;

    expect(usePlanningStore.getState().ui.currentView).toBe('week');

    await user.click(dayButton);
    expect(setViewSpy).toHaveBeenNthCalledWith(1, 'day');
    expect(usePlanningStore.getState().ui.currentView).toBe('day');

    await user.click(dashboardButton);
    expect(setViewSpy).toHaveBeenNthCalledWith(2, 'dashboard');
    expect(usePlanningStore.getState().ui.currentView).toBe('dashboard');

    await user.click(weekButton);
    expect(setViewSpy).toHaveBeenNthCalledWith(3, 'week');
    expect(usePlanningStore.getState().ui.currentView).toBe('week');

    setViewSpy.mockRestore();
  });
});
