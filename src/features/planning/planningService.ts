// src/features/planning/planningService.ts
import { addDays, differenceInCalendarDays, endOfWeek, formatISO, startOfWeek } from 'date-fns';
import { supabase } from '@/lib/supabaseClient';
import type {
  MealPlan,
  MealPlanSummary,
  MealPlanWithEntries,
  PlannedMeal,
  UpsertPlannedMealData,
} from './types';

const RECIPE_SELECT = `
  id,
  title,
  description,
  image_url,
  recipe_ingredients (
    id,
    recipe_id,
    ingredient_id,
    ingredient_name,
    quantity,
    unit
  )
`;

const MEAL_ENTRY_SELECT = `
  id,
  user_id,
  meal_plan_id,
  recipe_id,
  plan_date,
  meal_type,
  custom_meal_name,
  notes,
  created_at,
  recipes:recipes (${RECIPE_SELECT})
`;

function normalizeDate(date: string): string {
  if (!date) {
    throw new Error('Fecha inválida');
  }
  if (date.includes('T')) {
    return date.split('T')[0];
  }
  return date;
}

function parseDate(date: string): Date {
  return new Date(`${normalizeDate(date)}T00:00:00`);
}

function mapMealEntry(entry: any, fallbackPlanId?: string): PlannedMeal {
  const recipeData = entry?.recipes
    ? {
        id: entry.recipes.id,
        title: entry.recipes.title,
        description: entry.recipes.description,
        image_url: entry.recipes.image_url,
        ingredients: entry.recipes.recipe_ingredients ?? [],
      }
    : null;

  return {
    id: entry.id,
    user_id: entry.user_id,
    meal_plan_id: entry.meal_plan_id ?? fallbackPlanId ?? null,
    plan_date: entry.plan_date,
    meal_type: entry.meal_type,
    recipe_id: entry.recipe_id,
    custom_meal_name: entry.custom_meal_name,
    notes: entry.notes ?? null,
    created_at: entry.created_at,
    recipes: recipeData,
  };
}

async function ensureMealPlan(
  userId: string,
  startDate: string,
  endDate: string,
): Promise<MealPlan> {
  const normalizedStart = normalizeDate(startDate);
  const normalizedEnd = normalizeDate(endDate);

  const { data: existingPlan, error: fetchError } = await supabase
    .from('meal_plans')
    .select('id, user_id, start_date, end_date, name, created_at, updated_at')
    .eq('user_id', userId)
    .eq('start_date', normalizedStart)
    .eq('end_date', normalizedEnd)
    .maybeSingle();

  if (fetchError) {
    console.error('[planningService] Error fetching meal plan:', fetchError);
    throw new Error('No se pudo recuperar el plan semanal.');
  }

  if (existingPlan) {
    return existingPlan as MealPlan;
  }

  const { data: insertedPlan, error: insertError } = await supabase
    .from('meal_plans')
    .insert({
      user_id: userId,
      start_date: normalizedStart,
      end_date: normalizedEnd,
      name: `Plan semana ${normalizedStart}`,
    })
    .select('id, user_id, start_date, end_date, name, created_at, updated_at')
    .single();

  if (insertError || !insertedPlan) {
    console.error('[planningService] Error creating meal plan:', insertError);
    throw new Error('No se pudo crear el plan semanal.');
  }

  return insertedPlan as MealPlan;
}

async function resolveMealPlanForMeal(
  userId: string,
  mealData: UpsertPlannedMealData,
  explicitPlanId?: string | null,
): Promise<MealPlan> {
  if (explicitPlanId) {
    const { data: plan, error } = await supabase
      .from('meal_plans')
      .select('id, user_id, start_date, end_date, name, created_at, updated_at')
      .eq('id', explicitPlanId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('[planningService] Error fetching explicit plan:', error);
      throw new Error('No se pudo cargar el plan semanal.');
    }

    if (plan) {
      return plan as MealPlan;
    }
  }

  const planDate = parseDate(mealData.plan_date);
  const start = startOfWeek(planDate, { weekStartsOn: 1 });
  const end = endOfWeek(planDate, { weekStartsOn: 1 });
  return ensureMealPlan(
    userId,
    formatISO(start, { representation: 'date' }),
    formatISO(end, { representation: 'date' }),
  );
}

