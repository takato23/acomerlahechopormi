// src/features/planning/utils/nutritionalCalculations.ts

import type { Ingredient } from '@/types/ingredientTypes';
import type {
  CalorieBalance,
  DailyNutrition,
  GoalComparison,
  MacroDistribution,
  NutritionalGoals,
  NutritionalInfo,
  PlannedMeal,
  VarietyScore,
  WeeklyNutrition,
} from '../types';

const CALORIES_PER_PROTEIN_GRAM = 4;
const CALORIES_PER_CARBS_GRAM = 4;
const CALORIES_PER_FAT_GRAM = 9;

const SAFE_EPSILON = 0.0001;

const DEFAULT_NUTRITIONAL_DB: Record<
  string,
  { calories: number; protein: number; carbs: number; fat: number; fiber?: number }
> = {
  pollo: { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  arroz: { calories: 130, protein: 2.4, carbs: 28, fat: 0.3 },
  'arroz integral': { calories: 111, protein: 2.6, carbs: 23, fat: 0.9, fiber: 1.8 },
  lentejas: { calories: 116, protein: 9, carbs: 20, fat: 0.4, fiber: 8 },
  quinoa: { calories: 120, protein: 4.4, carbs: 21, fat: 1.9, fiber: 2.8 },
  salmón: { calories: 208, protein: 20, carbs: 0, fat: 13, fiber: 0 },
  huevo: { calories: 78, protein: 6, carbs: 0.6, fat: 5, fiber: 0 },
  avena: { calories: 150, protein: 5, carbs: 27, fat: 3, fiber: 4 },
  garbanzos: { calories: 164, protein: 9, carbs: 27, fat: 2.6, fiber: 8 },
};

const IDEAL_MACRO_DISTRIBUTION = {
  balanced: { protein: 0.3, carbs: 0.4, fat: 0.3 },
  weightLoss: { protein: 0.35, carbs: 0.35, fat: 0.3 },
  muscleGain: { protein: 0.35, carbs: 0.45, fat: 0.2 },
  maintenance: { protein: 0.3, carbs: 0.45, fat: 0.25 },
};

const clampPercentage = (value: number) => Math.min(100, Math.max(0, value));

const sumNutrition = (acc: NutritionalInfo, info?: NutritionalInfo): NutritionalInfo => {
  if (!info) {
    return acc;
  }

  return {
    calories: (acc.calories ?? 0) + (info.calories ?? 0),
    protein: (acc.protein ?? 0) + (info.protein ?? 0),
    carbs: (acc.carbs ?? 0) + (info.carbs ?? 0),
    fat: (acc.fat ?? 0) + (info.fat ?? 0),
    fiber: (acc.fiber ?? 0) + (info.fiber ?? 0),
  };
};

export const calculateDailyNutrition = (meals: PlannedMeal[]): DailyNutrition => {
  const base: NutritionalInfo = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };

  const totals = meals.reduce<NutritionalInfo>((acc, meal) => {
    if (meal.nutritional_info) {
      return sumNutrition(acc, meal.nutritional_info);
    }

    const estimated =
      meal.recipes?.recipe_ingredients?.map((ingredient) => ingredient?.ingredient_name?.toLowerCase()) ?? [];

    if (!estimated.length) {
      return acc;
    }

    const aggregated = estimated.reduce<NutritionalInfo>((productAcc, ingredientName) => {
      if (!ingredientName) {
        return productAcc;
      }
      const data = DEFAULT_NUTRITIONAL_DB[ingredientName];
      if (!data) {
        return productAcc;
      }

      return sumNutrition(productAcc, data);
    }, base);

    return sumNutrition(acc, aggregated);
  }, base);

  return {
    calories: totals.calories ?? 0,
    protein: totals.protein ?? 0,
    carbs: totals.carbs ?? 0,
    fat: totals.fat ?? 0,
    fiber: totals.fiber ?? 0,
    date: meals[0]?.plan_date ?? '',
  };
};

