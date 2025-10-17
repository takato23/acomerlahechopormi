import type { PreferredMealTimes, UserObjectives, ComplexityLevel } from '@/types/userPreferences';

export type DietaryPreference = 'omnivore' | 'vegetarian' | 'vegan';
export type DifficultyPreference = 'easy' | 'medium' | 'hard';

export interface UserProfile {
  id: string;
  email?: string;
  username: string | null;
  avatarUrl: string | null;
  geminiApiKey: string | null;
  dietaryRestrictions: string[];
  dislikedIngredients: string[];
  preferredCuisines: string[];
  cuisinePreferences: string[];
  cookingSkillLevel: string | null;
  preferredMealTimes: PreferredMealTimes;
  maxCalories: number | null;
  householdSize: number;
  onboardingCompletedAt: string | null;
  objectives: UserObjectives;
  excludedIngredients: string[];
  availableEquipment: string[];
  preferences?: Record<string, unknown> | null;
  createdAt?: string;
  updatedAt?: string;

  // Campos legacy mientras se migra la UI (para compatibilidad hacia atrás)
  cuisine_preferences?: string[] | null;
  preferred_meal_times?: any | null;
  max_calories?: number | null;
  household_size?: number | null;
  onboarding_completed_at?: string | null;
  dietary_preference?: DietaryPreference | null;
  difficulty_preference?: DifficultyPreference | null;
  max_prep_time?: number | null;
  allergies_restrictions?: string | null;
  avatar_url?: string | null;
  gemini_api_key?: string | null;
  excluded_ingredients?: string[] | null;
  available_equipment?: string[] | null;
}

export type UserProfileUpdate = Partial<Omit<UserProfile, 'id' | 'email' | 'createdAt' | 'updatedAt'>>;
