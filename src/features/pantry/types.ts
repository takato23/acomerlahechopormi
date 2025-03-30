// src/features/pantry/types.ts

/**
 * Representa un ingrediente básico (tabla 'ingredients').
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
 * Basado en la tabla 'categories' propuesta en el plan.
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
 * Representa un item en la despensa del usuario (tabla 'pantry_items').
 */
export interface PantryItem {
  id: string; // UUID
  user_id: string; // UUID del usuario
  ingredient_id: string; // UUID del ingrediente (FK a ingredients.id)
  quantity: number | null;
  unit: string | null;
  expiry_date?: string | null; // Formato YYYY-MM-DD
  category_id?: string | null; // Añadido para el rediseño (FK a categories.id)
  created_at: string; // Timestamp
  updated_at?: string | null; // Timestamp

  // Campos poblados opcionalmente via JOIN en el servicio
  ingredients?: { name: string } | null; // Quitado image_url
  categories?: { name: string; icon?: string | null; color?: string | null } | null; // Info de la categoría
}

/**
 * Datos necesarios para crear un nuevo item en la despensa.
 * Nota: El servicio se encargará de encontrar/crear el ingredient_id a partir del name.
 */
export interface CreatePantryItemData {
  ingredient_name: string; // El nombre que el usuario ingresa
  quantity?: number | null;
  unit?: string | null;
  expiry_date?: string | null;
  category_id?: string | null; // Añadido para el rediseño
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


// Podríamos añadir unidades comunes aquí si es necesario
// export const PANTRY_UNITS = [...]