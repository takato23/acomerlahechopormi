import { CategoryKeywords } from '../types'; // Asumiendo que CategoryKeywords está en pantry/types

// Mover categoryKeywords aquí (o importarlo de un lugar común si se usa en más sitios)
export const categoryKeywords: CategoryKeywords = {
  'vegetables': {
    exactMatch: ["manzana", "banana", "tomate", "lechuga", "zanahoria", "cebolla", "papa", "pera", "naranja", "limón", "uva", "frutilla", "kiwi", "palta", "ajo", "zapallo", "calabaza", "berenjena", "pepino", "pimiento", "morron", "brocoli", "espinaca", "acelga", "rucula", "mandarina", "pomelo", "durazno", "ciruela", "sandia", "melon", "anana", "mango", "batata", "choclo", "apio", "puerro", "champinon", "champignon"],
    partialMatch: ["fruta", "verdura", "hortaliza", "vegetal"],
    fuzzyMatch: ["verde", "fresco", "organico"],
    priority: 1,
  },
  'dairy': {
    exactMatch: ["leche", "yogur", "yogurt", "queso", "manteca", "crema", "ricota", "huevo", "huevos", "danonino", "casancrem", "finlandia", "mendicrim", "leche cultivada", "leche chocolatada", "dulce de leche"],
    partialMatch: ["lacteo", "descremado", "light", "untable", "rallado", "cremoso"],
    fuzzyMatch: ["sachet", "carton", "potecito"],
    priority: 2,
  },
  'meat': {
    exactMatch: ["carne", "pollo", "pescado", "cerdo", "bife", "milanesa", "hamburguesa", "chorizo", "jamon", "salchicha", "panceta", "bondiola", "lomo", "nalga", "peceto", "cuadril", "vacio", "asado", "matambre", "merluza", "atun", "salmon", "pollo entero", "pata muslo"],
    partialMatch: ["pechuga", "molida", "picada", "feteado", "trozado"],
    fuzzyMatch: ["fresco", "congelado", "kg", "kilo"],
    priority: 3,
  },
   'pantry': {
    exactMatch: ["arroz", "fideos", "polenta", "harina", "azucar", "sal", "aceite", "vinagre", "yerba", "mate cocido", "te", "cafe", "cacao", "galletitas", "pan", "pan lactal", "tostadas", "mermelada", "miel", "cereales", "avena", "legumbres", "lentejas", "garbanzos", "porotos", "arvejas", "choclo en lata", "atun en lata", "sardinas", "pate", "mayonesa", "ketchup", "mostaza", "salsa de tomate", "pure de tomate", "caldo", "sopas", "gelatina", "flan", "polvo para hornear", "levadura", "edulcorante", "stevia", "snacks", "papas fritas", "mani", "pasas de uva", "frutos secos"],
    partialMatch: ["lata", "paquete", "caja", "frasco", "integral", "diet"],
    fuzzyMatch: ["conserva", "seco", "instantaneo"],
    priority: 4,
  },
  'cleaning': {
    exactMatch: ["detergente", "jabon", "lavandina", "desodorante de ambiente", "limpiador", "papel higienico", "rollo de cocina", "servilletas", "esponja", "trapo", "bolsas de residuo", "insecticida", "lustramuebles", "limpiavidrios", "jabon liquido", "jabon en polvo", "suavizante", "quitamanchas", "cif", "ayudin"],
    partialMatch: ["limpia", "desinfectante", "multiuso", "ropa", "pisos", "baño", "cocina"],
    fuzzyMatch: ["anti", "aroma", "perfume", "repuesto"],
    priority: 5,
  },
  'beverages': {
    exactMatch: ["agua", "agua saborizada", "gaseosa", "cerveza", "vino", "jugo", "coca", "sprite", "fanta", "paso de los toros", "seven up", "7up", "fernet", "aperitivo", "speed", "red bull", "monster", "gatorade", "powerade"],
    partialMatch: ["bebida", "refresco", "botella", "lata", "pack", "tetra"],
    fuzzyMatch: ["lt", "litro", "ml", "cc", "sin azucar", "zero", "light"],
    priority: 6,
  },
  'frozen': {
    exactMatch: ["helado", "papas congeladas", "vegetales congelados", "frutas congeladas", "milanesas de soja", "medallones de pollo", "nuggets", "pizza congelada"],
    partialMatch: ["congelado", "frizado"],
    fuzzyMatch: ["listo", "rapido"],
    priority: 7,
  },
  'personal_care': {
    exactMatch: ["shampoo", "acondicionador", "jabon de tocador", "pasta dental", "cepillo de dientes", "desodorante", "talco", "crema corporal", "crema de manos", "protector solar", "repelente", "curitas", "algodon", "gasas", "alcohol", "agua oxigenada", "maquinita de afeitar", "espuma de afeitar", "toallitas femeninas", "tampones", "pañales"],
    partialMatch: ["cuidado", "higiene", "personal", "cabello", "piel", "bucal"],
    fuzzyMatch: ["anti", "pro", "sensitive"],
    priority: 8,
  },
  'other': {
    exactMatch: [],
    partialMatch: [],
    fuzzyMatch: [],
    priority: 99,
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
    let currentMatch: { categoryId: string; priority: number; matchType: 'exact' | 'partial' | 'fuzzy' } | null = null;

    // 1. Exact Match
    if (keywords.exactMatch.some((kw: string) => normalizedItem === normalizeText(kw))) {
      currentMatch = { categoryId, priority: keywords.priority, matchType: 'exact' };
    }

    // 2. Partial Match (solo si no hubo exact match)
    if (!currentMatch && keywords.partialMatch.some((kw: string) => normalizedItem.includes(normalizeText(kw)))) {
      currentMatch = { categoryId, priority: keywords.priority, matchType: 'partial' };
    }

    // 3. Fuzzy Match (opcional, solo si no hubo otros matches)
    // Implementación simple: buscar palabras sueltas
    if (!currentMatch && keywords.fuzzyMatch && keywords.fuzzyMatch.length > 0) {
       const itemWords = normalizedItem.split(' ');
       if (keywords.fuzzyMatch.some((kw: string) => itemWords.includes(normalizeText(kw)))) {
          currentMatch = { categoryId, priority: keywords.priority, matchType: 'fuzzy' };
       }
    }

    // Comparar con el mejor match encontrado hasta ahora
    if (currentMatch) {
        if (!bestMatch || currentMatch.priority < bestMatch.priority) {
            bestMatch = currentMatch;
        }
        // Podríamos añadir lógica para desempatar si la prioridad es la misma
        // (ej: preferir exact sobre partial, partial sobre fuzzy)
    }
  }

  return bestMatch ? bestMatch.categoryId : null;
}