import { useCallback, useMemo, useState } from 'react';
import { usePlanningStore } from '@/stores/planningStore';
import { usePantryStore } from '@/stores/pantryStore';

interface UseShoppingListIntegrationReturn {
  generateShoppingList: () => Promise<void>;
  addMissingIngredients: (mealId: string) => Promise<void>;
  missingIngredientsCount: number;
  estimatedCost: number | null;
  isGenerating: boolean;
}

export const useShoppingListIntegration = (): UseShoppingListIntegrationReturn => {
  const [isGenerating, setIsGenerating] = useState(false);
  const plannedMeals = usePlanningStore((state) => state.plannedMeals);
  const generateShoppingListFromCurrentPlan = usePlanningStore(
    (state) => state.generateShoppingListFromCurrentPlan,
  );
  const addMissingIngredientsFromStore = usePlanningStore((state) => state.addMissingIngredients);
  const pantryItems = usePantryStore((state) => state.items);

  const missingIngredientsCount = useMemo(() => {
    return plannedMeals
      .flatMap((meal) => meal.ingredient_status ?? [])
      .filter((status) => !status.available).length;
  }, [plannedMeals]);

  const estimatedCost = useMemo(() => {
    const costFromMeals = plannedMeals
      .map((meal) => meal.cost_estimate ?? 0)
      .reduce((acc, value) => acc + value, 0);

    if (costFromMeals > 0) {
      return Number(costFromMeals.toFixed(2));
    }

    const pantryPrices = pantryItems
      .map((item) => item.price ?? 0)
      .filter((price) => price > 0);

    if (!pantryPrices.length) return null;

    const averagePrice = pantryPrices.reduce((acc, value) => acc + value, 0) / pantryPrices.length;
    return Number((averagePrice * missingIngredientsCount).toFixed(2));
  }, [plannedMeals, pantryItems, missingIngredientsCount]);

  const generateShoppingList = useCallback(async () => {
    setIsGenerating(true);
    try {
      await generateShoppingListFromCurrentPlan();
    } finally {
      setIsGenerating(false);
    }
  }, [generateShoppingListFromCurrentPlan]);

  const addMissingIngredients = useCallback(
    async (mealId: string) => {
      await addMissingIngredientsFromStore(mealId);
    },
    [addMissingIngredientsFromStore],
  );

  return {
    generateShoppingList,
    addMissingIngredients,
    missingIngredientsCount,
    estimatedCost,
    isGenerating,
  };
};
