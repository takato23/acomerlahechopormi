import { create } from 'zustand';
import {
  SimpleShoppingItem,
  getSimpleShoppingItems,
  addSimpleShoppingItem,
  updateSimpleShoppingItem,
  deleteSimpleShoppingItem,
  clearCheckedItems
} from './services/simpleShoppingService';

interface SimpleShoppingState {
  items: SimpleShoppingItem[];
  isLoading: boolean;
  error: string | null;
  
  // Acciones
  fetchItems: () => Promise<void>;
  addItem: (name: string) => Promise<SimpleShoppingItem | null>;
  toggleItem: (id: string, currentStatus: boolean) => Promise<SimpleShoppingItem | null>;
  removeItem: (id: string) => Promise<boolean>;
  clearChecked: () => Promise<boolean>;
}

import { useAppStore } from '@/stores/appStore';

export const useSimpleShoppingStore = create<SimpleShoppingState>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,
  
  // Obtener todos los elementos
  fetchItems: async () => {
    set({ isLoading: true, error: null });
    try {
      const items = await getSimpleShoppingItems();
      set({ items, isLoading: false });
    } catch (error) {
      console.error('Error al cargar lista de compras:', error);
      set({
        error: 'No se pudo cargar la lista de compras',
        isLoading: false
      });
    }
  },
  
  // Añadir un elemento
  addItem: async (name: string) => {
    try {
      const newItem = await addSimpleShoppingItem(name);
      
      if (newItem) {
        set((state) => ({
          items: [newItem, ...state.items]
        }));

// --- INTEGRACIÓN EVENT BUS: Escuchar recetas generadas y agregar ingredientes a la lista de compras ---
(function subscribeToRecipeGenerated() {
  try {
    // Suscribirse solo una vez al evento global
    useAppStore.getState().subscribeToEvent('recipeGenerated', async (recipe) => {
      if (!recipe || !Array.isArray(recipe.ingredients)) return;
      const addItem = useSimpleShoppingStore.getState().addItem;
      for (const ingredient of recipe.ingredients) {
        if (typeof ingredient === 'string' && ingredient.trim().length > 0) {
          // Agrega cada ingrediente a la lista de compras real
          await addItem(ingredient.trim());
        }
      }
    });
    // Log para depuración
    if (typeof window !== 'undefined') {
      console.log('[EventBus] Listener de recipeGenerated activo en simpleShoppingStore');
    }
  } catch (e) {
    // Si falla, loguear y continuar
    if (typeof window !== 'undefined') {
      console.error('[EventBus] Error al suscribirse a recipeGenerated:', e);
    }
  }
})();

      }
      
      return newItem;
    } catch (error) {
      console.error('Error al añadir item:', error);
      return null;
    }
  },
  
  // Cambiar el estado de un elemento (marcado/desmarcado)
  toggleItem: async (id: string, currentStatus: boolean) => {
    // Actualización optimista
    const originalItems = [...get().items];
    
    set((state) => ({
      items: state.items.map(item =>
        item.id === id ? { ...item, is_checked: !currentStatus } : item
      )
    }));
    
    try {
      const updatedItem = await updateSimpleShoppingItem(id, !currentStatus);
      
      if (!updatedItem) {
        // Si falla, revertir al estado original
        set({ items: originalItems });
      }
      
      return updatedItem;
    } catch (error) {
      console.error('Error al actualizar item:', error);
      set({ items: originalItems });
      return null;
    }
  },
  
  // Eliminar un elemento
  removeItem: async (id: string) => {
    const originalItems = [...get().items];
    
    // Eliminar optimistamente
    set((state) => ({
      items: state.items.filter(item => item.id !== id)
    }));
    
    try {
      const success = await deleteSimpleShoppingItem(id);
      
      if (!success) {
        set({ items: originalItems });
      }
      
      return success;
    } catch (error) {
      console.error('Error al eliminar item:', error);
      set({ items: originalItems });
      return false;
    }
  },
  
  // Limpiar elementos marcados
  clearChecked: async () => {
    const originalItems = [...get().items];
    
    // Eliminar marcados optimistamente
    set((state) => ({
      items: state.items.filter(item => !item.is_checked)
    }));
    
    try {
      const success = await clearCheckedItems();
      
      if (!success) {
        set({ items: originalItems });
      }
      
      return success;
    } catch (error) {
      console.error('Error al limpiar items marcados:', error);
      set({ items: originalItems });
      return false;
    }
  }
})); 