async function attachEntriesToPlan(
  planId: string,
  entryIds: string[],
): Promise<void> {
  if (entryIds.length === 0) return;

  const { error } = await supabase
    .from('meal_plan_entries')
    .update({ meal_plan_id: planId })
    .in('id', entryIds);

  if (error) {
    console.error('[planningService] Error attaching entries to plan:', error);
  }
}

export async function getMealPlanWithEntries(
  startDate: string,
  endDate: string,
): Promise<MealPlanWithEntries> {
  console.log(`[planningService] Loading board between ${startDate} and ${endDate}`);
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error('[planningService] Authentication error:', authError);
    throw new Error('Usuario no autenticado');
  }

  const normalizedStart = normalizeDate(startDate);
  const normalizedEnd = normalizeDate(endDate);

  const mealPlan = await ensureMealPlan(user.id, normalizedStart, normalizedEnd);

  const { data: entries, error: entriesError } = await supabase
    .from('meal_plan_entries')
    .select(MEAL_ENTRY_SELECT)
    .eq('user_id', user.id)
    .gte('plan_date', normalizedStart)
    .lte('plan_date', normalizedEnd)
    .order('plan_date', { ascending: true })
    .order('meal_type', { ascending: true });

  if (entriesError) {
    console.error('[planningService] Error fetching meals:', entriesError);
    throw new Error('No se pudieron cargar las comidas planificadas.');
  }

  const safeEntries = entries ?? [];
  const missingPlanIds = safeEntries
    .filter(entry => !entry.meal_plan_id)
    .map(entry => entry.id);

  if (missingPlanIds.length > 0) {
    await attachEntriesToPlan(mealPlan.id, missingPlanIds);
    safeEntries.forEach(entry => {
      if (!entry.meal_plan_id) {
        entry.meal_plan_id = mealPlan.id;
      }
    });
  }

  return {
    plan: mealPlan,
    meals: safeEntries.map(entry => mapMealEntry(entry, mealPlan.id)),
  };
}

export async function getPlannedMeals(startDate: string, endDate: string): Promise<PlannedMeal[]> {
  try {
    const { meals } = await getMealPlanWithEntries(startDate, endDate);
    console.log(`[planningService] Found ${meals.length} meals`);
    return meals;
  } catch (error) {
    console.error('Error inesperado en getPlannedMeals:', error);
    return [];
  }
}

export async function upsertPlannedMeal(
  mealData: UpsertPlannedMealData,
  existingMealId?: string,
  mealPlanId?: string | null,
): Promise<PlannedMeal | null> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('[planningService] Authentication error:', userError);
      return null;
    }

    const plan = await resolveMealPlanForMeal(user.id, mealData, mealPlanId);

    const payload: Record<string, any> = {
      user_id: user.id,
      meal_plan_id: plan.id,
      plan_date: normalizeDate(mealData.plan_date),
      meal_type: mealData.meal_type,
      recipe_id: mealData.recipe_id ?? null,
      custom_meal_name: mealData.recipe_id ? null : (mealData.custom_meal_name ?? null),
      notes: mealData.notes ?? null,
    };

    if (existingMealId) {
      payload.id = existingMealId;
    }

    const { data, error } = await supabase
      .from('meal_plan_entries')
      .upsert(payload, { onConflict: 'id' })
      .select(MEAL_ENTRY_SELECT)
      .single();

    if (error || !data) {
      console.error('[planningService] Error saving meal plan entry:', error);
      throw new Error('No se pudo guardar la comida planificada.');
    }

    return mapMealEntry(data, plan.id);
  } catch (error) {
    console.error('Error inesperado en upsertPlannedMeal:', error);
    return null;
  }
}

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

export async function deletePlannedMealsInRange(startDate: string, endDate: string): Promise<boolean> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('[planningService] Authentication error:', userError);
      return false;
    }

    const plan = await ensureMealPlan(user.id, startDate, endDate);

    const { error } = await supabase
      .from('meal_plan_entries')
      .delete()
      .eq('user_id', user.id)
      .eq('meal_plan_id', plan.id);

    if (error) {
      console.error('[planningService] Error deleting planned meals in range:', error);
      return false;
    }

    console.log(`[planningService] Successfully deleted meals for plan ${plan.id}`);
    return true;
  } catch (error) {
    console.error('Error inesperado en deletePlannedMealsInRange:', error);
    return false;
  }
}

