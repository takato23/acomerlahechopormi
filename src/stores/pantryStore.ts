import { create } from 'zustand';
import {
  getPantryItems as getItemsService,
  addPantryItem as addItemService,
  updatePantryItem as updateItemService,
  deletePantryItem as deleteItemService,
  toggleFavoritePantryItem,
  fetchLowStockItems as fetchLowStockItemsService
} from '../features/pantry/services/pantryService';
import type { PantryItem, CreatePantryItemData, UpdatePantryItemData } from '../features/pantry/types';

interface PantryState {
  items: PantryItem[];
  lowStockItems: PantryItem[];
  isLoading: boolean;
  isLoadingLowStock: boolean;
  error: string | null;
  errorLowStock: string | null;
  fetchItems: () => Promise<void>;
  fetchLowStockItems: (threshold?: number) => Promise<void>;
  addItem: (itemData: CreatePantryItemData) => Promise<PantryItem | null>;
  updateItem: (itemId: string, updates: UpdatePantryItemData) => Promise<PantryItem | null>;
  deleteItem: (itemId: string) => Promise<boolean>;
  toggleFavorite: (itemId: string) => Promise<void>;
}

export const usePantryStore = create<PantryState>((set, get) => ({
  items: [],
  lowStockItems: [],
  isLoading: false,
  isLoadingLowStock: false,
  error: null,
  errorLowStock: null,

  fetchItems: async () => {
    if (get().isLoading) return;
    set({ isLoading: true, error: null });
    try {
      const items = await getItemsService();
      set({ items, isLoading: false });
    } catch (error) {
      console.error("Error fetching pantry items for store:", error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al cargar despensa.';
      set({ error: errorMessage, isLoading: false });
    }
  },

  fetchLowStockItems: async (threshold = 2) => {
    if (get().isLoadingLowStock) return;
    set({ isLoadingLowStock: true, errorLowStock: null });
    try {
      const lowStockItems = await fetchLowStockItemsService(threshold);
      set({ lowStockItems, isLoadingLowStock: false });
    } catch (error) {
      console.error("Error fetching low stock items:", error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al cargar items bajos de stock.';
      set({ errorLowStock: errorMessage, isLoadingLowStock: false });
    }
  },

  addItem: async (itemData: CreatePantryItemData) => {
    try {
      const newItem = await addItemService(itemData);
      if (!newItem) throw new Error("Failed to add item");
      set((state) => ({
        items: [newItem, ...state.items].sort((a, b) =>
          new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
        )
      }));
      return newItem;
    } catch (error) {
      console.error("Error adding pantry item via store:", error);
      return null;
    }
  },

  updateItem: async (itemId: string, updates: UpdatePantryItemData) => {
    const originalItems = get().items;
    const itemIndex = originalItems.findIndex(i => i.id === itemId);
    if (itemIndex === -1) return null;

    const updatedOptimisticItem = { ...originalItems[itemIndex], ...updates };
    set((state) => ({
      items: state.items.map(i => i.id === itemId ? updatedOptimisticItem : i)
    }));

    try {
      const updatedItem = await updateItemService(itemId, updates);
      if (!updatedItem) throw new Error("Update failed on server");
      set((state) => ({
        items: state.items.map(i => i.id === itemId ? updatedItem : i)
      }));
      return updatedItem;
    } catch (error) {
      console.error("Error updating pantry item via store:", error);
      set({ items: originalItems });
      return null;
    }
  },

  deleteItem: async (itemId: string) => {
    const originalItems = get().items;
    set((state) => ({
      items: state.items.filter(i => i.id !== itemId)
    }));
    try {
      await deleteItemService(itemId);
      return true;
    } catch (error) {
      console.error("Error deleting pantry item via store:", error);
      set({ items: originalItems });
      return false;
    }
  },

  toggleFavorite: async (itemId: string) => {
    const originalItems = get().items;
    const itemIndex = originalItems.findIndex(i => i.id === itemId);
    if (itemIndex === -1) {
      console.error(`[toggleFavorite] Item with ID ${itemId} not found in store.`);
      return;
    }

    const currentItem = originalItems[itemIndex];
    const currentState = Boolean(currentItem.is_favorite);
    const newState = !currentState;

    set((state) => ({
      items: state.items.map(i => i.id === itemId ? { ...i, is_favorite: newState } : i)
    }));

    try {
      const updatedItem = await toggleFavoritePantryItem(itemId, newState);
      if (!updatedItem) {
        throw new Error("Toggle favorite failed on server or item not found.");
      }
      console.log(`[toggleFavorite] Successfully toggled favorite for ${itemId} to ${newState}`);
    } catch (error) {
      console.error("Error toggling favorite via store:", error);
      set({ items: originalItems });
    }
  },
}));