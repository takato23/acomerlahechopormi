import { create } from 'zustand';
import {
  getShoppingListItems,
  addShoppingListItem, // Importar la función del servicio
  updateShoppingListItem,
  deleteShoppingListItem,
  clearPurchasedItems,
} from '@/features/shopping-list/services/shoppingListService'; // Asegúrate que la ruta es correcta
// Temporalmente usando any, idealmente definir estos tipos
// import type { ShoppingListItem as ServiceShoppingListItem, NewShoppingListItem, UpdateShoppingListItem } from '@/features/shopping-list/types';
type ServiceShoppingListItem = any; // Tipo devuelto por el servicio
type NewShoppingListItem = any; // Tipo esperado por addShoppingListItem del servicio
type UpdateShoppingListItem = any; // Tipo esperado por updateShoppingListItem del servicio
type GeneratedShoppingListItem = any; // Tipo devuelto por generateShoppingList

// Interfaz para el estado del store
interface ShoppingListState {
  items: ServiceShoppingListItem[]; // Ítems actualmente en el store/UI
  isLoading: boolean;
  error: string | null;
  fetchItems: () => Promise<void>;
  addItem: (itemData: NewShoppingListItem) => Promise<ServiceShoppingListItem | null>; // Añadir manualmente
  addGeneratedItems: (generatedItems: GeneratedShoppingListItem[]) => Promise<number>; // Añadir desde planificador
  updateItem: (itemId: string, updates: UpdateShoppingListItem) => Promise<ServiceShoppingListItem | null>;
  deleteItem: (itemId: string) => Promise<boolean>;
  clearPurchased: () => Promise<boolean>;
}

export const useShoppingListStore = create<ShoppingListState>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,

  fetchItems: async () => {
    // ... (implementación existente)
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

  addItem: async (itemData) => {
    // ... (implementación existente para añadir manualmente)
    try {
      const newItem = await addShoppingListItem(itemData); // Llama al servicio
      if (newItem) { // Verificar si newItem no es null
        set((state) => ({
          items: [...state.items, newItem].sort((a, b) => {
            if (a.is_purchased !== b.is_purchased) return a.is_purchased ? 1 : -1;
            // Asumiendo que 'created_at' existe y es comparable
            const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return dateA - dateB;
          })
        }));
      }
      return newItem;
    } catch (error) {
      console.error("Error adding shopping list item via store:", error);
      return null;
    }
  },

  // --- NUEVA ACCIÓN ---
  addGeneratedItems: async (generatedItems) => {
    const currentItems = get().items;
    const itemsToAdd: NewShoppingListItem[] = [];
    // Asumiendo que el ID único del ítem en el store es 'id' y contiene el 'ingredient_id'
    // O si hay un campo 'ingredient_id' directo, usar ese. Ajustar según la estructura real.
    const existingItemIngredientIds = new Set(currentItems.map(item => item.ingredient_id || item.id));

    // Filtrar ítems que ya podrían estar en la lista (basado en ingredient_id)
    // y mapear al formato NewShoppingListItem
    generatedItems.forEach(genItem => {
      // Asumiendo que genItem tiene 'id' como ingredient_id y 'ingredientName' como name
      const ingredientId = genItem.id;
      if (ingredientId && !existingItemIngredientIds.has(ingredientId)) {
        itemsToAdd.push({
          ingredient_id: ingredientId,
          name: genItem.ingredientName, // Mapear nombre
          quantity: genItem.quantity, // Usar cantidad calculada (puede ser null)
          unit: genItem.unit,
          // No incluir is_purchased, se asume false por defecto en el backend/servicio
        });
      } else {
         console.log(`Ítem omitido (ya existe o falta ID): ${genItem.ingredientName} (ID: ${ingredientId})`);
      }
    });

    if (itemsToAdd.length === 0) {
      console.log("No hay nuevos ítems únicos para añadir desde la generación.");
      return 0; // No hay nada que añadir
    }

    console.log(`Intentando añadir ${itemsToAdd.length} nuevos ítems generados...`);

    // Llamar al servicio addShoppingListItem para cada nuevo ítem
    const addPromises = itemsToAdd.map(itemData =>
      addShoppingListItem(itemData).catch(err => {
        console.error(`Error añadiendo ítem generado ${itemData.name}:`, err);
        return null; // Devolver null en caso de error para este ítem
      })
    );

    const results = await Promise.all(addPromises);
    const successfullyAddedItems = results.filter((item: any): item is ServiceShoppingListItem => item !== null);

    console.log(`${successfullyAddedItems.length} de ${itemsToAdd.length} ítems generados añadidos exitosamente.`);

    // Actualizar el estado del store con los ítems añadidos exitosamente
    if (successfullyAddedItems.length > 0) {
      set((state) => ({
        items: [...state.items, ...successfullyAddedItems].sort((a, b) => {
          if (a.is_purchased !== b.is_purchased) return a.is_purchased ? 1 : -1;
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateA - dateB;
        })
      }));
    }

    return successfullyAddedItems.length; // Devolver cuántos se añadieron realmente
  },
  // --- FIN NUEVA ACCIÓN ---

  updateItem: async (itemId, updates) => {
    // ... (implementación existente)
    const originalItems = get().items;
    // Optimistic update
    set((state) => ({
      items: state.items.map(i =>
        i.id === itemId ? { ...i, ...updates } : i
      ).sort((a, b) => {
         if (a.is_purchased !== b.is_purchased) return a.is_purchased ? 1 : -1;
         const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
         const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
         return dateA - dateB;
      })
    }));

    try {
      const updatedItem = await updateShoppingListItem(itemId, updates);
      // Opcional: Re-sincronizar
      // set((state) => ({ items: state.items.map(i => i.id === itemId ? updatedItem : i) }));
      return updatedItem;
    } catch (error) {
      console.error("Error updating shopping list item via store:", error);
      set({ items: originalItems }); // Revertir
      return null;
    }
  },

  deleteItem: async (itemId) => {
    // ... (implementación existente)
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
    // ... (implementación existente)
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

// Nota: Asegúrate de que los tipos `ServiceShoppingListItem`, `NewShoppingListItem`,
// `UpdateShoppingListItem` y `GeneratedShoppingListItem` estén correctamente definidos
// o importados desde tus archivos de tipos (`@/features/shopping-list/types`).
// El uso de `any` es temporal.
// También, verifica la estructura real de los ítems en el estado `items` para usar
// el campo correcto (`ingredient_id` o `id`) al comprobar duplicados en `addGeneratedItems`.