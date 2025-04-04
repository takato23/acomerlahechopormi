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
    name: string;
    quantity: string | number | null;
    unit: string | null;
    recipeName?: string; // Nombre de la receta de origen
}