export async function getMealPlanHistory(
  limit = 6,
  excludeRange?: { startDate: string; endDate: string },
): Promise<MealPlanSummary[]> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error('[planningService] Authentication error:', authError);
    throw new Error('Usuario no autenticado');
  }

  const { data, error } = await supabase
    .from('meal_plans')
    .select('id, user_id, start_date, end_date, name, created_at, updated_at, meal_plan_entries(count)')
    .eq('user_id', user.id)
    .order('start_date', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[planningService] Error fetching history:', error);
    throw new Error('No se pudo cargar el historial de planes.');
  }

  const normalizedExcludeStart = excludeRange ? normalizeDate(excludeRange.startDate) : null;
  const normalizedExcludeEnd = excludeRange ? normalizeDate(excludeRange.endDate) : null;

  return (data ?? [])
    .filter(plan => {
      if (!excludeRange) return true;
      return !(
        normalizeDate(plan.start_date) === normalizedExcludeStart &&
        normalizeDate(plan.end_date) === normalizedExcludeEnd
      );
    })
    .map(plan => ({
      id: plan.id,
      user_id: plan.user_id,
      start_date: plan.start_date,
      end_date: plan.end_date,
      name: plan.name,
      created_at: plan.created_at,
      updated_at: plan.updated_at,
      meal_count: plan.meal_plan_entries?.[0]?.count ?? 0,
    }));
}

export async function duplicateMealPlanToRange(
  sourcePlanId: string,
  targetStartDate: string,
  targetEndDate: string,
): Promise<PlannedMeal[]> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error('[planningService] Authentication error:', authError);
    throw new Error('Usuario no autenticado');
  }

  const { data: sourcePlan, error: sourceError } = await supabase
    .from('meal_plans')
    .select('id, user_id, start_date, end_date')
    .eq('id', sourcePlanId)
    .eq('user_id', user.id)
    .single();

  if (sourceError || !sourcePlan) {
    console.error('[planningService] Error loading source plan:', sourceError);
    throw new Error('No se encontró el plan seleccionado.');
  }

  const targetPlan = await ensureMealPlan(user.id, targetStartDate, targetEndDate);

  const { data: sourceEntries, error: entriesError } = await supabase
    .from('meal_plan_entries')
    .select('id, plan_date, meal_type, recipe_id, custom_meal_name, notes')
    .eq('meal_plan_id', sourcePlanId)
    .eq('user_id', user.id);

  if (entriesError) {
    console.error('[planningService] Error loading source entries:', entriesError);
    throw new Error('No se pudieron copiar las comidas de la semana.');
  }

  await supabase
    .from('meal_plan_entries')
    .delete()
    .eq('meal_plan_id', targetPlan.id)
    .eq('user_id', user.id);

  if (!sourceEntries || sourceEntries.length === 0) {
    return [];
  }

  const offset = differenceInCalendarDays(
    parseDate(targetStartDate),
    parseDate(sourcePlan.start_date),
  );

  const entriesToInsert = sourceEntries.map(entry => ({
    user_id: user.id,
    meal_plan_id: targetPlan.id,
    meal_type: entry.meal_type,
    recipe_id: entry.recipe_id,
    custom_meal_name: entry.custom_meal_name,
    notes: entry.notes ?? null,
    plan_date: formatISO(addDays(parseDate(entry.plan_date), offset), { representation: 'date' }),
  }));

  const { data: insertedEntries, error: insertError } = await supabase
    .from('meal_plan_entries')
    .insert(entriesToInsert)
    .select(MEAL_ENTRY_SELECT)
    .order('plan_date', { ascending: true })
    .order('meal_type', { ascending: true });

  if (insertError) {
    console.error('[planningService] Error inserting duplicated entries:', insertError);
    throw new Error('No se pudo duplicar la planificación seleccionada.');
  }

  return (insertedEntries ?? []).map(entry => mapMealEntry(entry, targetPlan.id));
}
