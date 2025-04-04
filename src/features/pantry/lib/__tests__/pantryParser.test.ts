import { parsePantryInput, normalizeUnit, ParseResult } from '../pantryParser';

// Helper para extraer datos del resultado exitoso
const expectSuccess = (result: ParseResult) => {
  expect(result.success).toBe(true);
  return (result as { success: true; data: any; usedFallback?: boolean });
};

// Helper para esperar un fallo
const expectFailure = (result: ParseResult, errorType?: 'empty_input' | 'unparseable') => {
  expect(result.success).toBe(false);
  if (errorType && !result.success) {
      expect(result.error).toBe(errorType);
  }
  return (result as { success: false; error: string; originalText: string });
};


describe('pantryParser', () => {
  // Casos de prueba para parsePantryInput
  describe('parsePantryInput', () => {
    test('should parse "Cantidad Unidad Nombre"', () => {
      const result = expectSuccess(parsePantryInput('2 kg harina'));
      expect(result.data.quantity).toBe(2);
      expect(result.data.unit).toBe('kg');
      expect(result.data.ingredientName).toBe('harina');
      expect(result.usedFallback).toBeUndefined();
    });

    test('should parse "CantidadDecimal Unidad Nombre"', () => {
      const result = expectSuccess(parsePantryInput('1.5 lt leche'));
      expect(result.data.quantity).toBe(1.5);
      expect(result.data.unit).toBe('l'); // Normalizado
      expect(result.data.ingredientName).toBe('leche');
    });

    test('should parse "Cantidad Unidad y medio Nombre"', () => {
      const result = expectSuccess(parsePantryInput('1 kg y medio de pollo'));
      expect(result.data.quantity).toBe(1.5);
      expect(result.data.unit).toBe('kg');
      expect(result.data.ingredientName).toBe('pollo');
    });

    test('should parse "Nombre Cantidad Unidad"', () => {
      const result = expectSuccess(parsePantryInput('Leche 1 litro'));
      expect(result.data.quantity).toBe(1);
      expect(result.data.unit).toBe('l'); // Normalizado
      expect(result.data.ingredientName).toBe('Leche'); // Mantiene mayúscula inicial
    });

     test('should parse "Nombre CantidadDecimal Unidad"', () => {
      const result = expectSuccess(parsePantryInput('Pollo 2.5 kg'));
      expect(result.data.quantity).toBe(2.5);
      expect(result.data.unit).toBe('kg');
      expect(result.data.ingredientName).toBe('Pollo');
    });

    test('should parse "Cantidad Nombre" (sin unidad)', () => {
      const result = expectSuccess(parsePantryInput('5 Manzanas'));
      expect(result.data.quantity).toBe(5);
      expect(result.data.unit).toBe('u'); // Unidad por defecto
      expect(result.data.ingredientName).toBe('Manzanas');
    });

     test('should parse "CantidadDecimal Nombre" (sin unidad)', () => {
      const result = expectSuccess(parsePantryInput('0.5 Pan'));
      expect(result.data.quantity).toBe(0.5);
      expect(result.data.unit).toBe('u');
      expect(result.data.ingredientName).toBe('Pan');
    });

    test('should parse "NumeroTexto Nombre"', () => {
      const result = expectSuccess(parsePantryInput('Doce huevos'));
      expect(result.data.quantity).toBe(12);
      expect(result.data.unit).toBe('u');
      expect(result.data.ingredientName).toBe('huevos');
    });

     test('should parse "NumeroTexto Fraccion Nombre"', () => {
      const result = expectSuccess(parsePantryInput('Media sandia'));
      expect(result.data.quantity).toBe(0.5);
      expect(result.data.unit).toBe('u');
      expect(result.data.ingredientName).toBe('sandia');
    });

     test('should parse "NumeroTexto Unidad Nombre"', () => {
        const result = expectSuccess(parsePantryInput('una docena de huevos'));
        expect(result.data.quantity).toBe(1); // "una" es 1
        expect(result.data.unit).toBe('doc'); // "docena" normalizado
        expect(result.data.ingredientName).toBe('huevos'); // "de" eliminado
    });

     test('should parse "Unidad de Nombre"', () => {
        const result = expectSuccess(parsePantryInput('paquete de fideos'));
        expect(result.data.quantity).toBe(1); // Cantidad asumida 1
        expect(result.data.unit).toBe('paq'); // Normalizado
        expect(result.data.ingredientName).toBe('fideos'); // "de" eliminado
    });

    test('should use fallback for "Solo Nombre"', () => {
      const result = expectSuccess(parsePantryInput('Sal'));
      expect(result.data.quantity).toBe(1);
      expect(result.data.unit).toBe('u');
      expect(result.data.ingredientName).toBe('Sal');
      expect(result.usedFallback).toBe(true);
    });

     test('should handle extra spaces', () => {
      const result = expectSuccess(parsePantryInput('  2  kg   harina de trigo  '));
      expect(result.data.quantity).toBe(2);
      expect(result.data.unit).toBe('kg');
      expect(result.data.ingredientName).toBe('harina trigo'); // "de" eliminado
    });

    test('should handle case insensitivity for units', () => {
      const result = expectSuccess(parsePantryInput('1 KG Carne'));
      expect(result.data.quantity).toBe(1);
      expect(result.data.unit).toBe('kg'); // Normalizado a minúscula
      expect(result.data.ingredientName).toBe('Carne');
    });

     test('should handle case insensitivity for text numbers', () => {
      const result = expectSuccess(parsePantryInput('DOS Manzanas'));
      expect(result.data.quantity).toBe(2);
      expect(result.data.unit).toBe('u');
      expect(result.data.ingredientName).toBe('Manzanas');
    });

    test('should return error for empty input', () => {
      expectFailure(parsePantryInput(''), 'empty_input');
    });

     test('should return error for unparseable input', () => {
      expectFailure(parsePantryInput('de'), 'unparseable');
    });

     test('should use fallback for only number (current behavior)', () => {
      // Podría mejorarse para marcar como unparseable, pero probamos el estado actual
      const result = expectSuccess(parsePantryInput('123'));
      expect(result.data.ingredientName).toBe('123');
      expect(result.usedFallback).toBe(true);
    });

  });

  // Casos de prueba para normalizeUnit
  describe('normalizeUnit', () => {
    test('should normalize common units', () => {
      expect(normalizeUnit('kilo')).toBe('kg');
      expect(normalizeUnit('gramos')).toBe('g');
      expect(normalizeUnit('LITROS')).toBe('l');
      expect(normalizeUnit('unidad')).toBe('u');
      expect(normalizeUnit('Docena')).toBe('doc');
      expect(normalizeUnit('paquete')).toBe('paq');
      expect(normalizeUnit('Botella')).toBe('bot');
    });

    test('should return lowercase unit if not in map', () => {
      expect(normalizeUnit('Cucharada')).toBe('cucharada');
      expect(normalizeUnit('slice')).toBe('slice');
    });

    test('should return null for null input', () => {
      expect(normalizeUnit(null)).toBeNull();
    });
  });
});