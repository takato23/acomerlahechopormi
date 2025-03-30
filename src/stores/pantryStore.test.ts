import { usePantryStore } from './pantryStore';
import { act } from 'react';
import * as pantryService from '@/features/pantry/pantryService';

// Mockear el servicio de despensa
jest.mock('@/features/pantry/pantryService');
const mockedPantryService = pantryService as jest.Mocked<typeof pantryService>;

// Mock de datos
const mockItem1 = { id: 'p1', name: 'Milk', quantity: 1, unit: 'L', created_at: '2023-01-01T10:00:00Z', ingredient_id: 'ing1', user_id: 'u1' };
const mockItem2 = { id: 'p2', name: 'Eggs', quantity: 12, unit: 'unit', created_at: '2023-01-02T10:00:00Z', ingredient_id: 'ing2', user_id: 'u1' };
const mockLowStockItem = { id: 'p3', name: 'Salt', quantity: 0, unit: 'kg', created_at: '2023-01-03T10:00:00Z', ingredient_id: 'ing3', user_id: 'u1' };
const mockNewItemData = { ingredient_name: 'Flour', quantity: 1, unit: 'kg' }; // Usar ingredient_name según CreatePantryItemData
const mockCreatedItem = { id: 'p-new', ...mockNewItemData, quantity: 1, unit: 'kg', created_at: new Date().toISOString(), ingredient_id: 'ing-flour', user_id: 'u1' };

