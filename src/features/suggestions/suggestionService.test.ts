import { getMealAlternatives } from './suggestionService';
import type { MealAlternativeRequestContext } from '@/features/planning/types';
import type { UserProfile } from '@/features/user/userTypes';
import type { SupabaseClient } from '@supabase/supabase-js';

interface SupabaseStubOptions {
  pantryItems: any[];
  userRecipes: any[];
  baseRecipes: any[];
}

class SupabaseStub {
  readonly pantryItems: any[];
  readonly userRecipes: any[];
  readonly baseRecipes: any[];
  auth: SupabaseClient['auth'];

  constructor({ pantryItems, userRecipes, baseRecipes }: SupabaseStubOptions) {
    this.pantryItems = pantryItems;
    this.userRecipes = userRecipes;
    this.baseRecipes = baseRecipes;
    this.auth = {
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
    } as unknown as SupabaseClient['auth'];
  }

  from(table: string) {
    if (table === 'pantry_items') {
      return {
        select: () => ({
          eq: () => Promise.resolve({ data: this.pantryItems, error: null }),
        }),
      };
    }

    if (table === 'recipes') {
      return {
        select: () => ({
          eq: (column: string, value: unknown) => {
            if (column === 'user_id') {
              return Promise.resolve({ data: this.userRecipes, error: null });
            }
            if (column === 'is_generated_base') {
              return Promise.resolve({ data: this.baseRecipes, error: null });
            }
            return Promise.resolve({ data: [], error: null });
          },
        }),
      };
    }

    return {
      select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }),
    };
  }
}

const pantryItems = [
  {
    ingredient_id: 'ing-tomato',
    quantity: 2,
    unit: 'u',
    ingredients: { name: 'Tomate' },
  },
  {
    ingredient_id: 'ing-chickpeas',
    quantity: 1,
    unit: 'lata',
    ingredients: { name: 'Garbanzos' },
  },
];

const userRecipes = [
  {
    id: 'recipe-1',
    user_id: 'user-1',
    title: 'Bowl de garbanzos fresco',
    description: 'Almuerzo lleno de plantas y proteínas vegetales',
    is_generated_base: false,
    difficulty_level: 'simple',
    prep_time_minutes: 20,
    cook_time_minutes: 10,
    recipe_ingredients: [
      { ingredient_id: 'ing-chickpeas', ingredient_name: 'Garbanzos', quantity: 1, unit: 'lata' },
      { ingredient_id: 'ing-tomato', ingredient_name: 'Tomate', quantity: 2, unit: 'u' },
    ],
  },
];

const baseRecipes = [
  {
    id: 'recipe-2',
    user_id: 'team-base',
    title: 'Milanesa clásica',
    description: 'Plato principal para la cena',
    is_generated_base: true,
    difficulty_level: 'medium',
    prep_time_minutes: 30,
    cook_time_minutes: 15,
    recipe_ingredients: [
      { ingredient_id: 'ing-beef', ingredient_name: 'Carne vacuna', quantity: 1, unit: 'unidad' },
    ],
  },
];

describe('getMealAlternatives', () => {
  it('prioriza recetas que aprovechan la despensa y respeta preferencias', async () => {
    const client = new SupabaseStub({ pantryItems, userRecipes, baseRecipes });

    const context: MealAlternativeRequestContext = {
      meal_type: 'Almuerzo',
      available_ingredients: ['Garbanzos'],
      dietary_restrictions: [],
    };

    const userProfile: Partial<UserProfile> = {
      id: 'user-1',
      difficulty_preference: 'easy',
      max_prep_time: 40,
      dislikedIngredients: ['Carne'],
      dietaryRestrictions: [],
    };

    const alternatives = await getMealAlternatives(context, userProfile, {
      client: client as unknown as SupabaseClient,
    });

    expect(alternatives).toHaveLength(1);
    const firstAlternative = alternatives[0];

    expect(firstAlternative.type).toBe('recipe');
    if (firstAlternative.type !== 'recipe') {
      throw new Error('La alternativa esperada debe ser de tipo recipe');
    }

    expect(firstAlternative.title).toBe('Bowl de garbanzos fresco');
    expect(firstAlternative.reason).toMatch(/Garbanzos/i);
  });
});
