import { create } from 'zustand';
import {
  getShoppingListItems,
  addShoppingListItem as apiAddShoppingListItem,
  updateShoppingListItem,
  deleteShoppingListItem,
  clearPurchasedItems,
  clearAllItems,     // Descomentar importación
} from '@/features/shopping-list/services/shoppingListService'; // Asegúrate que la ruta es correcta
import type { Database } from '@/lib/database.types'; // Importar tipos generados
import { addShoppingItemViaEdgeFunction, ShoppingItemPayload } from '@/features/shopping-list/services/shoppingListEdgeFunctions';
import { ShoppingListItem } from '@/types/shoppingListTypes';
import { getCategoryForItem } from '@/features/shopping-list/utils/categorization'; // <-- Importar la nueva utilidad

// Tipos correctos basados en los generados
type DBShoppingListItemRow = Database['public']['Tables']['shopping_list_items']['Row'];
type DBShoppingListItemInsert = Database['public']['Tables']['shopping_list_items']['Insert'];
type DBShoppingListItemUpdate = Database['public']['Tables']['shopping_list_items']['Update'];

// Interfaz para el estado del store
interface ShoppingListState {
  items: DBShoppingListItemRow[]; // Usar el tipo de fila de la DB
  isLoading: boolean;
  error: string | null;
  fetchItems: () => Promise<void>;
  // Ajustar Omit: no omitir user_id, pero asegurar ingredient_name
  addItem: (itemData: Omit<DBShoppingListItemInsert, 'id' | 'created_at' | 'updated_at' | 'is_checked'> & { ingredient_name: string }) => Promise<DBShoppingListItemRow | null>; // is_checked es default false
  updateItem: (itemId: string, updates: DBShoppingListItemUpdate) => Promise<DBShoppingListItemRow | null>;
  deleteItem: (itemId: string) => Promise<boolean>;
  clearPurchased: () => Promise<boolean>;
  clearAll: () => Promise<boolean>;
}

