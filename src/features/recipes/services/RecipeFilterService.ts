import { Recipe } from '@/types/recipeTypes'; // Usar el tipo Recipe actualizado
import {
  RecipeSearchCriteria,
  RecipeHistoryEntryWithDetails,
  VarietyMetric,
  MetricType,
  VARIETY_THRESHOLDS,
  CookingMethod, // Importar tipos específicos
  CuisineType,
  SeasonFlag
} from '@/types/recipeRecommendationTypes';
import { UserPreferences, ComplexityLevel } from '@/types/userPreferences'; // Importar tipos específicos
import { recipeHistoryService } from './RecipeHistoryService';
import { varietyMetricsService } from './VarietyMetricsService';
import { preferencesService } from '@/features/user/services/PreferencesService';

/**
 * Servicio para filtrar recetas basado en contexto y preferencias
 */
class RecipeFilterService {
  private static instance: RecipeFilterService;

  private constructor() {}

  public static getInstance(): RecipeFilterService {
    if (!RecipeFilterService.instance) {
      RecipeFilterService.instance = new RecipeFilterService();
    }
    return RecipeFilterService.instance;
  }

  /**
   * Filtrar una lista de recetas candidatas
   */
  async filterRecipes(
    userId: string,
    candidateRecipes: Recipe[],
    criteria: RecipeSearchCriteria
  ): Promise<Recipe[]> {
    // Obtener contexto necesario
    const [preferences, history, metrics] = await Promise.all([
      preferencesService.getUserPreferences(userId),
      recipeHistoryService.getUserHistory(userId, 30),
      varietyMetricsService.getUserMetrics(userId)
    ]);

    // Aplicar filtros secuencialmente
    let filteredRecipes = candidateRecipes;

    filteredRecipes = this.filterByPreferences(filteredRecipes, preferences, criteria);
    filteredRecipes = this.filterByHistory(filteredRecipes, history, metrics, criteria);
    filteredRecipes = this.filterByCriteria(filteredRecipes, criteria);

    return filteredRecipes;
  }

  /**
   * Filtrar por preferencias del usuario
   */
  private filterByPreferences(
    recipes: Recipe[],
    preferences: UserPreferences,
    criteria: RecipeSearchCriteria
  ): Recipe[] {
    return recipes.filter(recipe => {
      // Excluir por ingredientes no deseados
      if (preferences.dislikedIngredients.length > 0) {
        const recipeIngredients = recipe.ingredients.map(i => i.ingredient_name?.toLowerCase());
        if (recipeIngredients.some(ri => preferences.dislikedIngredients.includes(ri ?? ''))) {
          return false;
        }
      }

      // Excluir por restricciones dietéticas
      if (preferences.dietaryRestrictions.length > 0) {
        if (!recipe.tags?.some(tag => preferences.dietaryRestrictions.includes(tag))) {
          // Lógica simple: si no tiene ninguna tag de restricción requerida, se excluye
        }
      }

      // Filtrar por complejidad preferida
      if (preferences.complexityPreference && recipe.difficulty_level) { // Usar snake_case
        if (recipe.difficulty_level !== preferences.complexityPreference) {
          return false;
        }
      }
      
      // Filtrar por tipo de cocina preferida
      if (criteria.cuisineTypes && criteria.cuisineTypes.length > 0) {
        if (!recipe.cuisine_type?.some((ct: CuisineType) => criteria.cuisineTypes!.includes(ct))) { // Usar snake_case y tipo explícito
            return false;
        }
      } else if (preferences.cuisinePreferences.length > 0) {
        if (!recipe.cuisine_type?.some((ct: CuisineType) => preferences.cuisinePreferences.includes(ct))) { // Usar snake_case y tipo explícito
            // Opción: excluir si no es ninguna de las preferidas
            // return false; 
        }
      }

      return true;
    });
  }

  /**
   * Filtrar por historial y métricas de variedad
   */
  private filterByHistory(
    recipes: Recipe[],
    history: RecipeHistoryEntryWithDetails[],
    metrics: Partial<Record<MetricType, VarietyMetric>>,
    criteria: RecipeSearchCriteria
  ): Recipe[] {
    const recentRecipeIds = new Set(
      history
        .filter(entry => {
          const daysAgo = (new Date().getTime() - entry.plannedDate.getTime()) / (1000 * 60 * 60 * 24);
          return daysAgo <= VARIETY_THRESHOLDS.MIN_DAYS_BETWEEN_REPEAT;
        })
        .map(entry => entry.recipeId)
    );

    const proteinMetrics = metrics['protein_rotation'];
    const cuisineMetrics = metrics['cuisine_variety'];

    return recipes.filter(recipe => {
      // Evitar repetición reciente de la misma receta
      if (recentRecipeIds.has(recipe.id)) {
        return false;
      }

      // Lógica de rotación de proteínas
      if (proteinMetrics && recipe.main_ingredients && recipe.main_ingredients.length > 0) {
        const mainProtein = recipe.main_ingredients[0]; // Asume primer ingrediente principal
        const lastUsedProtein = proteinMetrics.lastUsed[mainProtein];
        if (lastUsedProtein) {
          const daysSinceLast = (new Date().getTime() - new Date(lastUsedProtein).getTime()) / (1000 * 60 * 60 * 24);
          if (daysSinceLast < VARIETY_THRESHOLDS.MIN_DAYS_BETWEEN_REPEAT) {
            // return false; // Podría ser un filtro estricto
          }
        }
      }
      
      // Lógica de variedad de cocina
      if (cuisineMetrics && recipe.cuisine_type && recipe.cuisine_type.length > 0) { // Usar snake_case
         const mainCuisine = recipe.cuisine_type[0];
         const cuisineCount = cuisineMetrics.frequencyCount[mainCuisine] || 0;
         // if (cuisineCount >= VARIETY_THRESHOLDS.MAX_SAME_CUISINE_PER_WEEK) return false;
      }

      return true;
    });
  }

  /**
   * Filtrar por criterios específicos de la búsqueda
   */
  private filterByCriteria(
    recipes: Recipe[],
    criteria: RecipeSearchCriteria
  ): Recipe[] {
    return recipes.filter(recipe => {
      if (criteria.difficulty && recipe.difficulty_level !== criteria.difficulty) { // Usar snake_case
        return false;
      }
      if (criteria.maxTime && (recipe.estimated_time ?? Infinity) > criteria.maxTime) { // Usar snake_case
        return false;
      }
      if (criteria.cookingMethods && !recipe.cooking_methods?.some((cm: CookingMethod) => criteria.cookingMethods!.includes(cm))) { // Usar snake_case y tipo explícito
        return false;
      }
      if (criteria.seasonalFlag && !recipe.seasonal_flags?.includes(criteria.seasonalFlag)) { // Usar snake_case
        return false;
      }
      if (criteria.excludeIngredients && recipe.ingredients.some(i => criteria.excludeIngredients!.includes(i.ingredient_name ?? ''))) {
        return false;
      }
      if (criteria.preferredEquipment && !recipe.equipment_needed?.some((eq: string) => criteria.preferredEquipment!.includes(eq))) { // Usar snake_case y tipo explícito
        // return false; // Podría ser un filtro estricto
      }
      if (criteria.mealType) {
         // Lógica futura para filtrar por adecuación al tipo de comida
      }

      return true;
    });
  }
}

// Exportar instancia única
export const recipeFilterService = RecipeFilterService.getInstance();