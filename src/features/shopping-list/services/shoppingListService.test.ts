import {
  getShoppingListItems,
  addShoppingListItem,
  updateShoppingListItem,
  deleteShoppingListItem,
  clearPurchasedItems,
  getFrequentItems,
  generateShoppingList,
} from './shoppingListService';
// Importar SOLO el mock de supabase
import { supabase } from '@/lib/supabaseClient';
// Mockear dependencias externas
import * as planningService from '@/features/planning/planningService';
import * as recipeService from '@/features/recipes/recipeService';
import * as pantryService from '@/features/pantry/pantryService';
// Importar tipos para mocks
import type { PlannedMeal } from '@/features/planning/types'; 
import type { Recipe, RecipeIngredient } from '@/features/recipes/recipeTypes'; 
import type { PantryItem } from '@/features/pantry/types';

// Mockear módulos
jest.mock('@/lib/supabaseClient');
jest.mock('@/features/planning/planningService');
jest.mock('@/features/recipes/recipeService');
jest.mock('@/features/pantry/pantryService');

// Acceder a los mocks directamente desde el objeto supabase importado
const mockGetUser = supabase.auth.getUser as jest.Mock;
const mockFrom = supabase.from as jest.Mock;
// No definir mocks encadenados aquí, se configurarán por prueba

// Mocks de servicios dependientes tipados
const mockedPlanningService = planningService as jest.Mocked<typeof planningService>;
const mockedRecipeService = recipeService as jest.Mocked<typeof recipeService>;
const mockedPantryService = pantryService as jest.Mocked<typeof pantryService>;

// Mock de usuario
const mockUser = { id: 'shop-user-789', email: 'shop@test.com' };
const mockDate = new Date().toISOString();
const mockIngredientIdPasta = 'ing-pasta-uuid'; 
const mockIngredientIdSauce = 'ing-sauce-uuid';