export const useShoppingListStore = create<ShoppingListState>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,

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

  addItem: async (itemData: Omit<DBShoppingListItemInsert, 'id' | 'created_at' | 'updated_at' | 'is_checked'> & { ingredient_name: string }) => {
    try {
      console.log('[shoppingListStore] Intentando añadir item con datos iniciales:', JSON.stringify(itemData));

      // --- Inicio: Auto-categorización ---
      let categoryToUse = itemData.category; // Usar categoría provista si existe
      console.log(`[shoppingListStore][Debug] Categoría inicial provista: ${categoryToUse}`); // LOG AÑADIDO

      if (!categoryToUse && itemData.ingredient_name) { // Si no hay categoría y sí hay nombre, intentar auto-asignar
        console.log(`[shoppingListStore][Debug] Intentando auto-categorizar para: "${itemData.ingredient_name}"`); // LOG AÑADIDO
        const detectedCategory = getCategoryForItem(itemData.ingredient_name);
        console.log(`[shoppingListStore][Debug] Resultado de getCategoryForItem: ${detectedCategory}`); // LOG AÑADIDO
        categoryToUse = detectedCategory; // Asignar la categoría detectada (puede ser null)
        if (categoryToUse) {
            console.log(`[shoppingListStore] Categoría auto-detectada asignada: ${categoryToUse}`);
        } else {
            console.log(`[shoppingListStore] No se detectó categoría automáticamente.`);
        }
      } else if (categoryToUse) {
         console.log(`[shoppingListStore] Usando categoría provista por usuario para "${itemData.ingredient_name}": ${categoryToUse}`);
      } else {
        console.log(`[shoppingListStore] No hay categoría provista ni nombre para auto-categorizar.`);
      }
      console.log(`[shoppingListStore][Debug] Categoría final a usar (categoryToUse): ${categoryToUse}`); // LOG AÑADIDO
      // --- Fin: Auto-categorización ---

      // Primero intentar con la API directa
      try {
        console.log('[shoppingListStore] Intentando añadir via API directa');

        // Preparar el objeto para la API directa, USANDO categoryToUse
        const apiData = {
          ingredient_name: itemData.ingredient_name,
          quantity: itemData.quantity === undefined ? null : itemData.quantity,
          unit: itemData.unit === undefined ? null : itemData.unit,
          notes: itemData.notes === undefined ? null : itemData.notes,
          recipe_source: itemData.recipe_source === undefined ? null : itemData.recipe_source,
          category: categoryToUse // <-- Usar la categoría determinada (string o null)
        } as ShoppingListItem; // Verifica si este tipo es el correcto

        console.log('[shoppingListStore][Debug] Datos para API directa (apiData):', JSON.stringify(apiData)); // LOG AÑADIDO

        // Llamar a la API directamente
        const newItem = await apiAddShoppingListItem(apiData);

        if (newItem && newItem.id) {
          console.log('[shoppingListStore] Item añadido via API directa:', JSON.stringify(newItem));
          const confirmedNewItem: DBShoppingListItemRow = newItem;

          set((state) => ({
            items: [...state.items, confirmedNewItem].sort((a, b) => {
              if (a.is_checked !== b.is_checked) return a.is_checked ? 1 : -1;
              const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
              const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
              return dateA - dateB;
            })
          }));

          return confirmedNewItem;
        } else {
           console.log('[shoppingListStore] API directa no devolvió un item válido.');
        }
      } catch (apiError) {
        console.error('[shoppingListStore] Error con API directa, intentando Edge Function:', apiError);

        // Si falla la API directa, intentar con Edge Function como fallback
        // *** IMPORTANTE: Asumiendo que Edge Function espera el NOMBRE de la categoría en 'category_id' ***
        // *** Si espera un UUID real, esta parte necesitará ajuste para buscar el ID correspondiente al nombre 'categoryToUse' ***
        const payload: ShoppingItemPayload = {
          ingredient_name: itemData.ingredient_name,
          quantity: itemData.quantity === undefined ? null : itemData.quantity,
          unit: itemData.unit === undefined ? null : itemData.unit,
          notes: itemData.notes === undefined ? null : itemData.notes,
          recipe_id: itemData.recipe_source === undefined ? null : itemData.recipe_source,
          category_id: categoryToUse // <-- Pasando el nombre (string o null)
        };

        console.log('[shoppingListStore][Debug] Datos para Edge Function (payload):', JSON.stringify(payload)); // LOG AÑADIDO

        const newItem = await addShoppingItemViaEdgeFunction(payload);

        if (newItem && newItem.id) {
          console.log('[shoppingListStore] Item añadido via Edge Function:', JSON.stringify(newItem));
          const confirmedNewItem: DBShoppingListItemRow = newItem;

          set((state) => ({
            items: [...state.items, confirmedNewItem].sort((a, b) => {
              if (a.is_checked !== b.is_checked) return a.is_checked ? 1 : -1;
              const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
              const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
              return dateA - dateB;
            })
          }));

          return confirmedNewItem;
        } else {
            console.log('[shoppingListStore] Edge Function no devolvió un item válido.');
        }
      }

      // Si llegamos aquí es que ambos métodos fallaron
      console.error("[shoppingListStore] No se pudo añadir el item con ningún método");
      set({ error: 'No se pudo añadir el item.' }); // Añadir mensaje de error al estado
      return null;
    } catch (error) {
      console.error("[shoppingListStore] Error adding shopping list item via store:", error);
       const errorMessage = error instanceof Error ? error.message : 'Error desconocido al añadir item.';
      set({ error: errorMessage }); // Añadir mensaje de error al estado
      return null;
    }
  },

  updateItem: async (itemId, updates) => {
    const originalItems = get().items;
    // Optimistic update con ordenación
    set((state) => ({
      items: state.items.map(i =>
        i.id === itemId ? { ...i, ...updates } : i
      ).sort((a, b) => {
         if (a.is_checked !== b.is_checked) return a.is_checked ? 1 : -1;
         const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
         const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
         return dateA - dateB;
      })
    }));

    try {
      const updatedItem = await updateShoppingListItem(itemId, updates);
      if (!updatedItem) throw new Error("Update failed silently");
      // Re-sincronizar con la respuesta real y re-ordenar
      set((state) => ({
        items: state.items.map(i => i.id === itemId ? { ...updatedItem } : i) // Usar el objeto completo retornado
         .sort((a, b) => {
             if (a.is_checked !== b.is_checked) return a.is_checked ? 1 : -1;
             const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
             const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
             return dateA - dateB;
         })
      }));
      return updatedItem;
    } catch (error) {
      console.error("Error updating shopping list item via store:", error);
      set({ items: originalItems, error: 'Error al actualizar el item.' }); // Revertir y setear error
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
      await deleteShoppingListItem(itemId);
      set({ error: null }); // Limpiar error en caso de éxito
      return true;
    } catch (error) {
      console.error("Error deleting shopping list item via store:", error);
      set({ items: originalItems, error: 'Error al eliminar el item.' }); // Revertir y setear error
      return false;
    }
  },

  clearPurchased: async () => {
    const originalItems = get().items;
    const itemsToKeep = originalItems.filter(i => !i.is_checked);
    // Optimistic update
    set({ items: itemsToKeep });

    try {
      await clearPurchasedItems();
      set({ error: null }); // Limpiar error en caso de éxito
      return true;
    } catch (error) {
      console.error("Error clearing purchased items via store:", error);
      set({ items: originalItems, error: 'Error al limpiar comprados.' }); // Revertir y setear error
      return false;
    }
  },

  clearAll: async () => {
    const originalItems = get().items;
    // Optimistic update
    set({ items: [] });
    try {
      await clearAllItems();
       set({ error: null }); // Limpiar error en caso de éxito
      return true;
    } catch (error) {
      console.error("Error clearing all items via store:", error);
      set({ items: originalItems, error: 'Error al limpiar todo.' }); // Revertir y setear error
      return false;
    }
  },
}));