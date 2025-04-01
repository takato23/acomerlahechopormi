/**
 * Parsea una cadena de texto para extraer cantidad, unidad y nombre de ingrediente.
 * Intenta reconocer patrones como:
 * - "2 kg harina"
 * - "Leche 1 litro"
 * - "5 Manzanas"
 * - "una docena de huevos"
 * - "Sal" (sin cantidad ni unidad)
 */

// Mapeo expandido de números en texto a valores numéricos
const TEXT_NUMBERS: Record<string, number> = {
  'un': 1, 'una': 1,
  'dos': 2,
  'tres': 3,
  'cuatro': 4,
  'cinco': 5,
  'seis': 6,
  'siete': 7,
  'ocho': 8,
  'nueve': 9,
  'diez': 10,
  'once': 11,
  'doce': 12, // docena
  'trece': 13,
  'catorce': 14,
  'quince': 15,
  'veinte': 20,
  'treinta': 30,
  'cuarenta': 40,
  'cincuenta': 50,
  'medio': 0.5, 'media': 0.5, // medio/media
  // Podrían añadirse más si es necesario (ej: dieciseis, veintiuno, etc.)
};

// Lista simple de unidades comunes
// Lista expandida y refinada de unidades comunes y sus variantes
const COMMON_UNITS = [
  // Peso/Masa
  'kg', 'kilo', 'kilos', 'g', 'gr', 'gramo', 'gramos', 'libra', 'libras', 'lb', 'lbs', 'onza', 'onzas', 'oz',
  // Volumen
  'l', 'lt', 'lts', 'litro', 'litros', 'ml', 'cc', 'galon', 'galones', 'gal',
  // Conteo
  'u', 'un', 'unidad', 'unidades',
  'doc', 'docena', 'docenas',
  'par', 'pares',
  // Contenedores/Formatos
  'paq', 'paquete', 'paquetes', 'caja', 'cajas',
  'lata', 'latas', 'bot', 'botella', 'botellas',
  'sachet', 'sachets',
  'atado', 'atados',
  'bandeja', 'bandejas',
  'rollo', 'rollos',
  'tableta', 'tabletas',
  'barra', 'barras',
  'bolsa', 'bolsas',
  'frasco', 'frascos',
  'tarro', 'tarros',
];

// Palabras que pueden ignorarse en el procesamiento
const IGNORE_WORDS = ['de', 'del', 'la', 'el', 'los', 'las'];

// Regex para unidades comunes (case-insensitive, palabra completa)
// Regex mejorada para unidades comunes (case-insensitive, palabra completa o abreviatura seguida de espacio/fin)
// Incluye 's' opcional al final para plurales simples
const UNITS_REGEX = new RegExp(`\\b(${COMMON_UNITS.join('|')})(s?)\\b`, 'i');

// Tipo de resultado del parseo, indicando éxito o tipo de fallo
export type ParseResult =
  | { success: true; data: ParsedPantryInput; usedFallback?: boolean }
  | { success: false; error: 'empty_input' | 'unparseable'; originalText: string };

// Datos parseados de un ítem
export interface ParsedPantryInput {
  quantity: number | null;
  unit: string | null;
  ingredientName: string;
  suggestedCategoryId?: string | null; // Se mantiene para compatibilidad, se asignará después
}

function parseTextNumber(text: string): number | null {
  const normalized = text.toLowerCase();
  return TEXT_NUMBERS[normalized] ?? null;
}

function cleanIngredientName(name: string): string {
  // Eliminar palabras de conexión y espacios extra
  return name
    .split(' ')
    .filter(word => !IGNORE_WORDS.includes(word.toLowerCase()))
    .join(' ')
    .trim();
}

