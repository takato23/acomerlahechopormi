import {
  getPantryItems,
  addPantryItem,
  updatePantryItem,
  deletePantryItem,
  // getLowStockItems, // TODO: Re-enable/implement getLowStockItems tests
} from '../pantryService';
// Importar SOLO el mock de supabase
import { supabase } from '@/lib/supabaseClient';
import { vi, type Mock } from 'vitest';

// Mockear el módulo
vi.mock('@/lib/supabaseClient', async () => await import('@/__mocks__/supabaseClient'));

// Acceder a los mocks directamente desde el objeto supabase importado
const mockGetUser = supabase.auth.getUser as Mock;
const mockFrom = supabase.from as Mock;
// No definir mocks encadenados aquí, se configurarán por prueba

// Mock de usuario
const mockUser = { id: 'pantry-user-456', email: 'pantry@test.com' };

describe.skip('pantryService', () => {
  beforeEach(() => {
    vi.resetAllMocks(); // Resetear todos los mocks completamente
    // Configurar mock de usuario por defecto para CADA prueba
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
  });

  // --- getPantryItems ---
  describe('getPantryItems', () => {
    it('should fetch pantry items for the current user', async () => {
      const mockPantryData = [
        { id: 'p1', name: 'Milk', quantity: 1, unit: 'L', user_id: mockUser.id },
      ];
      // Configurar cadena: from -> select -> eq -> order -> then
      const mockOrder = vi.fn().mockResolvedValueOnce({ data: mockPantryData, error: null });
      const mockEq = vi.fn(() => ({ order: mockOrder }));
      const mockSelect = vi.fn(() => ({ eq: mockEq }));
      mockFrom.mockImplementationOnce(() => ({ select: mockSelect }));

      const items = await getPantryItems();

      expect(items).toEqual(mockPantryData);
      expect(mockFrom).toHaveBeenCalledWith('pantry_items');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('user_id', mockUser.id);
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('should throw error if user is not authenticated', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
      await expect(getPantryItems()).rejects.toThrow('Usuario no autenticado');
    });

    it('should throw error if fetch fails', async () => {
      // Configurar cadena para fallo
      const mockOrder = vi.fn().mockResolvedValueOnce({ data: null, error: new Error('DB Error') });
      const mockEq = vi.fn(() => ({ order: mockOrder }));
      const mockSelect = vi.fn(() => ({ eq: mockEq }));
      mockFrom.mockImplementationOnce(() => ({ select: mockSelect }));
      await expect(getPantryItems()).rejects.toThrow(
        'No se pudieron cargar los ítems de la despensa.',
      );
    });
  });

  // --- addPantryItem ---
  describe('addPantryItem', () => {
    const newItemData = { ingredient_name: 'Eggs', quantity: 12, unit: 'unit' }; // Usar ingredient_name
    const addedItemDB = {
      id: 'p-new',
      user_id: mockUser.id,
      ...newItemData,
      ingredient: { name: newItemData.ingredient_name },
    }; // Usar ingredient_name

    it('should insert a new item and return it', async () => {
      // Configurar cadena: from -> insert -> select -> single -> then
      const mockSingle = vi.fn().mockResolvedValueOnce({ data: addedItemDB, error: null });
      const mockSelect = vi.fn(() => ({ single: mockSingle }));
      const mockInsert = vi.fn(() => ({ select: mockSelect }));
      mockFrom.mockImplementationOnce(() => ({ insert: mockInsert }));

      const result = await addPantryItem(newItemData);

      expect(result).toEqual(addedItemDB);
      expect(mockFrom).toHaveBeenCalledWith('pantry_items');
      expect(mockInsert).toHaveBeenCalledWith({ ...newItemData, user_id: mockUser.id });
    });

    it('should handle null quantity correctly', async () => {
      const newItemNullQty = { ingredient_name: 'Flour', quantity: null, unit: 'kg' }; // Usar ingredient_name
      const addedItemNullQtyDB = {
        id: 'p-null',
        user_id: mockUser.id,
        name: 'Flour',
        quantity: null,
        unit: 'kg',
        ingredient: { name: 'Flour' },
      }; // Simular 'ingredient' poblado
      const mockSingle = vi.fn().mockResolvedValueOnce({ data: addedItemNullQtyDB, error: null });
      const mockSelect = vi.fn(() => ({ single: mockSingle }));
      const mockInsert = vi.fn(() => ({ select: mockSelect }));
      mockFrom.mockImplementationOnce(() => ({ insert: mockInsert }));

      const result = await addPantryItem(newItemNullQty);
      expect(result.quantity).toBeNull();
      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({ quantity: null }));
    });

    it('should handle invalid quantity string as null', async () => {
      const newItemInvalidQty = { ingredient_name: 'Sugar', quantity: 'abc' as any, unit: 'kg' }; // Usar ingredient_name
      const addedItemInvalidQtyDB = {
        id: 'p-invalid',
        user_id: mockUser.id,
        name: 'Sugar',
        quantity: null,
        unit: 'kg',
        ingredient: { name: 'Sugar' },
      }; // Simular 'ingredient' poblado
      const mockSingle = vi
        .fn()
        .mockResolvedValueOnce({ data: addedItemInvalidQtyDB, error: null });
      const mockSelect = vi.fn(() => ({ single: mockSingle }));
      const mockInsert = vi.fn(() => ({ select: mockSelect }));
      mockFrom.mockImplementationOnce(() => ({ insert: mockInsert }));

      const result = await addPantryItem(newItemInvalidQty);
      expect(result.quantity).toBeNull();
      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({ quantity: null }));
    });

    it('should throw error if user is not authenticated', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
      await expect(addPantryItem(newItemData)).rejects.toThrow('Usuario no autenticado');
    });

    it('should throw error if insert fails', async () => {
      const mockSingle = vi
        .fn()
        .mockResolvedValueOnce({ data: null, error: new Error('Insert Fail') });
      const mockSelect = vi.fn(() => ({ single: mockSingle }));
      const mockInsert = vi.fn(() => ({ select: mockSelect }));
      mockFrom.mockImplementationOnce(() => ({ insert: mockInsert }));
      await expect(addPantryItem(newItemData)).rejects.toThrow(
        'No se pudo añadir el ítem a la despensa.',
      );
    });
  });

  // --- updatePantryItem ---
  describe('updatePantryItem', () => {
    const itemId = 'p-update';
    const updates = { quantity: 5 };
    const updatedItemDB = {
      id: itemId,
      name: 'Milk',
      quantity: 5,
      unit: 'L',
      user_id: mockUser.id,
      ingredient: { name: 'Milk' },
    }; // Simular 'ingredient' poblado

    it('should update an existing item and return it', async () => {
      // Configurar cadena: from -> update -> eq -> select -> single -> then
      const mockSingle = vi.fn().mockResolvedValueOnce({ data: updatedItemDB, error: null });
      const mockSelect = vi.fn(() => ({ single: mockSingle }));
      const mockEq = vi.fn(() => ({ select: mockSelect }));
      const mockUpdate = vi.fn(() => ({ eq: mockEq }));
      mockFrom.mockImplementationOnce(() => ({ update: mockUpdate }));

      const result = await updatePantryItem(itemId, updates);

      expect(result).toEqual(updatedItemDB);
      expect(mockFrom).toHaveBeenCalledWith('pantry_items');
      expect(mockUpdate).toHaveBeenCalledWith(updates);
      expect(mockEq).toHaveBeenCalledWith('id', itemId);
    });

    it('should handle null quantity update', async () => {
      const nullUpdates = { quantity: null };
      const mockSingle = vi
        .fn()
        .mockResolvedValueOnce({ data: { ...updatedItemDB, quantity: null }, error: null });
      const mockSelect = vi.fn(() => ({ single: mockSingle }));
      const mockEq = vi.fn(() => ({ select: mockSelect }));
      const mockUpdate = vi.fn(() => ({ eq: mockEq }));
      mockFrom.mockImplementationOnce(() => ({ update: mockUpdate }));

      const result = await updatePantryItem(itemId, nullUpdates);
      expect(result.quantity).toBeNull();
      expect(mockUpdate).toHaveBeenCalledWith({ quantity: null });
    });

    it('should throw error if user is not authenticated', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
      await expect(updatePantryItem(itemId, updates)).rejects.toThrow('Usuario no autenticado');
    });

    it('should throw error if update fails', async () => {
      const mockSingle = vi
        .fn()
        .mockResolvedValueOnce({ data: null, error: new Error('Update Fail') });
      const mockSelect = vi.fn(() => ({ single: mockSingle }));
      const mockEq = vi.fn(() => ({ select: mockSelect }));
      const mockUpdate = vi.fn(() => ({ eq: mockEq }));
      mockFrom.mockImplementationOnce(() => ({ update: mockUpdate }));
      await expect(updatePantryItem(itemId, updates)).rejects.toThrow(
        'No se pudo actualizar el ítem.',
      );
    });
  });

  // --- deletePantryItem ---
  describe('deletePantryItem', () => {
    it('should delete an item', async () => {
      // Configurar cadena: from -> delete -> eq -> then
      const mockThen = vi.fn().mockResolvedValueOnce({ error: null });
      const mockEq = vi.fn(() => ({ then: mockThen }));
      const mockDelete = vi.fn(() => ({ eq: mockEq }));
      mockFrom.mockImplementationOnce(() => ({ delete: mockDelete }));

      await expect(deletePantryItem('p-delete')).resolves.toBeUndefined();
      expect(mockFrom).toHaveBeenCalledWith('pantry_items');
      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('id', 'p-delete');
    });

    it('should throw error if user is not authenticated', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
      await expect(deletePantryItem('p-delete-fail')).rejects.toThrow('Usuario no autenticado');
    });

    it('should throw error if delete fails', async () => {
      const mockThen = vi.fn().mockResolvedValueOnce({ error: new Error('Delete Fail') });
      const mockEq = vi.fn(() => ({ then: mockThen }));
      const mockDelete = vi.fn(() => ({ eq: mockEq }));
      mockFrom.mockImplementationOnce(() => ({ delete: mockDelete }));
      await expect(deletePantryItem('p-delete-fail')).rejects.toThrow(
        'No se pudo eliminar el ítem.',
      );
    });
  });

  // --- getLowStockItems --- // TODO: Re-enable/implement getLowStockItems tests
  // describe('getLowStockItems', () => {
  //    it('should fetch items with quantity <= threshold', async () => {
  //      const mockLowStockData = [{ id: 'p-low', name: 'Salt', quantity: 0, user_id: mockUser.id }];
  //      // Configurar cadena: from -> select -> eq -> lte -> order -> then
  //      const mockThen = vi.fn().mockResolvedValueOnce({ data: mockLowStockData, error: null });
  //      const mockOrder = vi.fn(() => ({ then: mockThen }));
  //      const mockLte = vi.fn(() => ({ order: mockOrder }));
  //      const mockEq = vi.fn(() => ({ lte: mockLte }));
  //      const mockSelect = vi.fn(() => ({ eq: mockEq }));
  //      mockFrom.mockImplementationOnce(() => ({ select: mockSelect }));
  //
  //      const items = await getLowStockItems(1); // Threshold 1
  //
  //      expect(items).toEqual(mockLowStockData);
  //      expect(mockFrom).toHaveBeenCalledWith('pantry_items');
  //      expect(mockSelect).toHaveBeenCalledWith('*');
  //      expect(mockEq).toHaveBeenCalledWith('user_id', mockUser.id);
  //      expect(mockLte).toHaveBeenCalledWith('quantity', 1);
  //      expect(mockOrder).toHaveBeenCalledWith('name', { ascending: true });
  //    });
  //
  //    it('should use default threshold of 1 if not provided', async () => {
  //       const mockThen = vi.fn().mockResolvedValueOnce({ data: [], error: null });
  //       const mockOrder = vi.fn(() => ({ then: mockThen }));
  //       const mockLte = vi.fn(() => ({ order: mockOrder }));
  //       const mockEq = vi.fn(() => ({ lte: mockLte }));
  //       const mockSelect = vi.fn(() => ({ eq: mockEq }));
  //       mockFrom.mockImplementationOnce(() => ({ select: mockSelect }));
  //
  //       await getLowStockItems(); // Sin threshold
  //       expect(mockLte).toHaveBeenCalledWith('quantity', 1); // Verifica threshold por defecto
  //    });
  //
  //    it('should throw error if user is not authenticated', async () => {
  //      mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
  //      await expect(getLowStockItems()).rejects.toThrow('Usuario no autenticado');
  //    });
  //
  //    it('should throw error if fetch fails', async () => {
  //       const mockThen = vi.fn().mockResolvedValueOnce({ data: null, error: new Error('Low Stock Fetch Fail') });
  //       const mockOrder = vi.fn(() => ({ then: mockThen }));
  //       const mockLte = vi.fn(() => ({ order: mockOrder }));
  //       const mockEq = vi.fn(() => ({ lte: mockLte }));
  //       const mockSelect = vi.fn(() => ({ eq: mockEq }));
  //       mockFrom.mockImplementationOnce(() => ({ select: mockSelect }));
  //       await expect(getLowStockItems()).rejects.toThrow('No se pudieron cargar los ítems con bajo stock.');
  //    });
  // });
});

// Mock console
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};
