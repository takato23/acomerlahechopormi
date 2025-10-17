import { create } from 'zustand';
import { Recipe } from '@/types/recipeTypes'; // Asegúrate que la ruta sea correcta
import { Category } from '@/types/categoryTypes'; // Importar tipo Category
// Importaciones consolidadas del servicio de recetas
import {
  getRecipes,
  toggleRecipeFavorite,
  deleteRecipe as deleteRecipeService,
  getCategories // Asegurarse que getCategories esté aquí
} from '@/features/recipes/services/recipeService';
import { notifyError, notifySuccess } from '@/lib/notifications';
import { PREDEFINED_RECIPE_TAGS } from '@/config/recipeTags'; // Importar tags predefinidos

// Exportar tipo para filtros para que pueda ser usado por el servicio
export interface RecipeFilters {
  searchTerm?: string;
  showOnlyFavorites?: boolean;
  sortOption?: string; // Añadido para ordenamiento
  selectedIngredients?: string[]; // Nuevo filtro por ingredientes (IDs o nombres)
  selectedTags?: string[]; // Nuevo filtro por tags
  categoryId?: string | null; // Nuevo filtro por ID de categoría
  maxTotalTimeMinutes?: number | null;
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
  viewMode: 'card' | 'list'; // Estado para el modo de vista
  availableTags: string[]; // Lista de tags disponibles para filtrar
  // Estado para categorías
  categories: Category[]; // Lista de categorías disponibles
  selectedCategoryId: string | null; // ID de la categoría seleccionada para filtrar
  isLoadingCategories: boolean; // Indica si se están cargando las categorías
  maxTotalTimeMinutes: number | null;
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
  // Acciones para categorías
  fetchCategories: () => Promise<void>; // Nueva acción para cargar categorías
  setSelectedCategory: (categoryId: string | null, userId: string) => void; // Nueva acción para seleccionar categoría
  // Acciones existentes
  setSortOption: (option: string, userId: string) => void; // Acción para cambiar ordenamiento
  setSelectedIngredients: (ingredients: string[], userId: string) => void; // Acción para filtro de ingredientes
  setSelectedTags: (tags: string[], userId: string) => void; // Acción para filtro de tags (puede usarse para setear todos)
  toggleTagFilter: (tag: string, userId: string) => void; // Acción para añadir/quitar un tag
  clearTagFilters: (userId: string) => void; // Acción para limpiar filtros de tags
  setViewMode: (mode: 'card' | 'list') => void; // Acción para cambiar el modo de vista
  setMaxTotalTimeMinutes: (value: number | null, userId: string) => void;
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
  viewMode: 'card', // Vista inicial por defecto
  availableTags: PREDEFINED_RECIPE_TAGS, // Cargar tags predefinidos
  // Estado inicial para categorías
  categories: [],
  selectedCategoryId: null, // Ninguna categoría seleccionada por defecto
  isLoadingCategories: false,
  maxTotalTimeMinutes: null,
};

