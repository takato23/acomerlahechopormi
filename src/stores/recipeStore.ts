import { create } from 'zustand';
import type { Recipe } from '../types/recipeTypes';
import { getRecipes } from '../features/recipes/services/recipeService'; // Ajustado la ruta relativa

/**
 * Define la estructura del estado para el store de recetas.
 */
interface RecipeState {
  recipes: Recipe[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Define las acciones disponibles en el store de recetas.
 */
interface RecipeActions {
  /**
   * Busca y carga las recetas de un usuario específico desde el servicio.
   * Actualiza los estados de carga y error correspondientes.
   * @param userId - El ID del usuario cuyas recetas se van a buscar.
   */
  fetchRecipes: (userId: string) => Promise<void>;

  /**
   * Añade una nueva receta al estado local del store.
   * @param recipe - La receta a añadir.
   */
  addRecipe: (recipe: Recipe) => void;

  /**
   * Actualiza una receta existente en el estado local del store.
   * Busca la receta por su ID y aplica los cambios parciales proporcionados.
   * @param recipeId - El ID de la receta a actualizar.
   * @param updatedRecipeData - Un objeto con los campos de la receta a actualizar.
   */
  updateRecipeState: (recipeId: string, updatedRecipeData: Partial<Recipe>) => void;

  /**
   * Elimina una receta del estado local del store por su ID.
   * @param recipeId - El ID de la receta a eliminar.
   */
  removeRecipe: (recipeId: string) => void;
}

/**
 * Estado inicial para el store de recetas.
 */
const initialState: RecipeState = {
  recipes: [],
  isLoading: false,
  error: null,
};

/**
 * Hook de Zustand para gestionar el estado global de las recetas.
 * Combina el estado (`RecipeState`) y las acciones (`RecipeActions`).
 */
export const useRecipeStore = create<RecipeState & RecipeActions>((set, get) => ({
  ...initialState,

  fetchRecipes: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const fetchedRecipes = await getRecipes(userId);
      set({ recipes: fetchedRecipes, isLoading: false });
    } catch (err) {
      console.error('Error fetching recipes:', err);
      const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error desconocido al cargar las recetas.';
      set({ error: errorMessage, isLoading: false });
    }
  },

  addRecipe: (recipe: Recipe) => {
    set((state) => ({
      recipes: [...state.recipes, recipe],
    }));
  },

  updateRecipeState: (recipeId: string, updatedRecipeData: Partial<Recipe>) => {
    set((state) => ({
      recipes: state.recipes.map((recipe) =>
        recipe.id === recipeId ? { ...recipe, ...updatedRecipeData } : recipe
      ),
    }));
  },

  removeRecipe: (recipeId: string) => {
    set((state) => ({
      recipes: state.recipes.filter((recipe) => recipe.id !== recipeId),
    }));
  },
}));