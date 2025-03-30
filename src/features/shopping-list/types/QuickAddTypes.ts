import { NewShoppingListItem } from '../types'; // Corregir ruta de importación

export interface QuickAddSuggestion {
  label: string;
  quantity: number;
  unit: string | null;
}

export interface QuickAddButtonProps {
  itemName: string;
  suggestions: QuickAddSuggestion[];
  onAdd: (item: NewShoppingListItem) => Promise<void>; // Usar NewShoppingListItem
  onCustom?: (itemName: string) => void;
  // isAdding general ya no es necesario aquí, se maneja por botón
}