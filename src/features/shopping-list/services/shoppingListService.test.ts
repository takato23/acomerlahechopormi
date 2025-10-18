import {
  generateShoppingListFromPlanning,
  getShoppingListItems,
  addItemsToShoppingList,
  addShoppingListItem,
  updateShoppingListItem,
  deleteShoppingListItem,
  clearPurchasedItems,
  clearAllItems,
  calculateMissingRecipeIngredients,
} from './shoppingListService';
import type { ShoppingListItem } from '@/types/shoppingListTypes';

jest.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  },
}));

jest.mock('@/features/planning/planningService', () => ({
  getPlannedMeals: jest.fn(),
}));

import { supabase } from '@/lib/supabaseClient';
import { getPlannedMeals } from '@/features/planning/planningService';

const mockGetUser = supabase.auth.getUser as jest.Mock;
const mockFrom = supabase.from as jest.Mock;
const mockGetPlannedMeals = getPlannedMeals as jest.Mock;

const mockUser = { id: 'user-123', email: 'test@example.com' };

const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
const consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});

describe('shoppingListService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleLogSpy.mockRestore();
    consoleInfoSpy.mockRestore();
  });

  describe('getShoppingListItems', () => {
    it('retrieves items for the authenticated user', async () => {
      const expectedItems: ShoppingListItem[] = [
        {
          id: 'item-1',
          user_id: mockUser.id,
          ingredient_name: 'Tomate',
          is_checked: false,
          quantity: 2,
          unit: 'un',
          notes: null,
          category: 'vegetables',
          recipe_source: null,
          brand: null,
          created_at: '2024-05-01T10:00:00.000Z',
          updated_at: '2024-05-01T10:00:00.000Z',
        },
      ];

      const mockOrder = jest.fn().mockResolvedValue({ data: expectedItems, error: null });
      const mockEq = jest.fn(() => ({ order: mockOrder }));
      const mockSelect = jest.fn(() => ({ eq: mockEq }));
      mockFrom.mockImplementationOnce(() => ({ select: mockSelect }));

      const result = await getShoppingListItems();

      expect(result).toEqual(expectedItems);
      expect(mockFrom).toHaveBeenCalledWith('shopping_list_items');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('user_id', mockUser.id);
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('returns an empty array when the user is not authenticated', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

      const result = await getShoppingListItems();

      expect(result).toEqual([]);
    });

    it('returns an empty array when Supabase fails', async () => {
      const mockOrder = jest.fn().mockResolvedValue({ data: null, error: new Error('DB error') });
      const mockEq = jest.fn(() => ({ order: mockOrder }));
      const mockSelect = jest.fn(() => ({ eq: mockEq }));
      mockFrom.mockImplementationOnce(() => ({ select: mockSelect }));

      const result = await getShoppingListItems();

      expect(result).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('addItemsToShoppingList', () => {
    it('inserts multiple items with the user id', async () => {
      const items = [
        { ingredient_name: 'Leche', quantity: 1, unit: 'l' },
        { ingredient_name: 'Pan', quantity: 2, unit: 'un' },
      ];
      const inserted = items.map((item, index) => ({
        ...item,
        id: `item-${index + 1}`,
        user_id: mockUser.id,
        is_checked: false,
        notes: null,
        category: null,
        recipe_source: null,
        brand: null,
        created_at: '2024-05-01T10:00:00.000Z',
        updated_at: '2024-05-01T10:00:00.000Z',
      }));

      const mockSelect = jest.fn().mockResolvedValue({ data: inserted, error: null });
      const mockInsert = jest.fn(() => ({ select: mockSelect }));
      mockFrom.mockImplementationOnce(() => ({ insert: mockInsert }));

      const result = await addItemsToShoppingList(items);

      expect(result).toEqual(inserted);
      expect(mockInsert).toHaveBeenCalledWith(items.map(item => ({ ...item, user_id: mockUser.id })));
    });

    it('throws when the user is not authenticated', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

      await expect(addItemsToShoppingList([{ ingredient_name: 'Aceite' }])).rejects.toThrow('Usuario no autenticado');
    });
  });

  describe('addShoppingListItem', () => {
    it('inserts a single item for the authenticated user', async () => {
      const item = {
        id: 'item-1',
        user_id: mockUser.id,
        ingredient_name: 'Arroz',
        is_checked: false,
        quantity: 1,
        unit: 'kg',
        notes: null,
        category: null,
        recipe_source: null,
        brand: null,
        created_at: '2024-05-01T10:00:00.000Z',
        updated_at: '2024-05-01T10:00:00.000Z',
      } satisfies ShoppingListItem;

      const mockSingle = jest.fn().mockResolvedValue({ data: item, error: null });
      const mockSelect = jest.fn(() => ({ single: mockSingle }));
      const mockInsert = jest.fn(() => ({ select: mockSelect }));
      mockFrom.mockImplementationOnce(() => ({ insert: mockInsert }));

      const result = await addShoppingListItem(item);

      expect(result).toEqual(item);
      expect(mockInsert).toHaveBeenCalledWith({ ...item, user_id: mockUser.id });
    });

    it('propagates Supabase errors', async () => {
      const item = {
        id: 'item-1',
        user_id: mockUser.id,
        ingredient_name: 'Harina',
        is_checked: false,
        quantity: 1,
        unit: 'kg',
        notes: null,
        category: null,
        recipe_source: null,
        brand: null,
        created_at: '2024-05-01T10:00:00.000Z',
        updated_at: '2024-05-01T10:00:00.000Z',
      } satisfies ShoppingListItem;

      const mockSingle = jest.fn().mockResolvedValue({ data: null, error: new Error('Insert failed') });
      const mockSelect = jest.fn(() => ({ single: mockSingle }));
      const mockInsert = jest.fn(() => ({ select: mockSelect }));
      mockFrom.mockImplementationOnce(() => ({ insert: mockInsert }));

      await expect(addShoppingListItem(item)).rejects.toThrow('Insert failed');
    });
  });

  describe('updateShoppingListItem', () => {
    it('updates an item for the authenticated user', async () => {
      const updated = {
        id: 'item-1',
        user_id: mockUser.id,
        ingredient_name: 'Azúcar',
        is_checked: true,
        quantity: 1,
        unit: 'kg',
        notes: null,
        category: null,
        recipe_source: null,
        brand: null,
        created_at: '2024-05-01T10:00:00.000Z',
        updated_at: '2024-05-02T10:00:00.000Z',
      } satisfies ShoppingListItem;

      const mockSingle = jest.fn().mockResolvedValue({ data: updated, error: null });
      const mockSelect = jest.fn(() => ({ single: mockSingle }));
      const mockUserEq = jest.fn(() => ({ select: mockSelect }));
      const mockIdEq = jest.fn(() => ({ eq: mockUserEq }));
      const mockUpdate = jest.fn(() => ({ eq: mockIdEq }));
      mockFrom.mockImplementationOnce(() => ({ update: mockUpdate }));

      const result = await updateShoppingListItem('item-1', { is_checked: true });

      expect(result).toEqual(updated);
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockIdEq).toHaveBeenCalledWith('id', 'item-1');
      expect(mockUserEq).toHaveBeenCalledWith('user_id', mockUser.id);
    });

    it('throws when the user is not authenticated', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

      await expect(updateShoppingListItem('item-1', { is_checked: true })).rejects.toThrow('Usuario no autenticado');
    });
  });

  describe('deleteShoppingListItem', () => {
    it('removes an item by id for the authenticated user', async () => {
      const mockUserEq = jest.fn().mockResolvedValue({ error: null });
      const mockIdEq = jest.fn(() => ({ eq: mockUserEq }));
      const mockDelete = jest.fn(() => ({ eq: mockIdEq }));
      mockFrom.mockImplementationOnce(() => ({ delete: mockDelete }));

      await deleteShoppingListItem('item-1');

      expect(mockDelete).toHaveBeenCalled();
      expect(mockIdEq).toHaveBeenCalledWith('id', 'item-1');
      expect(mockUserEq).toHaveBeenCalledWith('user_id', mockUser.id);
    });

    it('throws when the user is not authenticated', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

      await expect(deleteShoppingListItem('item-1')).rejects.toThrow('Usuario no autenticado');
    });
  });

  describe('clearPurchasedItems', () => {
    it('deletes items marked as checked for the user', async () => {
      const mockCheckedEq = jest.fn().mockResolvedValue({ error: null });
      const mockUserEq = jest.fn(() => ({ eq: mockCheckedEq }));
      const mockDelete = jest.fn(() => ({ eq: mockUserEq }));
      mockFrom.mockImplementationOnce(() => ({ delete: mockDelete }));

      await clearPurchasedItems();

      expect(mockDelete).toHaveBeenCalled();
      expect(mockUserEq).toHaveBeenCalledWith('user_id', mockUser.id);
      expect(mockCheckedEq).toHaveBeenCalledWith('is_checked', true);
    });
  });

  describe('clearAllItems', () => {
    it('deletes all items for the user', async () => {
      const mockUserEq = jest.fn().mockResolvedValue({ error: null });
      const mockDelete = jest.fn(() => ({ eq: mockUserEq }));
      mockFrom.mockImplementationOnce(() => ({ delete: mockDelete }));

      await clearAllItems();

      expect(mockDelete).toHaveBeenCalled();
      expect(mockUserEq).toHaveBeenCalledWith('user_id', mockUser.id);
    });
  });

  describe('calculateMissingRecipeIngredients', () => {
    it('returns the difference between recipe requirements and current list', () => {
      const recipe = {
        title: 'Pasta con salsa',
        recipe_ingredients: [
          { ingredient_name: 'Pasta', quantity: 500, unit: 'g' },
          { ingredient_name: 'Tomate', quantity: 2, unit: 'un' },
        ],
      } as any;

      const currentItems = [
        {
          ingredient_name: 'Pasta',
          quantity: 200,
          unit: 'g',
        },
      ] as ShoppingListItem[];

      const missing = calculateMissingRecipeIngredients(recipe, currentItems);

      expect(missing).toEqual([
        {
          ingredient_name: 'Pasta',
          quantity: 300,
          unit: 'g',
          notes: 'Para: Pasta con salsa',
        },
        {
          ingredient_name: 'Tomate',
          quantity: 2,
          unit: 'un',
          notes: 'Para: Pasta con salsa',
        },
      ]);
    });
  });

  describe('generateShoppingListFromPlanning', () => {
    it('aggregates planned recipes, subtracts pantry stock and persists missing items', async () => {
      mockGetPlannedMeals.mockResolvedValue([
        { id: 'plan-1', recipe_id: 'recipe-1' },
      ]);

      const recipeIngredients = [
        { recipe_id: 'recipe-1', ingredient_id: null, ingredient_name: 'Queso', quantity: 2, unit: 'un' },
      ];

      const refreshedItems: ShoppingListItem[] = [
        {
          id: 'item-1',
          user_id: mockUser.id,
          ingredient_name: 'Queso',
          is_checked: false,
          quantity: 2,
          unit: 'un',
          notes: 'Recetas: Receta sin título',
          category: 'dairy',
          recipe_source: 'Receta sin título',
          brand: null,
          created_at: '2024-05-01T10:00:00.000Z',
          updated_at: '2024-05-01T10:00:00.000Z',
        },
      ];

      const mockRecipeIn = jest.fn().mockResolvedValue({ data: recipeIngredients, error: null });
      const mockRecipeSelect = jest.fn(() => ({ in: mockRecipeIn }));

      const mockPantryEq = jest.fn().mockResolvedValue({ data: [], error: null });
      const mockPantrySelect = jest.fn(() => ({ eq: mockPantryEq }));

      const mockExistingEq = jest.fn().mockResolvedValue({ data: [], error: null });
      const mockRefreshOrder = jest.fn().mockResolvedValue({ data: refreshedItems, error: null });
      const mockRefreshEq = jest.fn(() => ({ order: mockRefreshOrder }));
      let selectCall = 0;
      const mockShoppingSelect = jest.fn(() => {
        if (selectCall === 0) {
          selectCall++;
          return { eq: mockExistingEq };
        }
        return { eq: mockRefreshEq };
      });

      const mockInsert = jest.fn().mockResolvedValue({ error: null });

      mockFrom.mockImplementation(table => {
        if (table === 'recipe_ingredients') {
          return { select: mockRecipeSelect };
        }
        if (table === 'pantry_items') {
          return { select: mockPantrySelect };
        }
        if (table === 'shopping_list_items') {
          return {
            select: mockShoppingSelect,
            insert: mockInsert,
            update: jest.fn(() => ({ eq: jest.fn(() => ({ eq: jest.fn().mockResolvedValue({ error: null }) })) })),
          };
        }
        throw new Error(`Unexpected table ${table}`);
      });

      const result = await generateShoppingListFromPlanning('2024-05-01', '2024-05-07');

      expect(mockRecipeSelect).toHaveBeenCalledWith('recipe_id, ingredient_id, ingredient_name, quantity, unit');
      expect(mockPantrySelect).toHaveBeenCalledWith('ingredient_id, name, quantity, unit, categories(name)');
      expect(mockExistingEq).toHaveBeenCalledWith('user_id', mockUser.id);
      expect(mockInsert).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({
          user_id: mockUser.id,
          ingredient_name: 'Queso',
          quantity: 2,
          unit: 'un',
          category: 'dairy',
          is_checked: false,
          notes: 'Recetas: Receta sin título',
          recipe_source: 'Receta sin título',
        }),
      ]));
      expect(mockRefreshOrder).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toEqual(refreshedItems);
    });
  });
});
