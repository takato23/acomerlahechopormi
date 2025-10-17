import { PlanningEngine } from '../planningEngine';
import type { PlannedMeal, PlanningPreferences } from '../types';

describe('PlanningEngine', () => {
  let engine: PlanningEngine;

  beforeEach(() => {
    engine = new PlanningEngine();
  });

  describe('calculateNutritionalInfo', () => {
    it('should calculate nutritional info for a meal with ingredients', () => {
      const mockMeal: PlannedMeal = {
        id: '1',
        user_id: 'user1',
        plan_date: '2024-01-01',
        meal_type: 'Almuerzo',
        recipe_id: 'recipe1',
        custom_title: null,
        created_at: '2024-01-01T00:00:00Z',
        recipes: {
          id: 'recipe1',
          title: 'Pollo con arroz',
          description: 'Deliciosa comida',
          image_url: null,
          recipe_ingredients: [
            {
              id: 'ing1',
              ingredient_name: 'Pollo',
              quantity: 200,
              unit: 'g'
            },
            {
              id: 'ing2',
              ingredient_name: 'Arroz',
              quantity: 100,
              unit: 'g'
            }
          ]
        }
      };

      const result = engine.calculateNutritionalInfo(mockMeal);

      expect(result).toBeDefined();
      expect(result?.calories).toBeGreaterThan(0);
      expect(result?.protein).toBeGreaterThan(0);
    });

    it('should return undefined for meal without recipe ingredients', () => {
      const mockMeal: PlannedMeal = {
        id: '1',
        user_id: 'user1',
        plan_date: '2024-01-01',
        meal_type: 'Almuerzo',
        recipe_id: null,
        custom_title: 'Comida personalizada',
        created_at: '2024-01-01T00:00:00Z'
      };

      const result = engine.calculateNutritionalInfo(mockMeal);
      expect(result).toBeUndefined();
    });
  });

  describe('checkIngredientAvailability', () => {
    beforeEach(() => {
      // Configurar pantry con algunos ingredientes
      engine.updatePantryState([
        {
          id: 'pantry1',
          ingredient_id: null,
          ingredient_name: 'Pollo',
          quantity: 500,
          unit: 'g',
          user_id: 'user1'
        },
        {
          id: 'pantry2',
          ingredient_id: null,
          ingredient_name: 'Arroz',
          quantity: 200,
          unit: 'g',
          user_id: 'user1'
        }
      ]);
    });

    it('should check ingredient availability correctly', () => {
      const mockMeal: PlannedMeal = {
        id: '1',
        user_id: 'user1',
        plan_date: '2024-01-01',
        meal_type: 'Almuerzo',
        recipe_id: 'recipe1',
        custom_title: null,
        created_at: '2024-01-01T00:00:00Z',
        recipes: {
          id: 'recipe1',
          title: 'Pollo con arroz',
          description: 'Deliciosa comida',
          image_url: null,
          recipe_ingredients: [
            {
              id: 'ing1',
              ingredient_name: 'Pollo',
              quantity: 200,
              unit: 'g'
            },
            {
              id: 'ing2',
              ingredient_name: 'Arroz',
              quantity: 100,
              unit: 'g'
            }
          ]
        }
      };

      const result = engine.checkIngredientAvailability(mockMeal);

      expect(result).toHaveLength(2);
      expect(result[0].available).toBe(true); // 500g disponible > 200g needed
      expect(result[1].available).toBe(true); // 200g disponible > 100g needed
    });

    it('should mark ingredients as unavailable when insufficient quantity', () => {
      const mockMeal: PlannedMeal = {
        id: '1',
        user_id: 'user1',
        plan_date: '2024-01-01',
        meal_type: 'Almuerzo',
        recipe_id: 'recipe1',
        custom_title: null,
        created_at: '2024-01-01T00:00:00Z',
        recipes: {
          id: 'recipe1',
          title: 'Pollo con arroz',
          description: 'Deliciosa comida',
          image_url: null,
          recipe_ingredients: [
            {
              id: 'ing1',
              ingredient_name: 'Pollo',
              quantity: 600, // Más de lo disponible (500g)
              unit: 'g'
            }
          ]
        }
      };

      const result = engine.checkIngredientAvailability(mockMeal);

      expect(result).toHaveLength(1);
      expect(result[0].available).toBe(false);
      expect(result[0].quantity_needed).toBe(600);
      expect(result[0].quantity_available).toBe(500);
    });
  });

  describe('generateWeeklyStats', () => {
    it('should calculate weekly statistics correctly', () => {
      const mockMeals: PlannedMeal[] = [
        {
          id: '1',
          user_id: 'user1',
          plan_date: '2024-01-01',
          meal_type: 'Almuerzo',
          status: 'executed',
          recipe_id: null,
          custom_title: 'Comida 1',
          created_at: '2024-01-01T00:00:00Z',
          nutritional_info: {
            calories: 500,
            protein: 30,
            carbs: 40,
            fat: 20
          }
        },
        {
          id: '2',
          user_id: 'user1',
          plan_date: '2024-01-01',
          meal_type: 'Cena',
          status: 'confirmed',
          recipe_id: null,
          custom_title: 'Comida 2',
          created_at: '2024-01-01T00:00:00Z',
          nutritional_info: {
            calories: 600,
            protein: 35,
            carbs: 45,
            fat: 25
          }
        }
      ];

      const stats = engine.generateWeeklyStats(mockMeals);

      expect(stats.total_planned).toBe(2);
      expect(stats.total_executed).toBe(1);
      expect(stats.compliance_rate).toBe(50);
      expect(stats.total_calories).toBe(1100);
    });
  });

  describe('generateShoppingListFromMeals', () => {
    it('should generate shopping list from missing ingredients', () => {
      // Configurar pantry con ingredientes insuficientes
      engine.updatePantryState([
        {
          id: 'pantry1',
          ingredient_id: null,
          ingredient_name: 'Pollo',
          quantity: 100, // insuficiente
          unit: 'g',
          user_id: 'user1'
        }
      ]);

      const mockMeals: PlannedMeal[] = [
        {
          id: '1',
          user_id: 'user1',
          plan_date: '2024-01-01',
          meal_type: 'Almuerzo',
          recipe_id: 'recipe1',
          custom_title: null,
          created_at: '2024-01-01T00:00:00Z',
          recipes: {
            id: 'recipe1',
            title: 'Pollo con arroz',
            description: 'Deliciosa comida',
            image_url: null,
            recipe_ingredients: [
              {
                id: 'ing1',
                ingredient_name: 'Pollo',
                quantity: 200, // necesita 200g pero solo tiene 100g
                unit: 'g'
              },
              {
                id: 'ing2',
                ingredient_name: 'Arroz',
                quantity: 150, // no tiene arroz
                unit: 'g'
              }
            ]
          }
        }
      ];

      const shoppingList = engine.generateShoppingListFromMeals(mockMeals);

      expect(shoppingList).toHaveLength(2);

      // Pollo: necesita 100g más
      const polloItem = shoppingList.find(item => item.ingredient_name === 'Pollo');
      expect(polloItem?.quantity_needed).toBe(100);
      expect(polloItem?.unit).toBe('g');

      // Arroz: necesita 150g
      const arrozItem = shoppingList.find(item => item.ingredient_name === 'Arroz');
      expect(arrozItem?.quantity_needed).toBe(150);
      expect(arrozItem?.unit).toBe('g');
    });
  });

  describe('analyzeWeeklyNutrition', () => {
    it('should analyze nutritional balance', () => {
      const mockMeals: PlannedMeal[] = [
        {
          id: '1',
          user_id: 'user1',
          plan_date: '2024-01-01',
          meal_type: 'Almuerzo',
          recipe_id: null,
          custom_title: 'Almuerzo',
          created_at: '2024-01-01T00:00:00Z',
          nutritional_info: {
            calories: 600,
            protein: 40,
            carbs: 50,
            fat: 25
          }
        },
        {
          id: '2',
          user_id: 'user1',
          plan_date: '2024-01-01',
          meal_type: 'Cena',
          recipe_id: null,
          custom_title: 'Cena',
          created_at: '2024-01-01T00:00:00Z',
          nutritional_info: {
            calories: 700,
            protein: 45,
            carbs: 55,
            fat: 30
          }
        }
      ];

      const analysis = engine.analyzeWeeklyNutrition(mockMeals);

      expect(analysis.total_calories).toBe(1300);
      expect(analysis.avg_daily_calories).toBe(1300); // Solo un día
      expect(analysis.protein_avg).toBe(85);
      expect(analysis.carbs_avg).toBe(105);
      expect(analysis.fat_avg).toBe(55);
      expect(analysis.nutritional_score).toBe('good');
    });
  });
});
