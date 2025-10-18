import {
  getPantryItems,
  addPantryItem,
  updatePantryItem,
  deletePantryItem,
  deleteMultiplePantryItems,
  toggleFavoritePantryItem,
  clearPantry,
  fetchLowStockItems,
} from './pantryService';
import { supabase } from '@/lib/supabaseClient';
import { findOrCreateIngredient, normalizeIngredientName } from '../ingredients/ingredientService';
import { inferCategory } from '../shopping-list/lib/categoryInference';

jest.mock('@/lib/supabaseClient');
jest.mock('../ingredients/ingredientService', () => ({
  findOrCreateIngredient: jest.fn(),
  normalizeIngredientName: jest.fn((name: string) => name),
}));
jest.mock('../shopping-list/lib/categoryInference', () => ({
  inferCategory: jest.fn(),
}));

const mockGetUser = supabase.auth.getUser as jest.Mock;
const mockFrom = supabase.from as jest.Mock;
const mockFindOrCreateIngredient = findOrCreateIngredient as jest.Mock;
const mockNormalizeIngredientName = normalizeIngredientName as jest.Mock;
const mockInferCategory = inferCategory as jest.Mock;

const mockUser = { id: 'pantry-user-456', email: 'pantry@test.com' };

describe('pantryService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    mockFindOrCreateIngredient.mockResolvedValue({ id: 'ing-1', name: 'Test Ingredient' });
    mockInferCategory.mockResolvedValue(null);
    mockNormalizeIngredientName.mockImplementation((name: string) => `normalized-${name}`);
  });

  describe('getPantryItems', () => {
    it('should fetch pantry items for the current user', async () => {
      const mockData = [
        {
          id: 'p1',
          quantity: 1,
          unit: 'u',
          user_id: mockUser.id,
          ingredients: { id: 'ing-1', name: 'Milk', image_url: 'milk.png' },
          categories: { id: 'cat-1', name: 'Lácteos', icon_name: 'milk' },
        },
      ];

      const mockOrder = jest.fn().mockResolvedValue({ data: mockData, error: null });
      const mockEq = jest.fn(() => ({ order: mockOrder }));
      const mockSelect = jest.fn(() => ({ eq: mockEq }));
      mockFrom.mockReturnValueOnce({ select: mockSelect });

      const items = await getPantryItems();

      expect(mockFrom).toHaveBeenCalledWith('pantry_items');
      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('ingredients'));
      expect(mockEq).toHaveBeenCalledWith('user_id', mockUser.id);
      expect(items[0].ingredient?.name).toBe('normalized-Milk');
      expect(items[0].category?.name).toBe('Lácteos');
    });

    it('should throw an error when supabase fails', async () => {
      const mockOrder = jest.fn().mockResolvedValue({ data: null, error: new Error('DB Error') });
      const mockEq = jest.fn(() => ({ order: mockOrder }));
      const mockSelect = jest.fn(() => ({ eq: mockEq }));
      mockFrom.mockReturnValueOnce({ select: mockSelect });

      await expect(getPantryItems()).rejects.toThrow('No se pudieron cargar los ítems de la despensa.');
    });
  });

  describe('addPantryItem', () => {
    it('should upsert a new item and return it', async () => {
      const newItemData = {
        ingredient_name: 'Eggs',
        quantity: 12,
        unit: 'u',
        user_id: mockUser.id,
      };

      mockFindOrCreateIngredient.mockResolvedValue({ id: 'ing-eggs', name: 'Eggs' });
      mockInferCategory.mockResolvedValue('cat-eggs');

      const dbItem = {
        id: 'p-new',
        quantity: 12,
        unit: 'u',
        user_id: mockUser.id,
        ingredient_id: 'ing-eggs',
        ingredients: { id: 'ing-eggs', name: 'Eggs', image_url: null },
        categories: { id: 'cat-eggs', name: 'Huevos', icon_name: 'egg' },
      };

      const mockSingle = jest.fn().mockResolvedValue({ data: dbItem, error: null });
      const mockSelect = jest.fn(() => ({ single: mockSingle }));
      const mockUpsert = jest.fn(() => ({ select: mockSelect }));
      mockFrom.mockReturnValueOnce({ upsert: mockUpsert });

      const result = await addPantryItem(newItemData as any);

      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: mockUser.id,
          ingredient_id: 'ing-eggs',
          quantity: 12,
          unit: 'u',
        }),
        expect.objectContaining({ onConflict: expect.stringContaining('user_id') }),
      );
      expect(result.category?.id).toBe('cat-eggs');
      expect(mockNormalizeIngredientName).toHaveBeenCalledWith('Eggs', 12);
    });

    it('should throw when upsert fails', async () => {
      const newItemData = {
        ingredient_name: 'Sugar',
        quantity: 1,
        user_id: mockUser.id,
      };

      const mockSingle = jest.fn().mockResolvedValue({ data: null, error: new Error('Insert Fail') });
      const mockSelect = jest.fn(() => ({ single: mockSingle }));
      const mockUpsert = jest.fn(() => ({ select: mockSelect }));
      mockFrom.mockReturnValueOnce({ upsert: mockUpsert });

      await expect(addPantryItem(newItemData as any)).rejects.toThrow(
        'No se pudo guardar el ítem en la despensa.',
      );
    });
  });

  describe('updatePantryItem', () => {
    it('should update an existing item', async () => {
      const updatedRow = {
        id: 'p-update',
        quantity: 5,
        unit: 'kg',
        user_id: mockUser.id,
        ingredients: { id: 'ing-1', name: 'Flour', image_url: null },
        categories: { id: 'cat-1', name: 'Básicos', icon_name: 'box' },
      };

      const mockSingle = jest.fn().mockResolvedValue({ data: updatedRow, error: null });
      const mockSelect = jest.fn(() => ({ single: mockSingle }));
      const secondEq = jest.fn(() => ({ select: mockSelect }));
      const firstEq = jest.fn(() => ({ eq: secondEq }));
      const mockUpdate = jest.fn(() => ({ eq: firstEq }));
      mockFrom.mockReturnValueOnce({ update: mockUpdate });

      const result = await updatePantryItem('p-update', { quantity: 5 });

      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ quantity: 5 }));
      expect(secondEq).toHaveBeenCalledWith('user_id', mockUser.id);
      expect(result.ingredient?.name).toBe('normalized-Flour');
    });

    it('should throw when update fails', async () => {
      const mockSingle = jest.fn().mockResolvedValue({ data: null, error: new Error('Update Fail') });
      const mockSelect = jest.fn(() => ({ single: mockSingle }));
      const secondEq = jest.fn(() => ({ select: mockSelect }));
      const firstEq = jest.fn(() => ({ eq: secondEq }));
      const mockUpdate = jest.fn(() => ({ eq: firstEq }));
      mockFrom.mockReturnValueOnce({ update: mockUpdate });

      await expect(updatePantryItem('p-update', { quantity: 3 })).rejects.toThrow(
        'No se pudo actualizar el ítem.',
      );
    });
  });

  describe('deletePantryItem', () => {
    it('should delete an item', async () => {
      const secondEq = jest.fn().mockResolvedValue({ error: null });
      const firstEq = jest.fn(() => ({ eq: secondEq }));
      const mockDelete = jest.fn(() => ({ eq: firstEq }));
      mockFrom.mockReturnValueOnce({ delete: mockDelete });

      await expect(deletePantryItem('p-delete')).resolves.toBeUndefined();
      expect(firstEq).toHaveBeenCalledWith('id', 'p-delete');
      expect(secondEq).toHaveBeenCalledWith('user_id', mockUser.id);
    });

    it('should throw when delete fails', async () => {
      const secondEq = jest.fn().mockResolvedValue({ error: new Error('Delete Fail') });
      const firstEq = jest.fn(() => ({ eq: secondEq }));
      const mockDelete = jest.fn(() => ({ eq: firstEq }));
      mockFrom.mockReturnValueOnce({ delete: mockDelete });

      await expect(deletePantryItem('p-delete')).rejects.toThrow('No se pudo eliminar el ítem.');
    });
  });

  describe('deleteMultiplePantryItems', () => {
    it('should delete multiple items', async () => {
      const eqMock = jest.fn().mockResolvedValue({ error: null });
      const inMock = jest.fn(() => ({ eq: eqMock }));
      const deleteMock = jest.fn(() => ({ in: inMock }));
      mockFrom.mockReturnValueOnce({ delete: deleteMock });

      await expect(deleteMultiplePantryItems(['a', 'b'])).resolves.toBeUndefined();
      expect(deleteMock).toHaveBeenCalled();
      expect(inMock).toHaveBeenCalledWith('id', ['a', 'b']);
      expect(eqMock).toHaveBeenCalledWith('user_id', mockUser.id);
    });

    it('should throw on failure', async () => {
      const eqMock = jest.fn().mockResolvedValue({ error: new Error('bulk delete fail') });
      const inMock = jest.fn(() => ({ eq: eqMock }));
      const deleteMock = jest.fn(() => ({ in: inMock }));
      mockFrom.mockReturnValueOnce({ delete: deleteMock });

      await expect(deleteMultiplePantryItems(['a'])).rejects.toThrow(
        'No se pudieron eliminar los ítems seleccionados.',
      );
    });
  });

  describe('toggleFavoritePantryItem', () => {
    it('should toggle favorite state', async () => {
      const dbItem = {
        id: 'fav-1',
        is_favorite: true,
        quantity: 1,
        user_id: mockUser.id,
        ingredients: { id: 'ing-1', name: 'Rice', image_url: null },
        categories: null,
      };

      const mockSingle = jest.fn().mockResolvedValue({ data: dbItem, error: null });
      const mockSelect = jest.fn(() => ({ single: mockSingle }));
      const secondEq = jest.fn(() => ({ select: mockSelect }));
      const firstEq = jest.fn(() => ({ eq: secondEq }));
      const mockUpdate = jest.fn(() => ({ eq: firstEq }));
      mockFrom.mockReturnValueOnce({ update: mockUpdate });

      const result = await toggleFavoritePantryItem('fav-1', true);

      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ is_favorite: true }));
      expect(secondEq).toHaveBeenCalledWith('user_id', mockUser.id);
      expect(result?.ingredient?.name).toBe('normalized-Rice');
    });

    it('should throw on failure', async () => {
      const mockSingle = jest.fn().mockResolvedValue({ data: null, error: new Error('toggle fail') });
      const mockSelect = jest.fn(() => ({ single: mockSingle }));
      const secondEq = jest.fn(() => ({ select: mockSelect }));
      const firstEq = jest.fn(() => ({ eq: secondEq }));
      const mockUpdate = jest.fn(() => ({ eq: firstEq }));
      mockFrom.mockReturnValueOnce({ update: mockUpdate });

      await expect(toggleFavoritePantryItem('fav-1', false)).rejects.toThrow(
        'No se pudo actualizar el estado de favorito.',
      );
    });
  });

  describe('clearPantry', () => {
    it('should clear all items for the user', async () => {
      const eqMock = jest.fn().mockResolvedValue({ error: null });
      const deleteMock = jest.fn(() => ({ eq: eqMock }));
      mockFrom.mockReturnValueOnce({ delete: deleteMock });

      await expect(clearPantry()).resolves.toBeUndefined();
      expect(eqMock).toHaveBeenCalledWith('user_id', mockUser.id);
    });

    it('should throw when deletion fails', async () => {
      const eqMock = jest.fn().mockResolvedValue({ error: new Error('clear fail') });
      const deleteMock = jest.fn(() => ({ eq: eqMock }));
      mockFrom.mockReturnValueOnce({ delete: deleteMock });

      await expect(clearPantry()).rejects.toThrow('No se pudo vaciar la despensa.');
    });
  });

  describe('fetchLowStockItems', () => {
    it('should return items with quantity under min_stock', async () => {
      const mockRow = {
        id: 'low-1',
        quantity: 1,
        min_stock: 2,
        user_id: mockUser.id,
        ingredients: { id: 'ing-1', name: 'Beans', image_url: null },
        categories: null,
      };

      const mockOrder = jest.fn().mockResolvedValue({ data: [mockRow], error: null });
      const mockNot = jest.fn(() => ({ order: mockOrder }));
      const mockEq = jest.fn(() => ({ not: mockNot }));
      const mockSelect = jest.fn(() => ({ eq: mockEq }));
      mockFrom.mockReturnValueOnce({ select: mockSelect });

      const items = await fetchLowStockItems();

      expect(items).toHaveLength(1);
      expect(items[0].id).toBe('low-1');
    });

    it('should throw when query fails', async () => {
      const mockOrder = jest.fn().mockResolvedValue({ data: null, error: new Error('low stock fail') });
      const mockNot = jest.fn(() => ({ order: mockOrder }));
      const mockEq = jest.fn(() => ({ not: mockNot }));
      const mockSelect = jest.fn(() => ({ eq: mockEq }));
      mockFrom.mockReturnValueOnce({ select: mockSelect });

      await expect(fetchLowStockItems()).rejects.toThrow(
        'No se pudieron cargar los ítems con bajo stock.',
      );
    });
  });
});

// Quiet console noise in test output
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
