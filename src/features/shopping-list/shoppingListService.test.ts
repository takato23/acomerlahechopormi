import {
  getShoppingListItems,
  addShoppingListItem,
  updateShoppingListItem,
  deleteShoppingListItem,
  clearPurchasedItems,
  clearAllItems,
  generateShoppingList
} from './shoppingListService';
import { supabase } from '@/lib/supabaseClient';

jest.mock('@/lib/supabaseClient');
jest.mock('@/features/planning/planningService', () => ({
  getPlannedMeals: jest.fn().mockResolvedValue([])
}));
jest.mock('@/features/recipes/services/recipeService', () => ({
  getRecipeById: jest.fn()
}));

const mockFrom = supabase.from as jest.Mock;
const mockAuthGetUser = supabase.auth.getUser as unknown as jest.Mock;
const { getPlannedMeals } = jest.requireMock('@/features/planning/planningService') as {
  getPlannedMeals: jest.Mock;
};

beforeEach(() => {
  jest.clearAllMocks();
  mockAuthGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
});

describe('shoppingListService', () => {
  describe('getShoppingListItems', () => {
    it('returns items from Supabase', async () => {
      const secondOrder = jest.fn(() => ({ data: [{ id: '1' }], error: null }));
      const firstOrder = jest.fn(() => ({ order: secondOrder }));
      const eq = jest.fn(() => ({ order: firstOrder }));
      const select = jest.fn(() => ({ eq }));
      mockFrom.mockImplementationOnce(() => ({ select }));

      const result = await getShoppingListItems();
      expect(result).toEqual([
        expect.objectContaining({
          id: '1',
          is_purchased: false,
          quantity: null,
          unit: null,
        }),
      ]);
      expect(select).toHaveBeenCalled();
      expect(eq).toHaveBeenCalledWith('user_id', 'user-1');
    });
  });

  describe('addShoppingListItem', () => {
    it('inserts and returns new row', async () => {
      const single = jest.fn(() => ({ data: { id: 'new' }, error: null }));
      const select = jest.fn(() => ({ single }));
      const insert = jest.fn(() => ({ select }));
      mockFrom.mockImplementationOnce(() => ({ insert }));

      const result = await addShoppingListItem({
        name: 'Leche',
        quantity: 1,
        unit: 'lt',
        is_purchased: false
      });

      expect(result).toEqual(
        expect.objectContaining({
          id: 'new',
          is_purchased: false,
          quantity: null,
          unit: null,
        })
      );
      expect(insert).toHaveBeenCalled();
    });
  });

  describe('updateShoppingListItem', () => {
    it('actualiza el ítem', async () => {
      const single = jest.fn(() => ({ data: { id: '1', is_purchased: true }, error: null }));
      const select = jest.fn(() => ({ single }));
      const secondEq = jest.fn(() => ({ select }));
      const firstEq = jest.fn(() => ({ eq: secondEq }));
      const update = jest.fn(() => ({ eq: firstEq }));
      mockFrom.mockImplementationOnce(() => ({ update }));

      const result = await updateShoppingListItem('1', { is_purchased: true });
      expect(result).toEqual(
        expect.objectContaining({
          id: '1',
          is_purchased: true,
          quantity: null,
          unit: null,
        })
      );
      expect(firstEq).toHaveBeenCalledWith('id', '1');
      expect(secondEq).toHaveBeenCalledWith('user_id', 'user-1');
    });
  });

  describe('deleteShoppingListItem', () => {
    it('elimina el ítem', async () => {
      const secondEq = jest.fn(() => ({ error: null }));
      const firstEq = jest.fn(() => ({ eq: secondEq }));
      const del = jest.fn(() => ({ eq: firstEq }));
      mockFrom.mockImplementationOnce(() => ({ delete: del }));

      await expect(deleteShoppingListItem('1')).resolves.toBeUndefined();
      expect(firstEq).toHaveBeenCalledWith('id', '1');
      expect(secondEq).toHaveBeenCalledWith('user_id', 'user-1');
    });
  });

  describe('clearPurchasedItems', () => {
    it('elimina elementos comprados', async () => {
      const thirdEq = jest.fn(() => ({ error: null }));
      const secondEq = jest.fn(() => ({ eq: thirdEq }));
      const firstEq = jest.fn(() => ({ eq: secondEq }));
      const del = jest.fn(() => ({ eq: firstEq }));
      mockFrom.mockImplementationOnce(() => ({ delete: del }));

      await expect(clearPurchasedItems()).resolves.toBeUndefined();
      expect(firstEq).toHaveBeenCalledWith('user_id', 'user-1');
      expect(secondEq).toHaveBeenCalledWith('is_purchased', true);
    });
  });

  describe('clearAllItems', () => {
    it('vacía la lista', async () => {
      const eq = jest.fn(() => ({ error: null }));
      const del = jest.fn(() => ({ eq }));
      mockFrom.mockImplementationOnce(() => ({ delete: del }));
      await expect(clearAllItems()).resolves.toBeUndefined();
      expect(eq).toHaveBeenCalledWith('user_id', 'user-1');
    });
  });

  describe('generateShoppingList', () => {
    it('retorna lista vacía cuando no hay comidas planificadas', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
      getPlannedMeals.mockResolvedValueOnce([]);
      const list = await generateShoppingList('2025-01-01', '2025-01-07', 'user-1');
      expect(list).toEqual([]);
      consoleSpy.mockRestore();
    });
  });
});
