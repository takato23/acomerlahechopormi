import { supabase } from '@/lib/supabaseClient';
import type { OnboardingDraft } from './types';
import type { TablesInsert, TablesUpdate, Json } from '@/lib/database.types';
import { findOrCreateIngredient } from '@/features/ingredients/ingredientService';

export interface OnboardingResult {
  profileUpdated: boolean;
  pantryInserted: number;
  pantryUpdated: number;
  completedAt: string;
}

export async function completeOnboardingFlow(draft: OnboardingDraft): Promise<OnboardingResult> {
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError) {
    throw authError;
  }
  if (!user) {
    throw new Error('Usuario no autenticado.');
  }

  const aggregatedItems = aggregateDraftItems(draft);

  const [profileResult, pantryResult] = await Promise.all([
    persistProfile(user.id, draft),
    persistPantryItems(user.id, aggregatedItems)
  ]);

  return {
    profileUpdated: profileResult,
    pantryInserted: pantryResult.inserted,
    pantryUpdated: pantryResult.updated,
    completedAt: pantryResult.completedAt
  };
}

function aggregateDraftItems(draft: OnboardingDraft) {
  const map = new Map<
    string,
    {
      ingredient_name: string;
      quantity: number | null;
      unit: string | null;
      category_id: string | null;
      notes: string | null;
    }
  >();

  draft.initialPantryItems.forEach((item) => {
    const normalizedName = item.ingredient_name.trim().toLowerCase();
    if (!normalizedName) return;
    const current = map.get(normalizedName);
    if (!current) {
      map.set(normalizedName, {
        ingredient_name: item.ingredient_name.trim(),
        quantity: item.quantity ?? null,
        unit: item.unit ?? null,
        category_id: item.category_id ?? null,
        notes: item.notes ?? null
      });
      return;
    }
    const unifiedQuantity =
      current.quantity !== null && item.quantity !== null ? current.quantity + item.quantity : current.quantity ?? item.quantity ?? null;
    map.set(normalizedName, {
      ingredient_name: item.ingredient_name.trim(),
      quantity: unifiedQuantity,
      unit: current.unit ?? item.unit ?? null,
      category_id: current.category_id ?? item.category_id ?? null,
      notes: concatenateNotes(current.notes, item.notes ?? null)
    });
  });

  return Array.from(map.values());
}

function concatenateNotes(current: string | null, next: string | null) {
  if (current && next && current !== next) {
    return `${current}; ${next}`;
  }
  return current ?? next ?? null;
}

async function persistProfile(userId: string, draft: OnboardingDraft) {
  const preferredMealTimes = Object.entries(draft.preferredMealTimes ?? {}).reduce<Record<string, string>>((acc, [key, value]) => {
    if (value) acc[key] = value;
    return acc;
  }, {});

  const preferencesPayload: Json = {
    primaryGoal: draft.primaryGoal ?? null,
    dietaryPreferences: draft.dietaryPreferences,
    allergies: draft.allergies,
    dislikedIngredients: draft.dislikedIngredients,
    preferredMealTimes,
    quantitativeObjectives: {
      weeklyBudget: draft.quantitativeObjectives.weeklyBudget ?? null,
      calorieTarget: draft.quantitativeObjectives.calorieTarget ?? null,
      householdSize: draft.quantitativeObjectives.householdSize ?? null
    },
    notes: draft.notes ?? null
  };

  const profileUpdate: TablesUpdate<'profiles'> = {
    dietary_preference: draft.dietaryPreferences[0] ?? draft.primaryGoal ?? null,
    difficulty_preference: draft.preferredComplexity ?? null,
    allergies: draft.allergies.length ? draft.allergies : null,
    excluded_ingredients: draft.dislikedIngredients.length ? draft.dislikedIngredients : null,
    max_prep_time: draft.maxCookingMinutes ?? null,
    preferences: preferencesPayload,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase.from('profiles').update(profileUpdate).eq('id', userId);
  if (error) {
    console.error('[onboardingService] Error updating profile', error);
    throw error;
  }

  return true;
}

async function persistPantryItems(
  userId: string,
  items: Array<{
    ingredient_name: string;
    quantity: number | null;
    unit: string | null;
    category_id: string | null;
    notes: string | null;
  }>
) {
  if (items.length === 0) {
    return {
      inserted: 0,
      updated: 0,
      completedAt: new Date().toISOString()
    };
  }

  const { data: existing, error: fetchError } = await supabase
    .from('pantry_items')
    .select('id, ingredient_id, quantity, unit')
    .eq('user_id', userId);

  if (fetchError) {
    console.error('[onboardingService] Error fetching pantry items', fetchError);
    throw fetchError;
  }

  const existingMap = new Map(
    (existing ?? [])
      .filter((item): item is typeof item & { ingredient_id: string } => Boolean(item.ingredient_id))
      .map((item) => [item.ingredient_id, item])
  );

  let insertedCount = 0;
  let updatedCount = 0;

  for (const item of items) {
    const quantity = item.quantity ?? 1;
    const ingredient = await findOrCreateIngredient(item.ingredient_name, quantity);
    const unit = item.unit ?? ingredient.default_unit ?? 'unidad';
    const existingItem = ingredient.id ? existingMap.get(ingredient.id) : undefined;

      if (existingItem) {
        const updatePayload: TablesUpdate<'pantry_items'> = {
          id: existingItem.id,
          ingredient_id: ingredient.id,
          ingredient_name: item.ingredient_name,
          user_id: userId,
          quantity: item.quantity ?? existingItem.quantity ?? 1,
          unit,
          category_id: item.category_id ?? ingredient.category_id ?? null,
          notes: item.notes ?? null
      };

      const { error: updateError } = await supabase
        .from('pantry_items')
        .update(updatePayload)
        .eq('id', existingItem.id)
        .eq('user_id', userId);

      if (updateError) {
        console.error('[onboardingService] Error updating pantry item', updateError);
        throw updateError;
      }

      updatedCount += 1;
      } else {
        const insertPayload: TablesInsert<'pantry_items'> = {
          user_id: userId,
          ingredient_id: ingredient.id,
          ingredient_name: item.ingredient_name,
          quantity,
          unit,
          category_id: item.category_id ?? ingredient.category_id ?? null,
          notes: item.notes ?? null
        };

      const { error: insertError } = await supabase.from('pantry_items').insert(insertPayload);
      if (insertError) {
        console.error('[onboardingService] Error inserting pantry item', insertError);
        throw insertError;
      }

      insertedCount += 1;
    }
  }

  return {
    inserted: insertedCount,
    updated: updatedCount,
    completedAt: new Date().toISOString()
  };
}
