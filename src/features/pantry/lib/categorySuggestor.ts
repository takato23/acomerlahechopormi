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
        return null;
    }

    try {
        return await inferCategory(itemName);
    } catch (error) {
        console.error('[categorySuggestor] Error suggesting category:', error);
        return null;
    }
};
