import { getPlannedMeals } from '@/features/planning/planningService';
import type { PlannedMeal } from '@/features/planning/types';
import type { ShoppingListItem, RawIngredientInfo, AggregatedIngredient, DBShoppingListItem } from './types'; // Añadido AggregatedIngredient y DBShoppingListItem
import { supabase } from '@/lib/supabaseClient';
import { normalizeUnit, parseQuantity, convertUnits } from '@/lib/ingredientUtils'; // Añadido convertUnits (asumiendo que existe)
import type { Database } from '@/lib/database.types'; // Importar tipos generados

// Definir el nombre de la tabla para evitar errores tipográficos
const SHOPPING_LIST_TABLE = 'shopping_list_items';
// --- Tipos Reales ---
type RecipeIngredient = Database['public']['Tables']['recipe_ingredients']['Row'];
type Recipe = Database['public']['Tables']['recipes']['Row'] & {
    recipe_ingredients: RecipeIngredient[];
};
type PantryItem = Database['public']['Tables']['pantry_items']['Row'];
type DBShoppingListItemRow = Database['public']['Tables']['shopping_list_items']['Row'];
type DBShoppingListItemInsert = Database['public']['Tables']['shopping_list_items']['Insert'];
type DBShoppingListItemUpdate = Database['public']['Tables']['shopping_list_items']['Update'];
// --- Fin Tipos Reales ---

// --- Constantes ---
const BASIC_INGREDIENTS = [
    'sal', 'pimienta negra molida', 'aceite de girasol', 'aceite de oliva', 'agua', 'azúcar', 'vinagre'
].map(name => name.toLowerCase()); // Normalizar a minúsculas para comparación

const IMPRECISE_UNITS = [
    'pizca', 'cucharadita', 'cdita', 'cucharada', 'cda', 'al gusto', 'un chorrito', 'unidad', 'unidades'
].map(unit => normalizeUnit(unit)); // Normalizar unidades para comparación

/**
 * Obtiene los detalles de una receta por su ID.
 * Placeholder - Reemplazar con la importación real de recipeService.
 */
// Nota: getRecipeById se asume que ahora devuelve la estructura correcta con ingredient_id, etc.
// Si no, la consulta dentro de generateShoppingList debe ajustarse.
// Por simplicidad, mantendremos la llamada a getRecipeById como está,
// pero la consulta DENTRO de generateShoppingList se asegurará de traer los campos necesarios.
async function getRecipeById(recipeId: string): Promise<Recipe | null> {
    const { data, error } = await supabase
        .from('recipes')
        .select(`
            *,
            recipe_ingredients (
                ingredient_id,
                ingredient_name,
                quantity,
                unit
            )
        `)
        .eq('id', recipeId)
        .single();

    if (error) {
        console.error(`Error fetching recipe ${recipeId}:`, error);
        return null;
    }
    // Asegurarse de que recipe_ingredients sea un array
    if (data && !Array.isArray(data.recipe_ingredients)) {
        data.recipe_ingredients = [];
    }
    return data as Recipe | null; // Castear al tipo correcto
}


/**
 * Genera una lista de compras agregada basada en las comidas planificadas
 * para un rango de fechas específico.
 *
 * @param startDate Fecha de inicio (formato YYYY-MM-DD).
 * @param endDate Fecha de fin (formato YYYY-MM-DD).
 * @returns Una promesa que resuelve a un array de ShoppingListItem.
 * @throws Si ocurre un error irrecuperable durante la obtención de datos.
 */
