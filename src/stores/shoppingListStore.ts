import { create } from 'zustand';
import {
  getShoppingListItems,
  addShoppingListItem,
  updateShoppingListItem,
  deleteShoppingListItem,
  clearPurchasedItems,
} from '@/features/shopping-list/services/shoppingListService';
// Usar any temporalmente
// import type { ShoppingListItem, NewShoppingListItem, UpdateShoppingListItem } from '@/features/shopping-list/types';
type ShoppingListItem = any;
type NewShoppingListItem = any;
type UpdateShoppingListItem = any;

/**
 * @interface ShoppingListState Define el estado y las acciones para la gestión de la lista de compras.
 * @property {ShoppingListItem[]} items - Array de ítems en la lista de compras del usuario.
 * @property {boolean} isLoading - Indica si se están cargando los ítems.
 * @property {string | null} error - Mensaje de error si la carga falla.
 * @property {() => Promise<void>} fetchItems - Acción para cargar todos los ítems de la lista.
 * @property {(itemData: NewShoppingListItem) => Promise<ShoppingListItem | null>} addItem - Acción para añadir un nuevo ítem manualmente.
 * @property {(itemId: string, updates: UpdateShoppingListItem) => Promise<ShoppingListItem | null>} updateItem - Acción para actualizar un ítem (ej. marcar como comprado).
 * @property {(itemId: string) => Promise<boolean>} deleteItem - Acción para eliminar un ítem.
 * @property {() => Promise<boolean>} clearPurchased - Acción para eliminar todos los ítems marcados como comprados.
 */
interface ShoppingListState {
  items: ShoppingListItem[];
  isLoading: boolean;
  error: string | null;
  fetchItems: () => Promise<void>;
  addItem: (itemData: NewShoppingListItem) => Promise<ShoppingListItem | null>;
  updateItem: (itemId: string, updates: UpdateShoppingListItem) => Promise<ShoppingListItem | null>;
  deleteItem: (itemId: string) => Promise<boolean>;
  clearPurchased: () => Promise<boolean>;
}

/**
 * Hook de Zustand para gestionar el estado global de la lista de compras.
 */
export const useShoppingListStore = create<ShoppingListState>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,

  /**
   * Carga todos los ítems de la lista de compras del usuario desde el servicio.
   * @async
   */
  fetchItems: async () => {
    if (get().isLoading) return;
    set({ isLoading: true, error: null });
    try {
      const items = await getShoppingListItems();
      set({ items, isLoading: false });
    } catch (error) {
      console.error("Error fetching shopping list items for store:", error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al cargar lista.';
      set({ error: errorMessage, isLoading: false });
    }
  },

  /**
   * Añade un nuevo ítem a la lista llamando al servicio y actualiza el estado.
   * @async
   * @param {NewShoppingListItem} itemData - Datos del nuevo ítem.
   * @returns {Promise<ShoppingListItem | null>} El ítem añadido o null si falla.
   */
  addItem: async (itemData) => {
    try {
      const newItem = await addShoppingListItem(itemData);
      set((state) => ({ 
        items: [...state.items, newItem].sort((a, b) => { 
          if (a.is_purchased !== b.is_purchased) return a.is_purchased ? 1 : -1;
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        })
      }));
      return newItem;
    } catch (error) {
      console.error("Error adding shopping list item via store:", error);
      return null; 
    }
  },

  /**
   * Actualiza un ítem existente llamando al servicio y actualiza el estado.
   * Realiza una actualización optimista.
   * @async
   * @param {string} itemId - ID del ítem a actualizar.
   * @param {UpdateShoppingListItem} updates - Datos a actualizar.
   * @returns {Promise<ShoppingListItem | null>} El ítem actualizado o null si falla.
   */
  updateItem: async (itemId, updates) => {
    const originalItems = get().items;
    // Optimistic update
    set((state) => ({
      items: state.items.map(i => 
        i.id === itemId ? { ...i, ...updates } : i
      ).sort((a, b) => { 
         if (a.is_purchased !== b.is_purchased) return a.is_purchased ? 1 : -1;
         return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      })
    }));

    try {
      const updatedItem = await updateShoppingListItem(itemId, updates);
      // Opcional: Re-sincronizar con la respuesta del servidor
      // set((state) => ({ items: state.items.map(i => i.id === itemId ? updatedItem : i) }));
      return updatedItem;
    } catch (error) {
      console.error("Error updating shopping list item via store:", error);
      set({ items: originalItems }); // Revertir
      return null;
    }
  },

  /**
   * Elimina un ítem llamando al servicio y actualiza el estado.
   * Realiza una actualización optimista.
   * @async
   * @param {string} itemId - ID del ítem a eliminar.
   * @returns {Promise<boolean>} `true` si la eliminación fue exitosa, `false` si falló.
   */
  deleteItem: async (itemId) => {
     const originalItems = get().items;
     set((state) => ({
       items: state.items.filter(i => i.id !== itemId)
     }));

    try {
      await deleteShoppingListItem(itemId);
      return true;
    } catch (error) {
      console.error("Error deleting shopping list item via store:", error);
      set({ items: originalItems }); // Revertir
      return false;
    }
  },

  /**
   * Elimina todos los ítems comprados llamando al servicio y actualiza el estado.
   * Realiza una actualización optimista.
   * @async
   * @returns {Promise<boolean>} `true` si la operación fue exitosa, `false` si falló.
   */
  clearPurchased: async () => {
    const originalItems = get().items;
    const itemsToKeep = originalItems.filter(i => !i.is_purchased);
    set({ items: itemsToKeep });

    try {
      await clearPurchasedItems();
      return true;
    } catch (error) {
      console.error("Error clearing purchased items via store:", error);
      set({ items: originalItems }); // Revertir
      return false;
    }
  },
}));