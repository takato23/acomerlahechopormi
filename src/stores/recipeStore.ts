import { create } from 'zustand';
import { Recipe } from '@/types/recipeTypes';
import { getRecipes, toggleRecipeFavorite, deleteRecipe as deleteRecipeService } from '@/features/recipes/services/recipeService';
import { toast } from 'sonner';

// Exportar tipo para filtros para que pueda ser usado por el servicio
export interface RecipeFilters {
  searchTerm?: string;
  showOnlyFavorites?: boolean;
  sortOption?: string; // Añadido para ordenamiento
  selectedIngredients?: string[]; // Nuevo filtro por ingredientes (IDs o nombres)
  selectedTags?: string[]; // Nuevo filtro por tags
}

interface RecipeState {
  recipes: Recipe[];
  isLoading: boolean;
  error: string | null;
  searchTerm: string;
  showOnlyFavorites: boolean;
  currentPage: number; // Página actual para paginación
  recipesPerPage: number; // Límite de recetas por página
  hasMore: boolean; // Indica si hay más recetas por cargar
  isLoadingMore: boolean; // Indica si se está cargando la siguiente página
  sortOption: string; // Opción de ordenamiento actual
  selectedIngredients: string[]; // Estado para ingredientes seleccionados
  selectedTags: string[]; // Estado para tags seleccionados
}

interface RecipeActions {
  setSearchTerm: (term: string) => void; // Acción para actualizar búsqueda
  fetchRecipes: (params: { userId: string; filters?: RecipeFilters; page?: number; reset?: boolean }) => Promise<void>; // Modificar fetchRecipes
  addRecipe: (recipe: Recipe) => void;
  updateRecipeState: (recipeId: string, updatedRecipeData: Partial<Recipe>) => void;
  removeRecipe: (recipeId: string) => void;
  toggleFavoriteFilter: (userId: string) => void; // Necesita userId para refetch
  toggleFavorite: (recipeId: string) => Promise<void>;
  deleteRecipe: (recipeId: string) => Promise<void>;
  fetchNextPage: (userId: string) => Promise<void>; // Nueva acción para cargar más
  setSortOption: (option: string, userId: string) => void; // Acción para cambiar ordenamiento
  setSelectedIngredients: (ingredients: string[], userId: string) => void; // Acción para filtro de ingredientes
  setSelectedTags: (tags: string[], userId: string) => void; // Acción para filtro de tags
}

const initialState: RecipeState = {
  recipes: [],
  isLoading: false,
  error: null,
  searchTerm: '',
  showOnlyFavorites: false,
  currentPage: 1,
  recipesPerPage: 12, // Límite por defecto
  hasMore: true, // Asumir que hay más al inicio
  isLoadingMore: false,
  sortOption: 'created_at_desc', // Valor inicial: Más recientes
  selectedIngredients: [],
  selectedTags: [],
};