export async function generateShoppingList(startDate: string, endDate: string, userId: string): Promise<ShoppingListItem[]> {
    console.log(`Generando lista de compras para ${startDate} a ${endDate} para usuario ${userId}`);

    // 1. Obtener comidas planificadas
    let plannedMeals: PlannedMeal[] = [];
    try {
        plannedMeals = await getPlannedMeals(startDate, endDate);
        console.log(`Se encontraron ${plannedMeals.length} comidas planificadas.`);
    } catch (error) {
        console.error("Error obteniendo comidas planificadas:", error);
        throw new Error("No se pudieron obtener las comidas planificadas.");
    }

    if (plannedMeals.length === 0) {
        return []; // No hay nada que añadir a la lista
    }

    // 2. Obtener detalles de las recetas asociadas
    const recipeIds = plannedMeals
        .map(meal => meal.recipe_id)
        .filter((id): id is string => !!id); // Filtrar IDs nulos/undefined

    const uniqueRecipeIds = [...new Set(recipeIds)];
    const recipePromises = uniqueRecipeIds.map(id => getRecipeById(id));
    const recipeResults = await Promise.allSettled(recipePromises);

    const recipesMap = new Map<string, Recipe>();
    recipeResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
            recipesMap.set(uniqueRecipeIds[index], result.value);
        } else {
            console.warn(`No se pudo cargar la receta con ID ${uniqueRecipeIds[index]}:`, result.status === 'rejected' ? result.reason : 'Resultado nulo');
        }
    });
    console.log(`Se cargaron ${recipesMap.size} recetas únicas.`);

    // 3. Extraer todos los ingredientes crudos
    const allRawIngredients: RawIngredientInfo[] = [];
    plannedMeals.forEach(meal => {
        if (meal.recipe_id && recipesMap.has(meal.recipe_id)) {
            const recipe = recipesMap.get(meal.recipe_id);
            // Asegurarse de que recipe y recipe.recipe_ingredients existen y son arrays
            if (recipe && Array.isArray(recipe.recipe_ingredients)) {
                recipe.recipe_ingredients.forEach((ing: RecipeIngredient) => {
                    // Usar ingredient_name si existe, si no el 'name' legado (si aplica)
                    const ingredientName = ing.ingredient_name || (ing as any).name;
                    if (ing.ingredient_id && ingredientName) { // Requiere ID y nombre
                         allRawIngredients.push({
                             ingredient_id: ing.ingredient_id, // Guardar ID
                             name: ingredientName,
                             quantity: ing.quantity,
                             unit: ing.unit,
                             recipeName: recipe.title || 'Receta sin nombre' // Usar title
                         });
                    } else {
                         console.warn(`Ingrediente omitido por falta de ID o nombre: ${JSON.stringify(ing)} en receta ${recipe.id}`);
                    }
                });
            }
        } else if (meal.custom_meal_name) {
            console.log(`Ignorando comida personalizada: ${meal.custom_meal_name}`);
        }
    });
    console.log(`Se extrajeron ${allRawIngredients.length} ingredientes crudos válidos en total.`);

    // 4. Agrupar y sumar ingredientes
    // 4. Agrupar y sumar ingredientes por ingredient_id
    const aggregatedIngredients = new Map<string, AggregatedIngredient>();

    allRawIngredients.forEach(rawIng => {
        if (!rawIng.ingredient_id) return; // Saltar si no hay ID

        const key = rawIng.ingredient_id;
        const normalizedUnit = normalizeUnit(rawIng.unit);
        const quantityValue = parseQuantity(rawIng.quantity);

        let existingItem = aggregatedIngredients.get(key);

        if (existingItem) {
            // Intentar sumar cantidades
            if (existingItem.totalQuantity !== null && quantityValue !== null) {
                // Simplificación MVP: Solo sumar si las unidades son iguales o una es null/unidad
                if (existingItem.unit === normalizedUnit || !existingItem.unit || !normalizedUnit || normalizedUnit === 'unidad') {
                     existingItem.totalQuantity += quantityValue;
                     // Si la unidad actual era null/unidad y la nueva no lo es, actualizarla
                     if ((!existingItem.unit || existingItem.unit === 'unidad') && normalizedUnit && normalizedUnit !== 'unidad') {
                         existingItem.unit = normalizedUnit;
                     }
                } else {
                    // Unidades diferentes, intentar conversión básica (ej: g y kg)
                    const convertedQuantity = convertUnits(quantityValue, normalizedUnit, existingItem.unit);
                    if (convertedQuantity !== null) {
                        existingItem.totalQuantity += convertedQuantity;
                    } else {
                        // No se pudo convertir, marcar cantidad como indeterminada
                        console.warn(`No se pueden sumar unidades diferentes: ${existingItem.unit} y ${normalizedUnit} para ${existingItem.name}`);
                        existingItem.totalQuantity = null; // O manejar de otra forma (ej. crear otra entrada)
                    }
                }
            } else {
                // Si alguna cantidad es null, el total es null
                existingItem.totalQuantity = null;
            }

            // Añadir receta de origen si no está ya
            if (rawIng.recipeName && !existingItem.recipeSources.includes(rawIng.recipeName)) {
                existingItem.recipeSources.push(rawIng.recipeName);
            }
        } else {
            // Crear nuevo ítem agregado
            existingItem = {
                ingredient_id: key,
                name: rawIng.name.trim(), // Usar el nombre del primer ingrediente encontrado
                totalQuantity: quantityValue,
                unit: normalizedUnit, // Usar la unidad normalizada
                recipeSources: rawIng.recipeName ? [rawIng.recipeName] : [],
            };
            aggregatedIngredients.set(key, existingItem);
        }
    });

    console.log(`Se agregaron ${aggregatedIngredients.size} ingredientes únicos necesarios.`);

    // 5. Filtrar ingredientes básicos y por unidades imprecisas (Ingredientes Clave)
    const keyIngredients = new Map<string, AggregatedIngredient>();
    aggregatedIngredients.forEach((item, key) => {
        const nameLower = item.name.toLowerCase();
        const unitLower = item.unit ? item.unit.toLowerCase() : 'unidad'; // Considerar null como 'unidad'

        const isBasic = BASIC_INGREDIENTS.includes(nameLower);
        const isImprecise = IMPRECISE_UNITS.includes(unitLower);

        if (!isBasic && !isImprecise) {
            keyIngredients.set(key, item);
        } else {
             console.log(`Filtrado: ${item.name} (Básico: ${isBasic}, Impreciso: ${isImprecise})`);
        }
    });
    console.log(`Se identificaron ${keyIngredients.size} ingredientes clave.`);


    // 6. Obtener items de la despensa
    const { data: pantryItemsData, error: pantryError } = await supabase
        .from('pantry_items')
        .select('ingredient_id, quantity, unit')
        .eq('user_id', userId);

    if (pantryError) {
        console.error("Error obteniendo items de la despensa:", pantryError);
        throw new Error("No se pudieron obtener los items de la despensa.");
    }

    // 7. Agrupar items de la despensa por ingredient_id
    const pantryStock = new Map<string, { quantity: number | null, unit: string | null }>();
    // Definir un tipo local para los datos seleccionados de la despensa
    type PantryStockItem = Pick<PantryItem, 'ingredient_id' | 'quantity' | 'unit'>;

    (pantryItemsData as PantryStockItem[]).forEach((item) => { // Usar el tipo específico
        if (!item.ingredient_id) return;

        const key = item.ingredient_id;
        const normalizedUnit = normalizeUnit(item.unit);
        const quantityValue = parseQuantity(item.quantity);

        let existingStock = pantryStock.get(key);

        if (existingStock) {
            if (existingStock.quantity !== null && quantityValue !== null) {
                 // Simplificación MVP: Sumar solo si unidades coinciden o una es null/unidad
                 if (existingStock.unit === normalizedUnit || !existingStock.unit || !normalizedUnit || normalizedUnit === 'unidad') {
                    existingStock.quantity += quantityValue;
                    if ((!existingStock.unit || existingStock.unit === 'unidad') && normalizedUnit && normalizedUnit !== 'unidad') {
                        existingStock.unit = normalizedUnit;
                    }
                 } else {
                     // Intentar conversión básica
                     const convertedQuantity = convertUnits(quantityValue, normalizedUnit, existingStock.unit);
                     if (convertedQuantity !== null) {
                         existingStock.quantity += convertedQuantity;
                     } else {
                         console.warn(`No se pueden sumar unidades diferentes en despensa: ${existingStock.unit} y ${normalizedUnit} para ingrediente ${key}`);
                         existingStock.quantity = null; // Marcar como indeterminado
                     }
                 }
            } else {
                existingStock.quantity = null;
            }
        } else {
            pantryStock.set(key, { quantity: quantityValue, unit: normalizedUnit });
        }
    });
    console.log(`Se agregaron ${pantryStock.size} ingredientes únicos de la despensa.`);

    // 8. Calcular ingredientes faltantes y generar lista final
    const finalShoppingList: ShoppingListItem[] = [];
    keyIngredients.forEach((neededItem, key) => {
        const stock = pantryStock.get(key);
        let neededQuantity = neededItem.totalQuantity;
        let stockQuantity = 0; // Asumir 0 si no está en despensa

        if (stock && stock.quantity !== null && neededQuantity !== null) {
            // Intentar comparar/restar cantidades (considerando unidades)
            const stockInNeededUnit = convertUnits(stock.quantity, stock.unit, neededItem.unit);

            if (stockInNeededUnit !== null) {
                stockQuantity = stockInNeededUnit;
            } else {
                // No se pueden comparar unidades, asumir que se necesita todo
                console.warn(`No se pueden comparar unidades para ${neededItem.name}: Necesario ${neededItem.unit}, Despensa ${stock.unit}. Añadiendo cantidad completa.`);
                stockQuantity = 0; // Forzar compra
                neededQuantity = neededItem.totalQuantity; // Asegurar que neededQuantity no sea null si la conversión falló
            }
        } else if (neededQuantity === null) {
             // Si la cantidad necesaria es indeterminada (null), añadir a la lista sin cantidad
             stockQuantity = 0; // No podemos restar de null
        } else if (stock && stock.quantity === null) {
            // Si el stock es indeterminado, necesitamos la cantidad calculada
            stockQuantity = 0;
        }
        // Si neededQuantity sigue siendo null aquí, significa que no se pudo calcular la cantidad total necesaria.
        // Lo añadimos a la lista sin cantidad específica.

        const missingQuantity = neededQuantity !== null ? neededQuantity - stockQuantity : null;

        // Añadir a la lista si falta cantidad (o si la cantidad necesaria es null)
        if (missingQuantity === null || missingQuantity > 0) {
            finalShoppingList.push({
                id: neededItem.ingredient_id, // Usar ingredient_id como ID
                ingredientName: neededItem.name,
                quantity: missingQuantity, // Puede ser null
                unit: neededItem.unit,
                isChecked: false,
                recipeSources: neededItem.recipeSources,
            });
        }
    });

    console.log(`Lista de compras final generada con ${finalShoppingList.length} ítems.`);

    // Opcional: Ordenar la lista final antes de guardar
    finalShoppingList.sort((a, b) => a.ingredientName.localeCompare(b.ingredientName));

    // 9. Sincronizar con la base de datos
    try {
        // Pasar los valores del Map 'keyIngredients' que son de tipo AggregatedIngredient
        await syncShoppingListWithDB(userId, Array.from(keyIngredients.values()));
        console.log(`Lista de compras sincronizada con la DB para usuario ${userId}.`);
    } catch (error) {
        console.error("Error sincronizando la lista de compras con la DB:", error);
        // Decidir si lanzar el error o devolver la lista generada igualmente
        // Por ahora, lanzamos para que el store lo maneje
        throw new Error("Error al guardar la lista de compras generada.");
    }

    // 10. Devolver la lista generada (ahora también persistida)
    // Mapear de AggregatedIngredient a ShoppingListItem (que ahora representa el estado de la UI)
    // Nota: La función getShoppingListItems será la fuente principal para la UI ahora.
    // Esta función generate podría devolver void o un indicador de éxito.
    // Por coherencia con la firma original, devolvemos la lista generada,
    // pero la UI debería refrescarse desde getShoppingListItems.
    return finalShoppingList.map(item => ({
        id: item.id, // El ID es el ingredient_id en este punto
        ingredientName: item.ingredientName,
        quantity: item.quantity,
        unit: item.unit,
        isChecked: false, // Los items recién generados no están marcados
        recipeSources: item.recipeSources,
    }));
}

