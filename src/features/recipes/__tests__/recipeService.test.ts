import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { createRecipe, updateRecipe } from '../services/recipeService';
import { supabase } from '@/lib/supabaseClient';
import { findOrCreateIngredient } from '@/features/ingredients/ingredientService';
import { normalizeQuantity, normalizeUnit } from '@/utils/units';

vi.mock('@/lib/supabaseClient', async () => {
  const mockModule = await import('@/__mocks__/supabaseClient');
  return { supabase: mockModule.supabase };
});

vi.mock('@/features/ingredients/ingredientService', () => ({
  findOrCreateIngredient: vi.fn(),
}));

interface SupabaseMock {
  rpc: Mock;
  auth: { getUser: Mock };
}

const supabaseMock = supabase as unknown as SupabaseMock;
const findOrCreateIngredientMock = findOrCreateIngredient as unknown as Mock;

describe('recipeService transactional operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-123' } } });
    findOrCreateIngredientMock.mockResolvedValue({ id: 'ingredient-1', name: 'Harina' });
  });

  it('creates recipes using RPC and normalizes ingredient data', async () => {
    supabaseMock.rpc.mockResolvedValue({
      data: {
        recipe: {
          id: 'recipe-1',
          user_id: 'user-123',
          title: 'Bizcocho',
          created_at: '2024-01-01T00:00:00.000Z',
          instructions: ['Paso 1'],
          recipe_ingredients: [
            {
              id: 'ri-1',
              ingredient_name: 'Harina',
              quantity: 1.5,
              unit: 'g',
            },
          ],
          is_favorite: false,
          is_public: false,
          is_archived: false,
        },
      },
      error: null,
    });

    const created = await createRecipe({
      user_id: 'user-123',
      title: 'Bizcocho',
      description: 'Delicioso bizcocho',
      ingredients: [{ name: 'Harina', quantity: '1,5', unit: 'Gramos' }],
      instructions: ['Mezclar'],
      prep_time_minutes: null,
      cook_time_minutes: null,
      servings: null,
      tags: ['postre'],
      mainIngredients: ['Harina'],
      nutritional_info: null,
      is_public: false,
      is_archived: false,
      image_url: null,
      isBaseRecipe: false,
    });

    expect(supabaseMock.rpc).toHaveBeenCalledWith(
      'create_recipe_with_ingredients',
      expect.objectContaining({
        recipe_payload: expect.objectContaining({ title: 'Bizcocho', tags: ['postre'] }),
        ingredients_payload: [
          expect.objectContaining({ ingredient_name: 'Harina', quantity: 1.5, unit: 'g' }),
        ],
      }),
    );
    expect(created.recipe_ingredients[0].quantity).toBeCloseTo(1.5);
    expect(created.recipe_ingredients[0].unit).toBe('g');
  });

  it('updates recipes using RPC and normalized ingredients', async () => {
    findOrCreateIngredientMock.mockResolvedValue({ id: 'ingredient-2', name: 'Azúcar' });
    supabaseMock.rpc.mockResolvedValue({
      data: {
        recipe: {
          id: 'recipe-2',
          user_id: 'user-123',
          title: 'Receta actualizada',
          created_at: '2024-01-01T00:00:00.000Z',
          instructions: ['Paso único'],
          recipe_ingredients: [
            {
              id: 'ri-2',
              ingredient_name: 'Azúcar',
              quantity: 0.5,
              unit: 'kg',
            },
          ],
          is_favorite: false,
          is_public: false,
          is_archived: false,
        },
      },
      error: null,
    });

    const updated = await updateRecipe('recipe-2', {
      title: 'Receta actualizada',
      ingredients: [{ name: 'Azúcar', quantity: '1/2', unit: 'Kilogramos' }],
      instructions: ['Paso único'],
      tags: ['dulce'],
    });

    expect(supabaseMock.rpc).toHaveBeenCalledWith(
      'update_recipe_with_ingredients',
      expect.objectContaining({
        recipe_id: 'recipe-2',
        ingredients_payload: [
          expect.objectContaining({ ingredient_name: 'Azúcar', quantity: 0.5, unit: 'kg' }),
        ],
      }),
    );
    expect(updated.recipe_ingredients[0].quantity).toBeCloseTo(0.5);
    expect(updated.recipe_ingredients[0].unit).toBe('kg');
  });

  it('normalizes quantities and units with helpers', () => {
    expect(normalizeQuantity('2 1/2')).toBeCloseTo(2.5);
    expect(normalizeQuantity('1/4')).toBeCloseTo(0.25);
    expect(normalizeUnit('Gramos')).toBe('g');
  });
});
