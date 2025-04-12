import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import {
  RecipeHistoryEntry,
  RecipeHistoryEntryWithDetails,
  RecipeDetails,
  MetricType,
  WeeklyVarietyMetrics,
  calculateVarietyScore,
  CookingMethod,
  CuisineType,
  RecipeCountResult,
  isValidCookingMethod,
  isValidCuisineType
} from '@/types/recipeRecommendationTypes';
import { MealType } from '@/types/userPreferences';

// Tipos para respuestas de Supabase
// Exportar si es necesario para otros módulos
export interface RecipeHistoryRow {
  id: string;
  recipe_id: string;
  user_id: string;
  planned_date: string;
  meal_type: MealType;
  was_cooked: boolean;
  rating: number | null;
  notes: string | null;
  created_at: string;
  // Supabase devuelve un array para relaciones, incluso si es una relación 1:1
  recipes: RecipeDetails | RecipeDetails[] | null;
}

// La interfaz RecipeHistoryEntryWithDetails se importa desde @/types/recipeRecommendationTypes
// No es necesario redefinirla aquí.

// Use the shared Supabase client instance
const supabaseClient: SupabaseClient = supabase;

/**
 * Servicio para gestionar el historial de recetas
 */
class RecipeHistoryService {
  private static instance: RecipeHistoryService;
  private historyCache: Map<string, RecipeHistoryEntryWithDetails[]> = new Map();

  private constructor() {}

  public static getInstance(): RecipeHistoryService {
    if (!RecipeHistoryService.instance) {
      RecipeHistoryService.instance = new RecipeHistoryService();
    }
    return RecipeHistoryService.instance;
  }

