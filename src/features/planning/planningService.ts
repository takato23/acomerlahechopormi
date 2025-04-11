// src/features/planning/planningService.ts
import { supabase } from '@/lib/supabaseClient';
import type { PlannedMeal, UpsertPlannedMealData } from './types';

/**
 * Obtiene las comidas planificadas para un rango de fechas.
 * Versión restaurada para obtener datos reales de la base de datos.
 */
export async function getPlannedMeals(startDate: string, endDate: string): Promise<PlannedMeal[]> {
  try {
    console.log(`[planningService] Fetching planned meals between ${startDate} and ${endDate}`);
    
    // Verificar primero si el usuario está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('[planningService] Authentication error:', authError);
      return [];
    }
    
    // Obtener las entradas de meal_plan_entries
    const { data: mealEntries, error: mealsError } = await supabase
      .from('meal_plan_entries')
      .select('id, user_id, recipe_id, plan_date, meal_type, custom_meal_name, created_at')
      .eq('user_id', user.id)
      .gte('plan_date', startDate)
      .lte('plan_date', endDate)
      .order('plan_date', { ascending: true })
      .order('meal_type', { ascending: true });

    if (mealsError) {
      console.error('[planningService] Error fetching meals:', mealsError);
      return [];
    }

    if (!mealEntries || mealEntries.length === 0) {
      console.log('[planningService] No meals found');
      return [];
    }

    console.log(`[planningService] Found ${mealEntries.length} meals`);

    // Obtener las recetas asociadas en una consulta separada
    const recipeIds = mealEntries
      .filter(meal => meal.recipe_id)
      .map(meal => meal.recipe_id);

    if (recipeIds.length > 0) {
      const { data: recipes, error: recipesError } = await supabase
        .from('recipes')
        .select(`
          id, 
          title, 
          description, 
          image_url
        `)
        .in('id', recipeIds);

      if (recipesError) {
        console.error('[planningService] Error fetching recipes:', recipesError);
        // Continuar con las comidas sin recetas
      } else if (recipes && recipes.length > 0) {
        // Combinar los datos
        return mealEntries.map(meal => {
          const recipe = recipes.find(r => r.id === meal.recipe_id);
          return {
            ...meal,
            recipes: recipe || null
          };
        });
      }
    }

    // Si no hay recetas o hay un error, devolver las comidas sin información de recetas
    return mealEntries.map(meal => ({ ...meal, recipes: null }));

  } catch (error) {
    console.error('Error inesperado en getPlannedMeals:', error);
    return []; // Devolver array vacío en caso de error
  }
}

/**
 * Añade o actualiza una comida planificada.
 * Versión simplificada para evitar problemas con relaciones.
 */
export async function upsertPlannedMeal(
  mealData: UpsertPlannedMealData,
  existingMealId?: string
): Promise<PlannedMeal | null> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('[planningService] Authentication error:', userError);
      return null;
    }

    // Asegurar que solo uno de recipe_id o custom_meal_name tenga valor
    const dataToSave: Partial<PlannedMeal> = {
      ...mealData,
      user_id: user.id,
      recipe_id: mealData.recipe_id || null,
      custom_meal_name: mealData.recipe_id ? null : (mealData.custom_meal_name || null),
    };

    if (existingMealId) {
      // Actualizar (UPDATE)
      const { data, error } = await supabase
        .from('meal_plan_entries')
        .update(dataToSave)
        .eq('id', existingMealId)
        .eq('user_id', user.id)
        .select('id, user_id, recipe_id, plan_date, meal_type, custom_meal_name, created_at')
        .single();

      if (error) {
        console.error('[planningService] Error updating meal plan entry:', error);
        return null;
      }

      return { ...data, recipes: null };
    } else {
      // Insertar (INSERT)
      const { data, error } = await supabase
        .from('meal_plan_entries')
        .insert(dataToSave)
        .select('id, user_id, recipe_id, plan_date, meal_type, custom_meal_name, created_at')
        .single();

      if (error) {
        console.error('[planningService] Error inserting meal plan entry:', error);
        return null;
      }

      return { ...data, recipes: null };
    }
  } catch (error) {
    console.error('Error inesperado en upsertPlannedMeal:', error);
    return null;
  }
}

/**
 * Elimina una comida planificada.
 * Versión simplificada para manejar mejor los errores.
 */
export async function deletePlannedMeal(mealId: string): Promise<boolean> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('[planningService] Authentication error:', userError);
      return false;
    }

    const { error } = await supabase
      .from('meal_plan_entries')
      .delete()
      .eq('id', mealId)
      .eq('user_id', user.id);

    if (error) {
      console.error('[planningService] Error deleting meal plan entry:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error inesperado en deletePlannedMeal:', error);
    return false;
  }
}

/**
 * Elimina todas las comidas planificadas dentro de un rango de fechas.
 * Versión simplificada para manejar mejor los errores.
 */
export async function deletePlannedMealsInRange(startDate: string, endDate: string): Promise<boolean> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('[planningService] Authentication error:', userError);
      return false;
    }

    console.log(`[planningService] Deleting planned meals between ${startDate} and ${endDate}`);
    
    const { error } = await supabase
      .from('meal_plan_entries')
      .delete()
      .eq('user_id', user.id)
      .gte('plan_date', startDate)
      .lte('plan_date', endDate);

    if (error) {
      console.error('[planningService] Error deleting planned meals in range:', error);
      return false;
    }
    
    console.log(`[planningService] Successfully deleted meals between ${startDate} and ${endDate}`);
    return true;
  } catch (error) {
    console.error('Error inesperado en deletePlannedMealsInRange:', error);
    return false;
  }
}