export function parsePantryInput(text: string): ParseResult {
  const originalText = text;
  const inputText = text.trim();
  if (!inputText) {
    return { success: false, error: 'empty_input', originalText };
  }

  let quantity: number | null = null;
  let unit: string | null = null;
  let ingredientName = inputText;

  // --- Estrategia 1: Buscar números en texto al inicio ---
  // Ej: "una docena de huevos", "medio kilo de azúcar"
  const textNumberMatch = inputText.match(
    new RegExp(`^(${Object.keys(TEXT_NUMBERS).join('|')})\\s+([a-zA-Záéíóúñ]+)\\s+(.+)$`, 'i')
  );
  if (textNumberMatch) {
    const textNumber = parseTextNumber(textNumberMatch[1]);
    if (textNumber !== null) {
      const potentialUnit = textNumberMatch[2].toLowerCase();
      const restOfText = textNumberMatch[3];

      if (UNITS_REGEX.test(potentialUnit)) {
        quantity = textNumber;
        unit = normalizeUnit(potentialUnit);
        ingredientName = cleanIngredientName(restOfText);
        return { success: true, data: { quantity, unit, ingredientName } };
      }
    }
  }

  // --- Estrategia 2: Buscar "Cantidad Unidad Nombre" ---
  // Ej: "2 kg harina", "1.5 lt leche"
  const matchQtyUnitName = inputText.match(/^(\d*\.?\d+)\s*([a-zA-Záéíóúñ]+)\s+(.+)$/i);
  if (matchQtyUnitName) {
    const potentialQty = parseFloat(matchQtyUnitName[1]);
    const potentialUnit = matchQtyUnitName[2].toLowerCase();
    const potentialName = matchQtyUnitName[3];

    if (UNITS_REGEX.test(potentialUnit)) {
      quantity = potentialQty;
      unit = normalizeUnit(potentialUnit);
      ingredientName = potentialName.trim(); // No limpiar aún con cleanIngredientName

      // Revisar si el nombre empieza con "y medio" o "y media"
      if (ingredientName.toLowerCase().startsWith('y medio') || ingredientName.toLowerCase().startsWith('y media')) {
          quantity += 0.5;
          // Eliminar "y medio/a" del inicio del nombre (considerando posible espacio extra)
          ingredientName = ingredientName.replace(/^y\s+(medio|media)\s*/i, '').trim();
      }

      ingredientName = cleanIngredientName(ingredientName); // Limpiar el nombre restante
      return { success: true, data: { quantity, unit, ingredientName } };
    }
  }
  
    // --- Nueva Estrategia 3.5: Buscar "NumeroTexto Nombre" ---
    // Ej: "Doce huevos", "Medio pollo"
    const matchTextNumberName = inputText.match(
        new RegExp(`^(${Object.keys(TEXT_NUMBERS).join('|')})\\s+(.+)$`, 'i')
    );
    if (matchTextNumberName) {
        const textNumber = parseTextNumber(matchTextNumberName[1]);
        if (textNumber !== null) {
            quantity = textNumber;
            unit = normalizeUnit('u'); // Asumir unidad 'u' para este patrón
            ingredientName = cleanIngredientName(matchTextNumberName[2]);
            return { success: true, data: { quantity, unit, ingredientName } };
        }
    }
  
  // --- Estrategia 3: Buscar "Nombre Cantidad Unidad" ---
  // Ej: "Harina 1 kg", "Leche 1.5 lt"
  const matchNameQtyUnit = inputText.match(/^(.+?)\s+(\d*\.?\d+)\s*([a-zA-Záéíóúñ]*)$/i);
  if (matchNameQtyUnit) {
    const potentialName = matchNameQtyUnit[1];
    const potentialQty = parseFloat(matchNameQtyUnit[2]);
    const potentialUnit = matchNameQtyUnit[3]?.toLowerCase() || null;

    if (!potentialUnit || UNITS_REGEX.test(potentialUnit)) {
      quantity = potentialQty;
      unit = normalizeUnit(potentialUnit);
      ingredientName = cleanIngredientName(potentialName);
      return { success: true, data: { quantity, unit, ingredientName } };
    }
  }

  // --- Estrategia 4: Buscar "Cantidad Nombre" (sin unidad) ---
  // Ej: "5 Manzanas", "1 Pan", "15 huevos"
  const matchQtyName = inputText.match(/^(\d*\.?\d+)\s+(.+)$/i);
  if (matchQtyName) {
    quantity = parseFloat(matchQtyName[1]);
    unit = normalizeUnit('unidad');
    ingredientName = cleanIngredientName(matchQtyName[2]);
    return { success: true, data: { quantity, unit, ingredientName } };
  }

  // --- Estrategia 5: Buscar "Unidad de Nombre" ---
  // Ej: "paquete de café", "lata de tomates"
  const matchUnitDeName = inputText.match(new RegExp(`^(${COMMON_UNITS.join('|')})s?\\s+de\\s+(.+)$`, 'i'));
  if (matchUnitDeName) {
    quantity = 1; // Asumir cantidad 1 para este patrón
    unit = normalizeUnit(matchUnitDeName[1]);
    ingredientName = cleanIngredientName(matchUnitDeName[2]);
    return { success: true, data: { quantity, unit, ingredientName } };
  }

  // --- Estrategia 6: Solo Nombre (Fallback) ---
  // Si ninguna de las anteriores funcionó, intentar asumir que todo es el nombre
  // Devolvemos un flag para que la UI sepa que se usó el fallback
  quantity = 1;
  unit = normalizeUnit('u'); // Unidad por defecto 'u'
  ingredientName = cleanIngredientName(inputText);

  // Podríamos añadir una validación extra aquí: si el nombre resultante es muy corto o parece una unidad/número, marcar como no parseable.
  // Por ahora, lo dejamos como fallback.
  if (ingredientName) {
      return { success: true, data: { quantity, unit, ingredientName }, usedFallback: true };
  }

  // Si incluso el fallback falla (ej: input era solo "de"), marcar como no parseable
  return { success: false, error: 'unparseable', originalText };
}

