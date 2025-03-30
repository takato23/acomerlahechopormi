import { CategoryKeywords } from '../types/categoryTypes';

/**
 * Diccionario de palabras clave por ID de categoría para auto-categorización.
 * La prioridad determina qué categoría se elige si hay múltiples coincidencias
 * (menor número = mayor prioridad).
 */
export const categoryKeywords: CategoryKeywords = {
  // Verduras y Frutas
  'vegetables': {
    exactMatch: [
      "manzana", "banana", "tomate", "lechuga", "zanahoria", "cebolla", "papa",
      "pera", "naranja", "limón", "uva", "frutilla", "kiwi", "palta", "ajo",
      "zapallo", "calabaza", "berenjena", "pepino", "pimiento", "morron", "brocoli",
      "espinaca", "acelga", "rucula", "mandarina", "pomelo", "durazno", "ciruela",
      "sandia", "melon", "anana", "mango", "batata", "choclo", "apio", "puerro",
      "champinon", "champignon"
    ],
    partialMatch: ["fruta", "verdura", "hortaliza", "vegetal"],
    fuzzyMatch: ["verde", "fresco", "organico"],
    priority: 1,
  },
  // Lácteos y Huevos
  'dairy': {
    exactMatch: [
      "leche", "yogur", "yogurt", "queso", "manteca", "crema", "ricota",
      "huevo", "huevos", "danonino", "casancrem", "finlandia", "mendicrim",
      "leche cultivada", "leche chocolatada", "dulce de leche"
    ],
    partialMatch: ["lacteo", "descremado", "light", "untable", "rallado", "cremoso"],
    fuzzyMatch: ["sachet", "carton", "potecito"],
    priority: 2,
  },
  // Carnes y Pescados
  'meat': {
    exactMatch: [
      "carne", "pollo", "pescado", "cerdo", "bife", "milanesa", "hamburguesa",
      "chorizo", "jamon", "salchicha", "panceta", "bondiola", "lomo", "nalga",
      "peceto", "cuadril", "vacio", "asado", "matambre", "merluza", "atun",
      "salmon", "pollo entero", "pata muslo"
    ],
    partialMatch: ["pechuga", "molida", "picada", "feteado", "trozado"],
    fuzzyMatch: ["fresco", "congelado", "kg", "kilo"],
    priority: 3,
  },
  // Almacén / Despensa
  'pantry': {
    exactMatch: [
      "arroz", "fideos", "polenta", "harina", "azucar", "sal", "aceite", "vinagre",
      "yerba", "mate cocido", "te", "cafe", "cacao", "galletitas", "pan",
      "pan lactal", "tostadas", "mermelada", "miel", "cereales", "avena",
      "legumbres", "lentejas", "garbanzos", "porotos", "arvejas", "choclo en lata",
      "atun en lata", "sardinas", "pate", "mayonesa", "ketchup", "mostaza",
      "salsa de tomate", "pure de tomate", "caldo", "sopas", "gelatina", "flan",
      "polvo para hornear", "levadura", "edulcorante", "stevia", "snacks",
      "papas fritas", "mani", "pasas de uva", "frutos secos"
    ],
    partialMatch: ["lata", "paquete", "caja", "frasco", "integral", "diet"],
    fuzzyMatch: ["conserva", "seco", "instantaneo"],
    priority: 4,
  },
  // Limpieza
  'cleaning': {
    exactMatch: [
      "detergente", "jabon", "lavandina", "desodorante de ambiente", "limpiador",
      "papel higienico", "rollo de cocina", "servilletas", "esponja", "trapo",
      "bolsas de residuo", "insecticida", "lustramuebles", "limpiavidrios",
      "jabon liquido", "jabon en polvo", "suavizante", "quitamanchas", "cif", "ayudin"
    ],
    partialMatch: ["limpia", "desinfectante", "multiuso", "ropa", "pisos", "baño", "cocina"],
    fuzzyMatch: ["anti", "aroma", "perfume", "repuesto"],
    priority: 5,
  },
  // Bebidas
  'beverages': {
    exactMatch: [
      "agua", "agua saborizada", "gaseosa", "cerveza", "vino", "jugo", "coca",
      "sprite", "fanta", "paso de los toros", "seven up", "7up", "fernet", "aperitivo",
      "speed", "red bull", "monster", "gatorade", "powerade"
    ],
    partialMatch: ["bebida", "refresco", "botella", "lata", "pack", "tetra"],
    fuzzyMatch: ["lt", "litro", "ml", "cc", "sin azucar", "zero", "light"],
    priority: 6,
  },
  // Congelados
  'frozen': {
    exactMatch: [
      "helado", "papas congeladas", "vegetales congelados", "frutas congeladas",
      "milanesas de soja", "medallones de pollo", "nuggets", "pizza congelada"
    ],
    partialMatch: ["congelado", "frizado"],
    fuzzyMatch: ["listo", "rapido"],
    priority: 7,
  },
  // Cuidado Personal
  'personal_care': {
    exactMatch: [
        "shampoo", "acondicionador", "jabon de tocador", "pasta dental", "cepillo de dientes",
        "desodorante", "talco", "crema corporal", "crema de manos", "protector solar",
        "repelente", "curitas", "algodon", "gasas", "alcohol", "agua oxigenada",
        "maquinita de afeitar", "espuma de afeitar", "toallitas femeninas", "tampones",
        "pañales"
    ],
    partialMatch: ["cuidado", "higiene", "personal", "cabello", "piel", "bucal"],
    fuzzyMatch: ["anti", "pro", "sensitive"],
    priority: 8,
  },
  // Otros
  'other': {
    exactMatch: [], // Dejar vacío o añadir ítems muy genéricos
    partialMatch: [],
    fuzzyMatch: [],
    priority: 99, // Menor prioridad
  },
};

