import { create } from 'zustand';
import {
  getPantryItems as getItemsService,
  addPantryItem as addItemService,
  updatePantryItem as updateItemService,
  deletePantryItem as deleteItemService,
  getLowStockItems as getLowStockService 
} from '@/features/pantry/pantryService';
// Usar any temporalmente
// import type { PantryItem, NewPantryItem, UpdatePantryItem } from '@/features/pantry/types';
type PantryItem = any;
type NewPantryItem = any;
type UpdatePantryItem = any;

/**
 * @interface PantryState Define el estado y las acciones para la gestión de la despensa.
 * @property {PantryItem[]} items - Array de todos los ítems en la despensa del usuario.
 * @property {PantryItem[]} lowStockItems - Array de ítems con bajo stock.
 * @property {boolean} isLoading - Indica si se están cargando todos los ítems.
 * @property {boolean} isLoadingLowStock - Indica si se están cargando los ítems con bajo stock.
 * @property {string | null} error - Mensaje de error si la carga de todos los ítems falla.
 * @property {string | null} errorLowStock - Mensaje de error si la carga de ítems bajos falla.
 * @property {() => Promise<void>} fetchItems - Acción para cargar todos los ítems de la despensa.
 * @property {(threshold?: number) => Promise<void>} fetchLowStockItems - Acción para cargar ítems con stock bajo o igual al umbral.
 * @property {(itemData: NewPantryItem) => Promise<PantryItem | null>} addItem - Acción para añadir un nuevo ítem.
 * @property {(itemId: string, updates: UpdatePantryItem) => Promise<PantryItem | null>} updateItem - Acción para actualizar un ítem existente.
 * @property {(itemId: string) => Promise<boolean>} deleteItem - Acción para eliminar un ítem.
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
  addItem: (itemData: NewPantryItem) => Promise<PantryItem | null>;
  updateItem: (itemId: string, updates: UpdatePantryItem) => Promise<PantryItem | null>;
  deleteItem: (itemId: string) => Promise<boolean>;
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

  /**
   * Carga todos los ítems de la despensa del usuario desde el servicio.
   * @async
   */
  fetchItems: async () => {
    // Evitar carga múltiple si ya está cargando
    if (get().isLoading) return; 
    set({ isLoading: true, error: null });
    try {
      const items = await getItemsService();
      set({ items, isLoading: false });
      // Opcional: Recalcular low stock después de cargar todos los items
      // get().fetchLowStockItems(); 
    } catch (error) {
      console.error("Error fetching pantry items for store:", error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al cargar despensa.';
      set({ error: errorMessage, isLoading: false });
    }
  },

  /**
   * Carga los ítems con bajo stock desde el servicio.
   * @async
   * @param {number} [threshold=1] - Umbral de cantidad para considerar bajo stock.
   */
  fetchLowStockItems: async (threshold = 1) => {
     // Evitar carga múltiple
    if (get().isLoadingLowStock) return;
    set({ isLoadingLowStock: true, errorLowStock: null });
    try {
      const lowStockItems = await getLowStockService(threshold);
      set({ lowStockItems, isLoadingLowStock: false });
    } catch (error) {
      console.error("Error fetching low stock items for store:", error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al cargar items bajos.';
      set({ errorLowStock: errorMessage, isLoadingLowStock: false });
    }
  },

  /**
   * Añade un nuevo ítem a la despensa llamando al servicio y actualiza el estado.
   * @async
   * @param {NewPantryItem} itemData - Datos del nuevo ítem.
   * @returns {Promise<PantryItem | null>} El ítem añadido o null si falla.
   */
  addItem: async (itemData) => {
    try {
      const newItem = await addItemService(itemData);
      set((state) => ({ 
        items: [newItem, ...state.items].sort((a, b) => // Mantener ordenado si es necesario
           new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ) 
      }));
      // Refrescar low stock si el nuevo item podría calificar
      if (newItem.quantity !== null && newItem.quantity <= (get().lowStockItems.length > 0 ? 1 : 1)) { // Asumiendo umbral 1 por defecto
         get().fetchLowStockItems(); 
      }
      return newItem;
    } catch (error) {
      console.error("Error adding pantry item via store:", error);
      return null;
    }
  },

  /**
   * Actualiza un ítem existente llamando al servicio y actualiza el estado.
   * Realiza una actualización optimista.
   * @async
   * @param {string} itemId - ID del ítem a actualizar.
   * @param {UpdatePantryItem} updates - Datos a actualizar.
   * @returns {Promise<PantryItem | null>} El ítem actualizado o null si falla.
   */
  updateItem: async (itemId, updates) => {
     const originalItems = get().items;
     // Optimistic update
     set((state) => ({
       items: state.items.map(i => i.id === itemId ? { ...i, ...updates } : i)
     }));

     try {
      const updatedItem = await updateItemService(itemId, updates);
      // Re-sincronizar con la respuesta del servidor (opcional pero más seguro)
      set((state) => ({
        items: state.items.map(i => i.id === itemId ? updatedItem : i)
      }));
       // Refrescar low stock si la cantidad cambió
       if (updates.quantity !== undefined) {
          get().fetchLowStockItems(); 
       }
      return updatedItem;
    } catch (error) {
      console.error("Error updating pantry item via store:", error);
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
    // Optimistic update
    set((state) => ({
      items: state.items.filter(i => i.id !== itemId)
    }));
    try {
      await deleteItemService(itemId);
       // Refrescar low stock después de eliminar
       get().fetchLowStockItems();
      return true;
    } catch (error) {
      console.error("Error deleting pantry item via store:", error);
      set({ items: originalItems }); // Revertir
      return false;
    }
  },
}));