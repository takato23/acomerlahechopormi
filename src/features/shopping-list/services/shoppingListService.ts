import { supabase } from '@/lib/supabaseClient';
// Usar any temporalmente
type ShoppingListItem = any;
type NewShoppingListItem = any;
type UpdateShoppingListItem = any;
type PlannedMeal = any;
type Recipe = any;
type RecipeIngredient = any;
type PantryItem = any; 
import { getPlannedMeals } from '@/features/planning/planningService';
import { getRecipeById } from '@/features/recipes/recipeService'; 
import { getPantryItems } from '@/features/pantry/pantryService'; 

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
  return data || [];
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

  const quantity = itemData.quantity === undefined || itemData.quantity === null || isNaN(Number(itemData.quantity)) 
    ? null 
    : Number(itemData.quantity);

  const newItem = {
    ...itemData,
    quantity: quantity, 
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
  return data;
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
    .select()
    .single();

  if (error || !data) {
    console.error('Error updating shopping list item:', error);
    throw new Error('No se pudo actualizar el ítem.');
  }
  return data;
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
 * Genera una lista de compras consolidada basada en las comidas planificadas
 * para un rango de fechas dado, considerando el stock actual de la despensa.
 * @async
 * @function generateShoppingList
 * @param {string} startDate - Fecha de inicio (formato YYYY-MM-DD).
 * @param {string} endDate - Fecha de fin (formato YYYY-MM-DD).
 * @returns {Promise<ShoppingListItem[]>} Una promesa que resuelve a un array de ShoppingListItem consolidados y ajustados por stock.
 * @throws {Error} Si falla la obtención de datos necesarios (planificación, despensa, recetas).
 */
export const generateShoppingList = async (startDate: string, endDate: string): Promise<ShoppingListItem[]> => {
  // 1. Obtener comidas planificadas y despensa actual en paralelo
  const [plannedMeals, pantryItems] = await Promise.all([
    getPlannedMeals(startDate, endDate),
    getPantryItems() 
  ]);

  if (!plannedMeals || plannedMeals.length === 0) {
    return []; 
  }

  // Crear mapa de despensa
  const pantryMap = new Map<string, number>();
  // Corregir acceso al nombre del ingrediente
  pantryItems.forEach((item: PantryItem) => {
    const ingredientName = item.ingredients?.name; // Acceder a través de la relación
    if (ingredientName && typeof item.quantity === 'number') {
      const key = `${ingredientName.trim().toLowerCase()}-${(item.unit || '').trim().toLowerCase()}`;
      pantryMap.set(key, (pantryMap.get(key) || 0) + item.quantity);
    }
  });

  // 2. Obtener detalles de recetas
  const recipeIds = [...new Set(plannedMeals.map(meal => meal.recipe_id).filter(id => id !== null))] as string[];
  const recipes: Recipe[] = [];
  // Considerar Promise.all para optimizar si hay muchas recetas
  for (const id of recipeIds) {
    const recipe = await getRecipeById(id);
    if (recipe) recipes.push(recipe);
    else console.warn(`Recipe with ID ${id} planned but not found.`);
  }
  const recipeMap = new Map<string, Recipe>(recipes.map(r => [r.id, r]));

  // 3. Consolidar ingredientes requeridos
  const requiredIngredients: { [key: string]: { name: string; quantity: number | null; unit: string | null; sources: string[] } } = {};
  plannedMeals.forEach(meal => {
    if (meal.recipe_id) {
      const recipe = recipeMap.get(meal.recipe_id);
      if (recipe?.recipe_ingredients) {
        recipe.recipe_ingredients.forEach((ingredient: RecipeIngredient) => {
          const name = ingredient.name.trim();
          const unit = (ingredient.unit || '').trim();
          const key = `${name.toLowerCase()}-${unit.toLowerCase()}`;
          if (!requiredIngredients[key]) {
            requiredIngredients[key] = { name: name, quantity: 0, unit: unit || null, sources: [] };
          }
          if (typeof ingredient.quantity === 'number' && requiredIngredients[key].quantity !== null) {
            requiredIngredients[key].quantity! += ingredient.quantity;
          } else {
            requiredIngredients[key].quantity = null; 
          }
          if (!requiredIngredients[key].sources.includes(recipe.name)) {
             requiredIngredients[key].sources.push(recipe.name);
          }
        });
      }
    } else if (meal.custom_meal_name) {
       const name = meal.custom_meal_name.trim();
       const key = `${name.toLowerCase()}-custom`;
       if (!requiredIngredients[key]) {
         requiredIngredients[key] = { name: name, quantity: null, unit: null, sources: ['Comida personalizada'] };
       }
    }
  });

  // 4. Calcular ítems a comprar (Requerido - Despensa)
  const shoppingList: ShoppingListItem[] = [];
  Object.entries(requiredIngredients).forEach(([key, details], index) => {
    let neededQuantity = details.quantity;
    if (key.endsWith('-custom')) {
       shoppingList.push({
         id: `${details.name}-${index}`, name: details.name.charAt(0).toUpperCase() + details.name.slice(1),
         quantity: null, unit: null, is_purchased: false,
       });
       return; 
    }
    if (neededQuantity !== null && pantryMap.has(key)) {
      neededQuantity -= pantryMap.get(key)!;
    }
    if (neededQuantity === null || neededQuantity > 0) {
      shoppingList.push({
        id: `${details.name}-${index}`, name: details.name.charAt(0).toUpperCase() + details.name.slice(1),
        quantity: neededQuantity, unit: details.unit, is_purchased: false,
      });
    }
  });

  return shoppingList;
};