export const useRecipeStore = create<RecipeState & RecipeActions>((set, get) => ({
  ...initialState,

  setSearchTerm: (term: string) => {
    set({ searchTerm: term, currentPage: 1 }); // Resetear página al cambiar búsqueda
  }, // Coma añadida

  fetchRecipes: async ({ userId, filters = {}, page = 1, reset = false }) => {
    const state = get();
    // Incluir categoryId en los filtros que se pasan al servicio
    const currentFilters: RecipeFilters = {
      searchTerm: filters.searchTerm ?? state.searchTerm,
      showOnlyFavorites: filters.showOnlyFavorites ?? state.showOnlyFavorites,
      sortOption: filters.sortOption ?? state.sortOption,
      selectedIngredients: filters.selectedIngredients ?? state.selectedIngredients,
      selectedTags: filters.selectedTags ?? state.selectedTags,
      categoryId: filters.categoryId ?? state.selectedCategoryId, // Añadir categoryId aquí
      maxTotalTimeMinutes: filters.maxTotalTimeMinutes ?? state.maxTotalTimeMinutes,
    };
    const limit = state.recipesPerPage;

    const isLoadingState = page === 1 || reset ? { isLoading: true } : { isLoadingMore: true };
    set({ ...isLoadingState, error: null });

    console.log(`[RecipeStore] Fetching recipes - Page: ${page}, Limit: ${limit}, Filters:`, currentFilters, `Reset: ${reset}`);

    try {
      // Pasar los filtros completos (incluyendo categoryId) al servicio
      const { data: fetchedRecipes, hasMore } = await getRecipes({
        userId,
        filters: currentFilters,
        page,
        limit,
      });

      set((currentState) => ({
        recipes: page === 1 || reset ? fetchedRecipes : [...currentState.recipes, ...fetchedRecipes],
        currentPage: page,
        hasMore: hasMore,
        isLoading: false,
        isLoadingMore: false,
        // Actualizar filtros en el estado si se pasaron explícitamente
        searchTerm: currentFilters.searchTerm,
        showOnlyFavorites: currentFilters.showOnlyFavorites,
        sortOption: currentFilters.sortOption,
        selectedIngredients: currentFilters.selectedIngredients,
        selectedTags: currentFilters.selectedTags,
        selectedCategoryId: currentFilters.categoryId, // Actualizar categoryId en el estado
        maxTotalTimeMinutes: currentFilters.maxTotalTimeMinutes ?? null,
      }));

    } catch (err) {
      console.error('Error fetching recipes:', err);
      const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error desconocido al cargar las recetas.';
      set({ error: errorMessage, isLoading: false, isLoadingMore: false, recipes: page === 1 || reset ? [] : state.recipes });
    }
  }, // Coma añadida

  addRecipe: (recipe: Recipe) => {
    set((state) => ({
      recipes: [...state.recipes, recipe],
    }));
  }, // Coma añadida

  updateRecipeState: (recipeId: string, updatedRecipeData: Partial<Recipe>) => {
    set((state) => ({
      recipes: state.recipes.map((recipe) =>
        recipe.id === recipeId ? { ...recipe, ...updatedRecipeData } : recipe
      ),
    }));
  }, // Coma añadida

  removeRecipe: (recipeId: string) => {
    set((state) => ({
      recipes: state.recipes.filter((recipe) => recipe.id !== recipeId),
    }));
  }, // Coma añadida

  toggleFavoriteFilter: (userId: string) => {
    const newState = !get().showOnlyFavorites;
    set({ showOnlyFavorites: newState, currentPage: 1 });
    get().fetchRecipes({
      userId,
      filters: {
        searchTerm: get().searchTerm,
        showOnlyFavorites: newState,
        sortOption: get().sortOption,
        selectedIngredients: get().selectedIngredients,
        selectedTags: get().selectedTags,
        categoryId: get().selectedCategoryId, // Incluir categoryId actual
        maxTotalTimeMinutes: get().maxTotalTimeMinutes ?? undefined,
      },
      page: 1,
      reset: true
    });
  }, // Coma añadida

  toggleFavorite: async (recipeId: string) => {
    const currentRecipes = get().recipes;
    const recipe = currentRecipes.find(r => r.id === recipeId);
    if (!recipe) return;

    const currentIsFavorite = recipe.is_favorite ?? false;
    const newIsFavorite = !currentIsFavorite;

    set((state) => ({
      recipes: state.recipes.map((r) =>
        r.id === recipeId ? { ...r, is_favorite: newIsFavorite } : r
      ),
    }));

    try {
      await toggleRecipeFavorite(recipeId, newIsFavorite);
      notifySuccess(`Receta ${newIsFavorite ? 'añadida a' : 'quitada de'} favoritos`);
    } catch (error) {
      console.error("Error toggling favorite recipe:", error);
      notifyError("Error al actualizar favorito");
      set((state) => ({
        recipes: state.recipes.map((r) =>
          r.id === recipeId ? { ...r, is_favorite: currentIsFavorite } : r
        ),
      }));
    }
  }, // Coma añadida

  deleteRecipe: async (recipeId: string) => {
    const currentRecipes = get().recipes;
    set((state) => ({
      recipes: state.recipes.filter((recipe) => recipe.id !== recipeId),
    }));

    try {
      await deleteRecipeService(recipeId);
      notifySuccess('Receta eliminada');
    } catch (error) {
      console.error('Error deleting recipe:', error);
      notifyError('Error al eliminar la receta');
      set({ recipes: currentRecipes });
    }
  }, // Coma añadida

  fetchNextPage: async (userId: string) => {
    const { isLoading, isLoadingMore, hasMore, currentPage, fetchRecipes } = get();
    if (isLoading || isLoadingMore || !hasMore) {
      console.log("[RecipeStore] Cannot fetch next page:", { isLoading, isLoadingMore, hasMore });
      return;
    }

    const nextPage = currentPage + 1;
    console.log(`[RecipeStore] Fetching next page: ${nextPage}`);
    // fetchRecipes ya toma categoryId del estado actual
    await fetchRecipes({ userId, page: nextPage });
  }, // Coma añadida

  // --- Acciones para Categorías ---
  fetchCategories: async () => {
    set({ isLoadingCategories: true, error: null });
    try {
      // getCategories ya se importa estáticamente
      const fetchedCategories = await getCategories();
      set({ categories: fetchedCategories, isLoadingCategories: false });
    } catch (err) {
      console.error('Error fetching categories:', err);
      const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error desconocido al cargar las categorías.';
      set({ error: errorMessage, isLoadingCategories: false, categories: [] });
    }
  }, // Coma añadida

  setSelectedCategory: (categoryId: string | null, userId: string) => {
    set({ selectedCategoryId: categoryId, currentPage: 1 });
    get().fetchRecipes({
      userId,
      filters: {
        // Pasar explícitamente categoryId aquí, los demás se toman del estado
        categoryId: categoryId,
        maxTotalTimeMinutes: get().maxTotalTimeMinutes ?? undefined,
      },
      page: 1,
      reset: true,
    });
  }, // Coma añadida
  // --- Fin Acciones para Categorías ---

  setSortOption: (option: string, userId: string) => {
    set({ sortOption: option, currentPage: 1 });
    get().fetchRecipes({
      userId,
      filters: { sortOption: option }, // Pasar solo el filtro que cambia
      page: 1,
      reset: true,
    });
  }, // Coma añadida

  setSelectedIngredients: (ingredients: string[], userId: string) => {
    set({ selectedIngredients: ingredients, currentPage: 1 });
    get().fetchRecipes({
      userId,
      filters: { selectedIngredients: ingredients }, // Pasar solo el filtro que cambia
      page: 1,
      reset: true,
    });
  }, // Coma añadida

  setSelectedTags: (tags: string[], userId: string) => {
    set({ selectedTags: tags, currentPage: 1 });
    get().fetchRecipes({
      userId,
      filters: { selectedTags: tags }, // Pasar solo el filtro que cambia
      page: 1,
      reset: true,
    });
  }, // Coma añadida

  toggleTagFilter: (tag: string, userId: string) => {
    const currentTags = get().selectedTags;
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];
    set({ selectedTags: newTags, currentPage: 1 });
    get().fetchRecipes({
      userId,
      filters: { selectedTags: newTags }, // Pasar solo el filtro que cambia
      page: 1,
      reset: true,
    });
  }, // Coma añadida

  clearTagFilters: (userId: string) => {
    set({ selectedTags: [], currentPage: 1 });
    get().fetchRecipes({
      userId,
      filters: { selectedTags: [] }, // Pasar solo el filtro que cambia
      page: 1,
      reset: true,
    });
  }, // Coma añadida

  setViewMode: (mode: 'card' | 'list') => {
    set({ viewMode: mode });
  },

  setMaxTotalTimeMinutes: (value: number | null, userId: string) => {
    const normalizedValue = typeof value === 'number' && !Number.isNaN(value) ? value : null;
    set({ maxTotalTimeMinutes: normalizedValue, currentPage: 1 });
    get().fetchRecipes({
      userId,
      filters: { maxTotalTimeMinutes: normalizedValue },
      page: 1,
      reset: true,
    });
  }

})); // Fin de create
