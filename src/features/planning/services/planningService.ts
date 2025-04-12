import { supabase } from '@/lib/supabaseClient';
import { MealPlanEntry, MealPlanEntryWithRecipe, RecipeWithIngredients } from '@/types/planningTypes';
import { endOfDay, startOfDay } from 'date-fns';

const RECIPE_FIELDS = `
  id,
  title,
  description,
  image_url,
  is_public,
  is_favorite,
  user_id,
  created_at,
  updated_at,
  category_id,
  recipe_ingredients (
    id,
    recipe_id,
    ingredient_id,
    ingredient_name,
    quantity,
    unit
  )
`;

function mapDatabaseResponseToMealPlanEntry(dbResponse: any): MealPlanEntry {
  return {
    id: dbResponse.id,
    user_id: dbResponse.user_id,
    recipe_id: dbResponse.recipe_id,
    plan_date: dbResponse.plan_date,
    meal_type: dbResponse.meal_type,
    custom_meal_name: dbResponse.custom_meal_name,
    created_at: dbResponse.created_at,
    recipe: dbResponse.recipe ? {
      ...dbResponse.recipe,
      recipe_ingredients: dbResponse.recipe.recipe_ingredients || []
    } : null
  };
}

export async function getPlannedMeals(date: Date): Promise<MealPlanEntry[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const startDate = startOfDay(date).toISOString().split('T')[0];
    const endDate = endOfDay(date).toISOString().split('T')[0];

    console.log('[planningService] Fetching planned meals between', startDate, 'and', endDate);

    const { data, error } = await supabase
      .from('meal_plan_entries')
      .select(`
        id,
        user_id,
        recipe_id,
        plan_date,
        meal_type,
        custom_meal_name,
        created_at,
        recipe:recipes (${RECIPE_FIELDS})
      `)
      .eq('user_id', user.id)
      .gte('plan_date', startDate)
      .lte('plan_date', endDate)
      .order('plan_date', { ascending: true })
      .order('meal_type', { ascending: true });

    if (error) {
      console.error('[planningService] Error fetching planned meals:', error);
      throw error;
    }

    return (data || []).map(mapDatabaseResponseToMealPlanEntry);
  } catch (error) {
    console.error('Error inesperado en getPlannedMeals:', error);
    throw error;
  }
}

export async function createMealPlanEntry(entry: Partial<MealPlanEntry>): Promise<MealPlanEntryWithRecipe> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  const { data: mealPlanEntry, error: entryError } = await supabase
    .from('meal_plan_entries')
    .insert([{
      ...entry,
      user_id: user.id
    }])
    .select(`
      id,
      user_id,
      recipe_id,
      plan_date,
      meal_type,
      custom_meal_name,
      created_at,
      recipe:recipes (${RECIPE_FIELDS})
    `)
    .single();

  if (entryError) throw entryError;
  if (!mealPlanEntry) throw new Error('No se pudo crear la entrada del plan');

  return mapDatabaseResponseToMealPlanEntry(mealPlanEntry) as MealPlanEntryWithRecipe;
}

export async function updateMealPlanEntry(
  id: string, 
  updates: Partial<MealPlanEntry>
): Promise<MealPlanEntryWithRecipe> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  const { data: mealPlanEntry, error: entryError } = await supabase
    .from('meal_plan_entries')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select(`
      id,
      user_id,
      recipe_id,
      plan_date,
      meal_type,
      custom_meal_name,
      created_at,
      recipe:recipes (${RECIPE_FIELDS})
    `)
    .single();

  if (entryError) throw entryError;
  if (!mealPlanEntry) throw new Error('Entrada no encontrada');

  return mapDatabaseResponseToMealPlanEntry(mealPlanEntry) as MealPlanEntryWithRecipe;
}

export async function deleteMealPlanEntry(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  const { error } = await supabase
    .from('meal_plan_entries')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
}