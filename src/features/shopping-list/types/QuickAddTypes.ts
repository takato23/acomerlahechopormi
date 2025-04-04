import { ShoppingListItem } from '../types'; // Usar ShoppingListItem en lugar de NewShoppingListItem

export interface QuickAddSuggestion {
  label: string;
  quantity: number;
  unit: string | null;
}

export interface QuickAddButtonProps {
  itemName: string;
  suggestions: QuickAddSuggestion[];
  onAdd: (item: ShoppingListItem) => Promise<void>; // Usar ShoppingListItem
  onCustom?: (itemName: string) => void;
  // isAdding general ya no es necesario aquí, se maneja por botón
}