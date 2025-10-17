import { normalizeUnit as pantryNormalizeUnit } from '@/features/pantry/lib/pantryParser';

const UNIT_ALIASES: Record<string, string> = {
  kilogramo: 'kg',
  kilogramos: 'kg',
  kilo: 'kg',
  kilos: 'kg',
  kg: 'kg',
  gramo: 'g',
  gramos: 'g',
  gr: 'g',
  g: 'g',
  litro: 'l',
  litros: 'l',
  lt: 'l',
  l: 'l',
  millilitro: 'ml',
  millilitros: 'ml',
  ml: 'ml',
  cucharada: 'cda',
  cucharadas: 'cda',
  cucharadita: 'cdta',
  cucharaditas: 'cdta',
  taza: 'taza',
  tazas: 'taza',
  unidad: 'u',
  unidades: 'u',
  docena: 'doc',
  docenas: 'doc',
};

const FRACTION_REGEX = /^(\d+)\s*\/\s*(\d+)$/;
const MIXED_FRACTION_REGEX = /^(\d+)\s+(\d+)\s*\/\s*(\d+)$/;

export const normalizeUnit = (unit?: string | null): string | null => {
  if (!unit) return null;
  const trimmed = unit.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();
  if (UNIT_ALIASES[lower]) {
    return UNIT_ALIASES[lower];
  }
  const pantryNormalized = pantryNormalizeUnit(lower);
  if (pantryNormalized) {
    return pantryNormalized;
  }
  return lower;
};

export const normalizeQuantity = (quantity: string | number | null | undefined): number | null => {
  if (quantity == null) return null;
  if (typeof quantity === 'number') {
    return Number.isFinite(quantity) ? quantity : null;
  }
  const trimmed = quantity.trim();
  if (!trimmed) return null;

  const mixedMatch = trimmed.match(MIXED_FRACTION_REGEX);
  if (mixedMatch) {
    const whole = Number.parseFloat(mixedMatch[1]);
    const numerator = Number.parseFloat(mixedMatch[2]);
    const denominator = Number.parseFloat(mixedMatch[3]);
    if (!Number.isNaN(whole) && !Number.isNaN(numerator) && !Number.isNaN(denominator) && denominator !== 0) {
      return whole + numerator / denominator;
    }
  }

  const fractionMatch = trimmed.match(FRACTION_REGEX);
  if (fractionMatch) {
    const numerator = Number.parseFloat(fractionMatch[1]);
    const denominator = Number.parseFloat(fractionMatch[2]);
    if (!Number.isNaN(numerator) && !Number.isNaN(denominator) && denominator !== 0) {
      return numerator / denominator;
    }
  }

  const normalizedDecimal = trimmed.replace(',', '.');
  const parsed = Number.parseFloat(normalizedDecimal);
  return Number.isNaN(parsed) ? null : parsed;
};

export const parseIntegerOrNull = (value?: string | number | null): number | null => {
  if (value == null) return null;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? Math.trunc(value) : null;
  }
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isNaN(parsed) ? null : parsed;
};
