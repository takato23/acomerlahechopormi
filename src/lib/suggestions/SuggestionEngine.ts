import { differenceInCalendarDays } from 'date-fns';
import type { PantryItem } from '@/features/pantry/types';
import type { PlannedMeal, MealType } from '@/features/planning/types';
import type { Recipe, RecipeIngredient } from '@/types/recipeTypes';
import type { SuggestionRequest, SuggestionResponse, RecipeSuggestion } from '@/features/suggestions/types';
import { generateSuggestionsWithFallback } from '@/lib/ai/aiClient';

interface PantrySummaryItem {
  name: string;
  quantity?: number | null;
  unit?: string | null;
  isFavorite?: boolean;
  category?: string | null;
}

interface RecipeSummaryItem {
  id: string;
  title: string;
  description?: string | null;
  isFavorite: boolean;
  totalTime?: number | null;
  tags?: string[];
  mainIngredients: string[];
  lastPlannedDate?: string | null;
}

interface PlanningSummaryItem {
  plan_date: string;
  meal_type: MealType;
  recipe_id?: string | null;
  custom_meal_name?: string | null;
}

export interface SuggestionEngineContextInput {
  pantryItems: PantryItem[];
  recipes: Recipe[];
  plannedMeals: PlannedMeal[];
}

interface SuggestionEngineContext {
  pantry: PantrySummaryItem[];
  recipes: RecipeSummaryItem[];
  planning: PlanningSummaryItem[];
}

interface SuggestionEngineOptions {
  maxSuggestions?: number;
}

export class SuggestionEngine {
  private maxSuggestions: number;

  constructor(options: SuggestionEngineOptions = {}) {
    this.maxSuggestions = options.maxSuggestions ?? 3;
  }

  async generateSuggestions(
    request: SuggestionRequest,
    contextInput: SuggestionEngineContextInput,
  ): Promise<SuggestionResponse> {
    const context = this.buildContext(contextInput);
    const prompt = this.buildPrompt(request, context);
    const fallback: SuggestionResponse = {
      suggestions: this.buildFallbackSuggestions(request, context),
    };

    return generateSuggestionsWithFallback({
      prompt,
      context: {
        request,
        pantry: context.pantry,
        recipes: context.recipes,
        planning: context.planning,
      },
      fallback,
    });
  }

  private buildContext(input: SuggestionEngineContextInput): SuggestionEngineContext {
    const pantry: PantrySummaryItem[] = input.pantryItems.map((item) => ({
      name: item.ingredient?.name ?? item.notes ?? 'Item sin nombre',
      quantity: item.quantity,
      unit: item.unit,
      isFavorite: Boolean(item.is_favorite),
      category: item.category?.name ?? null,
    }));

    const planning: PlanningSummaryItem[] = input.plannedMeals.map((meal) => ({
      plan_date: meal.plan_date,
      meal_type: meal.meal_type,
      recipe_id: meal.recipe_id ?? undefined,
      custom_meal_name: meal.custom_meal_name ?? undefined,
    }));

    const lastPlannedByRecipe = new Map<string, string>();
    for (const meal of planning) {
      if (meal.recipe_id) {
        const existing = lastPlannedByRecipe.get(meal.recipe_id);
        if (!existing || existing < meal.plan_date) {
          lastPlannedByRecipe.set(meal.recipe_id, meal.plan_date);
        }
      }
    }

    const recipes: RecipeSummaryItem[] = input.recipes.map((recipe) => ({
      id: recipe.id,
      title: recipe.title,
      description: recipe.description ?? undefined,
      isFavorite: Boolean(recipe.is_favorite),
      totalTime:
        (recipe.prep_time_minutes ?? 0) + (recipe.cook_time_minutes ?? 0) || null,
      tags: recipe.tags ?? undefined,
      mainIngredients: this.extractRecipeIngredients(recipe.recipe_ingredients),
      lastPlannedDate: lastPlannedByRecipe.get(recipe.id) ?? null,
    }));

    return { pantry, recipes, planning };
  }

