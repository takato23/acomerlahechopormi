import { create } from 'zustand';
import { 
  Recipe, 
  RecipeFilters,
  RecipeInputData,
  UpdateRecipeData
} from '@/types/recipeTypes';
import { 
  getRecipes,
  addRecipe,
  updateRecipe,
  deleteRecipe,
  toggleRecipeFavorite,
  toggleRecipePublic
} from '@/features/recipes/services/recipeService';

interface RecipeState {
  recipes: Recipe[];
  isLoading: boolean;
  error: Error | null;
  hasMore: boolean;
  currentPage: number;
  filters: Partial<RecipeFilters>;
  selectedRecipeId: string | null;
  setFilters: (filters: Partial<RecipeFilters>) => void;
  loadRecipes: (userId: string, reset?: boolean) => Promise<void>;
  createRecipe: (recipe: RecipeInputData) => Promise<Recipe>;
  updateRecipe: (id: string, updates: Partial<UpdateRecipeData>) => Promise<Recipe>;
  deleteRecipe: (id: string) => Promise<void>;
  toggleFavorite: (id: string, isFavorite: boolean) => Promise<void>;
  togglePublic: (id: string, isPublic: boolean) => Promise<void>;
  selectRecipe: (id: string | null) => void;
}

export const useRecipeStore = create<RecipeState>((set, get) => ({
  recipes: [],
  isLoading: false,
  error: null,
  hasMore: true,
  currentPage: 1,
  filters: {},
  selectedRecipeId: null,

  setFilters: (newFilters) => {
    set({ filters: { ...newFilters }, currentPage: 1 });
  },

  loadRecipes: async (userId: string, reset = false) => {
    try {
      const { currentPage, filters } = get();
      set({ isLoading: true, error: null });

      if (reset) {
        set({ recipes: [], currentPage: 1 });
      }

      const page = reset ? 1 : currentPage;

      const response = await getRecipes({
        userId,
        filters,
        page,
        limit: 12
      });

      set(state => ({
        recipes: reset ? response.data : [...state.recipes, ...response.data],
        hasMore: response.hasMore,
        currentPage: page + 1,
        error: null
      }));

    } catch (error) {
      console.error('Error fetching recipes:', error);
      set({ error: error as Error });
    } finally {
      set({ isLoading: false });
    }
  },

  createRecipe: async (recipe) => {
    try {
      set({ isLoading: true, error: null });
      const newRecipe = await addRecipe(recipe);
      set(state => ({ recipes: [newRecipe, ...state.recipes] }));
      return newRecipe;
    } catch (error) {
      set({ error: error as Error });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateRecipe: async (id, updates) => {
    try {
      set({ isLoading: true, error: null });
      const updatedRecipe = await updateRecipe(id, {
        id,
        ...updates
      });
      set(state => ({
        recipes: state.recipes.map(recipe => 
          recipe.id === id ? updatedRecipe : recipe
        )
      }));
      return updatedRecipe;
    } catch (error) {
      set({ error: error as Error });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteRecipe: async (id) => {
    try {
      set({ isLoading: true, error: null });
      await deleteRecipe(id);
      set(state => ({
        recipes: state.recipes.filter(recipe => recipe.id !== id)
      }));
    } catch (error) {
      set({ error: error as Error });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  toggleFavorite: async (id, isFavorite) => {
    try {
      set({ error: null });
      const updatedRecipe = await toggleRecipeFavorite(id, isFavorite);
      set(state => ({
        recipes: state.recipes.map(recipe => 
          recipe.id === id ? updatedRecipe : recipe
        )
      }));
    } catch (error) {
      set({ error: error as Error });
      throw error;
    }
  },

  togglePublic: async (id, isPublic) => {
    try {
      set({ error: null });
      const updatedRecipe = await toggleRecipePublic(id, isPublic);
      set(state => ({
        recipes: state.recipes.map(recipe => 
          recipe.id === id ? updatedRecipe : recipe
        )
      }));
    } catch (error) {
      set({ error: error as Error });
      throw error;
    }
  },

  selectRecipe: (id) => {
    set({ selectedRecipeId: id });
  }
}));