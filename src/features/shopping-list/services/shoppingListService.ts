import { supabase } from '@/lib/supabaseClient';
import { ShoppingListItem, NewShoppingListItem, UpdateShoppingListItem } from '@/types/shoppingListTypes'; // Asumiendo que existen estos tipos
import { RecipeIngredient } from '@/types/recipeTypes'; // Asumiendo que existe este tipo
import { PantryItem } from '@/types/pantryTypes'; // Asumiendo que existe este tipo
import { getPantryItems } from '@/features/pantry/pantryService';
import { isBasicPantryIngredient, normalizeUnit, parseQuantity, convertUnits } from '@/lib/ingredientUtils'; // Importar utilidades

/** @constant {string} TABLE_NAME - Nombre de la tabla de la lista de compras en Supabase. */
const TABLE_NAME = 'shopping_list_items';

/**
 * Obtiene todos los ítems de la lista de compras para el usuario actual.
 * Ordena por estado de compra (no comprados primero) y luego por fecha de creación.
 * @async
 * @function getShoppingListItems
 * @returns {Promise<ShoppingListItem[]>} Una promesa que resuelve a un array de ítems de la lista de compras.
 * @throws {Error} Si el usuario no está autenticado o si ocurre un error en la consulta.
 */
export const getShoppingListItems = async (): Promise<ShoppingListItem[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado.');

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('user_id', user.id)
    .order('is_purchased', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching shopping list items:', error);
    throw new Error('No se pudieron cargar los ítems de la lista de compras.');
  }
  // Asegurar que devolvemos un array, incluso si data es null
  return (data || []) as ShoppingListItem[];
};

/**
 * Añade un nuevo ítem a la lista de compras.
 * @async
 * @function addShoppingListItem
 * @param {NewShoppingListItem} itemData - Datos del nuevo ítem (sin id, user_id, is_purchased).
 * @returns {Promise<ShoppingListItem>} El ítem recién creado.
 * @throws {Error} Si el usuario no está autenticado o si falla la inserción.
 */
export const addShoppingListItem = async (itemData: NewShoppingListItem): Promise<ShoppingListItem> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado.');

  // Validar y parsear cantidad antes de insertar
  const quantity = parseQuantity(itemData.quantity);

  const newItem = {
    ...itemData,
    quantity: quantity, // Usar cantidad parseada
    unit: normalizeUnit(itemData.unit), // Normalizar unidad
    user_id: user.id,
    is_purchased: false,
  };

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert(newItem)
    .select()
    .single();

  if (error || !data) {
    console.error('Error adding shopping list item:', error);
    throw new Error('No se pudo añadir el ítem a la lista de compras.');
  }
  return data as ShoppingListItem;
};

/**
 * Añade múltiples ítems nuevos a la lista de compras.
 * @async
 * @function addItemsToShoppingList
 * @param {NewShoppingListItem[]} itemsData - Array de datos de los nuevos ítems.
 * @returns {Promise<ShoppingListItem[]>} Los ítems recién creados.
 * @throws {Error} Si el usuario no está autenticado o si falla la inserción.
 */
export const addItemsToShoppingList = async (itemsData: NewShoppingListItem[]): Promise<ShoppingListItem[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado.');

    if (!itemsData || itemsData.length === 0) {
        return []; // No hay ítems para añadir
    }

    const newItems = itemsData.map(itemData => {
        const quantity = parseQuantity(itemData.quantity);
        return {
            ...itemData,
            quantity: quantity,
            unit: normalizeUnit(itemData.unit),
            user_id: user.id,
            is_purchased: false,
            // Asegurarse de que no se envíe un 'id' si existe en NewShoppingListItem
            id: undefined,
            created_at: undefined,
            updated_at: undefined,
        };
    });

    const { data, error } = await supabase
        .from(TABLE_NAME)
        .insert(newItems)
        .select();

    if (error || !data) {
        console.error('Error adding multiple shopping list items:', error);
        throw new Error('No se pudieron añadir los ítems a la lista de compras.');
    }
    return data as ShoppingListItem[];
};


/**
 * Actualiza un ítem existente en la lista de compras.
 * @async
 * @function updateShoppingListItem
 * @param {string} itemId - El ID del ítem a actualizar.
 * @param {UpdateShoppingListItem} updates - Un objeto con los campos a actualizar (ej. `is_purchased`).
 * @returns {Promise<ShoppingListItem>} El ítem actualizado.
 * @throws {Error} Si falla la actualización.
 */
