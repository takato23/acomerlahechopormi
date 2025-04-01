// src/features/pantry/types.ts

/**
 * Representa un ingrediente básico (tabla 'ingredient').
 */
export interface Ingredient {
  id: string; // UUID
  name: string;
  category?: string | null; // Categoría textual opcional del ingrediente en sí
  default_unit?: string | null;
  // image_url?: string | null; // Quitado - No existe en la tabla actual
  created_at: string; // Timestamp
}

/**
 * Representa una categoría para organizar ítems (si no existe globalmente).
 * Basado en la tabla 'category' propuesta en el plan.
 */
export interface Category {
  id: string; // UUID
  name: string;
  icon?: string | null;
  color?: string | null;
  order: number;
  user_id?: string | null;
  is_default: boolean;
}

/**
 * Representa un item en la despensa del usuario (tabla 'pantry_item').
 */
export interface PantryItem {
  id: string; // UUID
  user_id: string; // UUID del usuario
  ingredient_id: string; // UUID del ingrediente (FK a ingredients.id)
  quantity: number | null;
  unit: string | null; // Puede ser una unidad predefinida (COMMON_PANTRY_UNITS) o personalizada
  expiry_date?: string | null; // Formato YYYY-MM-DD
  category_id?: string | null; // FK a categories.id
  location?: string | null; // Ubicación (ej. Nevera, Despensa) - Fase 2
  price?: number | null; // Precio por unidad/kg/etc. (opcional) - Fase 2
  notes?: string | null; // Notas adicionales - Fase 2
  min_stock?: number | null; // Nivel mínimo deseado - Fase 2
  target_stock?: number | null; // Nivel objetivo deseado - Fase 2
  tags?: string[] | null; // Etiquetas (ej. "sin gluten", "vegano") - Fase 2
  created_at: string; // Timestamp
  updated_at?: string | null; // Timestamp

  // Campos poblados opcionalmente via JOIN en el servicio
  ingredient?: { name: string } | null; // Relación con tabla 'ingredient'
  category?: { name: string; icon?: string | null; color?: string | null } | null; // Relación con tabla 'category'

  // Propiedades añadidas en el frontend para manejar la consolidación/agrupación
  _consolidatedCount?: number; // Número de ítems originales representados por este ítem (si > 1, es consolidado/agrupado)
  _originalItems?: PantryItem[]; // Array de los ítems originales (si está consolidado/agrupado)
}

/**
 * Datos necesarios para crear un nuevo item en la despensa.
 * Nota: El servicio se encargará de encontrar/crear el ingredient_id a partir del name.
 */
export interface CreatePantryItemData {
  ingredient_name: string; // El nombre que el usuario ingresa
  quantity?: number | null;
  unit?: string | null; // Puede ser una unidad predefinida (COMMON_PANTRY_UNITS) o personalizada
  expiry_date?: string | null;
  category_id?: string | null;
  location?: string | null; // Fase 2
  price?: number | null; // Fase 2
  notes?: string | null; // Fase 2
  min_stock?: number | null; // Fase 2
  target_stock?: number | null; // Fase 2
  tags?: string[] | null; // Fase 2
}

/**
 * Datos que se pueden actualizar en un item existente.
 * Por ahora, no permitimos cambiar el ingrediente directamente aquí.
 */
export type UpdatePantryItemData = Partial<Omit<CreatePantryItemData, 'ingredient_name'>>;
// Permitimos actualizar category_id y expiry_date al editar

/**
 * Estructura para el diccionario de palabras clave usado en auto-categorización.
 */
export interface CategoryKeywordSet {
  exactMatch: string[]; // Palabras que deben coincidir exactamente
  partialMatch: string[]; // Palabras que deben estar contenidas
  fuzzyMatch?: string[]; // Palabras para coincidencia aproximada (opcional)
  priority: number; // Prioridad para resolver conflictos (menor es más prioritario)
}

export interface CategoryKeywords {
  [categoryId: string]: CategoryKeywordSet;
}

/**
 * Lista de unidades comunes sugeridas para la despensa.
 * El campo 'unit' puede contener estos valores o strings personalizados.
 */
export const COMMON_PANTRY_UNITS: string[] = [
  'unidad', 'unidades',
  'g', 'kg',
  'ml', 'l',
  'cucharadita', 'cucharada',
  'taza', 'pizca',
  'paquete', 'lata', 'botella', 'frasco', 'caja',
  'diente', // ej. ajo
  'ramita', // ej. perejil
  'hoja', // ej. laurel
];
// export const PANTRY_UNITS = [...]