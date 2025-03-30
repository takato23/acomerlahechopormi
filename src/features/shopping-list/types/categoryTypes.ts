/**
 * Tipos de datos para el sistema de categorías de la lista de compras.
 */

/**
 * Representa una categoría para organizar los ítems.
 */
export interface Category {
  id: string; // Identificador único (puede ser slug o UUID)
  name: string; // Nombre legible por humanos
  icon?: string; // Nombre del icono (ej: 'lucide:carrot', 'mdi:bottle-soda')
  color?: string; // Color hexadecimal (ej: '#4ade80') para UI
  order: number; // Orden de visualización
  user_id?: string | null; // ID del usuario si es personalizada, null si es default
  is_default: boolean; // Indica si es una categoría predefinida
}

/**
 * Datos necesarios para crear una nueva categoría personalizada.
 */
export type NewCategory = Omit<Category, 'id' | 'user_id' | 'is_default'>;

/**
 * Datos que se pueden actualizar en una categoría existente (solo personalizadas).
 */
export type UpdateCategory = Partial<Omit<Category, 'id' | 'user_id' | 'is_default'>>;

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
 * Representa una sugerencia de categoría generada.
 */
export interface CategorySuggestion {
  categoryId: string;
  confidence: number; // Nivel de confianza (0-1)
  source: 'keywords' | 'ml' | 'history' | 'manual'; // Origen de la sugerencia
}