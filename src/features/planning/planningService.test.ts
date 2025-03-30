import {
  getPlannedMeals,
  upsertPlannedMeal,
  deletePlannedMeal,
} from './planningService';
// Importar SOLO el mock de supabase
import { supabase } from '@/lib/supabaseClient';
import type { UpsertPlannedMealData } from './types';

// Mockear el módulo
jest.mock('@/lib/supabaseClient');

// Acceder a los mocks directamente desde el objeto supabase importado
const mockGetUser = supabase.auth.getUser as jest.Mock;
const mockFrom = supabase.from as jest.Mock;
const mockSelect = mockFrom().select as jest.Mock;
const mockUpsert = mockFrom().upsert as jest.Mock;
const mockDelete = mockFrom().delete as jest.Mock;
const mockEq = mockSelect().eq as jest.Mock; 
const mockOrder = mockSelect().order as jest.Mock; 
const mockLte = mockSelect().lte as jest.Mock; 
const mockGte = mockLte().gte as jest.Mock; 
const mockSingle = mockUpsert().select().single as jest.Mock; // Asumiendo upsert -> select -> single
const mockThen = mockEq().then as jest.Mock; 

// Mock de usuario
const mockUser = { id: 'plan-user-111', email: 'plan@test.com' };
const mockDate = new Date().toISOString();