  private buildPrompt(request: SuggestionRequest, context: SuggestionEngineContext): string {
    const sections: string[] = [];

    sections.push(
      'Eres un asistente culinario que ayuda a planificar comidas semanales en base a la despensa del usuario y sus recetas disponibles.',
    );

    if (request.mealType) {
      sections.push(`Tipo de comida objetivo: ${request.mealType}.`);
    }

    if (request.targetDate) {
      sections.push(`Fecha objetivo: ${request.targetDate}.`);
    }

    if (request.dietary) {
      const dietaryFlags = Object.entries(request.dietary)
        .filter(([, value]) => Boolean(value))
        .map(([key]) => key)
        .join(', ');
      if (dietaryFlags) {
        sections.push(`Restricciones dietéticas: ${dietaryFlags}.`);
      }
    }

    if (typeof request.maxTime === 'number') {
      sections.push(`Tiempo máximo deseado: ${request.maxTime} minutos.`);
    }

    sections.push('\n### Despensa actual');
    if (context.pantry.length === 0) {
      sections.push('- El usuario no tiene ingredientes registrados actualmente.');
    } else {
      for (const item of context.pantry) {
        sections.push(
          `- ${item.name}${item.quantity ? ` (${item.quantity}${item.unit ? ` ${item.unit}` : ''})` : ''}${item.isFavorite ? ' ⭐' : ''}${item.category ? ` [${item.category}]` : ''}`,
        );
      }
    }

    sections.push('\n### Recetas disponibles');
    if (context.recipes.length === 0) {
      sections.push('- No hay recetas guardadas por el usuario.');
    } else {
      for (const recipe of context.recipes) {
        const details: string[] = [];
        if (recipe.tags?.length) details.push(`tags: ${recipe.tags.join(', ')}`);
        if (recipe.totalTime) details.push(`tiempo total: ${recipe.totalTime} min`);
        if (recipe.lastPlannedDate) details.push(`última vez: ${recipe.lastPlannedDate}`);
        sections.push(`- ${recipe.title}${recipe.isFavorite ? ' ⭐' : ''}${details.length ? ` (${details.join(' | ')})` : ''}`);
      }
    }

    sections.push('\n### Planificación actual');
    if (context.planning.length === 0) {
      sections.push('- No hay comidas planificadas esta semana.');
    } else {
      for (const meal of context.planning) {
        const label = meal.recipe_id ? `receta ${meal.recipe_id}` : meal.custom_meal_name ?? 'comida personalizada';
        sections.push(`- ${meal.plan_date} (${meal.meal_type}): ${label}`);
      }
    }

    sections.push(
      `\nGenera hasta ${this.maxSuggestions} sugerencias en formato JSON con la siguiente estructura exacta: { "suggestions": [ { "title": string, "description": string, "reason": string, "id": string opcional, "estimatedTime": string opcional } ] }. Justifica cada sugerencia utilizando la información disponible. Usa español neutro.`,
    );

    return sections.join('\n');
  }

  private buildFallbackSuggestions(
    request: SuggestionRequest,
    context: SuggestionEngineContext,
  ): RecipeSuggestion[] {
    if (context.recipes.length === 0) {
      return [];
    }

    const pantryNames = new Set(
      context.pantry
        .map((item) => item.name?.toLowerCase())
        .filter(Boolean) as string[],
    );

    const ranked = context.recipes
      .map((recipe) => {
        const matchCount = recipe.mainIngredients.filter((ingredient) =>
          pantryNames.has(ingredient.toLowerCase()),
        ).length;

        const totalTime = recipe.totalTime ?? null;
        const withinTime =
          typeof request.maxTime === 'number' && totalTime
            ? totalTime <= request.maxTime
            : true;

        const recencyPenalty = this.calculateRecencyPenalty(recipe.lastPlannedDate);
        let score = matchCount * 2 + (recipe.isFavorite ? 1 : 0);
        if (!withinTime) {
          score -= 2;
        }
        score -= recencyPenalty;

        return {
          recipe,
          score,
          matchCount,
          totalTime,
          withinTime,
          recencyPenalty,
        };
      })
      .sort((a, b) => b.score - a.score);

    return ranked
      .slice(0, this.maxSuggestions)
      .map(({ recipe, matchCount, totalTime, withinTime, recencyPenalty }) => {
        const reasonParts: string[] = [];
        if (matchCount > 0) {
          reasonParts.push(
            `Aprovecha ${matchCount} ingrediente${matchCount === 1 ? '' : 's'} de tu despensa`,
          );
        }
        if (recipe.isFavorite) {
          reasonParts.push('Es una de tus recetas favoritas');
        }
        if (!recencyPenalty && recipe.lastPlannedDate) {
          const daysAgo = differenceInCalendarDays(
            new Date(),
            new Date(recipe.lastPlannedDate),
          );
          if (daysAgo > 7) {
            reasonParts.push(`Hace ${daysAgo} días que no la preparas`);
          }
        }
        if (!withinTime && typeof request.maxTime === 'number') {
          reasonParts.push('Requiere más tiempo del deseado');
        }
        if (reasonParts.length === 0) {
          reasonParts.push('Varía tu menú con una opción diferente');
        }

        return {
          id: recipe.id,
          title: recipe.title,
          description: recipe.description ?? 'Receta guardada en tu biblioteca.',
          reason: reasonParts.join('. '),
          estimatedTime: totalTime ? `${totalTime} minutos` : undefined,
        } satisfies RecipeSuggestion;
      });
  }

  private extractRecipeIngredients(ingredients: RecipeIngredient[] | null | undefined): string[] {
    if (!ingredients?.length) {
      return [];
    }
    return ingredients
      .map((ingredient) => ingredient?.ingredient_name?.toLowerCase())
      .filter((name): name is string => Boolean(name));
  }

  private calculateRecencyPenalty(lastPlannedDate?: string | null): number {
    if (!lastPlannedDate) {
      return 0;
    }

    const daysAgo = differenceInCalendarDays(new Date(), new Date(lastPlannedDate));
    if (Number.isNaN(daysAgo)) {
      return 0;
    }

    if (daysAgo <= 2) {
      return 3;
    }
    if (daysAgo <= 5) {
      return 1;
    }
    return 0;
  }
}

export const suggestionEngine = new SuggestionEngine();
