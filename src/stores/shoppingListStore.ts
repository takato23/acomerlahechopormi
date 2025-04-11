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
      console.log('[shoppingListStore] Intentando añadir item:', itemData);
      
      // Primero intentar con la API directa
      try {
        console.log('[shoppingListStore] Intentando añadir via API directa');
        
        // Preparar el objeto para la API directa
        const apiData = {
          ingredient_name: itemData.ingredient_name,
          quantity: itemData.quantity === undefined ? null : itemData.quantity,
          unit: itemData.unit === undefined ? null : itemData.unit,
          notes: itemData.notes === undefined ? null : itemData.notes,
          recipe_source: itemData.recipe_source === undefined ? null : itemData.recipe_source,
        } as ShoppingListItem;
        
        // Llamar a la API directamente
        const newItem = await apiAddShoppingListItem(apiData);
        
        if (newItem && newItem.id) { 
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
        }
      } catch (apiError) {
        console.error('[shoppingListStore] Error con API directa, intentando Edge Function:', apiError);
        
        // Si falla la API directa, intentar con Edge Function como fallback
        const payload: ShoppingItemPayload = {
          ingredient_name: itemData.ingredient_name,
          quantity: itemData.quantity === undefined ? null : itemData.quantity,
          unit: itemData.unit === undefined ? null : itemData.unit,
          notes: itemData.notes === undefined ? null : itemData.notes,
          recipe_id: itemData.recipe_source === undefined ? null : itemData.recipe_source,
        };
        
        const newItem = await addShoppingItemViaEdgeFunction(payload);
        
        if (newItem && newItem.id) { 
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
        }
      }
      
      // Si llegamos aquí es que ambos métodos fallaron
      console.error("[shoppingListStore] No se pudo añadir el item con ningún método");
      return null;
    } catch (error) {
      console.error("[shoppingListStore] Error adding shopping list item via store:", error);
      return null;
    }
  },

  updateItem: async (itemId, updates) => {
    const originalItems = get().items;
    set((state) => ({
      items: state.items.map(i =>
        i.id === itemId ? { ...i, ...updates } : i
      ).sort((a, b) => {
         // Usar is_checked consistentemente
         if (a.is_checked !== b.is_checked) return a.is_checked ? 1 : -1; // false primero
         const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
         const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
         return dateA - dateB;
      })
    }));

    try {
      const updatedItem = await updateShoppingListItem(itemId, updates);
      // Re-sincronizar con la respuesta real para asegurar consistencia
      set((state) => ({
        items: state.items.map(i => i.id === itemId ? { ...i, ...updatedItem } : i)
      }));
      return updatedItem;
    } catch (error) {
      console.error("Error updating shopping list item via store:", error);
      set({ items: originalItems }); 
      return null;
    }
  },

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

  clearPurchased: async () => {
    const originalItems = get().items;
    // Optimistic update: filtrar los comprados (is_checked = true)
    const itemsToKeep = originalItems.filter(i => !i.is_checked); 
    set({ items: itemsToKeep });

    try {
      await clearPurchasedItems();
      return true;
    } catch (error) {
      console.error("Error clearing purchased items via store:", error);
      set({ items: originalItems });
      return false;
    }
  },

  clearAll: async () => {
    const originalItems = get().items;
    set({ items: [] });
    try {
      await clearAllItems();
      return true;
    } catch (error) {
      console.error("Error clearing all items via store:", error);
      set({ items: originalItems });
      return false;
    }
  },
}));