export const updateShoppingListItem = async (itemId: string, updates: UpdateShoppingListItem): Promise<ShoppingListItem> => {
   const validatedUpdates: Partial<ShoppingListItem> = { ...updates }; // Usar Partial para flexibilidad

   // Validar y parsear cantidad si se está actualizando
   if (validatedUpdates.quantity !== undefined) {
     validatedUpdates.quantity = parseQuantity(validatedUpdates.quantity);
   }
   // Normalizar unidad si se está actualizando
   if (validatedUpdates.unit !== undefined) {
       validatedUpdates.unit = normalizeUnit(validatedUpdates.unit);
   }
   // Eliminar campos no actualizables directamente si existen
   delete validatedUpdates.id;
   delete validatedUpdates.user_id;
   delete validatedUpdates.created_at;


  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update(validatedUpdates as any) // Usar 'as any' temporalmente si Partial causa problemas con Supabase types
    .eq('id', itemId)
    .select()
    .single();

  if (error || !data) {
    console.error('Error updating shopping list item:', error);
    throw new Error('No se pudo actualizar el ítem.');
  }
  return data as ShoppingListItem;
};

/**
 * Elimina un ítem de la lista de compras.
 * @async
 * @function deleteShoppingListItem
 * @param {string} itemId - El ID del ítem a eliminar.
 * @returns {Promise<void>}
 * @throws {Error} Si falla la eliminación.
 */
