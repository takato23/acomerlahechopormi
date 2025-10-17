import {
  addPantryItem,
  deletePantryItem,
  getCategories,
  getPantryItems,
  updatePantryItem,
} from './pantryService';
import { supabase } from '@/lib/supabaseClient';
import { findOrCreateIngredient, normalizeIngredientName } from '../ingredients/ingredientService';
import { inferCategory } from '../shopping-list/lib/categoryInference';

jest.mock('@/lib/supabaseClient');
jest.mock('../ingredients/ingredientService');
jest.mock('../shopping-list/lib/categoryInference');

const mockGetUser = supabase.auth.getUser as jest.Mock;
const mockFrom = supabase.from as jest.Mock;
const findOrCreateIngredientMock = findOrCreateIngredient as jest.MockedFunction<typeof findOrCreateIngredient>;
const normalizeIngredientNameMock = normalizeIngredientName as jest.MockedFunction<typeof normalizeIngredientName>;
const inferCategoryMock = inferCategory as jest.MockedFunction<typeof inferCategory>;

const user = { id: 'user-abc' };

beforeEach(() => {
  jest.clearAllMocks();
  mockGetUser.mockResolvedValue({ data: { user }, error: null });
  normalizeIngredientNameMock.mockImplementation((name) => name);
});

describe('pantryService', () => {
  describe('getPantryItems', () => {
    it('maps nested ingredient/category data', async () => {
      const select = jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            data: [
              {
                id: '1',
                ingredient_id: 'ing-1',
                quantity: 2,
                unit: 'kg',
                ingredients: { id: 'ing-1', name: 'Arroz', image_url: 'img.png' },
                categories: { id: 'cat-1', name: 'Granos', icon: 'icon' },
              },
            ],
            error: null,
          })),
        })),
      }));
      mockFrom.mockImplementationOnce(() => ({ select }));

      const result = await getPantryItems();

      expect(result).toEqual([
        expect.objectContaining({
          id: '1',
          ingredient: expect.objectContaining({ name: 'Arroz' }),
          category: expect.objectContaining({ id: 'cat-1' }),
          ingredients: undefined,
          categories: undefined,
        }),
      ]);
    });
  });

  describe('getCategories', () => {
    it('fetches default categories', async () => {
      const select = jest.fn(() => ({
        or: jest.fn(() => ({
          order: jest.fn(() => ({
            order: jest.fn(() => ({ data: [{ id: 'cat' }], error: null })),
          })),
        })),
      }));
      mockFrom.mockImplementationOnce(() => ({ select }));

      const categories = await getCategories();
      expect(categories).toEqual([{ id: 'cat' }]);
    });
  });

  describe('addPantryItem', () => {
    it('creates missing ingredients and infers category when absent', async () => {
      findOrCreateIngredientMock.mockResolvedValue({ id: 'ing-1', name: 'Arroz' } as any);
      inferCategoryMock.mockResolvedValue('grains');

      const insert = jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => ({
            data: {
              id: '1',
              quantity: 1,
              unit: 'kg',
              ingredients: { id: 'ing-1', name: 'Arroz', image_url: null },
              categories: { id: 'grains', name: 'Granos', icon: null },
            },
            error: null,
          })),
        })),
      }));
      mockFrom.mockImplementationOnce(() => ({ insert }));

      const result = await addPantryItem({ ingredient_name: 'Arroz', quantity: 1, unit: 'Kg' });

      expect(findOrCreateIngredientMock).toHaveBeenCalledWith('Arroz', 1);
      expect(inferCategoryMock).toHaveBeenCalledWith('Arroz');
      expect(result.category?.id).toBe('grains');
    });

    it('persists optional metadata fields when provided', async () => {
      findOrCreateIngredientMock.mockResolvedValue({ id: 'ing-1', name: 'Arroz' } as any);
      inferCategoryMock.mockResolvedValue(null);

      const insert = jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => ({
            data: {
              id: '1',
              quantity: 2,
              unit: 'kg',
              ingredients: { id: 'ing-1', name: 'Arroz', image_url: null },
              categories: null,
            },
            error: null,
          })),
        })),
      }));
      mockFrom.mockImplementationOnce(() => ({ insert }));

      await addPantryItem({
        ingredient_name: 'Arroz',
        quantity: 2,
        unit: 'kg',
        location: 'Nevera',
        price: 4.5,
        notes: 'Compra mensual',
        min_stock: 1,
        target_stock: 6,
        tags: ['oferta', 'orgánico'],
        expiry_date: '2025-10-10',
        category_id: 'pantry'
      });

      expect(insert).toHaveBeenCalledWith(expect.objectContaining({
        location: 'Nevera',
        price: 4.5,
        notes: 'Compra mensual',
        min_stock: 1,
        target_stock: 6,
        tags: ['oferta', 'orgánico']
      }));
    });
  });

  describe('updatePantryItem', () => {
    it('updates existing item and returns mapped data', async () => {
      const update = jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn(() => ({
                data: {
                  id: '1',
                  quantity: 5,
                  ingredients: { id: 'ing-1', name: 'Arroz', image_url: null },
                  categories: null,
                },
                error: null,
              })),
            })),
          })),
        })),
      }));
      mockFrom.mockImplementationOnce(() => ({ update }));

      const updated = await updatePantryItem('1', { quantity: 5 });
      expect(updated.quantity).toBe(5);
      expect(updated.ingredient?.name).toBe('Arroz');
    });

    it('sends optional fields to supabase when updating', async () => {
      const update = jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn(() => ({
                data: {
                  id: '1',
                  quantity: 3,
                  min_stock: 2,
                  target_stock: 5,
                  location: 'Alacena',
                },
                error: null,
              })),
            })),
          })),
        })),
      }));
      mockFrom.mockImplementationOnce(() => ({ update }));

      await updatePantryItem('1', {
        quantity: 3,
        min_stock: 2,
        target_stock: 5,
        location: 'Alacena',
        tags: ['granel']
      });

      expect(update).toHaveBeenCalledWith(expect.objectContaining({
        quantity: 3,
        min_stock: 2,
        target_stock: 5,
        location: 'Alacena',
        tags: ['granel']
      }));
    });
  });

  describe('deletePantryItem', () => {
    it('performs delete with user constraint', async () => {
      const del = jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({ error: null })),
        })),
      }));
      mockFrom.mockImplementationOnce(() => ({ delete: del }));

      await expect(deletePantryItem('1')).resolves.toBeUndefined();
      expect(del).toHaveBeenCalled();
    });
  });
});
