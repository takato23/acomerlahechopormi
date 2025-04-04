import { getPlannedMeals } from '@/features/planning/planningService';
import type { PlannedMeal } from '@/features/planning/types';
// import { getRecipeById } from '@/features/recipes/recipeService'; // Asumiendo que existe
// import type { Recipe } from '@/types/recipeTypes'; // Asumiendo que existe
import type { ShoppingListItem, RawIngredientInfo } from './types';
import { supabase } from '@/lib/supabaseClient'; // Necesario para buscar recetas
import { normalizeUnit, parseQuantity } from '@/lib/ingredientUtils'; // Necesitaremos utilidades

// --- Tipos Temporales (Reemplazar con importaciones reales cuando estén disponibles) ---
type Recipe = any;
type RecipeIngredient = {
    name: string;
    quantity: string | number | null;
    unit: string | null;
};
// --- Fin Tipos Temporales ---

/**
 * Obtiene los detalles de una receta por su ID.
 * Placeholder - Reemplazar con la importación real de recipeService.
 */
async function getRecipeById(recipeId: string): Promise<Recipe | null> {
    // Implementación simulada o llamada real a Supabase si recipeService no está listo
    const { data, error } = await supabase
        .from('recipes')
        .select(`
            *,
            recipe_ingredients (
                name,
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
    return data;
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
export async function generateShoppingList(startDate: string, endDate: string): Promise<ShoppingListItem[]> {
    console.log(`Generando lista de compras para ${startDate} a ${endDate}`);

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
            if (recipe && recipe.recipe_ingredients) {
                recipe.recipe_ingredients.forEach((ing: RecipeIngredient) => {
                    if (ing.name) { // Solo añadir si tiene nombre
                         allRawIngredients.push({
                             name: ing.name,
                             quantity: ing.quantity,
                             unit: ing.unit,
                             recipeName: recipe.name || 'Receta sin nombre'
                         });
                    }
                });
            }
        } else if (meal.custom_meal_name) {
            // Podríamos intentar parsear el nombre de la comida personalizada
            // para extraer ingredientes, pero es complejo y propenso a errores.
            // Por ahora, ignoramos ingredientes de comidas personalizadas.
            console.log(`Ignorando comida personalizada: ${meal.custom_meal_name}`);
        }
    });
    console.log(`Se extrajeron ${allRawIngredients.length} ingredientes crudos en total.`);

    // 4. Agrupar y sumar ingredientes
    const aggregatedIngredients = new Map<string, ShoppingListItem>();

    allRawIngredients.forEach(rawIng => {
        const normalizedName = rawIng.name.trim().toLowerCase();
        const normalizedUnit = normalizeUnit(rawIng.unit); // Normalizar unidad (ej. 'gramos' -> 'g')
        const quantityValue = parseQuantity(rawIng.quantity); // Convertir '1/2', '1-2' a número

        const key = `${normalizedName}|${normalizedUnit || 'unidad'}`; // Clave para agrupar

        let existingItem = aggregatedIngredients.get(key);

        if (existingItem) {
            // Sumar cantidades si ambas son numéricas y la unidad es la misma
            if (existingItem.quantity !== null && quantityValue !== null) {
                existingItem.quantity += quantityValue;
            } else {
                // Si alguna cantidad no es numérica o las unidades difieren (o una es null),
                // la cantidad total se vuelve indeterminada (null).
                // Podríamos manejar conversiones de unidades aquí si fuera necesario.
                existingItem.quantity = null;
            }
            // Añadir receta de origen si no está ya
            if (rawIng.recipeName && !existingItem.recipeSources.includes(rawIng.recipeName)) {
                existingItem.recipeSources.push(rawIng.recipeName);
            }
        } else {
            // Crear nuevo ítem
            existingItem = {
                id: key, // Usar la clave como ID temporal
                ingredientName: rawIng.name.trim(), // Mantener capitalización original para mostrar
                quantity: quantityValue,
                unit: normalizedUnit,
                isChecked: false,
                recipeSources: rawIng.recipeName ? [rawIng.recipeName] : [],
            };
        }
        aggregatedIngredients.set(key, existingItem);
    });

    console.log(`Se agregaron ${aggregatedIngredients.size} ítems únicos en la lista.`);

    // 5. Convertir Map a Array y devolver
    const shoppingList = Array.from(aggregatedIngredients.values());

    // Opcional: Ordenar la lista (ej. alfabéticamente)
    shoppingList.sort((a, b) => a.ingredientName.localeCompare(b.ingredientName));

    return shoppingList;
}

// --- Funciones Opcionales (Si se persiste la lista) ---

// async function saveShoppingList(items: ShoppingListItem[]): Promise<void> { ... }
// async function getSavedShoppingList(): Promise<ShoppingListItem[]> { ... }
// async function updateShoppingListItem(itemId: string, updates: Partial<ShoppingListItem>): Promise<void> { ... }
// async function clearShoppingList(): Promise<void> { ... }