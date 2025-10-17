import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  OnboardingDraft,
  OnboardingStepId,
  PantryDraftItem,
  PrimaryGoal,
  ComplexityLevel,
  MealTimeKey
} from './types';
import type { UserProfile } from '@/features/user/userTypes';
import type { PreferredMealTimes } from '@/types/userPreferences';

interface OnboardingState {
  step: OnboardingStepId;
  draft: OnboardingDraft;
  completedSteps: OnboardingStepId[];
  isDirty: boolean;
  lastUpdatedAt: string | null;
  setStep: (step: OnboardingStepId) => void;
  markStepCompleted: (step: OnboardingStepId) => void;
  markStepIncomplete: (step: OnboardingStepId) => void;
  updateDraft: (update: Partial<OnboardingDraft>) => void;
  replaceDraft: (draft: OnboardingDraft) => void;
  reset: () => void;
  clearPersistedDraft: () => void;
  addInitialPantryItem: (item: PantryDraftItem) => void;
  updateInitialPantryItem: (id: string, update: Partial<PantryDraftItem>) => void;
  removeInitialPantryItem: (id: string) => void;
  hydrateFromProfile: (profile: UserProfile | null) => void;
}

const defaultDraft = (): OnboardingDraft => ({
  primaryGoal: null,
  dietaryPreferences: [],
  allergies: [],
  dislikedIngredients: [],
  preferredMealTimes: {},
  preferredComplexity: null,
  maxCookingMinutes: null,
  initialPantryItems: [],
  quantitativeObjectives: {
    calorieTarget: null,
    weeklyBudget: null,
    householdSize: null
  },
  notes: null
});

const baseState = (): Pick<OnboardingState, 'step' | 'draft' | 'completedSteps' | 'isDirty' | 'lastUpdatedAt'> => ({
  step: 'primaryGoal' as OnboardingStepId,
  draft: defaultDraft(),
  completedSteps: [],
  isDirty: false,
  lastUpdatedAt: null
});