export const deleteShoppingListItem = async (itemId: string): Promise<void> => {
  const { error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq('id', itemId);

  if (error) {
    console.error('Error deleting shopping list item:', error);
    throw new Error('No se pudo eliminar el ítem.');
  }
};

/**
 * Elimina todos los ítems marcados como comprados para el usuario actual.
 * @async
 * @function clearPurchasedItems
 * @returns {Promise<void>}
 * @throws {Error} Si el usuario no está autenticado o si falla la eliminación.
 */
export const clearPurchasedItems = async (): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado.');

  const { error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq('user_id', user.id)
    .eq('is_purchased', true);

  if (error) {
    console.error('Error clearing purchased items:', error);
    throw new Error('No se pudieron limpiar los ítems comprados.');
  }
};

/**
 * Obtiene los nombres de los ítems más frecuentemente añadidos por el usuario a la lista de compras.
 * Útil para sugerencias.
 * @async
 * @function getFrequentItems
 * @param {number} [limit=10] - El número máximo de ítems frecuentes a devolver.
 * @returns {Promise<string[]>} Una promesa que resuelve a un array de nombres de ítems (string).
 */
export const getFrequentItems = async (limit: number = 10): Promise<string[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Optimización: Llamar a una función RPC si la tabla es muy grande
  // Por ahora, mantenemos la lógica del cliente para tablas moderadas
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('name')
    .eq('user_id', user.id)
    .limit(500); // Limitar consulta inicial

  if (error || !data) {
    console.error('Error fetching items for frequency count:', error);
    return [];
  }

  // Contar frecuencias en cliente
  const frequencyMap: { [name: string]: number } = {};
  data.forEach(item => {
    if (item.name) {
      frequencyMap[item.name] = (frequencyMap[item.name] || 0) + 1;
    }
  });

  // Ordenar y devolver nombres
  const sortedItems = Object.entries(frequencyMap)
    .sort(([, countA], [, countB]) => countB - countA)
    .slice(0, limit)
    .map(([name]) => name);

  return sortedItems;
};


/**
 * Calcula los ingredientes de una receta que faltan en la despensa.
 * Filtra ingredientes básicos y compara cantidades (considerando unidades normalizadas).
 * @async
 * @function calculateMissingRecipeIngredients
 * @param {RecipeIngredient[]} recipeIngredients - Array de ingredientes de la receta.
 * @returns {Promise<NewShoppingListItem[]>} Una promesa que resuelve a un array de ítems faltantes para añadir a la lista.
 * @throws {Error} Si falla la obtención de la despensa.
 */
export const calculateMissingRecipeIngredients = async (recipeIngredients: RecipeIngredient[]): Promise<NewShoppingListItem[]> => {
    if (!recipeIngredients || recipeIngredients.length === 0) {
        return [];
    }

    // 1. Obtener despensa actual
    const pantryItems = await getPantryItems();

    // 2. Crear mapa de despensa con unidades normalizadas y cantidades parseadas
    //    Clave: "nombre_ingrediente-unidad_normalizada", Valor: cantidad_numerica
    const pantryMap = new Map<string, number>();
    pantryItems.forEach((item: PantryItem) => {
        // Usar el nombre del ingrediente relacionado si existe, si no, el nombre del item de despensa
        const name = item.ingredients?.name ?? item.name;
        if (name) {
            const normalizedUnit = normalizeUnit(item.unit);
            const quantity = parseQuantity(item.quantity);
            // Solo añadir si tenemos nombre, unidad normalizada y cantidad válida
            if (normalizedUnit !== null && quantity !== null && quantity > 0) {
                const key = `${name.trim().toLowerCase()}-${normalizedUnit}`;
                pantryMap.set(key, (pantryMap.get(key) || 0) + quantity);
            }
            // Considerar ítems sin unidad (contarlos por nombre)
            else if (normalizedUnit === null && quantity !== null && quantity > 0) {
                 const key = `${name.trim().toLowerCase()}-null`; // Clave especial para sin unidad
                 pantryMap.set(key, (pantryMap.get(key) || 0) + quantity);
            }
        }
    });

    // 3. Filtrar ingredientes básicos y calcular faltantes
    const missingItems: NewShoppingListItem[] = [];
    recipeIngredients.forEach(ingredient => {
        const name = ingredient.ingredient_name; // Usar ingredient_name
        if (!name || isBasicPantryIngredient(name)) {
            return; // Saltar si no hay nombre o es básico
        }

        const requiredQuantity = parseQuantity(ingredient.quantity);
        const requiredUnit = normalizeUnit(ingredient.unit);

        // Si no se necesita cantidad o no se pudo parsear, añadir sin cantidad (asumir que se necesita 1 unidad si no hay unidad)
        if (requiredQuantity === null || requiredQuantity <= 0) {
             // Evitar añadir duplicados si ya existe en la lista de faltantes (por si acaso)
             if (!missingItems.some(item => item.name.toLowerCase() === name.trim().toLowerCase())) {
                 missingItems.push({
                     name: name.trim(),
                     quantity: null, // O 1 si prefieres asumir una unidad
                     unit: requiredUnit ?? 'unidad', // Usar 'unidad' si no se especifica
                     // category_id: ingredient.category_id, // Podríamos añadir categoría si está disponible
                 });
             }
            return;
        }

        // Construir clave para buscar en despensa
        const key = `${name.trim().toLowerCase()}-${requiredUnit ?? 'null'}`; // Usar 'null' si la unidad es null
        const availableQuantity = pantryMap.get(key) || 0;

        const neededQuantity = requiredQuantity - availableQuantity;

        if (neededQuantity > 0) {
             // Evitar añadir duplicados
             if (!missingItems.some(item => item.name.toLowerCase() === name.trim().toLowerCase() && normalizeUnit(item.unit) === requiredUnit)) {
                 missingItems.push({
                     name: name.trim(),
                     quantity: neededQuantity, // Añadir solo la cantidad faltante
                     unit: ingredient.unit, // Mantener la unidad original de la receta para la lista
                     // category_id: ingredient.category_id,
                 });
             }
        }
    });

    return missingItems;
};


// --- Lógica de generateShoppingList (Comentada/Eliminada Temporalmente) ---
// La función generateShoppingList original basada en planificación se puede mantener
// o refactorizar si es necesario, pero está fuera del scope de esta tarea específica.
// Se recomienda mover la lógica de cálculo de faltantes a calculateMissingRecipeIngredients
// y potencialmente crear una función similar para la planificación si se necesita.

/*
export const generateShoppingList = async (startDate: string, endDate: string): Promise<ShoppingListItem[]> => {
  // ... (Código anterior comentado o eliminado) ...
  // Esta función ahora debería idealmente usar una lógica similar a
  // calculateMissingRecipeIngredients pero aplicada a todas las recetas
  // de la planificación en lugar de una sola.
  console.warn("generateShoppingList necesita ser refactorizada para usar la nueva lógica de cálculo de faltantes.");
  return []; // Devolver vacío temporalmente
};
*/