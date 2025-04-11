import { SupabaseClient } from '@supabase/supabase-js'; // Keep SupabaseClient type if needed elsewhere
import { supabase } from '@/lib/supabaseClient'; // Import the shared instance
import {
  VarietyMetric,
  MetricType,
  WeeklyVarietyMetrics,
  calculateVarietyScore,
  CuisineType,
  CookingMethod
} from '@/types/recipeRecommendationTypes';
import { RecipeHistoryEntryWithDetails } from '@/types/recipeRecommendationTypes'; // Importar desde el archivo de tipos central

// Use the shared Supabase client instance
const supabaseClient: SupabaseClient = supabase;

/**
 * Servicio para gestionar y calcular métricas de variedad
 */
class VarietyMetricsService {
  private static instance: VarietyMetricsService;
  private metricsCache: Map<string, Partial<Record<MetricType, VarietyMetric>>> = new Map();

  private constructor() {}

  public static getInstance(): VarietyMetricsService {
    if (!VarietyMetricsService.instance) {
      VarietyMetricsService.instance = new VarietyMetricsService();
    }
    return VarietyMetricsService.instance;
  }

  /**
   * Obtener métricas de variedad para un usuario
   */
  async getUserMetrics(userId: string): Promise<Partial<Record<MetricType, VarietyMetric>>> {
    const cached = this.metricsCache.get(userId);
    if (cached) return cached;

    const { data, error } = await supabaseClient
      .from('variety_metrics')
      .select('*')
      .eq('user_id', userId);

    if (error || !data) {
      console.error('Error fetching variety metrics:', error);
      return {};
    }

    const metrics: Partial<Record<MetricType, VarietyMetric>> = {};
    data.forEach(row => {
      metrics[row.metric_type as MetricType] = {
        id: row.id,
        userId: row.user_id,
        metricType: row.metric_type as MetricType,
        lastUsed: row.last_used || {},
        frequencyCount: row.frequency_count || {},
        updatedAt: new Date(row.updated_at)
      };
    });

    this.metricsCache.set(userId, metrics);
    return metrics;
  }

  /**
   * Actualizar una métrica específica para un usuario
   */
  async updateMetric(
    userId: string,
    metricType: MetricType,
    item: string
  ): Promise<void> {
    // Usar la función RPC creada en la migración 035
    const { error } = await supabaseClient.rpc('update_variety_metric', {
      p_user_id: userId,
      p_metric_type: metricType,
      p_item: item
    });

    if (error) {
      console.error(`Error updating metric ${metricType} for item ${item}:`, error);
      throw new Error(`Failed to update metric ${metricType}`);
    }

    // Invalidar cache
    this.clearCache(userId);
  }

  /**
   * Calcular métricas semanales basadas en el historial
   */
  async calculateWeeklyMetrics(
    userId: string,
    history: RecipeHistoryEntryWithDetails[]
  ): Promise<WeeklyVarietyMetrics> {
    const proteinFreq: Record<string, number> = {};
    const cuisineFreq: Record<string, number> = {};
    const methodFreq: Record<string, number> = {};

    history.forEach(entry => {
      if (entry.recipeDetails) {
        entry.recipeDetails.main_ingredients?.forEach((ingredient: string) => {
          proteinFreq[ingredient] = (proteinFreq[ingredient] || 0) + 1;
        });
        entry.recipeDetails.cuisine_type?.forEach((cuisine: CuisineType) => {
          cuisineFreq[cuisine] = (cuisineFreq[cuisine] || 0) + 1;
        });
        entry.recipeDetails.cooking_methods?.forEach((method: CookingMethod) => {
          methodFreq[method] = (methodFreq[method] || 0) + 1;
        });
      }
    });

    const totalItems = history.length;
    const proteinScore = calculateVarietyScore(proteinFreq, totalItems);
    const cuisineScore = calculateVarietyScore(cuisineFreq, totalItems);
    const methodScore = calculateVarietyScore(methodFreq, totalItems);

    return {
      proteinRotation: proteinScore,
      cuisineVariety: cuisineScore,
      methodVariety: methodScore,
      overallScore: (proteinScore * 0.4 + cuisineScore * 0.4 + methodScore * 0.2)
    };
  }

  /**
   * Limpiar cache de métricas
   */
  public clearCache(userId?: string): void {
    if (userId) {
      this.metricsCache.delete(userId);
    } else {
      this.metricsCache.clear();
    }
  }
}

// Exportar instancia única
export const varietyMetricsService = VarietyMetricsService.getInstance();