/**
 * Sincroniza la lista de compras generada con la base de datos.
 * Elimina los items no marcados existentes y luego inserta los nuevos.
 * @param userId ID del usuario.
 * @param generatedItems Lista de items generados (tipo AggregatedIngredient).
 */
async function syncShoppingListWithDB(userId: string, generatedItems: AggregatedIngredient[]): Promise<void> {
    // 1. Eliminar items no marcados existentes
    const { error: deleteError } = await supabase
        .from(SHOPPING_LIST_TABLE)
        .delete()
        .eq('user_id', userId)
        .eq('is_checked', false);

    if (deleteError) {
        console.error("Error eliminando items antiguos de la lista de compras:", deleteError);
        throw new Error("Error al limpiar la lista de compras anterior.");
    }
    console.log(`Items no marcados eliminados para usuario ${userId}.`);

    // 2. Preparar nuevos items para insertar
    if (generatedItems.length === 0) {
        console.log("No hay nuevos items generados para insertar.");
        return; // No hay nada que insertar
    }

    const itemsToInsert: DBShoppingListItemInsert[] = generatedItems.map(item => ({
        user_id: userId, // Asegurarse de incluir user_id
        name: item.name, // Usar 'name' como espera el tipo generado
        quantity: item.totalQuantity, // Usar numeric o convertir si es necesario
        unit: item.unit,
        is_checked: false,
        recipe_source: item.recipeSources.join(', ') || null, // Guardar fuentes como texto
        // id se genera automáticamente por la DB
    }));

    // 3. Insertar nuevos items
    const { error: insertError } = await supabase
        .from(SHOPPING_LIST_TABLE)
        .insert(itemsToInsert);

    if (insertError) {
        console.error("Error insertando nuevos items en la lista de compras:", insertError);
        throw new Error("Error al guardar los nuevos items de la lista de compras.");
    }
    console.log(`${itemsToInsert.length} nuevos items insertados para usuario ${userId}.`);
}

