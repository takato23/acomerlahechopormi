import { Recipe, RecipeIngredient } from "@/types/recipeTypes";
import { PantryItem } from "@/features/pantry/types"; // Cambiar la importación al tipo correcto

export interface MissingIngredient {
  ingredient_name: string;
  quantity: number | null;
  unit: string | null;
  ingredient_id: string | null;
}

/**
 * Compara los ingredientes de una receta con los disponibles en la despensa
 * y devuelve los ingredientes faltantes
 */
export function findMissingIngredients(
  recipe: Recipe,
  pantryItems: PantryItem[]
): MissingIngredient[] {
  // Crear un Map de ingredientes de la despensa usando ingredient_id
  const pantryItemMap = new Map(
    pantryItems.map(item => [
      item.ingredient_id,
      {
        ...item,
        quantity: item.quantity || 0,
        unit: item.unit || ''
      }
    ])
  );

  const missingIngredients: MissingIngredient[] = [];

  recipe.ingredients.forEach((ingredient: RecipeIngredient) => {
    if (!ingredient) return;

    // Buscar en la despensa por ingredient_id
    const pantryItem = ingredient.ingredient_id 
      ? pantryItemMap.get(ingredient.ingredient_id)
      : null;

    const needToAdd = !pantryItem || (
      // Si las unidades coinciden, comparar cantidades
      ingredient.unit && 
      pantryItem.unit &&
      ingredient.unit.toLowerCase() === pantryItem.unit.toLowerCase() &&
      ingredient.quantity &&
      pantryItem.quantity &&
      ingredient.quantity > pantryItem.quantity
    );

    if (needToAdd) {
      missingIngredients.push({
        ingredient_name: ingredient.ingredient_name || '',
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        ingredient_id: ingredient.ingredient_id
      });
    }
  });

  return missingIngredients;
}

export interface ShoppingListItem {
  ingredient_id: string | null;
  name: string;
  quantity: number | null;
  unit: string | null;
  notes?: string;
}

/**
 * Prepara los ingredientes faltantes para añadirlos a la lista de compras
 */
export function prepareMissingIngredientsForShoppingList(
  missingIngredients: MissingIngredient[]
): ShoppingListItem[] {
  return missingIngredients.map(ingredient => ({
    ingredient_id: ingredient.ingredient_id,
    name: ingredient.ingredient_name,
    quantity: ingredient.quantity,
    unit: ingredient.unit,
    notes: 'Añadido desde receta sugerida'
  }));
}