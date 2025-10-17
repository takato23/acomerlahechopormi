import { supabase } from '@/lib/supabaseClient';
import { differenceInCalendarDays } from 'date-fns';
import type {
  MealDifficulty,
  PlanningTemplate,
  PlannedMeal,
  TemplateCategory,
  SaveTemplateData,
  TemplateData,
  TemplateMeal
} from '../types';
import { handleError } from '@/lib/errorHandler';

/**
 * Servicio para gestionar plantillas de planificación
 */
export class TemplateService {

  /**
   * Obtiene todas las plantillas del usuario
   */
  static async getUserTemplates(): Promise<PlanningTemplate[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const { data, error } = await supabase
      .from('planning_templates')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      handleError(error, {
        component: 'TemplateService',
        action: 'getUserTemplates',
        severity: 'medium',
        userId: user.id,
      });
      throw error;
    }
    return data || [];
  }

  /**
   * Obtiene plantillas públicas populares
   */
  static async getPublicTemplates(limit: number = 10): Promise<PlanningTemplate[]> {
    const { data, error } = await supabase
      .from('planning_templates')
      .select('*')
      .eq('is_public', true)
      .order('usage_count', { ascending: false })
      .limit(limit);

    if (error) {
      handleError(error, {
        component: 'TemplateService',
        action: 'getPublicTemplates',
        severity: 'low',
      });
      throw error;
    }
    return data || [];
  }

  /**
   * Obtiene una plantilla por ID
   */
  static async getTemplateById(id: string): Promise<PlanningTemplate | null> {
    const { data, error } = await supabase
      .from('planning_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No encontrado
      handleError(error, {
        component: 'TemplateService',
        action: 'getTemplateById',
        severity: 'medium',
        metadata: { id },
      });
      throw error;
    }
    return data;
  }

  /**
   * Crea una nueva plantilla
   */
  static async createTemplate(templateData: SaveTemplateData): Promise<PlanningTemplate> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    // Convertir las comidas planificadas al formato de template
    const templateMeals = this.convertPlannedMealsToTemplate(templateData.meals);
    const metadata = this.buildTemplateMetadata(templateData.meals, templateMeals);

    const template: Omit<PlanningTemplate, 'id' | 'usage_count' | 'created_at' | 'updated_at'> = {
      user_id: user.id,
      name: templateData.name,
      description: templateData.description,
      category: templateData.category,
      is_public: templateData.is_public,
      template_data: {
        version: '1.0',
        meals: templateMeals,
        metadata
      }
    };

    const { data, error } = await supabase
      .from('planning_templates')
      .insert(template)
      .select()
      .single();

    if (error) {
      handleError(error, {
        component: 'TemplateService',
        action: 'createTemplate',
        severity: 'medium',
        userId: user.id,
        metadata: { templateName: templateData.name },
      });
      throw error;
    }
    return data;
  }

  /**
   * Actualiza una plantilla existente
   */
  static async updateTemplate(
    id: string,
    updates: Partial<Pick<PlanningTemplate, 'name' | 'description' | 'category' | 'is_public'>>
  ): Promise<PlanningTemplate> {
    const { data, error } = await supabase
      .from('planning_templates')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      handleError(error, {
        component: 'TemplateService',
        action: 'updateTemplate',
        severity: 'medium',
        metadata: { id },
      });
      throw error;
    }
    return data;
  }

  /**
   * Elimina una plantilla
   */
  static async deleteTemplate(id: string): Promise<void> {
    const { error } = await supabase
      .from('planning_templates')
      .delete()
      .eq('id', id);

    if (error) {
      handleError(error, {
        component: 'TemplateService',
        action: 'deleteTemplate',
        severity: 'medium',
        metadata: { id },
      });
      throw error;
    }
  }

  /**
   * Incrementa el contador de uso de una plantilla
   */
  static async incrementUsageCount(id: string): Promise<void> {
    const { error } = await supabase.rpc('increment_template_usage', { template_id: id });
    if (error) {
      handleError(error, {
        component: 'TemplateService',
        action: 'incrementUsageCount',
        severity: 'low',
        metadata: { id },
      });
      throw error;
    }
  }

  /**
   * Busca plantillas por categoría
   */
  static async searchTemplatesByCategory(category: TemplateCategory): Promise<PlanningTemplate[]> {
    const { data, error } = await supabase
      .from('planning_templates')
      .select('*')
      .eq('category', category)
      .eq('is_public', true)
      .order('usage_count', { ascending: false });

    if (error) {
      handleError(error, {
        component: 'TemplateService',
        action: 'searchTemplatesByCategory',
        severity: 'low',
        metadata: { category },
      });
      throw error;
    }
    return data || [];
  }

  // ========== MÉTODOS PRIVADOS ==========

  private static convertPlannedMealsToTemplate(meals: PlannedMeal[]): TemplateMeal[] {
    if (!meals.length) {
      return [];
    }

    const sortedMeals = [...meals].sort((a, b) => {
      const dateDiff = new Date(`${a.plan_date}T00:00:00`).getTime() - new Date(`${b.plan_date}T00:00:00`).getTime();
      if (dateDiff !== 0) return dateDiff;
      return a.meal_type.localeCompare(b.meal_type);
    });

    const originDate = new Date(`${sortedMeals[0].plan_date}T00:00:00`);

    return sortedMeals.map((meal) => {
      const currentDate = new Date(`${meal.plan_date}T00:00:00`);
      const dayIndex = Math.max(0, differenceInCalendarDays(currentDate, originDate));

      return {
        day_index: dayIndex,
        meal_type: meal.meal_type,
        recipe_id: meal.recipe_id ?? undefined,
        custom_title: meal.recipe_id ? undefined : meal.custom_title ?? undefined,
        notes: meal.notes ?? undefined,
        difficulty: meal.difficulty ?? undefined,
        prep_time_minutes: meal.prep_time_minutes ?? undefined,
      } satisfies TemplateMeal;
    });
  }

  private static buildTemplateMetadata(sourceMeals: PlannedMeal[], templateMeals: TemplateMeal[]): TemplateData['metadata'] {
    const maxDayIndex = templateMeals.reduce((acc, meal) => Math.max(acc, meal.day_index), 0);
    const totalDays = templateMeals.length ? maxDayIndex + 1 : 0;

    const estimatedCost = this.estimateCost(sourceMeals);
    const difficultyLevel = this.calculateDifficultyLevel(sourceMeals);
    const dietaryTags = this.extractDietaryTags(sourceMeals);

    return {
      total_days: totalDays,
      estimated_cost: estimatedCost,
      difficulty_level: difficultyLevel,
      dietary_tags: dietaryTags.length ? dietaryTags : undefined,
    };
  }

  private static estimateCost(meals: PlannedMeal[]): number | undefined {
    const costs = meals
      .map((meal) => {
        if (typeof meal.cost_estimate === 'number' && !Number.isNaN(meal.cost_estimate)) {
          return meal.cost_estimate;
        }
        return this.estimateCostFromIngredients(meal);
      })
      .filter((value): value is number => typeof value === 'number' && !Number.isNaN(value) && value > 0);

    if (!costs.length) {
      return undefined;
    }

    const total = costs.reduce((sum, value) => sum + value, 0);
    return Number(total.toFixed(2));
  }

  private static estimateCostFromIngredients(meal: PlannedMeal): number | null {
    const ingredients = meal.recipes?.recipe_ingredients;
    if (!ingredients?.length) {
      return null;
    }

    const ingredientCount = ingredients.length;
    const baseCostPerIngredient = 1.5; // aproximación en USD
    const estimated = ingredientCount * baseCostPerIngredient;
    return Number(estimated.toFixed(2));
  }

  private static calculateDifficultyLevel(meals: PlannedMeal[]): MealDifficulty {
    const normalized = meals
      .map((meal) => meal.difficulty)
      .filter((value): value is MealDifficulty => Boolean(value));

    if (normalized.includes('complex')) return 'complex';
    if (normalized.includes('medium')) return 'medium';
    if (normalized.includes('simple')) return 'simple';

    return meals.length <= 3 ? 'simple' : 'medium';
  }

  private static extractDietaryTags(meals: PlannedMeal[]): string[] {
    const tags = new Set<string>();

    meals.forEach((meal) => {
      meal.recipes?.tags?.forEach((tag) => {
        if (tag) tags.add(tag.toLowerCase());
      });
      // meal.recipes?.cuisine_type?.forEach((cuisine) => {
      //   if (cuisine) tags.add(cuisine.toLowerCase());
      // });
      meal.recipes?.main_ingredients?.forEach((ingredient) => {
        if (ingredient) tags.add(ingredient.toLowerCase());
      });

      if (meal.custom_title) {
        const lower = meal.custom_title.toLowerCase();
        if (lower.includes('vegano')) tags.add('vegan');
        if (lower.includes('vegetar')) tags.add('vegetarian');
        if (lower.includes('sin gluten')) tags.add('gluten-free');
      }
    });

    return Array.from(tags);
  }
}