const storage = typeof window !== 'undefined'
  ? createJSONStorage(() => window.localStorage)
  : undefined;

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      ...baseState(),
      setStep: (step) => set({ step }),
      markStepCompleted: (step) =>
        set((state) => ({
          completedSteps: Array.from(new Set([...state.completedSteps, step]))
        })),
      markStepIncomplete: (step) =>
        set((state) => ({
          completedSteps: state.completedSteps.filter((value) => value !== step)
        })),
      updateDraft: (update) =>
        set((state) => ({
          draft: { ...state.draft, ...update },
          isDirty: true,
          lastUpdatedAt: new Date().toISOString()
        })),
      replaceDraft: (draft) =>
        set({
          draft,
          isDirty: false,
          lastUpdatedAt: new Date().toISOString()
        }),
      reset: () => set(baseState()),
      clearPersistedDraft: () => {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem('onboarding_draft_v1');
        }
        set(baseState());
      },
      addInitialPantryItem: (item) =>
        set((state) => ({
          draft: {
            ...state.draft,
            initialPantryItems: [...state.draft.initialPantryItems, item]
          },
          isDirty: true,
          lastUpdatedAt: new Date().toISOString()
        })),
      updateInitialPantryItem: (id, update) =>
        set((state) => ({
          draft: {
            ...state.draft,
            initialPantryItems: state.draft.initialPantryItems.map((entry) =>
              entry.id === id ? { ...entry, ...update } : entry
            )
          },
          isDirty: true,
          lastUpdatedAt: new Date().toISOString()
        })),
      removeInitialPantryItem: (id) =>
        set((state) => ({
          draft: {
            ...state.draft,
            initialPantryItems: state.draft.initialPantryItems.filter((entry) => entry.id !== id)
          },
          isDirty: true,
          lastUpdatedAt: new Date().toISOString()
        })),
      hydrateFromProfile: (profile) => {
        if (!profile) return;
        const preferences = (profile.preferences ?? {}) as Record<string, unknown>;
        const quantitativePreferences = (preferences.quantitativeObjectives as OnboardingDraft['quantitativeObjectives']) ?? {};
        const objectives = (profile.objectives as Partial<OnboardingDraft['quantitativeObjectives']>) ?? {};
        const preferredMealTimes = normalizeMealTimes(
          (preferences.preferredMealTimes as PreferredMealTimes | Record<string, string> | null | undefined) ??
            (profile.preferred_meal_times as PreferredMealTimes | null | undefined)
        );

        const hydratedDraft: OnboardingDraft = {
          primaryGoal: normalizePrimaryGoal(
            (preferences.primaryGoal as string | null | undefined) ?? (profile.dietary_preference as string | null | undefined)
          ),
          dietaryPreferences: (preferences.dietaryPreferences as string[] | undefined) ?? profile.cuisine_preferences ?? [],
          allergies: (preferences.allergies as string[] | undefined) ?? profile.dietaryRestrictions ?? [],
          dislikedIngredients:
            (preferences.dislikedIngredients as string[] | undefined) ??
            profile.excludedIngredients ??
            profile.excluded_ingredients ??
            [],
          preferredMealTimes,
          preferredComplexity: normalizeComplexity(
            (preferences.preferredComplexity as ComplexityLevel | null | undefined) ?? profile.difficulty_preference ?? null
          ),
          maxCookingMinutes: (preferences.maxCookingMinutes as number | null | undefined) ?? profile.max_prep_time ?? null,
          initialPantryItems: [],
          quantitativeObjectives: {
            calorieTarget: quantitativePreferences.calorieTarget ?? objectives.calorieTarget ?? null,
            weeklyBudget: quantitativePreferences.weeklyBudget ?? objectives.weeklyBudget ?? null,
            householdSize: quantitativePreferences.householdSize ?? objectives.householdSize ?? profile.household_size ?? 1
          },
          notes: (preferences.notes as string | null | undefined) ?? null
        };
        set({
          draft: hydratedDraft,
          isDirty: false,
          lastUpdatedAt: new Date().toISOString()
        });
      }
    }),
    {
      name: 'onboarding_draft_v1',
      version: 2,
      storage,
      migrate: (persisted, version) => {
        if (!persisted) return persisted;
        if (version < 2) {
          return {
            ...baseState(),
            ...(persisted as Partial<OnboardingState>),
            draft: {
              ...defaultDraft(),
              ...(persisted as Partial<OnboardingState>).draft
            }
          };
        }
        return persisted as OnboardingState;
      }
    }
  )
);

function normalizeMealTimes(
  times: PreferredMealTimes | Record<string, string> | null | undefined
): OnboardingDraft['preferredMealTimes'] {
  if (!times) return {};
  return (Object.entries(times) as Array<[MealTimeKey, string | null | undefined]>).reduce<OnboardingDraft['preferredMealTimes']>((acc, [key, value]) => {
    if (value) {
      const normalized = value.length === 4 ? `${value.slice(0, 2)}:${value.slice(2)}` : value;
      acc[key] = normalized;
    }
    return acc;
  }, {});
}

function normalizePrimaryGoal(goal: string | null | undefined): PrimaryGoal | null {
  if (!goal) return null;
  const allowed: PrimaryGoal[] = ['eat_better', 'save_time', 'save_money', 'learn_cook', 'other'];
  if (allowed.includes(goal as PrimaryGoal)) {
    return goal as PrimaryGoal;
  }
  if (goal === 'health') return 'eat_better';
  return null;
}

function normalizeComplexity(level: ComplexityLevel | 'easy' | 'hard' | null | undefined): ComplexityLevel | null {
  if (!level) return null;
  if (level === 'easy') return 'simple';
  if (level === 'hard') return 'complex';
  const allowed: ComplexityLevel[] = ['simple', 'medium', 'complex'];
  return allowed.includes(level) ? level : 'medium';
}
