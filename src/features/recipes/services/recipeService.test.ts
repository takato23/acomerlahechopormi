import { filterRecipesByMaxTime, getEffectiveRecipeTotalTime } from './recipeService';
import type { Recipe } from '@/types/recipeTypes';

let recipeIdCounter = 0;

const createRecipe = (overrides: Partial<Recipe> = {}): Recipe => ({
  id: overrides.id ?? `recipe-${recipeIdCounter++}`,
  user_id: overrides.user_id ?? 'user-test',
  title: overrides.title ?? 'Receta de prueba',
  description: overrides.description ?? null,
  instructions: overrides.instructions ?? [],
  created_at: overrides.created_at ?? new Date().toISOString(),
  updated_at: overrides.updated_at ?? null,
  image_url: overrides.image_url ?? null,
  prep_time_minutes: overrides.prep_time_minutes ?? null,
  cook_time_minutes: overrides.cook_time_minutes ?? null,
  servings: overrides.servings ?? null,
  tags: overrides.tags ?? [],
  is_favorite: overrides.is_favorite ?? false,
  category_id: overrides.category_id ?? null,
  ingredients: overrides.ingredients ?? [],
  main_ingredients: overrides.main_ingredients ?? null,
  is_generated_base: overrides.is_generated_base ?? false,
  estimated_time: overrides.estimated_time ?? null,
  cooking_methods: overrides.cooking_methods,
  difficulty_level: overrides.difficulty_level,
  cuisine_type: overrides.cuisine_type,
  nutritional_info: overrides.nutritional_info,
  seasonal_flags: overrides.seasonal_flags,
  equipment_needed: overrides.equipment_needed,
});

describe('getEffectiveRecipeTotalTime', () => {
  it('prioritises estimated_time when present', () => {
    const recipe = createRecipe({
      prep_time_minutes: 10,
      cook_time_minutes: 15,
      estimated_time: 50,
    });

    expect(getEffectiveRecipeTotalTime(recipe)).toBe(50);
  });

  it('sums available prep and cook times ignoring nulls', () => {
    const recipe = createRecipe({
      prep_time_minutes: 20,
      cook_time_minutes: null,
    });

    expect(getEffectiveRecipeTotalTime(recipe)).toBe(20);
  });

  it('returns null when there is no timing data', () => {
    const recipe = createRecipe();

    expect(getEffectiveRecipeTotalTime(recipe)).toBeNull();
  });
});

describe('filterRecipesByMaxTime', () => {
  it('keeps recipes whose total time is within the threshold', () => {
    const quick = createRecipe({ id: 'quick', prep_time_minutes: 10, cook_time_minutes: 15 });
    const slow = createRecipe({ id: 'slow', prep_time_minutes: 30, cook_time_minutes: 45 });
    const estimated = createRecipe({ id: 'estimated', estimated_time: 25 });
    const missing = createRecipe({ id: 'missing' });

    const result = filterRecipesByMaxTime([quick, slow, estimated, missing], 30);

    expect(result).toEqual([quick, estimated]);
  });

  it('excludes recipes when the limit is lower than their total time', () => {
    const recipe = createRecipe({ id: 'only', prep_time_minutes: 5, cook_time_minutes: 20 });

    expect(filterRecipesByMaxTime([recipe], 15)).toHaveLength(0);
  });
});
