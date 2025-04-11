export function normalizeIngredientName(name: string, quantity: number = 1): string {
  if (!name) return '';

  let normalizedName = name.toLowerCase().trim();

  if (quantity === 1) {
    // Convertir a singular
    if (normalizedName.endsWith('es')) {
      normalizedName = normalizedName.slice(0, -2);
    } else if (normalizedName.endsWith('s') && !normalizedName.endsWith('ís')) {
      normalizedName = normalizedName.slice(0, -1);
    }
  } else {
    // Convertir a plural
    if (!normalizedName.endsWith('s')) {
      if (normalizedName.endsWith('z')) {
        normalizedName = normalizedName.slice(0, -1) + 'ces';
      } else if (normalizedName.endsWith('ón')) {
        normalizedName = normalizedName.slice(0, -2) + 'ones';
      } else {
        normalizedName += 's';
      }
    }
  }

  return normalizedName.charAt(0).toUpperCase() + normalizedName.slice(1);
}

export function cleanIngredientText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '');
}

export function parseQuantity(text: string): { amount: number; unit: string } {
  const defaultResult = { amount: 1, unit: '' };
  if (!text) return defaultResult;

  // Expresión regular para encontrar números y unidades
  const match = text.match(/^(\d*\.?\d+)\s*([a-zA-Z]+)?/);
  if (!match) return defaultResult;

  const amount = parseFloat(match[1]) || 1;
  const unit = (match[2] || '').toLowerCase();

  return { amount, unit };
}

export function normalizeUnit(unit: string): string {
  const unitMappings: { [key: string]: string } = {
    'kg': 'kg',
    'kilo': 'kg',
    'kilos': 'kg',
    'kilogramo': 'kg',
    'kilogramos': 'kg',
    'g': 'g',
    'gr': 'g',
    'grs': 'g',
    'gramo': 'g',
    'gramos': 'g',
    'l': 'l',
    'lt': 'l',
    'lts': 'l',
    'litro': 'l',
    'litros': 'l',
    'ml': 'ml',
    'mililitro': 'ml',
    'mililitros': 'ml',
    'cc': 'ml',
    'taza': 'taza',
    'tazas': 'taza',
    'cdta': 'cdta',
    'cucharadita': 'cdta',
    'cucharaditas': 'cdta',
    'cda': 'cda',
    'cucharada': 'cda',
    'cucharadas': 'cda',
    'un': 'un',
    'unidad': 'un',
    'unidades': 'un',
  };

  const normalizedUnit = unit.toLowerCase().trim();
  return unitMappings[normalizedUnit] || normalizedUnit;
}

export function convertUnits(amount: number, fromUnit: string, toUnit: string): number {
  const conversions: { [key: string]: { [key: string]: number } } = {
    'kg': { 'g': 1000 },
    'g': { 'kg': 0.001 },
    'l': { 'ml': 1000 },
    'ml': { 'l': 0.001 },
  };

  const normalized = {
    from: normalizeUnit(fromUnit),
    to: normalizeUnit(toUnit)
  };

  if (normalized.from === normalized.to) return amount;

  const conversion = conversions[normalized.from]?.[normalized.to];
  if (conversion) {
    return amount * conversion;
  }

  // Si no hay conversión disponible, retornar la cantidad original
  return amount;
}