describe('usePantryStore', () => {

  beforeEach(() => {
    usePantryStore.setState({ items: [], lowStockItems: [], isLoading: false, isLoadingLowStock: false, error: null, errorLowStock: null });
    jest.resetAllMocks(); // Usar reset completo
    // Asegurar que mockGetUser esté configurado por defecto si es necesario
    // (Aunque este store no llama directamente a getUser, los servicios que llama sí lo hacen)
    // Si las pruebas fallan por autenticación, añadiremos la configuración aquí.
  });

  // --- fetchItems ---
  it('fetchItems should update state on success', async () => {
    mockedPantryService.getPantryItems.mockResolvedValue([mockItem1, mockItem2]);
    
    await act(async () => {
      await usePantryStore.getState().fetchItems();
    });

    expect(usePantryStore.getState().isLoading).toBe(false);
    expect(usePantryStore.getState().error).toBeNull();
    expect(usePantryStore.getState().items).toEqual([mockItem1, mockItem2]);
    expect(mockedPantryService.getPantryItems).toHaveBeenCalledTimes(1);
  });

  it('fetchItems should set error state on failure', async () => {
    const errorMessage = 'Failed to fetch pantry';
    mockedPantryService.getPantryItems.mockRejectedValue(new Error(errorMessage));

    await act(async () => {
      await usePantryStore.getState().fetchItems();
    });

    expect(usePantryStore.getState().isLoading).toBe(false);
    expect(usePantryStore.getState().error).toBe(errorMessage);
    expect(usePantryStore.getState().items).toEqual([]);
  });
  
  it('fetchItems should not fetch if already loading', async () => {
     usePantryStore.setState({ isLoading: true }); // Simular estado de carga
     await act(async () => {
       await usePantryStore.getState().fetchItems();
     });
     expect(mockedPantryService.getPantryItems).not.toHaveBeenCalled();
  });

  // --- fetchLowStockItems ---
  it('fetchLowStockItems should update lowStockItems state on success', async () => {
    mockedPantryService.getLowStockItems.mockResolvedValue([mockLowStockItem]);
    
    await act(async () => {
      await usePantryStore.getState().fetchLowStockItems(1); // Usar threshold explícito
    });

    expect(usePantryStore.getState().isLoadingLowStock).toBe(false);
    expect(usePantryStore.getState().errorLowStock).toBeNull();
    expect(usePantryStore.getState().lowStockItems).toEqual([mockLowStockItem]);
    expect(mockedPantryService.getLowStockItems).toHaveBeenCalledWith(1);
  });
  
  it('fetchLowStockItems should use default threshold if not provided', async () => {
     mockedPantryService.getLowStockItems.mockResolvedValue([]);
     await act(async () => {
       await usePantryStore.getState().fetchLowStockItems(); // Sin threshold
     });
     expect(mockedPantryService.getLowStockItems).toHaveBeenCalledWith(1); // Verifica threshold 1 por defecto
  });

  it('fetchLowStockItems should set errorLowStock state on failure', async () => {
    const errorMessage = 'Failed to fetch low stock';
    mockedPantryService.getLowStockItems.mockRejectedValue(new Error(errorMessage));

    await act(async () => {
      await usePantryStore.getState().fetchLowStockItems();
    });

    expect(usePantryStore.getState().isLoadingLowStock).toBe(false);
    expect(usePantryStore.getState().errorLowStock).toBe(errorMessage);
    expect(usePantryStore.getState().lowStockItems).toEqual([]);
  });
  
  it('fetchLowStockItems should not fetch if already loading', async () => {
     usePantryStore.setState({ isLoadingLowStock: true }); 
     await act(async () => {
       await usePantryStore.getState().fetchLowStockItems();
     });
     expect(mockedPantryService.getLowStockItems).not.toHaveBeenCalled();
  });

  // --- addItem ---
  it('addItem should add an item and update state', async () => {
    mockedPantryService.addPantryItem.mockResolvedValue(mockCreatedItem);
    // Mockear fetchLowStockItems para verificar si se llama
    mockedPantryService.getLowStockItems.mockResolvedValue([]); 

    let result: any;
    await act(async () => {
       result = await usePantryStore.getState().addItem(mockNewItemData);
    });

    expect(result).toEqual(mockCreatedItem);
    expect(usePantryStore.getState().items).toContainEqual(mockCreatedItem);
    expect(mockedPantryService.addPantryItem).toHaveBeenCalledWith(mockNewItemData);
    // Verificar que se refrescó low stock porque quantity=1 <= threshold=1
    expect(mockedPantryService.getLowStockItems).toHaveBeenCalled(); 
  });
  
   it('addItem should not refresh low stock if quantity > threshold', async () => {
    const highQtyItemData = { ...mockNewItemData, quantity: 5 };
    const createdHighQtyItem = { ...mockCreatedItem, quantity: 5 };
    mockedPantryService.addPantryItem.mockResolvedValue(createdHighQtyItem);
    mockedPantryService.getLowStockItems.mockResolvedValue([]); 

    await act(async () => {
       await usePantryStore.getState().addItem(highQtyItemData);
    });

    expect(mockedPantryService.getLowStockItems).not.toHaveBeenCalled(); 
  });

  it('addItem should return null on failure', async () => {
     mockedPantryService.addPantryItem.mockRejectedValue(new Error('Add failed'));
     
     let result: any;
     await act(async () => {
        result = await usePantryStore.getState().addItem(mockNewItemData);
     });

     expect(result).toBeNull();
     expect(usePantryStore.getState().items).toEqual([]);
  });

  // --- updateItem ---
  it('updateItem should update an item in state (optimistic)', async () => {
    usePantryStore.setState({ items: [mockItem1], lowStockItems: [], isLoading: false, error: null });
    const updates = { quantity: 5 };
    const updatedItem = { ...mockItem1, ...updates };
    mockedPantryService.updatePantryItem.mockResolvedValue(updatedItem);
    mockedPantryService.getLowStockItems.mockResolvedValue([]); // Mockear para verificar llamada

    let result: any;
    await act(async () => {
       result = await usePantryStore.getState().updateItem(mockItem1.id, updates);
    });

    expect(result).toEqual(updatedItem);
    expect(usePantryStore.getState().items[0]).toEqual(updatedItem);
    expect(mockedPantryService.updatePantryItem).toHaveBeenCalledWith(mockItem1.id, updates);
    // Verificar que se refrescó low stock porque quantity cambió
    expect(mockedPantryService.getLowStockItems).toHaveBeenCalled(); 
  });
  
  it('updateItem should revert state on failure', async () => {
     usePantryStore.setState({ items: [mockItem1], isLoading: false, error: null });
     const updates = { quantity: 10 };
     mockedPantryService.updatePantryItem.mockRejectedValue(new Error('Update failed'));

     let result: any;
     await act(async () => {
        result = await usePantryStore.getState().updateItem(mockItem1.id, updates);
     });

     expect(result).toBeNull();
     expect(usePantryStore.getState().items[0]).toEqual(mockItem1); // Estado revertido
  });

  // --- deleteItem ---
  it('deleteItem should remove item from state (optimistic)', async () => {
    usePantryStore.setState({ items: [mockItem1, mockItem2], lowStockItems: [], isLoading: false, error: null });
    mockedPantryService.deletePantryItem.mockResolvedValue(); // Simular éxito
    mockedPantryService.getLowStockItems.mockResolvedValue([]); // Mockear para verificar llamada

    let success: boolean = false;
    await act(async () => {
       success = await usePantryStore.getState().deleteItem(mockItem1.id);
    });

    expect(success).toBe(true);
    expect(usePantryStore.getState().items).toEqual([mockItem2]);
    expect(mockedPantryService.deletePantryItem).toHaveBeenCalledWith(mockItem1.id);
    // Verificar que se refrescó low stock
    expect(mockedPantryService.getLowStockItems).toHaveBeenCalled(); 
  });
  
  it('deleteItem should revert state on failure', async () => {
     usePantryStore.setState({ items: [mockItem1, mockItem2], isLoading: false, error: null });
     mockedPantryService.deletePantryItem.mockRejectedValue(new Error('Delete failed'));

     let success: boolean = true;
     await act(async () => {
        success = await usePantryStore.getState().deleteItem(mockItem1.id);
     });

     expect(success).toBe(false);
     expect(usePantryStore.getState().items).toEqual([mockItem1, mockItem2]); // Estado revertido
  });

});