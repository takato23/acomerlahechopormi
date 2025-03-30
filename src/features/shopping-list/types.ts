// Define los tipos relacionados con la lista de compras

// Tipo para un ítem individual en la lista generada
export interface ShoppingListItem {
  id: string; // Podría ser el nombre del ingrediente o un ID generado
  name: string;
  quantity: number | null;
  unit: string | null;
  is_purchased: boolean; // Para marcar como comprado
  // Opcional: Podríamos añadir de qué receta(s) proviene
  // recipeSource?: string[]; 
}

// Tipo para crear un nuevo ítem manualmente (si se implementa)
export type NewShoppingListItem = Omit<ShoppingListItem, 'id' | 'is_purchased'>;

// Tipo para actualizar un ítem (ej. marcar como comprado)
export type UpdateShoppingListItem = Partial<Pick<ShoppingListItem, 'name' | 'quantity' | 'unit' | 'is_purchased'>>;