// --- Funciones CRUD para la Lista de Compras Persistente ---

/**
 * Obtiene todos los ítems de la lista de compras para el usuario actual.
 */
export async function getShoppingListItems(): Promise<DBShoppingListItemRow[]> {
    const { data, error } = await supabase
        .from(SHOPPING_LIST_TABLE)
        .select('*')
        // .eq('user_id', userId) // RLS se encarga de esto
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching shopping list items:", error);
        throw new Error("No se pudieron obtener los ítems de la lista de compras.");
    }
    return data || [];
}

/**
 * Añade un nuevo ítem a la lista de compras.
 * (Útil para añadir ítems manualmente)
 */
// Asegurar que el tipo del parámetro coincida con el Omit usado en el store
// El tipo generado DBShoppingListItemInsert ya maneja quantity como opcional (number | null | undefined)
export async function addShoppingListItem(itemData: Omit<DBShoppingListItemInsert, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<DBShoppingListItemRow | null> {
     const { data, error } = await supabase
        .from(SHOPPING_LIST_TABLE)
        .insert({ ...itemData }) // user_id se infiere por RLS/default
        .select()
        .single();

    if (error) {
        console.error("Error adding shopping list item:", error);
        throw new Error("No se pudo añadir el ítem a la lista de compras.");
    }
    return data;
}

/**
 * Actualiza un ítem de la lista de compras (ej. marcar como comprado).
 */
export async function updateShoppingListItem(itemId: string, updates: DBShoppingListItemUpdate): Promise<DBShoppingListItemRow | null> {
     // Asegurarse de no intentar actualizar user_id o id
     const { user_id, id, created_at, ...validUpdates } = updates;

     const { data, error } = await supabase
        .from(SHOPPING_LIST_TABLE)
        .update(validUpdates)
        .eq('id', itemId)
        .select()
        .single();

    if (error) {
        console.error(`Error updating shopping list item ${itemId}:`, error);
        throw new Error("No se pudo actualizar el ítem de la lista de compras.");
    }
    return data;
}

/**
 * Elimina un ítem específico de la lista de compras.
 */
export async function deleteShoppingListItem(itemId: string): Promise<void> {
    const { error } = await supabase
        .from(SHOPPING_LIST_TABLE)
        .delete()
        .eq('id', itemId);

    if (error) {
        console.error(`Error deleting shopping list item ${itemId}:`, error);
        throw new Error("No se pudo eliminar el ítem de la lista de compras.");
    }
}

/**
 * Elimina todos los ítems marcados como comprados (is_purchased = true).
 */
export async function clearPurchasedItems(): Promise<void> { // Renombrar función
    const { error } = await supabase
        .from(SHOPPING_LIST_TABLE)
        .delete()
        // .eq('user_id', userId) // RLS se encarga
        .eq('is_purchased', true); // Usar is_purchased

    if (error) {
        console.error("Error clearing purchased shopping list items:", error); // Actualizar mensaje
        throw new Error("No se pudieron limpiar los ítems comprados."); // Mantener mensaje
    }
}

/**
 * Elimina TODOS los ítems de la lista de compras del usuario.
 */
// Exportar también esta función
export async function clearAllItems(): Promise<void> {
    const { error } = await supabase
        .from(SHOPPING_LIST_TABLE)
        .delete()
        // .eq('user_id', userId); // RLS se encarga

    if (error) {
        console.error("Error clearing all shopping list items:", error);
        throw new Error("No se pudo vaciar la lista de compras.");
    }
}