const UNIT_NORMALIZATION_MAP: Record<string, string> = {
  // Peso/Masa
  'kilo': 'kg', 'kilos': 'kg',
  'g': 'g', 'gr': 'g', 'gramo': 'g', 'gramos': 'g',
  'libra': 'lb', 'libras': 'lb', 'lbs': 'lb',
  'onza': 'oz', 'onzas': 'oz',
  // Volumen
  'l': 'l', 'lt': 'l', 'lts': 'l', 'litro': 'l', 'litros': 'l',
  'ml': 'ml', 'cc': 'ml',
  'galon': 'gal', 'galones': 'gal',
  // Conteo
  'u': 'u', 'un': 'u', 'unidad': 'u', 'unidades': 'u',
  'doc': 'doc', 'docena': 'doc', 'docenas': 'doc',
  'par': 'par', 'pares': 'par',
  // Contenedores/Formatos
  'paq': 'paq', 'paquete': 'paq', 'paquetes': 'paq',
  'caja': 'caja', 'cajas': 'caja',
  'lata': 'lata', 'latas': 'lata',
  'bot': 'bot', 'botella': 'bot', 'botellas': 'bot',
  'sachet': 'sachet', 'sachets': 'sachet',
  'atado': 'atado', 'atados': 'atado',
  'bandeja': 'bandeja', 'bandejas': 'bandeja',
  'rollo': 'rollo', 'rollos': 'rollo',
  'tableta': 'tableta', 'tabletas': 'tableta',
  'barra': 'barra', 'barras': 'barra',
  'bolsa': 'bolsa', 'bolsas': 'bolsa',
  'frasco': 'frasco', 'frascos': 'frasco',
  'tarro': 'tarro', 'tarros': 'tarro',
};

export function normalizeUnit(unit: string | null): string | null {
  if (!unit) return null;
  const lowerUnit = unit.toLowerCase();
  return UNIT_NORMALIZATION_MAP[lowerUnit] || lowerUnit;
}