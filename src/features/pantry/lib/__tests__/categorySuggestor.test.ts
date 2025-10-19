import { vi } from 'vitest';

const mockMap: Record<string, string | null> = {
  pollo: 'meat',
  milanesa: 'meat',
  leche: 'dairy',
  manzana: 'vegetables',
  arroz: 'pantry',
  'carne picada': 'meat',
  'suprema de pollo': 'meat',
  'ensalada de fruta': 'vegetables',
  'queso lácteo': 'dairy',
  tornillos: null,
  xyz: null,
  '': null,
  '   ': null,
  lechuga: 'vegetables',
  fiambre: 'meat',
  'bebida gaseosa': 'beverages',
  'pan de cereal integral': 'pantry',
  empanada: null,
};

vi.mock('../../shopping-list/lib/categoryInference', () => ({
  inferCategory: vi.fn(async (itemName: string) => mockMap[itemName.toLowerCase()] ?? null),
}));

const { suggestCategory } = await import('../categorySuggestor');

describe.skip('categorySuggestor', () => {
  describe('suggestCategory', () => {
    // Casos de coincidencia exacta
    test('should suggest "meat" for "pollo"', async () => {
      await expect(suggestCategory('pollo')).resolves.toBe('meat');
    });

    test('should suggest "meat" for "milanesa"', async () => {
      await expect(suggestCategory('milanesa')).resolves.toBe('meat');
    });

    test('should suggest "dairy" for "leche"', async () => {
      await expect(suggestCategory('leche')).resolves.toBe('dairy');
    });

    test('should suggest "vegetables" for "manzana"', async () => {
      await expect(suggestCategory('manzana')).resolves.toBe('vegetables');
    });

    test('should suggest "pantry" for "arroz"', async () => {
      await expect(suggestCategory('arroz')).resolves.toBe('pantry');
    });

    // Casos de coincidencia parcial
    test('should suggest "meat" for "carne picada"', async () => {
      await expect(suggestCategory('carne picada')).resolves.toBe('meat');
    });

    test('should suggest "meat" for "suprema de pollo"', async () => {
      await expect(suggestCategory('suprema de pollo')).resolves.toBe('meat');
    });

    test('should suggest "vegetables" for "ensalada de fruta"', async () => {
      await expect(suggestCategory('ensalada de fruta')).resolves.toBe('vegetables');
    });

    test('should suggest "dairy" for "queso lácteo"', async () => {
      await expect(suggestCategory('queso lácteo')).resolves.toBe('dairy');
    });

    // Casos sin coincidencia
    test('should return null for unknown items', async () => {
      await expect(suggestCategory('tornillos')).resolves.toBeNull();
      await expect(suggestCategory('xyz')).resolves.toBeNull();
    });

    test('should return null for empty string', async () => {
      await expect(suggestCategory('')).resolves.toBeNull();
    });

    test('should return null for whitespace string', async () => {
      await expect(suggestCategory('   ')).resolves.toBeNull();
    });

    // Casos con mayúsculas/minúsculas
    test('should be case-insensitive', async () => {
      await expect(suggestCategory('LeChUgA')).resolves.toBe('vegetables');
      await expect(suggestCategory('FiAmBrE')).resolves.toBe('meat');
    });

    // Casos con palabras clave en diferentes partes del string
    test('should find keyword anywhere in the string for partial match', async () => {
      await expect(suggestCategory('bebida gaseosa')).resolves.toBe('beverages');
      await expect(suggestCategory('pan de CEREAL integral')).resolves.toBe('pantry');
    });

    // Caso límite: palabra clave exacta como subcadena (no debería coincidir como exacta)
    test('should not trigger exact match for substring', async () => {
      await expect(suggestCategory('empanada')).resolves.toBeNull();
    });
  });
});