/**
 * Normaliza el texto para comparación: minúsculas, sin acentos, sin espacios extra.
 */
export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD') // Separa acentos de letras base
    .replace(/[\u0300-\u036f]/g, '') // Elimina los acentos
    .replace(/\s+/g, ' ') // Reemplaza múltiples espacios por uno solo
    .trim();
}

/**
 * Función simple para sugerir una categoría basada en palabras clave.
 * Devuelve el ID de la categoría sugerida o null si no hay coincidencia.
 */
export function suggestCategoryByKeywords(itemName: string): string | null {
  const normalizedItem = normalizeText(itemName);
  if (!normalizedItem) return null;

  let bestMatch: { categoryId: string; priority: number; matchType: 'exact' | 'partial' | 'fuzzy' } | null = null;

  for (const categoryId in categoryKeywords) {
    const keywords = categoryKeywords[categoryId];

    // 1. Exact Match
    if (keywords.exactMatch.some(kw => normalizedItem === normalizeText(kw))) {
      if (!bestMatch || keywords.priority < bestMatch.priority) {
        bestMatch = { categoryId, priority: keywords.priority, matchType: 'exact' };
      }
      continue; // Si hay match exacto, es la mejor opción para esta categoría
    }

    // 2. Partial Match (solo si no hubo match exacto o si la prioridad es mejor)
    if (!bestMatch || keywords.priority < bestMatch.priority || (keywords.priority === bestMatch.priority && bestMatch.matchType !== 'exact')) {
      if (keywords.partialMatch.some(kw => normalizedItem.includes(normalizeText(kw)))) {
         if (!bestMatch || keywords.priority < bestMatch.priority || (keywords.priority === bestMatch.priority && bestMatch.matchType === 'fuzzy')) {
            bestMatch = { categoryId, priority: keywords.priority, matchType: 'partial' };
         }
      }
    }

    // 3. Fuzzy Match (opcional, menor prioridad)
    // Implementación simple: buscar palabras sueltas
    if (keywords.fuzzyMatch && (!bestMatch || keywords.priority < bestMatch.priority || bestMatch.matchType === 'fuzzy')) {
       const itemWords = normalizedItem.split(' ');
       if (keywords.fuzzyMatch.some(kw => itemWords.includes(normalizeText(kw)))) {
          if (!bestMatch || keywords.priority < bestMatch.priority) {
             bestMatch = { categoryId, priority: keywords.priority, matchType: 'fuzzy' };
          }
       }
    }
  }

  return bestMatch ? bestMatch.categoryId : null;
}