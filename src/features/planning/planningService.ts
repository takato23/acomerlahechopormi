// src/features/planning/planningService.ts
import { supabase } from '@/lib/supabaseClient';
import type { PlannedMeal, UpsertPlannedMealData } from './types';

/**
 * Obtiene las comidas planificadas para un rango de fechas.
 * Incluye el título de la receta si está asociada.
 */
export async function getPlannedMeals(startDate: string, endDate: string): Promise<PlannedMeal[]> {
  try {
    console.log(`[planningService] Fetching planned meals between ${startDate} and ${endDate}`); // Log antes de la llamada
    // RLS debería filtrar por user_id
    const { data, error } = await supabase
      .from('meal_plan_entries')
      .select(`
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
      `) // JOIN con recetas e ingredientes
      .gte('plan_date', startDate)
      .lte('plan_date', endDate)
      .order('plan_date', { ascending: true })
      .order('meal_type', { ascending: true }); // Ordenar por fecha y tipo

    if (error) {
      console.error('[planningService] Error fetching planned meals:', error); // Log de error específico
      throw error;
    }
    console.log(`[planningService] Fetched ${data?.length ?? 0} planned meals.`); // Log de éxito
    return data || [];
  } catch (error) {
    console.error('Error inesperado en getPlannedMeals:', error);
    throw error;
  }
}

/**
 * Añade o actualiza una comida planificada.
 * Si se proporciona un ID existente, actualiza; de lo contrario, inserta.
 * Asegura que solo se guarde recipe_id O custom_meal_name, no ambos.
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

    // Asegurar que solo uno de recipe_id o custom_meal_name tenga valor
    const dataToSave: Partial<PlannedMeal> = {
      ...mealData,
      user_id: user.id, // Asegurar user_id
      recipe_id: mealData.recipe_id || null,
      custom_meal_name: mealData.recipe_id ? null : (mealData.custom_meal_name || null),
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
      console.error('Error al guardar comida planificada:', error);
      throw error;
    }
    return data;

  } catch (error) {
    console.error('Error inesperado en upsertPlannedMeal:', error);
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
      console.error('Error al eliminar comida planificada:', error);
      throw error;
    }
    return true;
  } catch (error) {
    console.error('Error inesperado en deletePlannedMeal:', error);
    throw error;
  }
}

/**
 * Elimina todas las comidas planificadas dentro de un rango de fechas para el usuario actual.
 */
export async function deletePlannedMealsInRange(startDate: string, endDate: string): Promise<void> {
  try {
    console.log(`[planningService] Deleting planned meals between ${startDate} and ${endDate}`);
    // RLS se encarga de filtrar por user_id
    const { error } = await supabase
      .from('meal_plan_entries')
      .delete()
      .gte('plan_date', startDate)
      .lte('plan_date', endDate);

    if (error) {
      console.error('[planningService] Error deleting planned meals in range:', error);
      throw error;
    }
    console.log(`[planningService] Successfully deleted meals between ${startDate} and ${endDate}`);
  } catch (error) {
    console.error('Error inesperado en deletePlannedMealsInRange:', error);
    // Lanzar el error para que el store lo maneje
    throw error;
  }
}