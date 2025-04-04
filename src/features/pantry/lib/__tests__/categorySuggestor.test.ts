import { suggestCategory } from '../categorySuggestor';

describe('categorySuggestor', () => {
  describe('suggestCategory', () => {
    // Casos de coincidencia exacta
    test('should suggest "meat" for "pollo"', () => {
      expect(suggestCategory('pollo')).toBe('meat');
    });

    test('should suggest "meat" for "milanesa"', () => {
      expect(suggestCategory('milanesa')).toBe('meat');
    });

    test('should suggest "dairy" for "leche"', () => {
      expect(suggestCategory('leche')).toBe('dairy');
    });

    test('should suggest "vegetables" for "manzana"', () => {
      expect(suggestCategory('manzana')).toBe('vegetables');
    });

    test('should suggest "pantry" for "arroz"', () => {
      expect(suggestCategory('arroz')).toBe('pantry');
    });

    // Casos de coincidencia parcial
    test('should suggest "meat" for "carne picada"', () => {
      // 'carne' está en exactMatch, pero la lógica actual podría priorizar partialMatch si se implementa diferente.
      // Asumiendo que la lógica actual prioriza exactMatch si una palabra coincide.
      // Si no, podría ser 'proteína' (partialMatch). Probamos el resultado esperado actual.
      expect(suggestCategory('carne picada')).toBe('meat'); // 'carne' es exactMatch
    });

     test('should suggest "meat" for "suprema de pollo"', () => {
       expect(suggestCategory('suprema de pollo')).toBe('meat'); // 'pollo' es exactMatch
     });

     test('should suggest "vegetables" for "ensalada de fruta"', () => {
       expect(suggestCategory('ensalada de fruta')).toBe('vegetables'); // 'fruta' es partialMatch
     });

     test('should suggest "dairy" for "queso lácteo"', () => {
       // 'queso' es exactMatch, 'lácteo' es partialMatch. Debería priorizar 'queso'.
       expect(suggestCategory('queso lácteo')).toBe('dairy');
     });

    // Casos sin coincidencia
    test('should return null for unknown items', () => {
      expect(suggestCategory('tornillos')).toBeNull();
      expect(suggestCategory('xyz')).toBeNull();
    });

    test('should return null for empty string', () => {
      expect(suggestCategory('')).toBeNull();
    });

    test('should return null for whitespace string', () => {
      expect(suggestCategory('   ')).toBeNull();
    });

    // Casos con mayúsculas/minúsculas
    test('should be case-insensitive', () => {
      expect(suggestCategory('LeChUgA')).toBe('vegetables'); // exactMatch
      expect(suggestCategory('FiAmBrE')).toBe('meat'); // partialMatch
    });

    // Casos con palabras clave en diferentes partes del string
    test('should find keyword anywhere in the string for partial match', () => {
        // La lógica actual usa includes(), así que debería funcionar.
        expect(suggestCategory('bebida gaseosa')).toBe('beverages'); // 'bebida' es partialMatch
        expect(suggestCategory('pan de CEREAL integral')).toBe('pantry'); // 'cereal' es partialMatch
    });

     // Caso límite: palabra clave exacta como subcadena (no debería coincidir como exacta)
     test('should not trigger exact match for substring', () => {
         // 'pan' es exactMatch para 'pantry', pero 'empanada' no debería ser 'pantry'
         expect(suggestCategory('empanada')).toBeNull(); // Asumiendo que no hay otra keyword que coincida
     });

  });
});