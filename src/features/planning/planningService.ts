// src/features/planning/planningService.ts
import { supabase } from '@/lib/supabaseClient';
import type { PlannedMeal, UpsertPlannedMealData } from './types';
import { handleError } from '@/lib/errorHandler';
import { debugLogger } from '@/lib/utils';

const log = debugLogger('[planningService]');

/**
 * Obtiene las comidas planificadas para un rango de fechas.
 * Incluye el título de la receta si está asociada.
 */
export async function getPlannedMeals(startDate: string, endDate: string): Promise<PlannedMeal[]> {
  try {
    log('Fetching planned meals', { startDate, endDate });
    const { data, error } = await supabase
      .from('meal_plan_entries')
      .select(`
        *,
        recipes (
          id,
          title,
          description,
          image_url,
          prep_time_minutes,
          cook_time_minutes,
          servings,
          instructions,
          category_id,
          tags,
          main_ingredients,
          estimated_time,
          recipe_ingredients (
            id,
            ingredient_id,
            ingredient_name,
            quantity,
            unit,
            notes
          )
        )
      `)
      .gte('plan_date', startDate)
      .lte('plan_date', endDate)
      .order('plan_date', { ascending: true })
      .order('meal_type', { ascending: true });

    if (error) {
      throw error;
    }
    return data || [];
  } catch (error) {
    handleError(error, {
      component: 'planningService',
      action: 'getPlannedMeals',
      severity: 'medium',
      metadata: { startDate, endDate },
    });
    throw error;
  }
}

/**
 * Añade o actualiza una comida planificada.
 * Si se proporciona un ID existente, actualiza; de lo contrario, inserta.
 * Asegura que solo se guarde recipe_id O custom_title, no ambos.
 */
export async function upsertPlannedMeal(
  mealData: UpsertPlannedMealData,
  existingMealId?: string
): Promise<PlannedMeal | null> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Usuario no autenticado');
    }

    // Asegurar que solo uno de recipe_id o custom_title tenga valor
    const dataToSave: Partial<PlannedMeal> = {
      ...mealData,
      user_id: user.id, // Asegurar user_id
      recipe_id: mealData.recipe_id || null,
      custom_title: mealData.recipe_id ? null : (mealData.custom_title || null),
    };

    let query;
    if (existingMealId) {
      // Actualizar (UPDATE)
      query = supabase
        .from('meal_plan_entries')
        .update(dataToSave)
        .eq('id', existingMealId)
        .eq('user_id', user.id); // Doble check por RLS
    } else {
      // Insertar (INSERT)
      query = supabase
        .from('meal_plan_entries')
        .insert(dataToSave);
    }

    const { data, error } = await query.select(`
      *,
      recipes (
        id,
        title,
        description,
        image_url,
        recipe_ingredients (
          id,
          ingredient_id,
          ingredient_name,
          quantity,
          unit,
          notes
        )
      )
    `).single();

    if (error) {
      throw error;
    }
    return data;

  } catch (error) {
    handleError(error, {
      component: 'planningService',
      action: existingMealId ? 'updatePlannedMeal' : 'createPlannedMeal',
      severity: 'medium',
      metadata: { mealId: existingMealId },
    });
    throw error;
  }
}


/**
 * Elimina una comida planificada.
 */
export async function deletePlannedMeal(mealId: string): Promise<boolean> {
  try {
    // RLS debería prevenir eliminar items de otros usuarios
    const { error } = await supabase
      .from('meal_plan_entries')
      .delete()
      .eq('id', mealId);

    if (error) {
      throw error;
    }
    return true;
  } catch (error) {
    handleError(error, {
      component: 'planningService',
      action: 'deletePlannedMeal',
      severity: 'medium',
      metadata: { mealId },
    });
    throw error;
  }
}

/**
 * Elimina todas las comidas planificadas dentro de un rango de fechas para el usuario actual.
 */
export async function deletePlannedMealsInRange(startDate: string, endDate: string): Promise<void> {
  try {
    // RLS se encarga de filtrar por user_id
    const { error } = await supabase
      .from('meal_plan_entries')
      .delete()
      .gte('plan_date', startDate)
      .lte('plan_date', endDate);

    if (error) {
      throw error;
    }
  } catch (error) {
    handleError(error, {
      component: 'planningService',
      action: 'deletePlannedMealsInRange',
      severity: 'medium',
      metadata: { startDate, endDate },
    });
    throw error;
  }
}
