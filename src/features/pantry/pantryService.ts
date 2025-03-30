import { supabase } from '@/lib/supabaseClient';
// Usar any temporalmente
// import type { PantryItem, NewPantryItem, UpdatePantryItem } from './types';
type PantryItem = any;
type NewPantryItem = any;
type UpdatePantryItem = any;

/** @constant {string} TABLE_NAME - Nombre de la tabla de despensa en Supabase. */
const TABLE_NAME = 'pantry_items';

/**
 * Obtiene todos los ítems de la despensa para el usuario actual.
 * @async
 * @function getPantryItems
 * @returns {Promise<PantryItem[]>} Una promesa que resuelve a un array de ítems de la despensa.
 * @throws {Error} Si el usuario no está autenticado o si ocurre un error en la consulta.
 */
export const getPantryItems = async (): Promise<PantryItem[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*') // Considerar seleccionar explícitamente o incluir JOIN con ingredients si es necesario
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching pantry items:', error);
    throw new Error('No se pudieron cargar los ítems de la despensa.');
  }
  return data || [];
};

/**
 * Añade un nuevo ítem a la despensa.
 * Valida y convierte la cantidad a número o null.
 * @async
 * @function addPantryItem
 * @param {NewPantryItem} itemData - Datos del nuevo ítem (sin id, user_id).
 * @returns {Promise<PantryItem>} El ítem recién creado.
 * @throws {Error} Si el usuario no está autenticado o si falla la inserción.
 */
export const addPantryItem = async (itemData: NewPantryItem): Promise<PantryItem> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  const quantity = itemData.quantity === undefined || itemData.quantity === null || isNaN(Number(itemData.quantity)) 
    ? null 
    : Number(itemData.quantity);

  const newItem = {
    ...itemData,
    quantity: quantity,
    user_id: user.id,
    // Asegurarse de que otros campos obligatorios tengan valor (ej. ingredient_id si aplica)
  };

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert(newItem)
    .select()
    .single();

  if (error || !data) {
    console.error('Error adding pantry item:', error);
    throw new Error('No se pudo añadir el ítem a la despensa.');
  }
  return data;
};

/**
 * Actualiza un ítem existente en la despensa.
 * Valida y convierte la cantidad si se incluye en las actualizaciones.
 * @async
 * @function updatePantryItem
 * @param {string} itemId - El ID del ítem a actualizar.
 * @param {UpdatePantryItem} updates - Un objeto con los campos a actualizar.
 * @returns {Promise<PantryItem>} El ítem actualizado.
 * @throws {Error} Si falla la actualización.
 */
export const updatePantryItem = async (itemId: string, updates: UpdatePantryItem): Promise<PantryItem> => {
   const validatedUpdates = { ...updates };
   if (validatedUpdates.quantity !== undefined) {
     const quantity = validatedUpdates.quantity === null || isNaN(Number(validatedUpdates.quantity))
       ? null
       : Number(validatedUpdates.quantity);
     validatedUpdates.quantity = quantity;
   }

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update(validatedUpdates)
    .eq('id', itemId)
    // Podríamos añadir .eq('user_id', user.id) si RLS no es suficiente
    .select()
    .single();

  if (error || !data) {
    console.error('Error updating pantry item:', error);
    throw new Error('No se pudo actualizar el ítem.');
  }
  return data;
};

/**
 * Elimina un ítem de la despensa.
 * @async
 * @function deletePantryItem
 * @param {string} itemId - El ID del ítem a eliminar.
 * @returns {Promise<void>}
 * @throws {Error} Si falla la eliminación.
 */
export const deletePantryItem = async (itemId: string): Promise<void> => {
  const { error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq('id', itemId);
    // Podríamos añadir .eq('user_id', user.id) si RLS no es suficiente

  if (error) {
    console.error('Error deleting pantry item:', error);
    throw new Error('No se pudo eliminar el ítem.');
  }
};

/**
 * Obtiene ítems de la despensa con cantidad baja o nula.
 * @async
 * @function getLowStockItems
 * @param {number} [threshold=1] - La cantidad máxima para considerar bajo stock (inclusive).
 * @returns {Promise<PantryItem[]>} Una promesa que resuelve a un array de ítems con bajo stock.
 * @throws {Error} Si el usuario no está autenticado o si falla la consulta.
 */
export const getLowStockItems = async (threshold: number = 1): Promise<PantryItem[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*, ingredients ( name )') // Asegurarse de traer el nombre del ingrediente
    .eq('user_id', user.id)
    .lte('quantity', threshold)
    .order('ingredients(name)', { ascending: true }); // Ordenar por el nombre del ingrediente relacionado

  if (error) {
    console.error('Error fetching low stock items:', error);
    throw new Error('No se pudieron cargar los ítems con bajo stock.');
  }
  return data || [];
};
