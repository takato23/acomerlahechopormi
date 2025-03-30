import { useShoppingListStore } from './shoppingListStore';
import { act } from 'react';
import * as shoppingListService from '@/features/shopping-list/services/shoppingListService';

// Mockear el servicio de lista de compras
jest.mock('@/features/shopping-list/services/shoppingListService');
const mockedShoppingListService = shoppingListService as jest.Mocked<typeof shoppingListService>;

// Mock de datos
const mockItem1 = { id: 'sl1', name: 'Milk', is_purchased: false, created_at: '2023-01-01T10:00:00Z', user_id: 'u1' };
const mockItem2 = { id: 'sl2', name: 'Eggs', is_purchased: true, created_at: '2023-01-02T10:00:00Z', user_id: 'u1' };
const mockNewItemData = { name: 'Bread' };
const mockCreatedItem = { id: 'sl-new', ...mockNewItemData, is_purchased: false, created_at: new Date().toISOString(), user_id: 'u1' };

describe('useShoppingListStore', () => {

  beforeEach(() => {
    useShoppingListStore.setState({ items: [], isLoading: false, error: null });
    jest.resetAllMocks(); // Usar reset completo
    // Asegurar que mockGetUser esté configurado por defecto si es necesario
    // (Aunque este store no llama directamente a getUser, los servicios que llama sí lo hacen)
    // Si las pruebas fallan por autenticación, añadiremos la configuración aquí.
  });

  // --- fetchItems ---
  it('fetchItems should update state on success', async () => {
    mockedShoppingListService.getShoppingListItems.mockResolvedValue([mockItem1, mockItem2]);
    
    await act(async () => {
      await useShoppingListStore.getState().fetchItems();
    });

    expect(useShoppingListStore.getState().isLoading).toBe(false);
    expect(useShoppingListStore.getState().error).toBeNull();
    expect(useShoppingListStore.getState().items).toEqual([mockItem1, mockItem2]);
    expect(mockedShoppingListService.getShoppingListItems).toHaveBeenCalledTimes(1);
  });

  it('fetchItems should set error state on failure', async () => {
    const errorMessage = 'Failed to fetch shopping list';
    mockedShoppingListService.getShoppingListItems.mockRejectedValue(new Error(errorMessage));

    await act(async () => {
      await useShoppingListStore.getState().fetchItems();
    });

    expect(useShoppingListStore.getState().isLoading).toBe(false);
    expect(useShoppingListStore.getState().error).toBe(errorMessage);
    expect(useShoppingListStore.getState().items).toEqual([]);
  });
  
  it('fetchItems should not fetch if already loading', async () => {
     useShoppingListStore.setState({ isLoading: true }); 
     await act(async () => {
       await useShoppingListStore.getState().fetchItems();
     });
     expect(mockedShoppingListService.getShoppingListItems).not.toHaveBeenCalled();
  });

  // --- addItem ---
  it('addItem should add an item and update state, maintaining sort order', async () => {
    // Estado inicial con item comprado
    useShoppingListStore.setState({ items: [mockItem2], isLoading: false, error: null });
    mockedShoppingListService.addShoppingListItem.mockResolvedValue(mockCreatedItem);

    let result: any;
    await act(async () => {
       result = await useShoppingListStore.getState().addItem(mockNewItemData);
    });

    expect(result).toEqual(mockCreatedItem);
    // El nuevo item (no comprado) debe ir antes del comprado
    expect(useShoppingListStore.getState().items).toEqual([mockCreatedItem, mockItem2]); 
    expect(mockedShoppingListService.addShoppingListItem).toHaveBeenCalledWith(mockNewItemData);
  });
  
  it('addItem should return null on failure', async () => {
     mockedShoppingListService.addShoppingListItem.mockRejectedValue(new Error('Add failed'));
     
     let result: any;
     await act(async () => {
        result = await useShoppingListStore.getState().addItem(mockNewItemData);
     });

     expect(result).toBeNull();
     expect(useShoppingListStore.getState().items).toEqual([]);
  });

  // --- updateItem ---
  it('updateItem should update an item in state (optimistic) and maintain sort order', async () => {
    useShoppingListStore.setState({ items: [mockItem1, mockItem2], isLoading: false, error: null });
    const updates = { is_purchased: true }; // Marcar mockItem1 como comprado
    const updatedItem = { ...mockItem1, ...updates };
    mockedShoppingListService.updateShoppingListItem.mockResolvedValue(updatedItem);

    let result: any;
    await act(async () => {
       result = await useShoppingListStore.getState().updateItem(mockItem1.id, updates);
    });

    expect(result).toEqual(updatedItem);
    // Ambos items ahora están comprados, el orden debería ser por created_at (mockItem1 antes que mockItem2)
    expect(useShoppingListStore.getState().items).toEqual([updatedItem, mockItem2]); 
    expect(mockedShoppingListService.updateShoppingListItem).toHaveBeenCalledWith(mockItem1.id, updates);
  });
  
  it('updateItem should revert state on failure', async () => {
     useShoppingListStore.setState({ items: [mockItem1, mockItem2], isLoading: false, error: null });
     const updates = { is_purchased: true };
     mockedShoppingListService.updateShoppingListItem.mockRejectedValue(new Error('Update failed'));

     let result: any;
     await act(async () => {
        result = await useShoppingListStore.getState().updateItem(mockItem1.id, updates);
     });

     expect(result).toBeNull();
     expect(useShoppingListStore.getState().items).toEqual([mockItem1, mockItem2]); // Estado revertido
  });

  // --- deleteItem ---
  it('deleteItem should remove item from state (optimistic)', async () => {
    useShoppingListStore.setState({ items: [mockItem1, mockItem2], isLoading: false, error: null });
    mockedShoppingListService.deleteShoppingListItem.mockResolvedValue(); 

    let success: boolean = false;
    await act(async () => {
       success = await useShoppingListStore.getState().deleteItem(mockItem1.id);
    });

    expect(success).toBe(true);
    expect(useShoppingListStore.getState().items).toEqual([mockItem2]);
    expect(mockedShoppingListService.deleteShoppingListItem).toHaveBeenCalledWith(mockItem1.id);
  });
  
  it('deleteItem should revert state on failure', async () => {
     useShoppingListStore.setState({ items: [mockItem1, mockItem2], isLoading: false, error: null });
     mockedShoppingListService.deleteShoppingListItem.mockRejectedValue(new Error('Delete failed'));

     let success: boolean = true;
     await act(async () => {
        success = await useShoppingListStore.getState().deleteItem(mockItem1.id);
     });

     expect(success).toBe(false);
     expect(useShoppingListStore.getState().items).toEqual([mockItem1, mockItem2]); // Estado revertido
  });

  // --- clearPurchased ---
  it('clearPurchased should remove purchased items from state (optimistic)', async () => {
    useShoppingListStore.setState({ items: [mockItem1, mockItem2], isLoading: false, error: null }); // item2 is purchased
    mockedShoppingListService.clearPurchasedItems.mockResolvedValue(); 

    let success: boolean = false;
    await act(async () => {
       success = await useShoppingListStore.getState().clearPurchased();
    });

    expect(success).toBe(true);
    expect(useShoppingListStore.getState().items).toEqual([mockItem1]); // Solo queda item1
    expect(mockedShoppingListService.clearPurchasedItems).toHaveBeenCalledTimes(1);
  });
  
  it('clearPurchased should revert state on failure', async () => {
     useShoppingListStore.setState({ items: [mockItem1, mockItem2], isLoading: false, error: null });
     mockedShoppingListService.clearPurchasedItems.mockRejectedValue(new Error('Clear failed'));

     let success: boolean = true;
     await act(async () => {
        success = await useShoppingListStore.getState().clearPurchased();
     });

     expect(success).toBe(false);
     expect(useShoppingListStore.getState().items).toEqual([mockItem1, mockItem2]); // Estado revertido
  });

});