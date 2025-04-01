import { create } from 'zustand';
import {
  getPantryItems as getItemsService,
  addPantryItem as addItemService,
  updatePantryItem as updateItemService,
  deletePantryItem as deleteItemService
  // getLowStockItems no existe en pantryService
} from '../features/pantry/pantryService'; // Ruta relativa
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
  lowStockItems: PantryItem[]; // Estado para items bajos de stock (funcionalidad pendiente)
  isLoading: boolean;
  isLoadingLowStock: boolean; // (funcionalidad pendiente)
  error: string | null;
  errorLowStock: string | null; // (funcionalidad pendiente)
  fetchItems: () => Promise<void>;
  fetchLowStockItems: (threshold?: number) => Promise<void>; // Acción (funcionalidad pendiente)
  addItem: (itemData: NewPantryItem) => Promise<PantryItem | null>;
  updateItem: (itemId: string, updates: UpdatePantryItem) => Promise<PantryItem | null>;
  deleteItem: (itemId: string) => Promise<boolean>;
}

/**
 * Hook de Zustand para gestionar el estado global de la despensa.
 */
export const usePantryStore = create<PantryState>((set, get) => ({
  items: [],
  lowStockItems: [], // Estado inicial (funcionalidad pendiente)
  isLoading: false,
  isLoadingLowStock: false, // Estado inicial (funcionalidad pendiente)
  error: null,
  errorLowStock: null, // Estado inicial (funcionalidad pendiente)

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
  // --- Funcionalidad Low Stock Pendiente ---
  // fetchLowStockItems: async (threshold = 1) => {
  //    // Evitar carga múltiple
  //   if (get().isLoadingLowStock) return;
  //   set({ isLoadingLowStock: true, errorLowStock: null });
  //   try {
  //     // const lowStockItems = await getLowStockService(threshold); // getLowStockService no existe
  //     console.warn("fetchLowStockItems no implementado en pantryService");
  //     const lowStockItems: PantryItem[] = []; // Placeholder
  //     set({ lowStockItems, isLoadingLowStock: false });
  //   } catch (error) {
  //     console.error("Error fetching low stock items for store:", error);
  //     const errorMessage = error instanceof Error ? error.message : 'Error desconocido al cargar items bajos.';
  //     set({ errorLowStock: errorMessage, isLoadingLowStock: false });
  //   }
  // },
  // Placeholder para evitar errores si se llama accidentalmente
  fetchLowStockItems: async (_threshold = 1) => {
      console.warn("fetchLowStockItems llamado pero no implementado en pantryService.");
      set({ lowStockItems: [], isLoadingLowStock: false, errorLowStock: 'Funcionalidad no implementada' });
      return Promise.resolve();
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
      // TODO: Refrescar low stock si el nuevo item podría calificar (cuando se implemente)
      // if (newItem.quantity !== null && newItem.quantity <= 1) { // Asumiendo umbral 1 por defecto
      //    get().fetchLowStockItems();
      // }
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
       // TODO: Refrescar low stock si la cantidad cambió (cuando se implemente)
       // if (updates.quantity !== undefined) {
       //    get().fetchLowStockItems();
       // }
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
      // TODO: Refrescar low stock después de eliminar (cuando se implemente)
      // get().fetchLowStockItems();
      return true;
    } catch (error) {
      console.error("Error deleting pantry item via store:", error);
      set({ items: originalItems }); // Revertir
      return false;
    }
  },
}));