  /**
   * Mapear respuesta de Supabase a tipo RecipeHistoryEntryWithDetails
   */
  private mapDbRowToHistoryEntry(
    row: RecipeHistoryRow,
    userId: string
  ): RecipeHistoryEntryWithDetails {
    // Manejar el caso donde 'recipes' puede ser un array o un objeto
    const recipeData = Array.isArray(row.recipes) ? row.recipes[0] : row.recipes;

    // Validar y filtrar tipos de cocina y métodos de cocción
    const recipeDetails = recipeData ? {
      ...recipeData,
      cuisine_type: recipeData.cuisine_type?.filter(isValidCuisineType),
      cooking_methods: recipeData.cooking_methods?.filter(isValidCookingMethod)
    } : undefined;

    return {
      id: row.id,
      userId,
      recipeId: row.recipe_id,
      plannedDate: new Date(row.planned_date),
      mealType: row.meal_type,
      wasCooked: row.was_cooked,
      rating: row.rating ?? undefined, // Convertir null a undefined
      notes: row.notes ?? undefined, // Convertir null a undefined
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.created_at), // Asumir que updated_at es igual a created_at inicialmente
      recipeDetails
    };
  }

  /**
   * Obtener historial de recetas del usuario
   */
  async getUserHistory(userId: string, days = 30): Promise<RecipeHistoryEntryWithDetails[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabaseClient
      .from('recipe_history')
      .select(`
        id,
        recipe_id,
        user_id,
        planned_date,
        meal_type,
        was_cooked,
        rating,
        notes,
        created_at,
        recipes (
          title,
          cuisine_type,
          cooking_methods,
          main_ingredients
        )
      `)
      .eq('user_id', userId)
      .gte('planned_date', startDate.toISOString())
      .order('planned_date', { ascending: false });

    if (error || !data) {
      console.error('Error fetching recipe history:', error);
      return [];
    }

    // Transformar datos asegurando tipos correctos
    const history = (data as RecipeHistoryRow[]).map(row =>
      this.mapDbRowToHistoryEntry(row, userId)
    );

    // Actualizar cache
    this.historyCache.set(userId, history);
    return history;
  }

  /**
   * Registrar una nueva entrada en el historial
   */
  async addHistoryEntry(
    userId: string,
    entry: Omit<RecipeHistoryEntryWithDetails, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<RecipeHistoryEntryWithDetails> {
    // Verificar duplicados
    const { data: existing } = await supabaseClient
      .from('recipe_history')
      .select('id')
      .eq('user_id', userId)
      .eq('planned_date', entry.plannedDate.toISOString())
      .eq('meal_type', entry.mealType)
      .maybeSingle();

    if (existing) {
      throw new Error('Ya existe una receta planificada para esa fecha y comida');
    }

    // Insertar nueva entrada
    const { data, error } = await supabaseClient
      .from('recipe_history')
      .insert({
        user_id: userId,
        recipe_id: entry.recipeId,
        planned_date: entry.plannedDate.toISOString(),
        meal_type: entry.mealType,
        was_cooked: entry.wasCooked,
        rating: entry.rating,
        notes: entry.notes
      })
      .select('*, recipes (*)') // Seleccionar la relación para obtener detalles
      .single();

    if (error || !data) {
      console.error('Error adding history entry:', error);
      throw new Error('Failed to add history entry');
    }

    // Actualizar métricas de variedad
    await this.updateVarietyMetrics(userId, entry);

    // Limpiar cache
    this.historyCache.delete(userId);

    return this.mapDbRowToHistoryEntry(data as RecipeHistoryRow, userId);
  }

  /**
   * Actualizar estado de una receta
   */
  async updateHistoryEntry(
    userId: string,
    entryId: string,
    updates: {
      wasCooked?: boolean;
      rating?: number | null;
      notes?: string | null;
    }
  ): Promise<void> {
    const { error } = await supabaseClient
      .from('recipe_history')
      .update(updates)
      .eq('id', entryId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating history entry:', error);
      throw new Error('Failed to update history entry');
    }

    // Limpiar cache
    this.historyCache.delete(userId);
  }

  /**
   * Calcular métricas de variedad para un período
   */
  async calculateVarietyMetrics(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<WeeklyVarietyMetrics> {
    const history = await this.getUserHistory(
      userId,
      Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    );

    const filteredHistory = history.filter(
      entry => entry.plannedDate >= startDate && entry.plannedDate <= endDate
    );

    const proteinFreq: Record<string, number> = {};
    const cuisineFreq: Record<string, number> = {};
    const methodFreq: Record<string, number> = {};

    filteredHistory.forEach(entry => {
      if (entry.recipeDetails) {
        entry.recipeDetails.main_ingredients?.forEach(ingredient => {
          proteinFreq[ingredient] = (proteinFreq[ingredient] || 0) + 1;
        });

        entry.recipeDetails.cuisine_type?.forEach(cuisine => {
          cuisineFreq[cuisine] = (cuisineFreq[cuisine] || 0) + 1;
        });

        entry.recipeDetails.cooking_methods?.forEach(method => {
          methodFreq[method] = (methodFreq[method] || 0) + 1;
        });
      }
    });

    return {
      proteinRotation: calculateVarietyScore(proteinFreq, filteredHistory.length),
      cuisineVariety: calculateVarietyScore(cuisineFreq, filteredHistory.length),
      methodVariety: calculateVarietyScore(methodFreq, filteredHistory.length),
      overallScore: (
        calculateVarietyScore(proteinFreq, filteredHistory.length) * 0.4 +
        calculateVarietyScore(cuisineFreq, filteredHistory.length) * 0.4 +
        calculateVarietyScore(methodFreq, filteredHistory.length) * 0.2
      )
    };
  }

  /**
   * Actualizar métricas de variedad
   */
  private async updateVarietyMetrics(
    userId: string,
    entry: Omit<RecipeHistoryEntryWithDetails, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<void> {
    if (!entry.recipeDetails) return;

    const updateMetric = async (
      metricType: MetricType,
      items: string[]
    ) => {
      const timestamp = new Date().toISOString();
      // Usar la función RPC definida en la migración 035
      const { error } = await supabaseClient.rpc('update_variety_metric', {
        p_user_id: userId,
        p_metric_type: metricType,
        p_item: items[0] // Asumimos que actualizamos un item a la vez por simplicidad
      });
      if (error) {
        console.error(`Error updating metric ${metricType}:`, error);
      }
    };

    const { main_ingredients, cuisine_type, cooking_methods } = entry.recipeDetails;

    if (main_ingredients?.length) {
      await updateMetric('protein_rotation', main_ingredients);
    }
    if (cuisine_type?.length) {
      await updateMetric('cuisine_variety', cuisine_type);
    }
    if (cooking_methods?.length) {
      await updateMetric('cooking_method', cooking_methods);
    }
  }

  /**
   * Obtener recetas más comunes por tipo de comida
   */
  async getMostCommonRecipes(
    userId: string,
    mealType?: MealType,
    limit = 5
  ): Promise<Array<{ recipeId: string; count: number }>> {
    // Usar RPC para agrupar, ya que .group() no está disponible en JS client
    const rpcParams: { p_user_id: string; p_meal_type?: MealType; p_limit: number } = {
      p_user_id: userId,
      p_limit: limit
    };
    if (mealType) {
      rpcParams.p_meal_type = mealType;
    }

    const { data, error } = await supabaseClient.rpc(
      'get_most_common_recipes',
      rpcParams
    );

    if (error || !data) {
      console.error('Error fetching common recipes via RPC:', error);
      return [];
    }

    return (data as RecipeCountResult[]).map(row => ({
      recipeId: row.recipe_id,
      count: typeof row.count === 'string' ? parseInt(row.count, 10) : row.count
    }));
  }

  /**
   * Limpiar cache
   */
  public clearCache(userId?: string): void {
    if (userId) {
      this.historyCache.delete(userId);
    } else {
      this.historyCache.clear();
    }
  }
}

// Exportar instancia única
export const recipeHistoryService = RecipeHistoryService.getInstance();