import { useRecipeStore } from './recipeStore';
import { act } from 'react'; // Usar act para envolver actualizaciones de estado
import * as recipeService from '@/features/recipes/recipeService';

// Mockear el servicio de recetas
jest.mock('@/features/recipes/recipeService');
const mockedRecipeService = recipeService as jest.Mocked<typeof recipeService>;

// Mock de datos
const mockRecipe1 = { id: 'r1', name: 'Recipe 1', is_favorite: false, created_at: '2023-01-01T10:00:00Z', recipe_ingredients: [] };
const mockRecipe2 = { id: 'r2', name: 'Recipe 2', is_favorite: true, created_at: '2023-01-02T10:00:00Z', recipe_ingredients: [] };
const mockNewRecipeData = { name: 'New Recipe', description: 'Desc' };
const mockNewIngredients = [{ name: 'Ing 1', quantity: 1, unit: 'cup' }];
const mockCreatedRecipe = { id: 'r-new', ...mockNewRecipeData, is_favorite: false, created_at: new Date().toISOString(), recipe_ingredients: [] };
const mockUpdatedRecipe = { ...mockRecipe1, name: 'Updated Recipe 1' };

describe('useRecipeStore', () => {
  
  // Resetear estado y mocks antes de cada prueba
  beforeEach(() => {
    useRecipeStore.setState({ recipes: [], isLoading: false, error: null }); // Resetear estado inicial
    jest.resetAllMocks(); // Usar reset completo
    // No necesitamos configurar mockGetUser aquí, los servicios mockeados se encargan
  });

  // --- fetchRecipes ---
  it('fetchRecipes should update state on success', async () => {
    mockedRecipeService.getRecipes.mockResolvedValue([mockRecipe1, mockRecipe2]);
    
    // Usar act para operaciones asíncronas que actualizan estado
    await act(async () => {
      await useRecipeStore.getState().fetchRecipes();
    });

    expect(useRecipeStore.getState().isLoading).toBe(false);
    expect(useRecipeStore.getState().error).toBeNull();
    expect(useRecipeStore.getState().recipes).toEqual([mockRecipe1, mockRecipe2]);
    expect(mockedRecipeService.getRecipes).toHaveBeenCalledTimes(1);
  });

  it('fetchRecipes should set error state on failure', async () => {
    const errorMessage = 'Failed to fetch';
    mockedRecipeService.getRecipes.mockRejectedValue(new Error(errorMessage));

    await act(async () => {
      await useRecipeStore.getState().fetchRecipes();
    });

    expect(useRecipeStore.getState().isLoading).toBe(false);
    expect(useRecipeStore.getState().error).toBe(errorMessage);
    expect(useRecipeStore.getState().recipes).toEqual([]);
  });

  // --- addRecipe ---
  it('addRecipe should add a recipe and update state', async () => {
    mockedRecipeService.createRecipe.mockResolvedValue(mockCreatedRecipe);

    let result: any;
    await act(async () => {
       result = await useRecipeStore.getState().addRecipe(mockNewRecipeData, mockNewIngredients);
    });

    expect(result).toEqual(mockCreatedRecipe);
    // Verificar que la receta se añadió al estado (puede estar al principio o al final)
    expect(useRecipeStore.getState().recipes).toEqual(expect.arrayContaining([mockCreatedRecipe]));
    expect(mockedRecipeService.createRecipe).toHaveBeenCalledWith(mockNewRecipeData, mockNewIngredients);
  });
  
  it('addRecipe should set error state on failure', async () => {
     const errorMessage = 'Failed to create';
     mockedRecipeService.createRecipe.mockRejectedValue(new Error(errorMessage));
     
     let result: any;
     await act(async () => {
        result = await useRecipeStore.getState().addRecipe(mockNewRecipeData, mockNewIngredients);
     });
     
     expect(result).toBeUndefined(); // O null, dependiendo de cómo maneje el error el store
     expect(useRecipeStore.getState().error).toBe(errorMessage);
     expect(useRecipeStore.getState().recipes).toEqual([]); // Asumiendo que no se añade nada si falla
  });

  // --- updateRecipe ---
  it('updateRecipe should update a recipe in state', async () => {
    // Estado inicial con una receta
    useRecipeStore.setState({ recipes: [mockRecipe1] });
    mockedRecipeService.updateRecipe.mockResolvedValue(mockUpdatedRecipe);

    let result: any;
    await act(async () => {
       result = await useRecipeStore.getState().updateRecipe(mockRecipe1.id, { name: 'Updated Recipe 1' }, []);
    });

    expect(result).toEqual(mockUpdatedRecipe);
    const updatedState = useRecipeStore.getState().recipes;
    expect(updatedState.length).toBe(1);
    expect(updatedState[0]).toEqual(mockUpdatedRecipe);
    expect(mockedRecipeService.updateRecipe).toHaveBeenCalledWith(mockRecipe1.id, { name: 'Updated Recipe 1' }, []);
  });
  
  it('updateRecipe should set error state on failure', async () => {
     useRecipeStore.setState({ recipes: [mockRecipe1] });
     const errorMessage = 'Failed to update';
     mockedRecipeService.updateRecipe.mockRejectedValue(new Error(errorMessage));
     
     let result: any;
     await act(async () => {
        result = await useRecipeStore.getState().updateRecipe(mockRecipe1.id, { name: 'Updated Recipe 1' }, []);
     });
     
     expect(result).toBeUndefined(); // O null
     expect(useRecipeStore.getState().error).toBe(errorMessage);
     expect(useRecipeStore.getState().recipes).toEqual([mockRecipe1]); // El estado no debería cambiar
  });

  // --- deleteRecipe ---
  it('deleteRecipe should remove a recipe from state', async () => {
    useRecipeStore.setState({ recipes: [mockRecipe1, mockRecipe2] });
    mockedRecipeService.deleteRecipe.mockResolvedValue(undefined); // deleteRecipe no devuelve nada

    await act(async () => {
       await useRecipeStore.getState().deleteRecipe(mockRecipe1.id);
    });

    const updatedState = useRecipeStore.getState().recipes;
    expect(updatedState.length).toBe(1);
    expect(updatedState).toEqual([mockRecipe2]);
    expect(mockedRecipeService.deleteRecipe).toHaveBeenCalledWith(mockRecipe1.id);
  });
  
  it('deleteRecipe should set error state on failure', async () => {
     useRecipeStore.setState({ recipes: [mockRecipe1, mockRecipe2] });
     const errorMessage = 'Failed to delete';
     mockedRecipeService.deleteRecipe.mockRejectedValue(new Error(errorMessage));
     
     await act(async () => {
        await useRecipeStore.getState().deleteRecipe(mockRecipe1.id);
     });
     
     expect(useRecipeStore.getState().error).toBe(errorMessage);
     expect(useRecipeStore.getState().recipes).toEqual([mockRecipe1, mockRecipe2]); // El estado no debería cambiar
  });

  // --- toggleFavorite ---
  it('toggleFavorite should update favorite status optimistically and call service', async () => {
    useRecipeStore.setState({ recipes: [mockRecipe1] });
    mockedRecipeService.setRecipeFavoriteStatus.mockResolvedValue(true); // Simular éxito del servicio

    // Llamada inicial (marcar como favorito)
    await act(async () => {
      await useRecipeStore.getState().toggleFavorite(mockRecipe1.id, mockRecipe1.is_favorite);
    });

    // Verificar actualización optimista
    expect(useRecipeStore.getState().recipes[0].is_favorite).toBe(true);
    // Verificar llamada al servicio
    expect(mockedRecipeService.setRecipeFavoriteStatus).toHaveBeenCalledWith(mockRecipe1.id, true);

    // Llamada secundaria (desmarcar como favorito)
    await act(async () => {
      await useRecipeStore.getState().toggleFavorite(mockRecipe1.id, true); // El estado ahora es true, pasamos eso
    });
    
    // Verificar actualización optimista
    expect(useRecipeStore.getState().recipes[0].is_favorite).toBe(false);
    // Verificar llamada al servicio
    expect(mockedRecipeService.setRecipeFavoriteStatus).toHaveBeenCalledWith(mockRecipe1.id, false);
  });
  
   it('toggleFavorite should revert optimistic update and set error on service failure', async () => {
     useRecipeStore.setState({ recipes: [mockRecipe1] }); // Estado inicial: no favorito
     const errorMessage = 'Failed to toggle favorite';
     mockedRecipeService.setRecipeFavoriteStatus.mockResolvedValue(false); // Simular fallo del servicio

     await act(async () => {
       await useRecipeStore.getState().toggleFavorite(mockRecipe1.id, mockRecipe1.is_favorite);
     });

     // Verificar que se revirtió el cambio optimista
     expect(useRecipeStore.getState().recipes[0].is_favorite).toBe(false); 
     // Verificar que se estableció el error
     expect(useRecipeStore.getState().error).toContain(errorMessage); 
     expect(mockedRecipeService.setRecipeFavoriteStatus).toHaveBeenCalledWith(mockRecipe1.id, true);
   });

});

// Mock console si es necesario para suprimir warnings/errors esperados
// global.console = { ...console, error: jest.fn(), warn: jest.fn() };