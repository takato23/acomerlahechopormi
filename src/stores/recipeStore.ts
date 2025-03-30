import { create } from 'zustand';
import { 
  getRecipes, 
  createRecipe as createRecipeService, 
  updateRecipe as updateRecipeService, 
  deleteRecipe as deleteRecipeService,
  setRecipeFavoriteStatus as setFavoriteStatusService 
} from '@/features/recipes/recipeService';
// Usar any temporalmente
// import type { Recipe, UpsertRecipeData, RecipeIngredient } from '@/features/recipes/recipeTypes';
type Recipe = any;
type UpsertRecipeData = any;
type RecipeIngredient = any;

/**
 * @interface RecipeState Define el estado y las acciones para la gestión de recetas.
 * @property {Recipe[]} recipes - Array de recetas del usuario.
 * @property {boolean} isLoading - Indica si se están cargando las recetas.
 * @property {string | null} error - Mensaje de error si la carga falla.
 * @property {() => Promise<void>} fetchRecipes - Acción para cargar todas las recetas del usuario.
 * @property {(recipeData: Omit<UpsertRecipeData, 'ingredients'>, ingredients: Omit<RecipeIngredient, 'id' | 'recipe_id'>[]) => Promise<Recipe | null>} addRecipe - Acción para crear una nueva receta.
 * @property {(recipeId: string, recipeData: Omit<UpsertRecipeData, 'ingredients'>, ingredients: Omit<RecipeIngredient, 'id' | 'recipe_id'>[]) => Promise<Recipe | null>} updateRecipe - Acción para actualizar una receta existente.
 * @property {(recipeId: string) => Promise<boolean>} deleteRecipe - Acción para eliminar una receta.
 * @property {(recipeId: string, currentStatus: boolean) => Promise<boolean>} toggleFavorite - Acción para marcar/desmarcar una receta como favorita.
 */
interface RecipeState {
  recipes: Recipe[];
  isLoading: boolean;
  error: string | null;
  fetchRecipes: () => Promise<void>;
  addRecipe: (recipeData: Omit<UpsertRecipeData, 'ingredients'>, ingredients: Omit<RecipeIngredient, 'id' | 'recipe_id'>[]) => Promise<Recipe | null>;
  updateRecipe: (recipeId: string, recipeData: Omit<UpsertRecipeData, 'ingredients'>, ingredients: Omit<RecipeIngredient, 'id' | 'recipe_id'>[]) => Promise<Recipe | null>;
  deleteRecipe: (recipeId: string) => Promise<boolean>;
  toggleFavorite: (recipeId: string, currentStatus: boolean) => Promise<boolean>;
}

/**
 * Hook de Zustand para gestionar el estado global de las recetas.
 */
export const useRecipeStore = create<RecipeState>((set, get) => ({
  recipes: [],
  isLoading: false,
  error: null,

  /**
   * Carga todas las recetas del usuario desde el servicio y actualiza el estado.
   * @async
   */
  fetchRecipes: async () => {
    set({ isLoading: true, error: null });
    try {
      const recipes = await getRecipes(); 
      set({ recipes, isLoading: false });
    } catch (error) {
      console.error("Error fetching recipes for store:", error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al cargar recetas.';
      set({ error: errorMessage, isLoading: false });
    }
  },

  /**
   * Añade una nueva receta llamando al servicio y actualiza el estado local.
   * @async
   * @param {Omit<UpsertRecipeData, 'ingredients'>} recipeData - Datos principales de la receta.
   * @param {Omit<RecipeIngredient, 'id' | 'recipe_id'>[]} ingredients - Array de ingredientes.
   * @returns {Promise<Recipe | null>} La nueva receta creada o null si falla.
   */
  addRecipe: async (recipeData, ingredients) => {
    try {
      const newRecipe = await createRecipeService(recipeData, ingredients);
      set((state) => ({ 
        recipes: [newRecipe, ...state.recipes].sort((a, b) => 
           new Date(b.created_at).getTime() - new Date(a.created_at).getTime() 
        ) 
      }));
      return newRecipe;
    } catch (error) {
      console.error("Error adding recipe via store:", error);
      return null; 
    }
  },

  /**
   * Actualiza una receta existente llamando al servicio y actualiza el estado local.
   * @async
   * @param {string} recipeId - ID de la receta a actualizar.
   * @param {Omit<UpsertRecipeData, 'ingredients'>} recipeData - Datos principales a actualizar.
   * @param {Omit<RecipeIngredient, 'id' | 'recipe_id'>[]} ingredients - Array completo y actualizado de ingredientes.
   * @returns {Promise<Recipe | null>} La receta actualizada o null si falla.
   */
  updateRecipe: async (recipeId, recipeData, ingredients) => {
     try {
      const updatedRecipe = await updateRecipeService(recipeId, recipeData, ingredients);
      set((state) => ({
        recipes: state.recipes.map(r => r.id === recipeId ? updatedRecipe : r)
      }));
      return updatedRecipe;
    } catch (error) {
      console.error("Error updating recipe via store:", error);
      return null;
    }
  },

  /**
   * Elimina una receta llamando al servicio y actualiza el estado local.
   * Realiza una actualización optimista.
   * @async
   * @param {string} recipeId - ID de la receta a eliminar.
   * @returns {Promise<boolean>} `true` si la eliminación (local y remota) fue exitosa, `false` si falló.
   */
  deleteRecipe: async (recipeId) => {
    const originalRecipes = get().recipes;
    // Optimistic update
    set((state) => ({
      recipes: state.recipes.filter(r => r.id !== recipeId)
    }));
    try {
      await deleteRecipeService(recipeId);
      return true;
    } catch (error) {
      console.error("Error deleting recipe via store:", error);
      set({ recipes: originalRecipes }); // Revertir
      return false;
    }
  },

  /**
   * Cambia el estado de favorito de una receta llamando al servicio y actualiza el estado local.
   * Realiza una actualización optimista.
   * @async
   * @param {string} recipeId - ID de la receta.
   * @param {boolean} currentStatus - Estado actual de favorito.
   * @returns {Promise<boolean>} `true` si la operación fue exitosa, `false` si falló.
   */
  toggleFavorite: async (recipeId, currentStatus) => {
    const newState = !currentStatus;
    const originalRecipes = get().recipes;
    // Optimistic UI update
    set((state) => ({
      recipes: state.recipes.map(r => 
        r.id === recipeId ? { ...r, is_favorite: newState } : r
      )
    }));

    try {
      const success = await setFavoriteStatusService(recipeId, newState);
      if (!success) {
        console.error("Failed to update favorite status in DB");
        set({ recipes: originalRecipes }); // Revertir
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error toggling favorite via store:", error);
       set({ recipes: originalRecipes }); // Revertir
      return false;
    }
  },

}));