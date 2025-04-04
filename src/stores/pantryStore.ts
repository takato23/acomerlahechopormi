import { create } from 'zustand';
import {
  getPantryItems as getItemsService,
  addPantryItem as addItemService,
  updatePantryItem as updateItemService,
  deletePantryItem as deleteItemService,
  toggleFavoritePantryItem // Importar la nueva función del servicio
} from '../features/pantry/pantryService'; // Asegurar ruta relativa correcta
import type { PantryItem, CreatePantryItemData, UpdatePantryItemData } from '../features/pantry/types'; // Usar tipos reales

/**
 * @interface PantryState Define el estado y las acciones para la gestión de la despensa.
 * ... (descripciones de props existentes) ...
 * @property {() => Promise<void>} toggleFavorite - Acción para cambiar el estado de favorito de un ítem.
 */
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
  toggleFavorite: (itemId: string) => Promise<void>; // Nueva acción
}

/**
 * Hook de Zustand para gestionar el estado global de la despensa.
 */
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

  // Placeholder para evitar errores si se llama accidentalmente
  fetchLowStockItems: async (_threshold = 1) => {
      console.warn("fetchLowStockItems llamado pero no implementado en pantryService.");
      set({ lowStockItems: [], isLoadingLowStock: false, errorLowStock: 'Funcionalidad no implementada' });
      return Promise.resolve();
  },

  addItem: async (itemData) => {
    try {
      const newItem = await addItemService(itemData);
      if (!newItem) throw new Error("Failed to add item"); // Manejar caso null
      set((state) => ({
        items: [newItem, ...state.items].sort((a, b) => // Mantener ordenado si es necesario
           new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
        )
      }));
      return newItem;
    } catch (error) {
      console.error("Error adding pantry item via store:", error);
      return null;
    }
  },

  updateItem: async (itemId, updates) => {
     const originalItems = get().items;
     const itemIndex = originalItems.findIndex(i => i.id === itemId);
     if (itemIndex === -1) return null; // Item no encontrado

     // Optimistic update
     const updatedOptimisticItem = { ...originalItems[itemIndex], ...updates };
     set((state) => ({
       items: state.items.map(i => i.id === itemId ? updatedOptimisticItem : i)
     }));

     try {
      const updatedItem = await updateItemService(itemId, updates);
      if (!updatedItem) throw new Error("Update failed on server"); // Manejar caso null
      // Re-sincronizar con la respuesta del servidor
      set((state) => ({
        items: state.items.map(i => i.id === itemId ? updatedItem : i)
      }));
      return updatedItem;
    } catch (error) {
      console.error("Error updating pantry item via store:", error);
      set({ items: originalItems }); // Revertir
      return null;
    }
  },

  deleteItem: async (itemId) => {
    const originalItems = get().items;
    // Optimistic update
    set((state) => ({
      items: state.items.filter(i => i.id !== itemId)
    }));
    try {
      await deleteItemService(itemId);
      return true;
    } catch (error) {
      console.error("Error deleting pantry item via store:", error);
      set({ items: originalItems }); // Revertir
      return false;
    }
  },

  // Nueva acción para togglear favoritos
  toggleFavorite: async (itemId: string) => {
    const originalItems = get().items;
    const itemIndex = originalItems.findIndex(i => i.id === itemId);
    if (itemIndex === -1) {
      console.error(`[toggleFavorite] Item with ID ${itemId} not found in store.`);
      return; // Item no encontrado en el store
    }

    const currentItem = originalItems[itemIndex];
    const currentState = Boolean(currentItem.is_favorite); // Asegurar que sea booleano
    const newState = !currentState;

    // Optimistic update
    set((state) => ({
      items: state.items.map(i => i.id === itemId ? { ...i, is_favorite: newState } : i)
    }));

    try {
      const updatedItem = await toggleFavoritePantryItem(itemId, newState);
      if (!updatedItem) {
        // Si el servicio devuelve null (ej: error o no encontrado), revertir
        throw new Error("Toggle favorite failed on server or item not found.");
      }
      // Opcional: Re-sincronizar con la respuesta del servidor si es necesario
      // set((state) => ({
      //   items: state.items.map(i => i.id === itemId ? updatedItem : i)
      // }));
      console.log(`[toggleFavorite] Successfully toggled favorite for ${itemId} to ${newState}`);
    } catch (error) {
      console.error("Error toggling favorite via store:", error);
      // Revertir en caso de error
      set({ items: originalItems });
      // Opcional: Lanzar el error o mostrar un toast
      // throw error;
    }
  },
}));