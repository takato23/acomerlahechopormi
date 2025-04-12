/**
 * Representa un ítem individual en la lista de compras generada.
 */
export interface ShoppingListItem {
  id: string; // Identificador único para el ítem (puede ser el nombre normalizado o un UUID)
  ingredientName: string; // Nombre del ingrediente
  quantity: number | null; // Cantidad total calculada (puede ser null si solo se suman ocurrencias)
  unit: string | null; // Unidad (puede ser null)
  isChecked: boolean; // Estado para marcar/desmarcar en la UI
  recipeSources: string[]; // Nombres de las recetas que requieren este ingrediente (opcional)
}

/**
 * Representa un ingrediente extraído de una receta o comida planificada,
 * antes de ser agregado y normalizado.
 */
export interface RawIngredientInfo {
    ingredient_id: string | null; // Añadido ID del ingrediente
    name: string;
    quantity: string | number | null;
    unit: string | null;
    recipeName?: string; // Nombre de la receta de origen
}

/**
 * Representa un ingrediente después de ser agregado por ID,
 * antes de ser filtrado y comparado con la despensa.
 */
export interface AggregatedIngredient {
    ingredient_id: string;
    name: string; // Nombre (del primer ingrediente encontrado con ese ID)
    totalQuantity: number | null; // Cantidad total sumada
    unit: string | null; // Unidad normalizada (la primera encontrada o la más común)
    recipeSources: string[]; // Nombres de las recetas que lo requieren
}

/**
 * Representa la estructura de un ítem en la tabla shopping_list_items de la DB.
 */
export interface DBShoppingListItem {
  id: string;
  user_id: string;
  ingredient_name: string;
  quantity: number | null; // Corresponde a 'numeric' en SQL
  unit: string | null;
  is_checked: boolean;
  recipe_source: string | null;
  created_at: string;
  updated_at: string;
}
