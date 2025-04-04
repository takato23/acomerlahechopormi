import { Category } from '../types';
import { inferCategory } from '../../shopping-list/lib/categoryInference';


/**
 * Sugiere una ID de categoría basada en el nombre de un item y un conjunto de palabras clave.
 * @param itemName Nombre del item ingresado por el usuario.
 * @param keywords Diccionario de palabras clave por categoryId.
 * @returns La ID de la categoría sugerida o null si no hay coincidencia.
 */
/**
 * Sugiere una ID de categoría basada en el nombre del ítem.
 * Utiliza el sistema de inferencia de categorías principal.
 */
export const suggestCategory = async (itemName: string): Promise<string | null> => {
    if (!itemName?.trim()) {
        console.log('[categorySuggestor] Empty item name, no suggestion');
        return null;
    }

    try {
        console.log(`[categorySuggestor] Attempting to suggest category for "${itemName}"`);
        const suggestedCategory = await inferCategory(itemName);
        console.log(`[categorySuggestor] Suggestion result:`, suggestedCategory);
        return suggestedCategory;
    } catch (error) {
        console.error('[categorySuggestor] Error suggesting category:', error);
        return null;
    }
};