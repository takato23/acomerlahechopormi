import { Category, CategoryKeywords } from '../types'; // Asumiendo que CategoryKeywords está definido aquí

// TODO: Cargar o definir las palabras clave reales para cada categoría
// TODO: Cargar o definir las palabras clave reales para cada categoría. Usar los IDs reales de la migración.
const MOCK_CATEGORY_KEYWORDS: CategoryKeywords = {
  'vegetables': { exactMatch: ['manzana', 'pera', 'banana', 'lechuga', 'tomate', 'zanahoria', 'cebolla', 'papa', 'naranja', 'limon', 'uva', 'frutilla'], partialMatch: ['fruta', 'verdura', 'hortaliza'], priority: 1 }, // Verduras y Frutas
  'dairy': { exactMatch: ['leche', 'queso', 'yogur', 'huevo', 'huevos', 'manteca', 'crema'], partialMatch: ['lácteo'], priority: 1 }, // Lácteos y Huevos
  'meat': { exactMatch: ['pollo', 'carne', 'pescado', 'cerdo', 'jamon', 'milanesa', 'milanesas', 'salchicha', 'atun', 'bife'], partialMatch: ['proteína', 'fiambre', 'embutido'], priority: 1 }, // Carnes y Pescados
  'pantry': { exactMatch: ['arroz', 'fideos', 'pan', 'harina', 'azucar', 'sal', 'aceite', 'lata', 'conserva', 'galletitas', 'cafe', 'te', 'yerba', 'mermelada', 'pure'], partialMatch: ['cereal', 'pasta', 'almacen', 'seco', 'enlatado'], priority: 1 }, // Almacén
  'cleaning': { exactMatch: ['lavandina', 'detergente', 'jabon', 'limpiador', 'papel higienico', 'servilleta', 'escoba', 'trapo'], partialMatch: ['limpieza', 'hogar'], priority: 1 }, // Limpieza
  'beverages': { exactMatch: ['agua', 'gaseosa', 'jugo', 'vino', 'cerveza', 'soda'], partialMatch: ['bebida', 'liquido'], priority: 1 }, // Bebidas
  'frozen': { exactMatch: ['helado', 'congelado', 'pizza congelada', 'verdura congelada'], partialMatch: ['congelado', 'freezer'], priority: 1 }, // Congelados
  'personal_care': { exactMatch: ['shampoo', 'acondicionador', 'desodorante', 'perfume', 'crema corporal', 'protector solar'], partialMatch: ['cuidado personal', 'higiene', 'cosmetico'], priority: 1 }, // Cuidado Personal
  'other': { exactMatch: ['mascota', 'pilas'], partialMatch: [], priority: 99 }, // Otros (sin keywords específicas por ahora)
};

/**
 * Sugiere una ID de categoría basada en el nombre de un item y un conjunto de palabras clave.
 * @param itemName Nombre del item ingresado por el usuario.
 * @param keywords Diccionario de palabras clave por categoryId.
 * @returns La ID de la categoría sugerida o null si no hay coincidencia.
 */
export const suggestCategory = (
    itemName: string,
    keywords: CategoryKeywords = MOCK_CATEGORY_KEYWORDS
): string | null => {
    if (!itemName || itemName.trim().length === 0) {
        return null;
    }

    const lowerItemName = itemName.trim().toLowerCase();
    let bestMatch: { categoryId: string; priority: number } | null = null;

    // Iterar sobre las categorías y sus keywords
    for (const categoryId in keywords) {
        const keywordSet = keywords[categoryId];
        let matchFound = false;
        let currentPriority = keywordSet.priority;

        // 1. Búsqueda por coincidencia exacta (palabra por palabra)
        const inputWords = lowerItemName.split(/\s+/); // Dividir por espacios
        if (keywordSet.exactMatch.some(kw => inputWords.includes(kw.toLowerCase()))) {
            matchFound = true;
        }
        // 2. Búsqueda por coincidencia parcial (si no hubo exacta)
        else if (keywordSet.partialMatch.some(kw => lowerItemName.includes(kw.toLowerCase()))) {
            matchFound = true;
            currentPriority += 10; // Dar menos prioridad a parcial vs exacta
        }
        // TODO: Añadir lógica fuzzyMatch si es necesario

        // Actualizar mejor coincidencia basada en prioridad (menor es mejor)
        if (matchFound) {
            if (!bestMatch || currentPriority < bestMatch.priority) {
                bestMatch = { categoryId, priority: currentPriority };
            }
        }
    }

    console.log(`Suggestion for "${itemName}": ${bestMatch ? bestMatch.categoryId : 'None'}`);
    return bestMatch ? bestMatch.categoryId : null;
};