describe('planningService', () => {

  beforeEach(() => {
    jest.resetAllMocks(); // Resetear todos los mocks completamente
    // Configurar mock de usuario por defecto para CADA prueba
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    // Configurar implementaciones por defecto para mocks encadenables
    mockEq.mockImplementation(() => ({ 
        then: mockThen, 
        single: mockSingle, 
        eq: mockEq, 
        order: mockOrder,
        gte: mockGte 
    }));
     mockLte.mockImplementation(() => ({ 
        gte: mockGte 
    }));
     mockGte.mockImplementation(() => ({ 
        eq: mockEq 
    }));
     mockOrder.mockImplementation(() => ({ 
        then: mockThen, 
        eq: mockEq, 
        order: mockOrder 
    }));
     mockFrom.mockImplementation(() => ({
        select: mockSelect,
        insert: jest.fn(), // Añadir mocks faltantes si es necesario
        update: jest.fn(),
        delete: mockDelete,
        upsert: mockUpsert,
    }));
     mockSelect.mockImplementation(() => ({ 
        eq: mockEq, 
        order: mockOrder, 
        lte: mockLte,
        limit: jest.fn(() => ({ then: mockThen })) 
    }));
     mockUpsert.mockImplementation(() => ({ 
        select: jest.fn(() => ({ single: mockSingle })) 
    }));
     mockDelete.mockImplementation(() => ({ 
        eq: mockEq 
    }));
  });

  // --- getPlannedMeals ---
  describe('getPlannedMeals', () => {
    const startDate = '2023-02-01';
    const endDate = '2023-02-07';
    const mockMealsData = [{ id: 'pm1', plan_date: '2023-02-03', meal_type: 'Almuerzo', user_id: mockUser.id }];

    it('should fetch planned meals for the date range and user', async () => {
      // Configurar cadena: from -> select -> lte -> gte -> eq -> order -> then
      mockOrder.mockResolvedValueOnce({ data: mockMealsData, error: null }); 

      const meals = await getPlannedMeals(startDate, endDate);

      expect(meals).toEqual(mockMealsData);
      expect(mockFrom).toHaveBeenCalledWith('meal_plan_entries'); 
      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('recipes (*)')); 
      expect(mockLte).toHaveBeenCalledWith('plan_date', endDate);
      expect(mockGte).toHaveBeenCalledWith('plan_date', startDate);
      expect(mockEq).toHaveBeenCalledWith('user_id', mockUser.id);
      expect(mockOrder).toHaveBeenCalledWith('plan_date');
    });

    it('should throw error if user is not authenticated', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null }); 
      await expect(getPlannedMeals(startDate, endDate)).rejects.toThrow('Usuario no autenticado');
    });

    it('should throw error if fetch fails', async () => {
      mockOrder.mockResolvedValueOnce({ data: null, error: new Error('Fetch Fail') });
      await expect(getPlannedMeals(startDate, endDate)).rejects.toThrow('No se pudieron cargar las comidas planificadas.');
    });
  });

  // --- upsertPlannedMeal ---
  describe('upsertPlannedMeal', () => {
    const mealData: UpsertPlannedMealData = { 
        plan_date: '2023-02-05', 
        meal_type: 'Cena', 
        recipe_id: 'r-new', 
        custom_meal_name: null 
    };
    const upsertedMealDB = { id: 'pm-upsert', user_id: mockUser.id, ...mealData, created_at: mockDate };

    it('should upsert a meal and return it (create case)', async () => {
      // Configurar cadena: from -> upsert -> select -> single -> then
      mockSingle.mockResolvedValueOnce({ data: upsertedMealDB, error: null });

      const result = await upsertPlannedMeal(mealData); 

      expect(result).toEqual(upsertedMealDB);
      expect(mockFrom).toHaveBeenCalledWith('meal_plan_entries'); 
      expect(mockUpsert).toHaveBeenCalledWith(
          expect.objectContaining({ ...mealData, user_id: mockUser.id }),
          { onConflict: 'id' } 
      );
      expect(mockUpsert().select).toHaveBeenCalledTimes(1);
      expect(mockUpsert().select().single).toHaveBeenCalledTimes(1);
    });
    
    it('should upsert a meal and return it (update case)', async () => {
       const mealId = 'pm-existing';
       const updatedMealDB = { ...upsertedMealDB, id: mealId, name: 'Updated Name' }; 
       mockSingle.mockResolvedValueOnce({ data: updatedMealDB, error: null });

       const result = await upsertPlannedMeal(mealData, mealId); 

       expect(result).toEqual(updatedMealDB);
       expect(mockFrom).toHaveBeenCalledWith('meal_plan_entries'); 
       expect(mockUpsert).toHaveBeenCalledWith(
           expect.objectContaining({ id: mealId, ...mealData, user_id: mockUser.id }),
           { onConflict: 'id' }
       );
    });

    it('should throw error if user is not authenticated for upsert', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null }); 
      await expect(upsertPlannedMeal(mealData)).rejects.toThrow('Usuario no autenticado');
    });
    
    it('should throw error if upsert DB operation fails', async () => {
      mockSingle.mockResolvedValueOnce({ data: null, error: new Error('Upsert Fail') });
      await expect(upsertPlannedMeal(mealData)).rejects.toThrow('No se pudo guardar la comida planificada.');
    });
  });

  // --- deletePlannedMeal ---
  describe('deletePlannedMeal', () => {
     it('should delete a planned meal', async () => {
       // Configurar mockEq para que devuelva .then() exitoso (ya está por defecto)
       mockThen.mockResolvedValueOnce({ error: null }); // Configurar resultado final

       await expect(deletePlannedMeal('pm-delete')).resolves.toBe(true);
       expect(mockFrom).toHaveBeenCalledWith('meal_plan_entries'); 
       expect(mockDelete).toHaveBeenCalled();
       expect(mockEq).toHaveBeenCalledWith('id', 'pm-delete');
     });

     it('should throw error if user is not authenticated for delete', async () => {
        mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null }); 
        await expect(deletePlannedMeal('pm-delete-fail')).rejects.toThrow('Usuario no autenticado'); 
     });
     
     it('should return false if delete DB operation fails', async () => {
        // Configurar mock de delete para fallo ANTES
        mockEq.mockImplementationOnce(() => ({ // delete().eq()
           // Simular que la promesa resuelve con un objeto de error
           then: jest.fn((callback) => Promise.resolve({ error: new Error('Delete Fail') }))
        }));
       await expect(deletePlannedMeal('pm-delete-fail')).resolves.toBe(false);
       expect(console.error).toHaveBeenCalledWith('Error deleting planned meal:', expect.any(Error));
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