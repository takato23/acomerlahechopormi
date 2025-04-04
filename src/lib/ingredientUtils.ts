// import { ShoppingItem } from "@/context/AppContext"; // Eliminado - AppContext no existe aquí

export const BASIC_PANTRY_INGREDIENTS = [
    "Huevo", "Tomate", "Carne", "Pollo", "Arroz", "Pasta", "Cebolla",
    "Ajo", "Zanahoria", "Papa", "Queso", "Leche", "Yogur", "Atún",
    "Harina", "Azúcar", "Manzana", "Plátano", "Frijoles", "Lentejas",
    "Aceite", "Sal", "Pimienta"
];

// Define IngredientCategory as an enum
export enum IngredientCategory {
    PRODUCE = 'Frutas y Verduras',
    PROTEIN = 'Carnes', // Includes fish, poultry, meat, eggs, tofu etc.
    DAIRY = 'Lácteos',
    GRAINS = 'Granos', // Includes pasta, rice, bread, flour etc.
    SPICES = 'Condimentos',
    CANNED = 'Enlatados',
    FROZEN = 'Congelados',
    SNACKS = 'Snacks',
    BEVERAGES = 'Bebidas',
    BAKERY = 'Panadería',
    BASIC_PANTRY = 'Básicos Despensa', // For salt, sugar, oil etc. that might not fit elsewhere easily
    OTHER = 'Otros'
}

/**
 * Maps a category string value back to its IngredientCategory enum key.
 * Returns IngredientCategory.OTHER if no match is found.
 */
export const mapStringToIngredientCategory = (categoryString: string): IngredientCategory => {
    for (const key in IngredientCategory) {
        if (IngredientCategory[key as keyof typeof IngredientCategory] === categoryString) {
            return IngredientCategory[key as keyof typeof IngredientCategory];
        }
    }
    // Fallback if the string doesn't match any known category value
    console.warn(`Unknown category string: "${categoryString}". Defaulting to OTHER.`);
    return IngredientCategory.OTHER;
};


/**
 * Basic function to clean ingredient text - removes leading numbers, units, and common preparation words.
 * Needs refinement for more complex cases.
 */
export const cleanIngredientText = (ingredient: string): string => {
  let cleaned = ingredient.toLowerCase();
  // Remove leading quantity and unit (e.g., "2 cups ", "100g ")
  cleaned = cleaned.replace(/^[\d./\s]+(kg|g|ml|l|taza|cucharada|cucharadita|unidad|paquete|lata|botella|cabeza|diente|cdita|cda|unidades|kilos|gramos|litros|mililitros)s?\s+/, '');
  // Remove common preparation instructions often found after commas or parentheses
  cleaned = cleaned.split(',')[0]; // Take only text before the first comma
  cleaned = cleaned.split('(')[0]; // Take only text before the first parenthesis
  // Remove common words like "picado", "cortado", "fresco", "enlatado", "congelado" etc.
  cleaned = cleaned.replace(/\b(picado|picada|cortado|cortada|fresco|fresca|enlatado|enlatada|congelado|congelada|grande|pequeño|mediano|al gusto|opcional|dividido|dividida)\b/g, '');
  return cleaned.trim();
};

/**
 * Checks if an ingredient name corresponds to a basic pantry item.
 */
export const isBasicPantryIngredient = (ingredient: string): boolean => {
  const cleanedName = cleanIngredientText(ingredient).toLowerCase();
  // Check against a more comprehensive list or keywords
  const basicKeywords = ['sal', 'pimienta', 'aceite', 'vinagre', 'azúcar', 'harina', 'levadura', 'caldo', 'agua'];
  return basicKeywords.some(keyword => cleanedName.includes(keyword)) ||
         BASIC_PANTRY_INGREDIENTS.some(basic => cleanedName.includes(basic.toLowerCase()));
};

/**
 * Assigns a category to an ingredient based on its name.
 * This is a simplified categorization and can be improved.
 */
export const categorizeIngredient = (ingredient: string): IngredientCategory => {
    const cleanedName = cleanIngredientText(ingredient).toLowerCase();

    if (/\b(manzana|banana|tomate|lechuga|zanahoria|papa|cebolla|ajo|limon|naranja|palta|brocoli|espinaca|pimiento)\b/.test(cleanedName)) return IngredientCategory.PRODUCE;
    if (/\b(pollo|carne|cerdo|pescado|res|huevo|tofu|jamon)\b/.test(cleanedName)) return IngredientCategory.PROTEIN;
    if (/\b(leche|queso|yogur|yogurt|crema|manteca)\b/.test(cleanedName)) return IngredientCategory.DAIRY;
    if (/\b(arroz|frijol|lenteja|pasta|harina|pan|avena|fideos|galletas|galletitas)\b/.test(cleanedName)) return IngredientCategory.GRAINS;
    if (/\b(sal|pimienta|oregano|comino|canela|pimenton|curry|mostaza|ketchup|mayonesa|salsa de soja)\b/.test(cleanedName)) return IngredientCategory.SPICES;
    if (/\b(atun|tomate en lata|maiz en lata|arvejas en lata)\b/.test(cleanedName)) return IngredientCategory.CANNED;
    if (/\b(helado|verduras congeladas)\b/.test(cleanedName)) return IngredientCategory.FROZEN;
    if (/\b(papas fritas|chocolate|nueces|almendras)\b/.test(cleanedName)) return IngredientCategory.SNACKS;
    if (/\b(agua|jugo|vino|cerveza|gaseosa|cafe|te|yerba)\b/.test(cleanedName)) return IngredientCategory.BEVERAGES;
    if (isBasicPantryIngredient(ingredient)) return IngredientCategory.BASIC_PANTRY; // Check basic pantry last before Other

    return IngredientCategory.OTHER;
};


