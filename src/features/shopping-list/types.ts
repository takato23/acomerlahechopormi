/**
 * Representa un ítem individual en la lista de compras generada.
 */
export interface ShoppingListItem {
  id: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  isChecked: boolean;
  recipeSources: string[];
}

/**
 * Representa un ingrediente extraído de una receta o comida planificada,
 * antes de ser agregado y normalizado.
 */
export interface RawIngredientInfo {
  name: string;
  quantity: string | number | null;
  unit: string | null;
  recipeName?: string;
}

/**
 * Representa un ingrediente después de ser agregado por ID,
 * antes de ser filtrado y comparado con la despensa.
 */
export interface AggregatedIngredient {
  name: string;
  totalQuantity: number | null;
  unit: string | null;
  recipeSources: string[];
}

/**
 * Representa la estructura de un ítem en la tabla shopping_list_items de la DB.
 */
export interface DBShoppingListItem {
  id: string;
  user_id: string;
  quantity: number | null;
  unit: string | null;
  is_purchased: boolean | null;
  name: string;
  created_at: string | null;
  updated_at: string | null;
}