export const calculateWeeklyNutrition = (meals: PlannedMeal[]): WeeklyNutrition => {
  const grouped = meals.reduce<Record<string, PlannedMeal[]>>((acc, meal) => {
    const key = meal.plan_date;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(meal);
    return acc;
  }, {});

  const days = Object.entries(grouped)
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .map<DailyNutrition>(([, dayMeals]) => calculateDailyNutrition(dayMeals));

  const totals = days.reduce<NutritionalInfo>(
    (acc, day) =>
      sumNutrition(acc, {
        calories: day.calories,
        protein: day.protein,
        carbs: day.carbs,
        fat: day.fat,
        fiber: day.fiber,
      }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
  );

  const averages: NutritionalInfo = {
    calories: days.length ? (totals.calories ?? 0) / days.length : 0,
    protein: days.length ? (totals.protein ?? 0) / days.length : 0,
    carbs: days.length ? (totals.carbs ?? 0) / days.length : 0,
    fat: days.length ? (totals.fat ?? 0) / days.length : 0,
    fiber: days.length ? (totals.fiber ?? 0) / days.length : 0,
  };

  const variability =
    days.length > 1
      ? Math.sqrt(
          days.reduce((varianceAcc, day) => {
            const diff = (day.calories ?? 0) - (averages.calories ?? 0);
            return varianceAcc + diff * diff;
          }, 0) / (days.length - 1),
        )
      : 0;

  return {
    days,
    totals,
    averages,
    variability,
  };
};

export const compareWithGoals = (actual: NutritionalInfo, goals: NutritionalGoals): GoalComparison => {
  const currentCalories = actual.calories ?? 0;
  const targetCalories = goals.dailyCalories;

  if (!targetCalories) {
    return {
      status: 'on-track',
      percentage: 100,
      difference: 0,
    };
  }

  const difference = currentCalories - targetCalories;
  const percentage = clampPercentage((currentCalories / targetCalories) * 100);

  let status: GoalComparison['status'] = 'on-track';
  if (difference > targetCalories * 0.1) {
    status = 'over';
  } else if (difference < targetCalories * -0.1) {
    status = 'under';
  }

  let recommendation: string | undefined;
  if (status === 'over') {
    recommendation = 'Considera reducir el tamaño de las porciones o remplazar ingredientes más calóricos.';
  } else if (status === 'under') {
    recommendation = 'Añade snacks ricos en proteínas o incrementa las porciones para alcanzar tus calorías objetivo.';
  }

  return {
    status,
    percentage,
    difference,
    recommendation,
  };
};

export const calculateMacroDistribution = (nutrition: NutritionalInfo): MacroDistribution => {
  const proteinCalories = (nutrition.protein ?? 0) * CALORIES_PER_PROTEIN_GRAM;
  const carbsCalories = (nutrition.carbs ?? 0) * CALORIES_PER_CARBS_GRAM;
  const fatCalories = (nutrition.fat ?? 0) * CALORIES_PER_FAT_GRAM;
  const totalCalories = proteinCalories + carbsCalories + fatCalories;

  if (totalCalories <= SAFE_EPSILON) {
    return {
      proteinPercent: 0,
      carbsPercent: 0,
      fatPercent: 0,
      evaluation: 'balanced',
    };
  }

  const proteinPercent = (proteinCalories / totalCalories) * 100;
  const carbsPercent = (carbsCalories / totalCalories) * 100;
  const fatPercent = (fatCalories / totalCalories) * 100;

  let evaluation: MacroDistribution['evaluation'] = 'balanced';
  if (proteinPercent > 40) {
    evaluation = 'high-protein';
  } else if (carbsPercent > 50) {
    evaluation = 'high-carb';
  } else if (fatPercent > 40) {
    evaluation = 'high-fat';
  }

  return {
    proteinPercent: Math.round(proteinPercent),
    carbsPercent: Math.round(carbsPercent),
    fatPercent: Math.round(fatPercent),
    evaluation,
  };
};

const getWeeklyTotals = (meals: PlannedMeal[]): NutritionalInfo =>
  meals.reduce<NutritionalInfo>(
    (acc, meal) => sumNutrition(acc, meal.nutritional_info),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
  );

export const generateNutritionalRecommendations = (
  meals: PlannedMeal[],
  goals: NutritionalGoals,
): string[] => {
  const tips: string[] = [];
  const totals = getWeeklyTotals(meals);
  const averageCalories = (totals.calories ?? 0) / Math.max(meals.length || 1, 1);

  if (averageCalories < goals.dailyCalories * 0.85) {
    tips.push('Añade comidas o snacks adicionales para alcanzar tus calorías diarias objetivo.');
  }

  if ((totals.protein ?? 0) < goals.proteinGrams * 6) {
    tips.push('Considera incorporar fuentes de proteína magra en más comidas.');
  }

  if ((totals.carbs ?? 0) > goals.carbsGrams * 7) {
    tips.push('Reduce porciones de carbohidratos refinados y prioriza integrales.');
  }

  if (goals.restrictions.includes('alto en fibra') && (totals.fiber ?? 0) < goals.fiberGrams * 7) {
    tips.push('Integra más vegetales, legumbres o granos enteros para aumentar la fibra.');
  }

  if (!tips.length) {
    tips.push('Excelente equilibrio nutricional esta semana, mantén estos hábitos.');
  }

  return tips;
};

export const calculateIngredientVariety = (meals: PlannedMeal[]): VarietyScore => {
  const allIngredients = meals.flatMap((meal) => {
    if (meal.ingredient_status?.length) {
      return meal.ingredient_status.map((ingredient) => ingredient.ingredient_name.toLowerCase());
    }

    return (
      meal.recipes?.recipe_ingredients
        ?.map((ingredient) => ingredient.ingredient_name?.toLowerCase())
        .filter(Boolean) ?? []
    );
  });

  const totalIngredients = allIngredients.length;
  const uniqueIngredientsSet = new Set(allIngredients);
  const uniqueIngredients = uniqueIngredientsSet.size;

  const repetitions = allIngredients.reduce<Record<string, number>>((acc, ingredient) => {
    if (!ingredient) {
      return acc;
    }

    acc[ingredient] = (acc[ingredient] ?? 0) + 1;
    return acc;
  }, {});

  const repeatedIngredients = Object.entries(repetitions)
    .filter(([, count]) => count > 2)
    .map(([ingredient]) => ingredient);

  const score = totalIngredients ? clampPercentage((uniqueIngredients / totalIngredients) * 100) : 0;

  const suggestions =
    repeatedIngredients.length > 0
      ? repeatedIngredients.map(
          (ingredient) => `Considera sustituir ${ingredient} por opciones distintas para aumentar la variedad.`,
        )
      : [];

  return {
    score,
    uniqueIngredients,
    repeatedIngredients,
    suggestions,
  };
};

export const estimateNutritionalInfo = (ingredients: Ingredient[]): NutritionalInfo => {
  if (!ingredients.length) {
    return {};
  }

  const totals = ingredients.reduce<NutritionalInfo>((acc, ingredient) => {
    const key = ingredient.name.toLowerCase();
    const data = DEFAULT_NUTRITIONAL_DB[key];
    if (!data) {
      return acc;
    }

    return sumNutrition(acc, data);
  }, {});

  return totals;
};

export const calculateCalorieBalance = (meals: PlannedMeal[], goal: number): CalorieBalance => {
  const weeklyNutrition = calculateWeeklyNutrition(meals);

  const daily = weeklyNutrition.days.map(({ date, calories }) => ({
    date,
    balance: Math.round((calories ?? 0) - goal),
  }));

  const weeklyBalance = daily.reduce((acc, day) => acc + day.balance, 0);

  let status: CalorieBalance['status'] = 'balanced';
  if (weeklyBalance > goal * 0.5) {
    status = 'surplus';
  } else if (weeklyBalance < goal * -0.5) {
    status = 'deficit';
  }

  const adjustmentSuggestions: string[] = [];
  if (status === 'surplus') {
    adjustmentSuggestions.push('Reduce porciones ricas en carbohidratos o grasas en los días con mayor excedente.');
  }
  if (status === 'deficit') {
    adjustmentSuggestions.push('Añade snacks nutritivos o incrementa porciones los días con mayor déficit calórico.');
  }

  return {
    daily,
    weeklyBalance,
    status,
    adjustmentSuggestions,
  };
};

export const getIdealMacroDistribution = (objective?: string) => {
  switch (objective) {
    case 'pérdida de peso':
      return IDEAL_MACRO_DISTRIBUTION.weightLoss;
    case 'ganar músculo':
      return IDEAL_MACRO_DISTRIBUTION.muscleGain;
    case 'mantener':
      return IDEAL_MACRO_DISTRIBUTION.maintenance;
    default:
      return IDEAL_MACRO_DISTRIBUTION.balanced;
  }
};
