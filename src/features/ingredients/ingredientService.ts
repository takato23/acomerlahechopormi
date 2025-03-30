import { supabase } from '@/lib/supabaseClient';
// Usar any temporalmente
// import type { Ingredient } from '@/features/pantry/types'; // Reutilizar tipo si aplica
type Ingredient = any; 

const TABLE_NAME = 'ingredients'; // Nombre de la tabla maestra de ingredientes

/**
 * Busca ingredientes en la tabla maestra por nombre.
 * @param query - El término de búsqueda.
 * @param limit - Número máximo de resultados (default 10).
 * @returns Una promesa que resuelve a un array de Ingredients.
 */
export const searchIngredients = async (query: string, limit: number = 10): Promise<Ingredient[]> => {
  if (!query || query.length < 2) {
    return []; // No buscar si la query es muy corta
  }

  // Asumiendo que el acceso a la tabla 'ingredients' es público o RLS permite lectura
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    // Usar ilike para búsqueda case-insensitive que contenga la query
    .ilike('name', `%${query}%`) 
    .limit(limit);

  if (error) {
    console.error('Error searching ingredients:', error);
    // No lanzar error, devolver array vacío para que el combobox no falle
    return []; 
  }

  return data || [];
};

/**
 * (Opcional/Futuro) Añade un nuevo ingrediente a la tabla maestra.
 * Esto podría necesitar permisos especiales o hacerse desde otro lugar.
 */
// export const addMasterIngredient = async (ingredientData: { name: string; /* otros campos */ }) => { ... }