import { 
  getRecipes, 
  getRecipeById, 
  createRecipe, 
  updateRecipe, 
  deleteRecipe, 
  setRecipeFavoriteStatus 
} from './recipeService';
// Importar SOLO el mock de supabase
import { supabase } from '@/lib/supabaseClient'; 

// Mockear el módulo (Jest usará automáticamente src/__mocks__/supabaseClient.ts)
jest.mock('@/lib/supabaseClient');

// Acceder a los mocks directamente desde el objeto supabase importado
const mockGetUser = supabase.auth.getUser as jest.Mock;
const mockFrom = supabase.from as jest.Mock;
// No definir mocks encadenados aquí

// Mock de usuario estándar para las pruebas
const mockUser = { id: 'user-test-123', email: 'test@test.com' };

describe('recipeService', () => {

  beforeEach(() => {
    jest.resetAllMocks(); // Resetear todos los mocks completamente
    // Configurar mock de usuario por defecto para CADA prueba
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
  });

  // --- getRecipes ---
  describe('getRecipes', () => {
    it('should fetch recipes for the current user', async () => {
      const mockRecipeData = [{ id: 'r1', name: 'Recipe 1', user_id: mockUser.id, recipe_ingredients: [] }];
      // Configurar la cadena completa para esta prueba
      const mockOrder = jest.fn().mockResolvedValueOnce({ data: mockRecipeData, error: null });
      const mockEq = jest.fn(() => ({ order: mockOrder }));
      const mockSelect = jest.fn(() => ({ eq: mockEq }));
      mockFrom.mockImplementationOnce(() => ({ select: mockSelect }));

      const recipes = await getRecipes();

      expect(recipes).toEqual(mockRecipeData);
      expect(mockFrom).toHaveBeenCalledWith('recipes');
      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('recipe_ingredients (*)'));
      expect(mockEq).toHaveBeenCalledWith('user_id', mockUser.id);
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
    });
    
    it('should fetch only favorite recipes when onlyFavorites is true', async () => {
       const mockRecipeData = [{ id: 'r2', name: 'Fav Recipe', user_id: mockUser.id, is_favorite: true, recipe_ingredients: [] }];
       // Configurar la cadena completa para esta prueba
       const mockFavEq = jest.fn().mockResolvedValueOnce({ data: mockRecipeData, error: null });
       const mockOrder = jest.fn(() => ({ eq: mockFavEq }));
       const mockUserEq = jest.fn(() => ({ order: mockOrder }));
       const mockSelect = jest.fn(() => ({ eq: mockUserEq }));
       mockFrom.mockImplementationOnce(() => ({ select: mockSelect }));

       const recipes = await getRecipes(true);

       expect(recipes).toEqual(mockRecipeData);
       expect(mockFrom).toHaveBeenCalledWith('recipes');
       expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('recipe_ingredients (*)'));
       expect(mockUserEq).toHaveBeenCalledWith('user_id', mockUser.id); 
       expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
       expect(mockFavEq).toHaveBeenCalledWith('is_favorite', true); 
    });

    it('should throw error if user is not authenticated', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null }); 
      await expect(getRecipes()).rejects.toThrow('Usuario no autenticado');
    });
    
    it('should throw error if fetch fails', async () => {
       // Configurar la cadena para fallo
       const mockOrder = jest.fn().mockResolvedValueOnce({ data: null, error: new Error('DB Fetch Error') });
       const mockEq = jest.fn(() => ({ order: mockOrder }));
       const mockSelect = jest.fn(() => ({ eq: mockEq }));
       mockFrom.mockImplementationOnce(() => ({ select: mockSelect }));
       await expect(getRecipes()).rejects.toThrow('No se pudieron cargar las recetas.');
    });
     it('should return empty array if no recipes found', async () => {
       // Configurar la cadena para datos nulos
       const mockOrder = jest.fn().mockResolvedValueOnce({ data: null, error: null }); 
       const mockEq = jest.fn(() => ({ order: mockOrder }));
       const mockSelect = jest.fn(() => ({ eq: mockEq }));
       mockFrom.mockImplementationOnce(() => ({ select: mockSelect }));
       await expect(getRecipes()).resolves.toEqual([]);
    });
     it('should ensure recipe_ingredients is an array', async () => {
       const mockData = [
         { id: 'r1', name: 'Recipe 1', user_id: mockUser.id, recipe_ingredients: [{ id: 'i1' }] },
         { id: 'r2', name: 'Recipe 2', user_id: mockUser.id, recipe_ingredients: null }, 
         { id: 'r3', name: 'Recipe 3', user_id: mockUser.id }, 
       ];
       // Configurar la cadena
       const mockOrder = jest.fn().mockResolvedValueOnce({ data: mockData, error: null });
       const mockEq = jest.fn(() => ({ order: mockOrder }));
       const mockSelect = jest.fn(() => ({ eq: mockEq }));
       mockFrom.mockImplementationOnce(() => ({ select: mockSelect }));

       const recipes = await getRecipes();
       expect(recipes[0].recipe_ingredients).toBeInstanceOf(Array);
       expect(recipes[1].recipe_ingredients).toEqual([]);
       expect(recipes[2].recipe_ingredients).toEqual([]);
    });
  });

  // --- getRecipeById ---
  describe('getRecipeById', () => {
     it('should fetch a specific recipe by ID for the current user', async () => {
       const mockRecipe = { id: 'r1', name: 'Specific Recipe', user_id: mockUser.id, recipe_ingredients: [] };
       // Configurar la cadena: select().eq(id).eq(user).single().then()
       const mockSingle = jest.fn().mockResolvedValueOnce({ data: mockRecipe, error: null }); 
       const mockUserEq = jest.fn(() => ({ single: mockSingle }));
       const mockIdEq = jest.fn(() => ({ eq: mockUserEq })); 
       const mockSelect = jest.fn(() => ({ eq: mockIdEq }));
       mockFrom.mockImplementationOnce(() => ({ select: mockSelect }));

       const recipe = await getRecipeById('r1');

       expect(recipe).toEqual(mockRecipe);
       expect(mockFrom).toHaveBeenCalledWith('recipes');
       expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('recipe_ingredients (*)'));
       expect(mockIdEq).toHaveBeenCalledWith('id', 'r1'); 
       expect(mockUserEq).toHaveBeenCalledWith('user_id', mockUser.id); 
       expect(mockSingle).toHaveBeenCalledTimes(1);
     });

     it('should return null if recipe not found (PGRST116)', async () => {
       const mockSingle = jest.fn().mockResolvedValueOnce({ data: null, error: { code: 'PGRST116', message: 'Not Found' } });
       const mockUserEq = jest.fn(() => ({ single: mockSingle }));
       const mockIdEq = jest.fn(() => ({ eq: mockUserEq })); 
       const mockSelect = jest.fn(() => ({ eq: mockIdEq }));
       mockFrom.mockImplementationOnce(() => ({ select: mockSelect }));
       await expect(getRecipeById('not-found')).resolves.toBeNull();
     });
     
     it('should return null on other fetch errors', async () => {
       const mockSingle = jest.fn().mockResolvedValueOnce({ data: null, error: new Error('Some DB Error') });
       const mockUserEq = jest.fn(() => ({ single: mockSingle }));
       const mockIdEq = jest.fn(() => ({ eq: mockUserEq })); 
       const mockSelect = jest.fn(() => ({ eq: mockIdEq }));
       mockFrom.mockImplementationOnce(() => ({ select: mockSelect }));
       await expect(getRecipeById('error-id')).resolves.toBeNull();
       expect(console.error).toHaveBeenCalledWith('Error fetching recipe by ID:', expect.any(Error));
     });

     it('should throw error if user is not authenticated', async () => {
       mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null }); 
       await expect(getRecipeById('r1')).rejects.toThrow('Usuario no autenticado');
     });
  });

  // --- createRecipe ---
  describe('createRecipe', () => {
     const recipeData = { name: 'New Recipe', description: 'Desc' };
     const ingredientsData = [{ name: 'Ing 1', quantity: 1, unit: 'cup' }];
     const newRecipeDB = { id: 'new-r1', user_id: mockUser.id, ...recipeData, created_at: new Date().toISOString() };
     
     it('should insert recipe and ingredients, returning the new recipe', async () => {
       // Configurar mocks ANTES de llamar
       const mockSingle = jest.fn().mockResolvedValueOnce({ data: newRecipeDB, error: null }); // Mock recipe insert success
       const mockIngredientInsert = jest.fn().mockResolvedValue({ error: null }); // Mock ingredient insert success
       const mockRecipeInsert = jest.fn(() => ({ select: jest.fn(() => ({ single: mockSingle })) }));
       // Configurar mockFrom para devolver el mock de insert correcto según la tabla
       mockFrom.mockImplementation((tableName: string) => {
           if (tableName === 'recipes') return { insert: mockRecipeInsert };
           if (tableName === 'recipe_ingredients') return { insert: mockIngredientInsert }; 
           return {};
       });

       const result = await createRecipe(recipeData, ingredientsData);

       expect(result).toEqual(expect.objectContaining({
         ...newRecipeDB,
         recipe_ingredients: expect.any(Array) 
       }));
       // ... (resto de las expectativas) ...
       
       expect(mockFrom).toHaveBeenCalledWith('recipes');
       expect(mockRecipeInsert).toHaveBeenCalledWith({ ...recipeData, user_id: mockUser.id });
       expect(mockFrom).toHaveBeenCalledWith('recipe_ingredients');
       expect(mockIngredientInsert).toHaveBeenCalledWith( 
         expect.arrayContaining([expect.objectContaining({ ...ingredientsData[0], recipe_id: 'new-r1' })]),
         { returning: 'minimal' } 
       );
     });
     
     it('should throw error if recipe creation fails', async () => {
        const mockSingle = jest.fn().mockResolvedValueOnce({ data: null, error: new Error('Recipe Insert Fail') });
        const mockRecipeInsert = jest.fn(() => ({ select: jest.fn(() => ({ single: mockSingle })) }));
        mockFrom.mockImplementationOnce(() => ({ insert: mockRecipeInsert })); // Solo mockear la primera llamada a from
        await expect(createRecipe(recipeData, ingredientsData)).rejects.toThrow('No se pudo crear la receta.');
     });

     it('should throw error and attempt rollback if ingredient creation fails', async () => {
        const mockSingle = jest.fn().mockResolvedValueOnce({ data: newRecipeDB, error: null }); // Recipe insert OK
        const mockIngredientInsertFail = jest.fn().mockResolvedValue({ error: new Error('Ingredient Insert Fail') });
        const mockRecipeInsert = jest.fn(() => ({ select: jest.fn(() => ({ single: mockSingle })) }));
        const mockDeleteThen = jest.fn().mockResolvedValueOnce({ error: null }); // delete().eq().then()
        const mockDeleteEq = jest.fn(() => ({ then: mockDeleteThen }));
        const mockDelete = jest.fn(() => ({ eq: mockDeleteEq }));
        
        // Configurar mockFrom para devolver los mocks correctos en secuencia
        mockFrom
          .mockImplementationOnce(() => ({ insert: mockRecipeInsert })) // Primera llamada (insert recipe)
          .mockImplementationOnce(() => ({ insert: mockIngredientInsertFail })) // Segunda llamada (insert ingredients - fail)
          .mockImplementationOnce(() => ({ delete: mockDelete })); // Tercera llamada (delete recipe - rollback)
       
       await expect(createRecipe(recipeData, ingredientsData)).rejects.toThrow('No se pudieron guardar los ingredientes de la receta.');
       // ... (resto de las expectativas) ...
       expect(mockFrom).toHaveBeenCalledWith('recipes'); 
       expect(mockFrom).toHaveBeenCalledWith('recipe_ingredients'); 
       expect(mockFrom).toHaveBeenCalledWith('recipes'); 
       expect(mockDelete).toHaveBeenCalled();
       expect(mockDeleteEq).toHaveBeenCalledWith('id', 'new-r1');
       expect(console.log).toHaveBeenCalledWith(`Rolled back recipe creation for id: new-r1`);
     });
  });

  // --- updateRecipe ---
  describe('updateRecipe', () => {
     const recipeId = 'r-update';
     const recipeData = { name: 'Updated Recipe', description: 'Updated Desc' };
     const ingredientsData = [{ name: 'Updated Ing 1', quantity: 2, unit: 'kg' }];
     const updatedRecipeDB = { id: recipeId, user_id: mockUser.id, ...recipeData };

     it('should update recipe, delete old ingredients, insert new ingredients', async () => {
        const mockSingle = jest.fn().mockResolvedValueOnce({ data: updatedRecipeDB, error: null }); // Mock update recipe success
        const mockDeleteThen = jest.fn().mockResolvedValueOnce({ error: null }); // delete().eq().then()
        const mockDeleteEq = jest.fn(() => ({ then: mockDeleteThen }));
        const mockDelete = jest.fn(() => ({ eq: mockDeleteEq }));
        const mockIngredientInsert = jest.fn().mockResolvedValue({ error: null }); // Mock insert ingredients success
        const mockUpdateEq = jest.fn(() => ({ select: jest.fn(() => ({ single: mockSingle })) })); // update().eq().select().single()
        const mockUpdate = jest.fn(() => ({ eq: mockUpdateEq }));

        // Configurar mockFrom para devolver los mocks correctos en secuencia
        mockFrom
          .mockImplementationOnce(() => ({ update: mockUpdate })) // update recipe
          .mockImplementationOnce(() => ({ delete: mockDelete })) // delete ingredients
          .mockImplementationOnce(() => ({ insert: mockIngredientInsert })); // insert ingredients

        const result = await updateRecipe(recipeId, recipeData, ingredientsData);

        expect(result).toEqual(expect.objectContaining({
           ...updatedRecipeDB,
           recipe_ingredients: expect.any(Array)
        }));
        // ... (resto de las expectativas) ...

        expect(mockFrom).toHaveBeenCalledWith('recipes'); 
        expect(mockUpdate).toHaveBeenCalledWith(recipeData);
        expect(mockUpdateEq).toHaveBeenCalledWith('id', recipeId); 
        // expect(mockUpdateEq).toHaveBeenCalledWith('user_id', mockUser.id); // Esta verificación es implícita por RLS

        expect(mockFrom).toHaveBeenCalledWith('recipe_ingredients'); 
        expect(mockDelete).toHaveBeenCalled();
        expect(mockDeleteEq).toHaveBeenCalledWith('recipe_id', recipeId); 
        
        expect(mockFrom).toHaveBeenCalledWith('recipe_ingredients'); 
        expect(mockIngredientInsert).toHaveBeenCalledWith( 
          expect.arrayContaining([expect.objectContaining({ ...ingredientsData[0], recipe_id: recipeId })]),
          { returning: 'minimal' } 
        );
     });
     
     it('should throw error if recipe update fails', async () => {
        const mockSingle = jest.fn().mockResolvedValueOnce({ data: null, error: new Error('Recipe Update Fail') });
        const mockUpdateEq = jest.fn(() => ({ select: jest.fn(() => ({ single: mockSingle })) })); 
        const mockUpdate = jest.fn(() => ({ eq: mockUpdateEq }));
        mockFrom.mockImplementationOnce(() => ({ update: mockUpdate })); 

        await expect(updateRecipe(recipeId, recipeData, ingredientsData)).rejects.toThrow('No se pudo actualizar la receta');
     });
     
  });

  // --- deleteRecipe ---
  describe('deleteRecipe', () => {
     it('should delete the recipe for the current user', async () => {
        // Configurar delete success (delete().eq().eq().then())
        const mockThen = jest.fn().mockResolvedValueOnce({ error: null }); 
        const mockUserEq = jest.fn(() => ({ then: mockThen }));
        const mockIdEq = jest.fn(() => ({ eq: mockUserEq })); 
        const mockDelete = jest.fn(() => ({ eq: mockIdEq }));
        mockFrom.mockImplementationOnce(() => ({ delete: mockDelete }));

        await expect(deleteRecipe('r-delete')).resolves.toBeUndefined();
        expect(mockFrom).toHaveBeenCalledWith('recipes');
        expect(mockDelete).toHaveBeenCalled();
        expect(mockIdEq).toHaveBeenCalledWith('id', 'r-delete'); 
        expect(mockUserEq).toHaveBeenCalledWith('user_id', mockUser.id); 
     });
     
     it('should throw error if delete fails', async () => {
        // Configurar delete fail
        const mockThen = jest.fn().mockResolvedValueOnce({ error: new Error('Delete Fail') }); 
        const mockUserEq = jest.fn(() => ({ then: mockThen }));
        const mockIdEq = jest.fn(() => ({ eq: mockUserEq }));
        const mockDelete = jest.fn(() => ({ eq: mockIdEq }));
        mockFrom.mockImplementationOnce(() => ({ delete: mockDelete }));

        await expect(deleteRecipe('r-delete-fail')).rejects.toThrow('No se pudo eliminar la receta.');
     });
  });

  // --- setRecipeFavoriteStatus ---
  describe('setRecipeFavoriteStatus', () => {
     it('should update the favorite status for the user recipe', async () => {
         // Configurar update success (update().eq().eq().then())
         const mockThen = jest.fn().mockResolvedValueOnce({ error: null });
         const mockUserEq = jest.fn(() => ({ then: mockThen }));
         const mockIdEq = jest.fn(() => ({ eq: mockUserEq }));
         const mockUpdate = jest.fn(() => ({ eq: mockIdEq }));
         mockFrom.mockImplementationOnce(() => ({ update: mockUpdate }));

        await expect(setRecipeFavoriteStatus('r-fav', true)).resolves.toBe(true);
        expect(mockFrom).toHaveBeenCalledWith('recipes');
        expect(mockUpdate).toHaveBeenCalledWith({ is_favorite: true });
        expect(mockIdEq).toHaveBeenCalledWith('id', 'r-fav'); 
        expect(mockUserEq).toHaveBeenCalledWith('user_id', mockUser.id); 
     });
     
     it('should return false if update fails', async () => {
        // Configurar update fail
        const mockThen = jest.fn().mockResolvedValueOnce({ error: new Error('Fav Update Fail') });
        const mockUserEq = jest.fn(() => ({ then: mockThen }));
        const mockIdEq = jest.fn(() => ({ eq: mockUserEq }));
        const mockUpdate = jest.fn(() => ({ eq: mockIdEq }));
        mockFrom.mockImplementationOnce(() => ({ update: mockUpdate }));

        await expect(setRecipeFavoriteStatus('r-fav-fail', false)).resolves.toBe(false);
        expect(console.error).toHaveBeenCalledWith('Error updating favorite status:', expect.any(Error));
     });
  });

});

// Mock console
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};