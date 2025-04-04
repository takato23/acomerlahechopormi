import { supabase } from '../../lib/supabaseClient';
import type { Ingredient } from '../../types/ingredientTypes';

// Reglas básicas de singularización en español
const PLURAL_RULES: [RegExp, string][] = [
  [/^(.+)es$/i, '$1'],    // ej: huevos -> huevo, peces -> pez
  [/^(.+[aeiou])s$/i, '$1'], // ej: manzanas -> manzana
  [/^(.+[zñ])es$/i, '$1'], // ej: peces -> pez, piñones -> piñón
  [/^(.+)ces$/i, '$1z'],   // ej: lápices -> lápiz
  [/^(.+)les$/i, '$1l'],   // ej: papeles -> papel
  [/^(.+)s$/i, '$1'],     // regla general: quitar 's'
];

// Reglas básicas de pluralización en español
const SINGULAR_RULES: [RegExp, string][] = [
  [/^(.+[aeiou])$/i, '$1s'],   // vocal -> añadir 's'
  [/^(.+[zñ])$/i, '$1es'],     // z, ñ -> añadir 'es'
  [/^(.+[l])$/i, '$1es'],      // l -> añadir 'es'
  [/^(.+[r])$/i, '$1es'],      // r -> añadir 'es'
  [/^(.+)$/i, '$1s'],         // regla general: añadir 's'
];

// La interfaz Ingredient se importa ahora desde ../../types/ingredientTypes

const TABLE_NAME = 'ingredients';

/**
 * Busca ingredientes en la tabla maestra por nombre.
 * @param query - El término de búsqueda.
 * @param limit - Número máximo de resultados (default 10).
 * @returns Una promesa que resuelve a un array de Ingredients.
 */
export const searchIngredients = async (query: string, limit: number = 10): Promise<Ingredient[]> => {
  if (!query || query.length < 2) {
    return [];
  }

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*, image_url') // Añadir image_url
    .ilike('name', `%${query}%`)
    .limit(limit);

  if (error) {
    console.error('Error searching ingredients:', error);
    return [];
  }

  return data || [];
};

/**
 * Busca un ingrediente exacto por nombre.
 * @param name - Nombre exacto del ingrediente a buscar.
 * @returns El ingrediente si existe, null si no.
 */
const findIngredientByExactName = async (name: string): Promise<Ingredient | null> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*, image_url') // Añadir image_url
    .ilike('name', name.trim())
    .limit(1); // Limitar a 1 resultado

  if (error) {
    console.error('Error finding ingredient:', error);
    return null;
  }

  // Si no hay error y data es un array con al menos un elemento, devolver el primero.
  // Si data es null o vacío, devuelve null.
  return data && data.length > 0 ? data[0] : null;
};

/**
 * Crea un nuevo ingrediente en la tabla maestra.
 * @param name - Nombre del nuevo ingrediente.
 * @returns El ingrediente creado.
 */
const createIngredient = async (name: string): Promise<Ingredient> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuario no autenticado");

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert({
      name: name.trim(),
      // user_id: user.id, // Eliminar user_id ya que la columna no existe en la tabla
    })
    .select('*, image_url') // Añadir image_url
    .single();

  if (error) {
    console.error('Error creating ingredient:', error);
    throw error;
  }

  return data;
};

function toSingular(word: string): string {
    for (const [pattern, replacement] of PLURAL_RULES) {
        if (pattern.test(word)) {
            return word.replace(pattern, replacement);
        }
    }
    return word; // Si no coincide con ninguna regla, devolver la palabra original
}

function toPlural(word: string): string {
    for (const [pattern, replacement] of SINGULAR_RULES) {
        if (pattern.test(word)) {
            return word.replace(pattern, replacement);
        }
    }
    return word; // Si no coincide con ninguna regla, devolver la palabra original
}

/**
 * Normaliza el nombre de un ingrediente teniendo en cuenta la cantidad.
 * @param name Nombre del ingrediente
 * @param quantity Cantidad del ingrediente (para determinar singular/plural)
 */
// Exportar la función para uso en otros servicios
export function normalizeIngredientName(name: string, quantity: number = 1): string {
    const trimmed = name.trim();
    if (!trimmed) return '';

    // Primero convertir a singular
    const singular = toSingular(trimmed.toLowerCase());
    
    // Capitalizar la primera letra de cada palabra
    const capitalized = singular
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

    // Si la cantidad es 1, mantener en singular, si no, pluralizar
    return quantity === 1 ? capitalized : toPlural(capitalized);
}

/**
 * Busca un ingrediente por nombre normalizado o lo crea si no existe.
 * @param name - Nombre del ingrediente a buscar o crear (se normalizará).
 * @param quantity - Cantidad para determinar singular/plural.
 * @returns El ingrediente encontrado o creado con el nombre normalizado.
 */
export const findOrCreateIngredient = async (name: string, quantity: number = 1): Promise<Ingredient> => {
  const normalizedName = normalizeIngredientName(name, quantity);
  if (!normalizedName) {
      throw new Error("El nombre del ingrediente no puede estar vacío.");
  }
  console.log(`Buscando o creando ingrediente normalizado: "${normalizedName}" (original: "${name}")`);
  
  // Buscar usando el nombre normalizado
  const existingIngredient = await findIngredientByExactName(normalizedName);
  if (existingIngredient) {
    console.log(`Ingrediente encontrado: ${existingIngredient.id}`);
    return existingIngredient;
  }

  console.log(`Creando nuevo ingrediente: "${normalizedName}"`);
  // Crear usando el nombre normalizado
  const newIngredient = await createIngredient(normalizedName);
  console.log(`Ingrediente creado: ${newIngredient.id}`);
  return newIngredient;
};