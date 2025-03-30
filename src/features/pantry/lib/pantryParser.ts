/**
 * Parsea una cadena de texto para extraer cantidad, unidad y nombre de ingrediente.
 * Intenta reconocer patrones como:
 * - "2 kg harina"
 * - "Leche 1 litro"
 * - "5 Manzanas"
 * - "una docena de huevos"
 * - "Sal" (sin cantidad ni unidad)
 */

// Mapeo de números en texto a valores numéricos
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
  'doce': 12,
  'medio': 0.5, 'media': 0.5,
};

// Lista simple de unidades comunes
const COMMON_UNITS = [
  // Unidades de peso/masa
  'kg', 'kilo', 'kilos', 'gr', 'gramo', 'gramos',
  // Unidades de volumen
  'lt', 'lts', 'litro', 'litros', 'ml', 'cc',
  // Unidades de conteo
  'unidad', 'unidades', 'u', 'un',
  'docena', 'docenas',
  'par', 'pares',
  // Contenedores
  'paquete', 'paquetes', 'caja', 'cajas',
  'lata', 'latas', 'botella', 'botellas',
  'sachet', 'sachets',
  'atado', 'atados',
];

// Palabras que pueden ignorarse en el procesamiento
const IGNORE_WORDS = ['de', 'del', 'la', 'el', 'los', 'las'];

// Regex para unidades comunes (case-insensitive, palabra completa)
const UNITS_REGEX = new RegExp(`\\b(${COMMON_UNITS.join('|')})s?\\b`, 'i');

export interface ParsedPantryInput {
  quantity: number | null;
  unit: string | null;
  ingredientName: string;
  suggestedCategoryId?: string | null;
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

export function parsePantryInput(text: string): ParsedPantryInput | null {
  const inputText = text.trim();
  if (!inputText) {
    return null;
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
        return { quantity, unit, ingredientName };
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
      ingredientName = cleanIngredientName(potentialName);
      return { quantity, unit, ingredientName };
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
      return { quantity, unit, ingredientName };
    }
  }

  // --- Estrategia 4: Buscar "Cantidad Nombre" (sin unidad) ---
  // Ej: "5 Manzanas", "1 Pan"
  const matchQtyName = inputText.match(/^(\d*\.?\d+)\s+(.+)$/i);
  if (matchQtyName) {
    quantity = parseFloat(matchQtyName[1]);
    unit = normalizeUnit('unidad');
    ingredientName = cleanIngredientName(matchQtyName[2]);
    return { quantity, unit, ingredientName };
  }

  // --- Estrategia 5: Buscar "Unidad de Nombre" ---
  // Ej: "paquete de café", "lata de tomates"
  const matchUnitDeName = inputText.match(new RegExp(`^(${COMMON_UNITS.join('|')})s?\\s+de\\s+(.+)$`, 'i'));
  if (matchUnitDeName) {
    quantity = 1; // Asumir cantidad 1 para este patrón
    unit = normalizeUnit(matchUnitDeName[1]);
    ingredientName = cleanIngredientName(matchUnitDeName[2]);
    return { quantity, unit, ingredientName };
  }

  // --- Estrategia 6: Solo Nombre (Fallback) ---
  // Si ninguna de las anteriores funcionó, asumir que todo es el nombre
  quantity = 1;
  unit = normalizeUnit('unidad'); // Unidad por defecto 'u'
  ingredientName = cleanIngredientName(inputText);
  return { quantity, unit, ingredientName };
}

const UNIT_NORMALIZATION_MAP: Record<string, string> = {
  // Peso/masa
  'kilo': 'kg', 'kilos': 'kg',
  'gramo': 'gr', 'gramos': 'gr',
  // Volumen
  'litro': 'lt', 'litros': 'lt',
  // Conteo
  'unidades': 'u', 'un': 'u', 'unidad': 'u',
  'docena': 'doc', 'docenas': 'doc',
  'par': 'par', 'pares': 'par',
};

export function normalizeUnit(unit: string | null): string | null {
  if (!unit) return null;
  const lowerUnit = unit.toLowerCase();
  return UNIT_NORMALIZATION_MAP[lowerUnit] || lowerUnit;
}