/**
 * Checks if a cleaned ingredient name already exists in the shopping list.
 */
// Ajustar el tipo ShoppingItem si es necesario
export const isDuplicateIngredient = (cleanedIngredientName: string, shoppingList: any[]): boolean => { 
    if (!shoppingList) return false;
    const lowerCaseName = cleanedIngredientName.toLowerCase();
    // Ajustar la propiedad 'name' si el tipo ShoppingItem es diferente
    return shoppingList.some(item => cleanIngredientText(item.name).toLowerCase() === lowerCaseName && !item.completed); 
};


/**
 * Determines a likely default unit for a given ingredient name.
 */
export const getDefaultUnitForIngredient = (name: string): string => {
    const lowerName = name.toLowerCase();
    if (/\b(leche|agua|aceite|jugo|vino|cerveza|gaseosa|caldo)\b/.test(lowerName)) return 'litros';
    if (/\b(crema|salsa)\b/.test(lowerName)) return 'ml';
    if (/\b(queso|carne|pollo|pescado|arroz|harina|azucar|sal|papa|tomate|zanahoria|lentejas|garbanzos|frijoles|manteca)\b/.test(lowerName)) return 'kg';
    if (/\b(jamon|fiambre)\b/.test(lowerName)) return 'gramos';
    if (/\b(pasta|fideos|galletas|galletitas|yerba|cafe)\b/.test(lowerName)) return 'paquete';
    if (/\b(ajo)\b/.test(lowerName)) return 'cabeza';
    if (/\b(pan)\b/.test(lowerName)) return 'unidad';
    if (/\b(huevo|yogur|manzana|banana|naranja|limon|cebolla|palta|lata|botella)\b/.test(lowerName)) return 'unidad';
    return 'unidad';
};

/**
 * Normaliza una unidad de medida a una forma estándar en minúsculas.
 * Maneja plurales simples y variaciones comunes.
 * @param {string | null} unit La unidad a normalizar.
 * @returns {string | null} La unidad normalizada o null.
 */
export const normalizeUnit = (unit: string | null): string | null => {
  if (!unit) return null;

  const lowerUnit = unit.toLowerCase().trim();

  // Mapeo de unidades comunes y sus variaciones
  const unitMap: { [key: string]: string } = {
    g: 'g',
    gr: 'g',
    gramo: 'g',
    gramos: 'g',
    kg: 'kg',
    kilo: 'kg',
    kilos: 'kg',
    kilogramo: 'kg',
    kilogramos: 'kg',
    l: 'l',
    litro: 'l',
    litros: 'l',
    ml: 'ml',
    mililitro: 'ml',
    mililitros: 'ml',
    taza: 'taza',
    tazas: 'taza',
    cucharada: 'cda',
    cucharadas: 'cda',
    cda: 'cda',
    cdas: 'cda',
    cucharadita: 'cdita',
    cucharaditas: 'cdita',
    cdita: 'cdita',
    cditas: 'cdita',
    unidad: 'unidad',
    unidades: 'unidad',
    diente: 'diente',
    dientes: 'diente',
    cabeza: 'cabeza',
    cabezas: 'cabeza',
    paquete: 'paquete',
    paquetes: 'paquete',
    lata: 'lata',
    latas: 'lata',
    botella: 'botella',
    botellas: 'botella',
    pizca: 'pizca',
    pizcas: 'pizca',
    // Añadir más según sea necesario
  };

  return unitMap[lowerUnit] || lowerUnit; // Devolver normalizado o el original en minúsculas si no hay mapeo
};

/**
 * Intenta convertir una cantidad (string o número) a un número.
 * Maneja fracciones simples ('1/2') y rangos ('1-2', toma el primer número).
 * @param {string | number | null} quantity La cantidad a parsear.
 * @returns {number | null} El valor numérico o null si no se puede parsear.
 */
export const parseQuantity = (quantity: string | number | null): number | null => {
  if (quantity === null || quantity === undefined) return null;
  if (typeof quantity === 'number') return isNaN(quantity) ? null : quantity;
  if (typeof quantity !== 'string') return null;

  const trimmedQty = quantity.trim();
  if (trimmedQty === '') return null;

  // Intentar parseo directo
  const directParse = parseFloat(trimmedQty);
  if (!isNaN(directParse)) return directParse;

  // Manejar fracciones 'X/Y'
  if (trimmedQty.includes('/')) {
    const parts = trimmedQty.split('/');
    if (parts.length === 2) {
      const numerator = parseFloat(parts[0]);
      const denominator = parseFloat(parts[1]);
      if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
        return numerator / denominator;
      }
    }
  }

  // Manejar rangos 'X-Y' (tomar el primer número)
  if (trimmedQty.includes('-')) {
    const parts = trimmedQty.split('-');
    if (parts.length >= 1) { // Puede ser solo '1-' o '1-2'
      const firstNum = parseFloat(parts[0]);
      if (!isNaN(firstNum)) {
        return firstNum;
      }
    }
  }

  // Si nada funcionó
  return null;
};
