import { describe, expect, it } from '@jest/globals';
import {
  isBasicPantryIngredient,
  isImpreciseUnit,
  normalizeUnit,
} from '@/lib/ingredientUtils';

describe('ingredientUtils helpers', () => {
  it('identifies extended pantry items such as aceite de oliva', () => {
    expect(isBasicPantryIngredient('Aceite de oliva extra virgen')).toBe(true);
    expect(isBasicPantryIngredient('sal gruesa marina')).toBe(true);
    expect(isBasicPantryIngredient('pollo entero')).toBe(false);
  });

  it('normalizes units and detects imprecise measurements', () => {
    expect(normalizeUnit('Chorrito')).toBe('chorrito');
    expect(isImpreciseUnit('unidad')).toBe(true);
    expect(isImpreciseUnit('pizca')).toBe(true);
    expect(isImpreciseUnit('l')).toBe(false);
  });
});
