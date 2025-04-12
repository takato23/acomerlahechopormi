import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { PantryItem, PantryState, PantryFilters, CreatePantryItemData } from '../types';
import * as pantryService from '../services/pantryService';

interface PantryStore extends PantryState {
  setFilters: (filters: Partial<PantryFilters>) => void;
  resetFilters: () => void;
  fetchItems: () => Promise<void>;
  addItem: (itemData: CreatePantryItemData) => Promise<void>;
  updateItem: (id: string, updates: Partial<PantryItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  clearPantry: () => Promise<void>;
  fetchLowStockItems: () => Promise<PantryItem[]>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState: PantryState = {
  items: [],
  loading: false,
  error: null,
  filters: {
    searchTerm: '',
    categories: [],
    lowStock: false,
    favorites: false,
  }
};

export const usePantryStore = create<PantryStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setFilters: (filters) => set((state) => ({
        filters: { ...state.filters, ...filters }
      })),

      resetFilters: () => set(() => ({
        filters: initialState.filters
      })),

      fetchItems: async () => {
        set({ loading: true, error: null });
        try {
          const items = await pantryService.getPantryItems();
          set({ items, loading: false });
        } catch (error) {
          console.error('Error fetching pantry items:', error);
          set({ error: error instanceof Error ? error.message : 'Error al cargar la despensa', loading: false });
        }
      },

      addItem: async (itemData) => {
        set({ loading: true, error: null });
        try {
          const newItem = await pantryService.addPantryItem(itemData);
          set((state) => ({ items: [newItem, ...state.items], loading: false }));
        } catch (error) {
          console.error('Error adding pantry item:', error);
          set({ error: error instanceof Error ? error.message : 'Error al añadir item', loading: false });
        }
      },

      updateItem: async (id, updates) => {
        set({ loading: true, error: null });
        try {
          const updatedItem = await pantryService.updatePantryItem(id, updates);
          set((state) => ({
            items: state.items.map(item => item.id === id ? updatedItem : item),
            loading: false
          }));
        } catch (error) {
          console.error('Error updating pantry item:', error);
          set({ error: error instanceof Error ? error.message : 'Error al actualizar item', loading: false });
        }
      },

      deleteItem: async (id) => {
        set({ loading: true, error: null });
        try {
          await pantryService.deletePantryItem(id);
          set((state) => ({
            items: state.items.filter(item => item.id !== id),
            loading: false
          }));
        } catch (error) {
          console.error('Error deleting pantry item:', error);
          set({ error: error instanceof Error ? error.message : 'Error al eliminar item', loading: false });
        }
      },

      toggleFavorite: async (id) => {
        const item = get().items.find(i => i.id === id);
        if (!item) return;
        
        set({ loading: true, error: null });
        try {
          const updatedItem = await pantryService.toggleFavoritePantryItem(id, !item.is_favorite);
          if (updatedItem) {
            set((state) => ({
              items: state.items.map(i => i.id === id ? updatedItem : i),
              loading: false
            }));
          } else {
            set({ loading: false }); // No se encontró el item para actualizar
          }
        } catch (error) {
          console.error('Error toggling favorite:', error);
          set({ error: error instanceof Error ? error.message : 'Error al marcar favorito', loading: false });
        }
      },

      clearPantry: async () => {
        set({ loading: true, error: null });
        try {
          await pantryService.clearPantry();
          set({ items: [], loading: false });
        } catch (error) {
          console.error('Error clearing pantry:', error);
          set({ error: error instanceof Error ? error.message : 'Error al vaciar despensa', loading: false });
        }
      },

      fetchLowStockItems: async () => {
        set({ loading: true, error: null });
        try {
          const lowStockItems = await pantryService.fetchLowStockItems();
          set({ loading: false });
          return lowStockItems;
        } catch (error) {
          console.error('Error fetching low stock items:', error);
          set({ error: error instanceof Error ? error.message : 'Error al buscar stock bajo', loading: false });
          return [];
        }
      },

      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      reset: () => set(initialState)
    }),
    {
      name: 'pantry-store',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        filters: state.filters
      })
    }
  )
);