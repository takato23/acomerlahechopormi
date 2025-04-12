import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Recipe, RecipeState, RecipeFilters, defaultRecipeFilters } from '@/types/recipeTypes';
import { Category } from '@/types/categoryTypes';
import recipeService from '../services/recipeService';
import { supabase } from '@/lib/supabaseClient';

interface FetchRecipesOptions {
  page?: number;
  filters?: RecipeFilters;
  reset?: boolean;
}

interface RecipeStoreState {
  recipes: Recipe[];
  selectedRecipe: Recipe | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;
  filters: RecipeFilters;
  currentPage: number;
  hasMore: boolean;
}

const initialState: RecipeStoreState = {
  recipes: [],
  selectedRecipe: null,
  loading: false,
  initialized: false,
  error: null,
  filters: defaultRecipeFilters,
  currentPage: 1,
  hasMore: true
};

type Store = {
  // Estado
  recipes: Recipe[];
  selectedRecipe: Recipe | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;
  filters: RecipeFilters;
  currentPage: number;
  hasMore: boolean;

  // Acciones
  fetchRecipes: (options?: FetchRecipesOptions) => Promise<void>;
  fetchRecipeById: (id: string) => Promise<void>;
  fetchCategories: () => Promise<Category[]>;
  createRecipe: (recipe: Omit<Recipe, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  updateRecipe: (id: string, updates: Partial<Recipe>) => Promise<void>;
  deleteRecipe: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  setSelectedRecipe: (recipe: Recipe | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilters: (filters: Partial<RecipeFilters>) => void;
  resetFilters: () => void;
  reset: () => void;
  loadRecipes: (options: { reset?: boolean }) => Promise<void>;
};

export const useRecipeStore = create<Store>()(
  persist(
    (set, get) => ({
      ...initialState,

      setFilters: (filters) => set((state) => ({
        filters: { ...state.filters, ...filters }
      })),

      resetFilters: () => set(() => ({
        filters: defaultRecipeFilters
      })),

      loadRecipes: async (options = {}) => {
        const loadRecipes = async (userId: string, reset = false) => {
          if (get().initialized && !reset) return;
          
          try {
            set({ loading: true });
            const data = await recipeService.getRecipes({ userId });
            if (!data) return;
            
            set({ 
              recipes: data, 
              loading: false, 
              initialized: true 
            });
          } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Error desconocido';
            set({ error: message, loading: false });
          }
        };

        if (get().loading || get().initialized) return;

        set({ loading: true, error: null });

        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('Usuario no autenticado');

          await loadRecipes(user.id, options.reset);
        } catch (error) {
          set({ error: error.message, loading: false });
        }
      },

      fetchRecipeById: async (id) => {
        set({ loading: true, error: null });
        try {
          const recipe = await recipeService.getRecipeById(id);
          set({
            selectedRecipe: recipe,
            loading: false
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Error al cargar la receta',
            loading: false
          });
        }
      },

      fetchCategories: async () => {
        try {
          console.log('[RecipeStore] Getting categories...');
          const categories = await recipeService.getCategories();
          console.log('[RecipeStore] Categories received:', categories);
          return categories;
        } catch (error) {
          console.error('Error fetching categories:', error);
          set({
            error: error instanceof Error ? error.message : 'Error al cargar las categorías'
          });
          return [];
        }
      },

      createRecipe: async (recipe) => {
        set({ loading: true, error: null });
        try {
          const newRecipe = await recipeService.createRecipe(recipe);
          set((state) => ({
            recipes: [newRecipe, ...state.recipes],
            loading: false
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Error al crear la receta',
            loading: false
          });
        }
      },

      updateRecipe: async (id, updates) => {
        set({ loading: true, error: null });
        try {
          const updatedRecipe = await recipeService.updateRecipe(id, updates);
          set((state) => ({
            recipes: state.recipes.map(r => r.id === id ? updatedRecipe : r),
            selectedRecipe: state.selectedRecipe?.id === id ? updatedRecipe : state.selectedRecipe,
            loading: false
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Error al actualizar la receta',
            loading: false
          });
        }
      },

      deleteRecipe: async (id) => {
        set({ loading: true, error: null });
        try {
          await recipeService.deleteRecipe(id);
          set((state) => ({
            recipes: state.recipes.filter(r => r.id !== id),
            selectedRecipe: state.selectedRecipe?.id === id ? null : state.selectedRecipe,
            loading: false
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Error al eliminar la receta',
            loading: false
          });
        }
      },

      toggleFavorite: async (id) => {
        const recipe = get().recipes.find(r => r.id === id);
        if (!recipe) return;

        try {
          const updatedRecipe = await recipeService.toggleRecipeFavorite(id);
          set((state) => ({
            recipes: state.recipes.map(r => r.id === id ? updatedRecipe : r),
            selectedRecipe: state.selectedRecipe?.id === id ? updatedRecipe : state.selectedRecipe
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Error al actualizar favoritos'
          });
        }
      },

      setSelectedRecipe: (recipe) => set({ selectedRecipe: recipe }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      reset: () => set(initialState)
    }),
    {
      name: 'recipe-store',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        filters: state.filters
      })
    }
  )
);