describe('shoppingListService', () => {

  beforeEach(() => {
    jest.resetAllMocks(); // Resetear todos los mocks completamente
    // Configurar mock de usuario por defecto para CADA prueba
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
  });

  // --- getShoppingListItems ---
  describe('getShoppingListItems', () => {
    it('should fetch items ordered by purchased status and creation date', async () => {
      const mockListData = [{ id: 'sl1', name: 'Item 1', is_purchased: false, created_at: '2023-01-01' }];
      // Configurar cadena: select().eq().order(purchased).order(created).then()
      const mockThen = jest.fn().mockResolvedValueOnce({ data: mockListData, error: null });
      const mockCreatedOrder = jest.fn(() => ({ then: mockThen }));
      const mockPurchasedOrder = jest.fn(() => ({ order: mockCreatedOrder })); 
      const mockEq = jest.fn(() => ({ order: mockPurchasedOrder }));
      const mockSelect = jest.fn(() => ({ eq: mockEq }));
      mockFrom.mockImplementationOnce(() => ({ select: mockSelect }));

      const items = await getShoppingListItems();

      expect(items).toEqual(mockListData);
      expect(mockFrom).toHaveBeenCalledWith('shopping_list_items');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('user_id', mockUser.id);
      expect(mockPurchasedOrder).toHaveBeenCalledWith('is_purchased', { ascending: true });
      expect(mockCreatedOrder).toHaveBeenCalledWith('created_at', { ascending: true });
    });
    // Tests para errores y usuario no autenticado
     it('should throw error if user is not authenticated', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null }); 
      await expect(getShoppingListItems()).rejects.toThrow('Usuario no autenticado.'); 
    });
     it('should throw error if fetch fails', async () => {
       // Configurar cadena para fallo
       const mockThen = jest.fn().mockResolvedValueOnce({ data: null, error: new Error('Fetch Fail') });
       const mockCreatedOrder = jest.fn(() => ({ then: mockThen }));
       const mockPurchasedOrder = jest.fn(() => ({ order: mockCreatedOrder })); 
       const mockEq = jest.fn(() => ({ order: mockPurchasedOrder }));
       const mockSelect = jest.fn(() => ({ eq: mockEq }));
       mockFrom.mockImplementationOnce(() => ({ select: mockSelect }));
       await expect(getShoppingListItems()).rejects.toThrow('No se pudieron cargar los ítems.');
    });
  });

  // --- addShoppingListItem ---
  describe('addShoppingListItem', () => {
     const newItemData = { name: 'New SL Item', quantity: 2, unit: 'pcs' };
     const addedItemDB = { id: 'sl-new', user_id: mockUser.id, is_purchased: false, ...newItemData, created_at: mockDate };

     it('should insert a new item and return it', async () => {
       // Configurar cadena: from -> insert -> select -> single -> then
       const mockSingle = jest.fn().mockResolvedValueOnce({ data: addedItemDB, error: null }); 
       const mockSelect = jest.fn(() => ({ single: mockSingle }));
       const mockInsert = jest.fn(() => ({ select: mockSelect }));
       mockFrom.mockImplementationOnce(() => ({ insert: mockInsert }));

       const result = await addShoppingListItem(newItemData);
       expect(result).toEqual(addedItemDB);
       expect(mockFrom).toHaveBeenCalledWith('shopping_list_items');
       expect(mockInsert).toHaveBeenCalledWith({ ...newItemData, user_id: mockUser.id, is_purchased: false });
     });
     // Tests para errores y cantidades inválidas
      it('should throw error if user is not authenticated', async () => {
        mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null }); 
        await expect(addShoppingListItem(newItemData)).rejects.toThrow('Usuario no autenticado.'); 
      });
      it('should throw error if insert fails', async () => {
        const mockSingle = jest.fn().mockResolvedValueOnce({ data: null, error: new Error('Insert Fail') });
        const mockSelect = jest.fn(() => ({ single: mockSingle }));
        const mockInsert = jest.fn(() => ({ select: mockSelect }));
        mockFrom.mockImplementationOnce(() => ({ insert: mockInsert }));
        await expect(addShoppingListItem(newItemData)).rejects.toThrow('No se pudo añadir el ítem.');
      });
  });

  // --- updateShoppingListItem ---
  describe('updateShoppingListItem', () => {
     const itemId = 'sl-update';
     const updates = { is_purchased: true };
     const updatedItemDB = { id: itemId, name: 'Updated Item', is_purchased: true, user_id: mockUser.id, created_at: mockDate, quantity: null, unit: null };

     it('should update an item and return it', async () => {
       // Configurar cadena: from -> update -> eq -> select -> single -> then
       const mockSingle = jest.fn().mockResolvedValueOnce({ data: updatedItemDB, error: null }); 
       const mockSelect = jest.fn(() => ({ single: mockSingle }));
       const mockEq = jest.fn(() => ({ select: mockSelect }));
       const mockUpdate = jest.fn(() => ({ eq: mockEq }));
       mockFrom.mockImplementationOnce(() => ({ update: mockUpdate }));

       const result = await updateShoppingListItem(itemId, updates);
       expect(result).toEqual(updatedItemDB);
       expect(mockFrom).toHaveBeenCalledWith('shopping_list_items');
       expect(mockUpdate).toHaveBeenCalledWith(updates);
       expect(mockEq).toHaveBeenCalledWith('id', itemId);
     });
     // Tests para errores
      it('should throw error if update fails', async () => {
        const mockSingle = jest.fn().mockResolvedValueOnce({ data: null, error: new Error('Update Fail') });
        const mockSelect = jest.fn(() => ({ single: mockSingle }));
        const mockEq = jest.fn(() => ({ select: mockSelect }));
        const mockUpdate = jest.fn(() => ({ eq: mockEq }));
        mockFrom.mockImplementationOnce(() => ({ update: mockUpdate }));
        await expect(updateShoppingListItem(itemId, updates)).rejects.toThrow('No se pudo actualizar el ítem.');
      });
  });

  // --- deleteShoppingListItem ---
  describe('deleteShoppingListItem', () => {
     it('should delete an item', async () => {
       // Configurar cadena: from -> delete -> eq -> then
       const mockThen = jest.fn().mockResolvedValueOnce({ error: null }); 
       const mockEq = jest.fn(() => ({ then: mockThen }));
       const mockDelete = jest.fn(() => ({ eq: mockEq }));
       mockFrom.mockImplementationOnce(() => ({ delete: mockDelete }));

       await expect(deleteShoppingListItem('sl-delete')).resolves.toBeUndefined();
       expect(mockFrom).toHaveBeenCalledWith('shopping_list_items');
       expect(mockDelete).toHaveBeenCalled();
       expect(mockEq).toHaveBeenCalledWith('id', 'sl-delete');
     });
     // Tests para errores
      it('should throw error if delete fails', async () => {
        const mockThen = jest.fn().mockResolvedValueOnce({ error: new Error('Delete Fail') }); 
        const mockEq = jest.fn(() => ({ then: mockThen }));
        const mockDelete = jest.fn(() => ({ eq: mockEq }));
        mockFrom.mockImplementationOnce(() => ({ delete: mockDelete }));
       await expect(deleteShoppingListItem('sl-delete-fail')).rejects.toThrow('No se pudo eliminar el ítem.');
     });
  });

  // --- clearPurchasedItems ---
  describe('clearPurchasedItems', () => {
     it('should delete items where user_id matches and is_purchased is true', async () => {
        // Configurar cadena: from -> delete -> eq(user).eq(purchased).then()
        const mockThen = jest.fn().mockResolvedValueOnce({ error: null }); 
        const mockPurchasedEq = jest.fn(() => ({ then: mockThen }));
        const mockUserEq = jest.fn(() => ({ eq: mockPurchasedEq }));
        const mockDelete = jest.fn(() => ({ eq: mockUserEq }));
        mockFrom.mockImplementationOnce(() => ({ delete: mockDelete }));

        await expect(clearPurchasedItems()).resolves.toBeUndefined();
        expect(mockFrom).toHaveBeenCalledWith('shopping_list_items');
        expect(mockDelete).toHaveBeenCalled();
        expect(mockUserEq).toHaveBeenCalledWith('user_id', mockUser.id);
        expect(mockPurchasedEq).toHaveBeenCalledWith('is_purchased', true);
     });
     // Tests para errores
      it('should throw error if user is not authenticated', async () => {
        mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null }); 
        await expect(clearPurchasedItems()).rejects.toThrow('Usuario no autenticado.'); 
      });
      it('should throw error if delete fails', async () => {
         const mockThen = jest.fn().mockResolvedValueOnce({ error: new Error('Clear Fail') }); 
         const mockPurchasedEq = jest.fn(() => ({ then: mockThen }));
         const mockUserEq = jest.fn(() => ({ eq: mockPurchasedEq }));
         const mockDelete = jest.fn(() => ({ eq: mockUserEq }));
         mockFrom.mockImplementationOnce(() => ({ delete: mockDelete }));
        await expect(clearPurchasedItems()).rejects.toThrow('No se pudieron limpiar los ítems comprados.');
     });
  });

  // --- getFrequentItems ---
  describe('getFrequentItems', () => {
     it('should return frequently added item names', async () => {
        const mockItems = [
           { name: 'Milk' }, { name: 'Eggs' }, { name: 'Milk' }, { name: 'Bread' }, { name: 'Milk' }
        ];
        // Configurar cadena: from -> select -> eq -> limit -> then
        const mockThen = jest.fn().mockResolvedValueOnce({ data: mockItems, error: null });
        const mockLimit = jest.fn(() => ({ then: mockThen }));
        const mockEq = jest.fn(() => ({ limit: mockLimit }));
        const mockSelect = jest.fn(() => ({ eq: mockEq }));
        mockFrom.mockImplementationOnce(() => ({ select: mockSelect }));

        const frequent = await getFrequentItems(2); 

        expect(frequent).toEqual(['Milk', 'Eggs']); 
        expect(mockFrom).toHaveBeenCalledWith('shopping_list_items');
        expect(mockSelect).toHaveBeenCalledWith('name');
        expect(mockEq).toHaveBeenCalledWith('user_id', mockUser.id);
        expect(mockLimit).toHaveBeenCalledWith(500); 
     });
     // Tests para errores y sin datos
      it('should return empty array if user is not authenticated', async () => {
        mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null }); 
        const frequent = await getFrequentItems();
        expect(frequent).toEqual([]);
      });
      it('should return empty array if fetch fails', async () => {
         const mockThen = jest.fn().mockResolvedValueOnce({ data: null, error: new Error('Freq Fail') });
         const mockLimit = jest.fn(() => ({ then: mockThen }));
         const mockEq = jest.fn(() => ({ limit: mockLimit }));
         const mockSelect = jest.fn(() => ({ eq: mockEq }));
         mockFrom.mockImplementationOnce(() => ({ select: mockSelect }));
        const frequent = await getFrequentItems();
        expect(frequent).toEqual([]);
        expect(console.error).toHaveBeenCalledWith('Error fetching frequent items:', expect.any(Error));
     });
  });

  // --- generateShoppingList ---
  describe('generateShoppingList', () => {
     const startDate = '2023-01-02';
     const endDate = '2023-01-08';
     const mockPlannedMeals: PlannedMeal[] = [{ 
         id: 'pm1', plan_date: '2023-01-03', meal_type: 'Almuerzo', recipe_id: 'r1', 
         user_id: mockUser.id, custom_meal_name: null, created_at: mockDate 
     }];
     const mockRecipe: Recipe = { 
         id: 'r1', name: 'Pasta', description: '', instructions: '', prep_time: null, cook_time: null, servings: null, is_favorite: false, user_id: mockUser.id, created_at: mockDate,
         recipe_ingredients: [
             { id: 'i1', recipe_id: 'r1', name: 'Pasta', quantity: 200, unit: 'g' }, 
             { id: 'i2', recipe_id: 'r1', name: 'Tomato Sauce', quantity: 1, unit: 'can' }
         ] 
     };
     const mockPantryItems: PantryItem[] = [{ 
         id: 'p1', 
         quantity: 100, 
         unit: 'g', 
         user_id: mockUser.id, 
         created_at: mockDate, 
         category_id: null, 
         ingredient_id: mockIngredientIdPasta,
         ingredients: { name: 'Pasta' } 
     }]; 

     beforeEach(() => {
        mockedPlanningService.getPlannedMeals.mockClear();
        mockedRecipeService.getRecipeById.mockClear();
        mockedPantryService.getPantryItems.mockClear();
     });

     it('should generate list subtracting pantry stock', async () => {
        mockedPlanningService.getPlannedMeals.mockResolvedValue(mockPlannedMeals);
        mockedRecipeService.getRecipeById.mockResolvedValue(mockRecipe);
        mockedPantryService.getPantryItems.mockResolvedValue(mockPantryItems);

        const list = await generateShoppingList(startDate, endDate);

        expect(list).toEqual(expect.arrayContaining([
           expect.objectContaining({ name: 'Pasta', quantity: 100, unit: 'g' }), 
           expect.objectContaining({ name: 'Tomato Sauce', quantity: 1, unit: 'can' }) 
        ]));
        expect(mockedPlanningService.getPlannedMeals).toHaveBeenCalledWith(startDate, endDate);
        expect(mockedRecipeService.getRecipeById).toHaveBeenCalledWith('r1');
        expect(mockedPantryService.getPantryItems).toHaveBeenCalled();
     });
     
     it('should not add item if pantry stock is sufficient', async () => {
        const mockPantrySufficient: PantryItem[] = [
            { id: 'p1', quantity: 300, unit: 'g', user_id: mockUser.id, created_at: mockDate, category_id: null, ingredient_id: mockIngredientIdPasta, ingredients: { name: 'Pasta' } }, 
            { id: 'p2', quantity: 2, unit: 'can', user_id: mockUser.id, created_at: mockDate, category_id: null, ingredient_id: mockIngredientIdSauce, ingredients: { name: 'Tomato Sauce' } }
        ];
        mockedPlanningService.getPlannedMeals.mockResolvedValue(mockPlannedMeals);
        mockedRecipeService.getRecipeById.mockResolvedValue(mockRecipe);
        mockedPantryService.getPantryItems.mockResolvedValue(mockPantrySufficient);

        const list = await generateShoppingList(startDate, endDate);
        expect(list).toEqual([]); 
     });
     
     it('should handle items with null quantity in recipe', async () => {
        const mockRecipeNullQty: Recipe = { 
            id: 'r2', name: 'Salad', description: '', instructions: '', prep_time: null, cook_time: null, servings: null, is_favorite: false, user_id: mockUser.id, created_at: mockDate,
            recipe_ingredients: [{ id: 'i3', recipe_id: 'r2', name: 'Lettuce', quantity: null, unit: null }] 
        };
        const mockPlannedNull: PlannedMeal[] = [{ 
            id: 'pm2', plan_date: '2023-01-04', meal_type: 'Cena', recipe_id: 'r2', 
            user_id: mockUser.id, custom_meal_name: null, created_at: mockDate 
        }];
        mockedPlanningService.getPlannedMeals.mockResolvedValue(mockPlannedNull);
        mockedRecipeService.getRecipeById.mockResolvedValue(mockRecipeNullQty);
        mockedPantryService.getPantryItems.mockResolvedValue([]); 

        const list = await generateShoppingList(startDate, endDate);
        expect(list).toEqual(expect.arrayContaining([
           expect.objectContaining({ name: 'Lettuce', quantity: null, unit: null }) 
        ]));
     });
     
     it('should add custom meal names directly', async () => {
        const mockPlannedCustom: PlannedMeal[] = [{ 
            id: 'pm3', plan_date: '2023-01-05', meal_type: 'Desayuno', custom_meal_name: 'Yogurt con Fruta', 
            recipe_id: null, user_id: mockUser.id, created_at: mockDate 
        }];
        mockedPlanningService.getPlannedMeals.mockResolvedValue(mockPlannedCustom);
        mockedRecipeService.getRecipeById.mockResolvedValue(null); 
        mockedPantryService.getPantryItems.mockResolvedValue([]);

        const list = await generateShoppingList(startDate, endDate);
        expect(list).toEqual(expect.arrayContaining([
           expect.objectContaining({ name: 'Yogurt con Fruta', quantity: null, unit: null })
        ]));
        expect(mockedRecipeService.getRecipeById).not.toHaveBeenCalled();
     });

     it('should throw error if user is not authenticated', async () => {
       mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null }); 
       await expect(generateShoppingList(startDate, endDate)).rejects.toThrow('Usuario no autenticado'); 
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