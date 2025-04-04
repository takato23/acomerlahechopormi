import { create } from 'zustand';
import type { Recipe } from '../types/recipeTypes';
import { getRecipes, updateRecipeFavoriteStatus, deleteRecipe as deleteRecipeService } from '../features/recipes/services/recipeService'; // Importar servicios
import { toast } from 'sonner';

/**
 * Define la estructura del estado para el store de recetas.
 */
interface RecipeState {
  recipes: Recipe[];
  isLoading: boolean;
  error: string | null;
  showOnlyFavorites: boolean; // Nuevo estado para filtro
}

/**
 * Define las acciones disponibles en el store de recetas.
 */
interface RecipeActions {
  /**
   * Busca y carga las recetas de un usuario específico desde el servicio.
   */
  fetchRecipes: (userId: string) => Promise<void>;

  /**
   * Añade una nueva receta al estado local del store.
   */
  addRecipe: (recipe: Recipe) => void;

  /**
   * Actualiza una receta existente en el estado local del store.
   */
  updateRecipeState: (recipeId: string, updatedRecipeData: Partial<Recipe>) => void;

  /**
   * Elimina una receta del estado local del store por su ID (solo estado).
   */
  removeRecipe: (recipeId: string) => void;

  /**
   * Cambia el estado del filtro para mostrar solo recetas favoritas.
   */
  toggleFavoriteFilter: () => void;

  /**
   * Marca o desmarca una receta como favorita (llama al servicio y actualiza estado).
   */
  toggleFavorite: (recipeId: string) => Promise<void>;

  /**
   * Elimina una receta de la base de datos y del estado local (llama al servicio).
   */
  deleteRecipe: (recipeId: string) => Promise<void>;
}

/**
 * Estado inicial para el store de recetas.
 */
const initialState: RecipeState = {
  recipes: [],
  isLoading: false,
  error: null,
  showOnlyFavorites: false,
};

/**
 * Hook de Zustand para gestionar el estado global de las recetas.
 */
// Modificar create para incluir un selector derivado o filtrar en los componentes que lo usan
// Por ahora, modificaremos las acciones para que consideren el filtro al exponer
export const useRecipeStore = create<RecipeState & RecipeActions>((set, get) => ({
  ...initialState,

  fetchRecipes: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const fetchedRecipes = await getRecipes(userId);
      // Aplicar filtro inicial si es necesario al cargar
      const filteredRecipes = get().showOnlyFavorites ? fetchedRecipes.filter(r => r.is_favorite) : fetchedRecipes;
      set({ recipes: filteredRecipes, isLoading: false });
    } catch (err) {
      console.error('Error fetching recipes:', err);
      const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error desconocido al cargar las recetas.';
      set({ error: errorMessage, isLoading: false });
    }
  },

  addRecipe: (recipe: Recipe) => {
    set((state) => ({
      // Añadir la nueva receta y luego aplicar filtro si es necesario
      recipes: get().showOnlyFavorites ? [...state.recipes, recipe].filter(r => r.is_favorite) : [...state.recipes, recipe],
    }));
  },

  updateRecipeState: (recipeId: string, updatedRecipeData: Partial<Recipe>) => {
    set((state) => ({
      recipes: state.recipes.map((recipe) =>
        recipe.id === recipeId ? { ...recipe, ...updatedRecipeData } : recipe
      ),
    }));
    // No es necesario filtrar aquí, updateRecipeState actualiza un item existente
  },

  removeRecipe: (recipeId: string) => {
    // Esta es la acción original que solo modifica el estado local
    // removeRecipe solo afecta el estado local, el filtro se aplica al leer
    set((state) => ({
      recipes: state.recipes.filter((recipe) => recipe.id !== recipeId),
    }));
  },

  toggleFavoriteFilter: () => {
    // Al cambiar el filtro, necesitamos re-filtrar la lista completa original
    // Esto es complejo sin guardar la lista original. Mejor filtrar en el componente que consume.
    // Por ahora, solo cambiamos el flag. Los componentes deberán usar un selector.
    set((state) => ({ showOnlyFavorites: !state.showOnlyFavorites }));
    // TODO: Considerar usar un selector derivado o filtrar en los componentes
  },

  toggleFavorite: async (recipeId: string) => {
    const currentRecipe = get().recipes.find(r => r.id === recipeId);
    if (!currentRecipe) {
      console.error(`Recipe with ID ${recipeId} not found in store.`);
      toast.error('No se encontró la receta para actualizar.');
      return;
    }

    const newFavoriteStatus = !currentRecipe.is_favorite;
    const originalStatus = currentRecipe.is_favorite; // Guardar estado original para revertir

    // Optimistic update
    set((state) => ({
      recipes: state.recipes.map(r =>
        r.id === recipeId ? { ...r, is_favorite: newFavoriteStatus } : r
      ),
    }));

    try {
      const updatedData = await updateRecipeFavoriteStatus(recipeId, newFavoriteStatus);

      if (!updatedData) {
        // Revertir si la actualización falló o no devolvió datos
        throw new Error('Update failed or returned no data');
      }
      // La actualización fue exitosa, el estado ya está actualizado (optimistic)
      toast.success(newFavoriteStatus ? 'Receta añadida a favoritos' : 'Receta quitada de favoritos');

    } catch (error) {
      console.error('Error toggling favorite status:', error);
      // Revertir el cambio optimista
      set((state) => ({
        // Revertir y luego aplicar filtro si es necesario
        recipes: state.recipes.map(r =>
          r.id === recipeId ? { ...r, is_favorite: originalStatus } : r
        ).filter(r => get().showOnlyFavorites ? r.is_favorite : true),
      }));
      toast.error('Error al actualizar favoritos.');
    }
  },

  deleteRecipe: async (recipeId: string) => {
    const recipeToDelete = get().recipes.find(r => r.id === recipeId);
    if (!recipeToDelete) {
      console.error(`Recipe with ID ${recipeId} not found in store for deletion.`);
      toast.error('No se encontró la receta para eliminar.');
      return;
    }

    const originalRecipes = get().recipes; // Guardar estado original

    // Optimistic update
    set((state) => ({
      recipes: state.recipes.filter((recipe) => recipe.id !== recipeId),
    }));

    try {
      await deleteRecipeService(recipeId);
      toast.success(`Receta "${recipeToDelete.title}" eliminada.`);
    } catch (error) {
      console.error('Error deleting recipe:', error);
      // Revertir el cambio optimista
      set({ recipes: originalRecipes });
      toast.error(`Error al eliminar la receta "${recipeToDelete.title}".`);
    }
  },

}));