export const useRecipeStore = create<RecipeState & RecipeActions>((set, get) => ({
  ...initialState,

  setSearchTerm: (term) => {
    set({ searchTerm: term, currentPage: 1 }); // Resetear página al cambiar búsqueda
    // Nota: fetchRecipes debe ser llamado explícitamente desde el componente
    // después de actualizar el término de búsqueda, usualmente con un debounce.
    // Por ahora, solo actualizamos el término y reseteamos la página.
    // Si se requiere fetch automático, se necesitaría userId y lógica de debounce aquí.
    // Ejemplo (requiere userId):
    // const userId = get().userId; // Asumiendo que userId está en el estado
    // if (userId) {
    //   get().fetchRecipes({ userId, filters: { searchTerm: term, showOnlyFavorites: get().showOnlyFavorites }, page: 1, reset: true });
    // }
  },

  fetchRecipes: async ({ userId, filters = {}, page = 1, reset = false }) => {
    const state = get();
    const currentFilters = {
      searchTerm: filters.searchTerm ?? state.searchTerm,
      showOnlyFavorites: filters.showOnlyFavorites ?? state.showOnlyFavorites,
      sortOption: filters.sortOption ?? state.sortOption, // Incluir sortOption
      selectedIngredients: filters.selectedIngredients ?? state.selectedIngredients, // Incluir ingredientes
      selectedTags: filters.selectedTags ?? state.selectedTags, // Incluir tags
    };
    const limit = state.recipesPerPage;

    // Determinar si es carga inicial/reseteo o carga de "más"
    const isLoadingState = page === 1 || reset ? { isLoading: true } : { isLoadingMore: true };
    set({ ...isLoadingState, error: null });

    console.log(`[RecipeStore] Fetching recipes - Page: ${page}, Limit: ${limit}, Filters:`, currentFilters, `Reset: ${reset}`);

    try {
      const { data: fetchedRecipes, hasMore } = await getRecipes({
        userId,
        filters: currentFilters,
        page,
        limit,
      });

      set((currentState) => ({
        // Si es la página 1 o se pide reseteo, reemplazar recetas. Si no, añadir.
        recipes: page === 1 || reset ? fetchedRecipes : [...currentState.recipes, ...fetchedRecipes],
        currentPage: page,
        hasMore: hasMore,
        isLoading: false,
        isLoadingMore: false,
        // Actualizar filtros en el estado si se pasaron explícitamente
        searchTerm: currentFilters.searchTerm,
        showOnlyFavorites: currentFilters.showOnlyFavorites,
        sortOption: currentFilters.sortOption, // Actualizar sortOption en el estado
        selectedIngredients: currentFilters.selectedIngredients, // Actualizar ingredientes en el estado
        selectedTags: currentFilters.selectedTags, // Actualizar tags en el estado
      }));

    } catch (err) {
      console.error('Error fetching recipes:', err);
      const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error desconocido al cargar las recetas.';
      set({ error: errorMessage, isLoading: false, isLoadingMore: false, recipes: page === 1 || reset ? [] : state.recipes }); // Limpiar solo si es la primera página o reseteo
    }
  },

  addRecipe: (recipe: Recipe) => {
    set((state) => ({
      // Añadir siempre, el filtrado se hace al obtener o en el componente
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

  toggleFavoriteFilter: (userId: string) => {
    const newState = !get().showOnlyFavorites;
    set({ showOnlyFavorites: newState, currentPage: 1 }); // Resetear página
    // Volver a cargar las recetas desde la página 1 con el filtro actualizado y los demás filtros actuales
    get().fetchRecipes({
      userId,
      filters: {
        searchTerm: get().searchTerm,
        showOnlyFavorites: newState,
        sortOption: get().sortOption,
        selectedIngredients: get().selectedIngredients,
        selectedTags: get().selectedTags,
      },
      page: 1,
      reset: true
    });
  },

  toggleFavorite: async (recipeId: string) => {
    const currentRecipes = get().recipes;
    const recipe = currentRecipes.find(r => r.id === recipeId);
    if (!recipe) return;

    const currentIsFavorite = recipe.is_favorite ?? false;
    const newIsFavorite = !currentIsFavorite;

    // Optimistic update
    set((state) => ({
      recipes: state.recipes.map((r) =>
        r.id === recipeId ? { ...r, is_favorite: newIsFavorite } : r
      ),
    }));

    try {
      await toggleRecipeFavorite(recipeId, newIsFavorite);
      toast.success(`Receta ${newIsFavorite ? 'añadida a' : 'quitada de'} favoritos`);
    } catch (error) {
      console.error("Error toggling favorite recipe:", error);
      toast.error("Error al actualizar favorito");
      // Revertir
      set((state) => ({
        recipes: state.recipes.map((r) =>
          r.id === recipeId ? { ...r, is_favorite: currentIsFavorite } : r
        ),
      }));
    }
  },

  deleteRecipe: async (recipeId: string) => {
    const currentRecipes = get().recipes;
    // Optimistic update (eliminar del estado local primero)
    set((state) => ({
      recipes: state.recipes.filter((recipe) => recipe.id !== recipeId),
    }));

    try {
      await deleteRecipeService(recipeId);
      toast.success('Receta eliminada');
    } catch (error) {
      console.error('Error deleting recipe:', error);
      toast.error('Error al eliminar la receta');
      // Revertir si falla la eliminación en el backend
      set({ recipes: currentRecipes });
    }
  },

  fetchNextPage: async (userId: string) => {
    const { isLoading, isLoadingMore, hasMore, currentPage, fetchRecipes } = get();
    if (isLoading || isLoadingMore || !hasMore) {
      console.log("[RecipeStore] Cannot fetch next page:", { isLoading, isLoadingMore, hasMore });
      return; // No cargar si ya está cargando o no hay más páginas
    }

    const nextPage = currentPage + 1;
    console.log(`[RecipeStore] Fetching next page: ${nextPage}`);
    await fetchRecipes({ userId, page: nextPage }); // Los filtros (incluido sortOption) se toman del estado actual dentro de fetchRecipes
  }, // Fin de fetchNextPage

  setSortOption: (option, userId) => {
    set({ sortOption: option, currentPage: 1 }); // Resetear página al cambiar ordenamiento
    // Volver a cargar las recetas desde la página 1 con la nueva opción de ordenamiento
    get().fetchRecipes({
      userId,
      filters: {
        searchTerm: get().searchTerm,
        showOnlyFavorites: get().showOnlyFavorites,
        sortOption: option, // Usar la nueva opción
        selectedIngredients: get().selectedIngredients, // Mantener filtro ingredientes
        selectedTags: get().selectedTags, // Mantener filtro tags
      },
      page: 1,
      reset: true,
    });
  }, // Fin de setSortOption

  setSelectedIngredients: (ingredients, userId) => {
    set({ selectedIngredients: ingredients, currentPage: 1 }); // Resetear página
    // Volver a cargar las recetas desde la página 1 con el filtro actualizado
    get().fetchRecipes({
      userId,
      filters: {
        searchTerm: get().searchTerm,
        showOnlyFavorites: get().showOnlyFavorites,
        sortOption: get().sortOption,
        selectedIngredients: ingredients, // Usar los nuevos ingredientes
        selectedTags: get().selectedTags,
      },
      page: 1,
      reset: true,
    });
  }, // Fin de setSelectedIngredients

  setSelectedTags: (tags, userId) => {
    set({ selectedTags: tags, currentPage: 1 }); // Resetear página
    // Volver a cargar las recetas desde la página 1 con el filtro actualizado
    get().fetchRecipes({
      userId,
      filters: {
        searchTerm: get().searchTerm,
        showOnlyFavorites: get().showOnlyFavorites,
        sortOption: get().sortOption,
        selectedIngredients: get().selectedIngredients,
        selectedTags: tags, // Usar los nuevos tags
      },
      page: 1,
      reset: true,
    });
  }, // Fin de setSelectedTags

})); // Fin de create