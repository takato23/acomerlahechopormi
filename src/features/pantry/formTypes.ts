import { PantryItem } from './types';

/**
 * Tipo para datos parciales cuando se crea un ítem desde Quick Add
 */
export interface QuickAddData {
  ingredients?: {
    name: string;
  };
  ingredient_id?: string;
  quantity?: number | null;
  unit?: string | null;
  category_id?: string | null;
}

/**
 * Tipo unión que representa los posibles datos que puede recibir el formulario
 */
export type FormItemData = PantryItem | QuickAddData;