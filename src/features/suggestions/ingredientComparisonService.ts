import { PantryItem } from "../pantry/types";
import { Recipe } from "../recipes/types";

// Definimos la interfaz MissingIngredient que necesitamos
export interface MissingIngredient {
  ingredient_id: string | null;
  ingredient_name: string | null;
  quantity: number | null;
  unit: string | null;
}

export interface ShoppingListItem {
  ingredient_id: string | null;
  name: string;
  quantity: number | null;
  unit: string | null;
  notes?: string;
  categoryId?: number;  // Añadimos la propiedad categoryId como opcional
}

export function findMissingIngredients(recipe: Recipe, pantryItems: PantryItem[]): MissingIngredient[] {
  if (!recipe.ingredients || recipe.ingredients.length === 0) {
    return [];
  }

  const pantryIngredientNames = pantryItems.map(item => item.ingredient_name?.toLowerCase() || '');
  
  const missingIngredients: MissingIngredient[] = [];
  
  recipe.ingredients.forEach((ingredient) => {
    // Si no hay nombre de ingrediente, no podemos compararlo
    if (!ingredient.ingredient_name) return;
    
    // Normalizar el nombre del ingrediente para la comparación
    const ingredientName = ingredient.ingredient_name.toLowerCase();
    
    // Verificar si el ingrediente está en la despensa
    const isInPantry = pantryIngredientNames.some(pantryName => 
      // Comparación exacta o como substring
      pantryName === ingredientName || 
      ingredientName.includes(pantryName) || 
      pantryName.includes(ingredientName)
    );
    
    if (!isInPantry) {
      missingIngredients.push({
        ingredient_id: ingredient.ingredient_id,
        ingredient_name: ingredient.ingredient_name,
        quantity: ingredient.quantity,
        unit: ingredient.unit
      });
    }
  });
  
  return missingIngredients;
}

export function prepareMissingIngredientsForShoppingList(missingIngredients: MissingIngredient[]): ShoppingListItem[] {
  return missingIngredients.map(ingredient => {
    // Intentar determinar la categoría basada en el ingrediente
    // Por ahora, usamos una categoría genérica (implementar lógica más avanzada después)
    let categoryId: number | undefined = undefined;
    
    // Simple lógica de mapeo de categorías
    const ingredientName = ingredient.ingredient_name?.toLowerCase() || '';
    if (ingredientName.includes('carne') || ingredientName.includes('pollo') || ingredientName.includes('pescado')) {
      categoryId = 1; // Categoría: Carnes
    } else if (ingredientName.includes('leche') || ingredientName.includes('queso') || ingredientName.includes('yogur')) {
      categoryId = 2; // Categoría: Lácteos
    } else if (ingredientName.includes('manzana') || ingredientName.includes('banana') || 
               ingredientName.includes('naranja') || ingredientName.includes('pera') || 
               ingredientName.includes('fruta')) {
      categoryId = 3; // Categoría: Frutas
    } else if (ingredientName.includes('zanahoria') || ingredientName.includes('lechuga') || 
               ingredientName.includes('tomate') || ingredientName.includes('cebolla') || 
               ingredientName.includes('verdura')) {
      categoryId = 4; // Categoría: Verduras
    } else if (ingredientName.includes('arroz') || ingredientName.includes('pasta') || 
               ingredientName.includes('harina') || ingredientName.includes('cereal')) {
      categoryId = 5; // Categoría: Cereales y Pastas
    } else {
      categoryId = 6; // Categoría: Otros
    }
    
    return {
      ingredient_id: ingredient.ingredient_id,
      name: ingredient.ingredient_name || '',
      quantity: ingredient.quantity,
      unit: ingredient.unit,
      notes: 'Añadido desde receta sugerida',
      categoryId // Incluir la categoría inferida
    };
  });
}