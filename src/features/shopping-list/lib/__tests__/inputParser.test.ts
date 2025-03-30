import { parseShoppingInput } from '../inputParser';

describe('parseShoppingInput', () => {
  // Casos básicos
  test('debería parsear solo nombre', () => {
    expect(parseShoppingInput("Manzanas")).toEqual({
      name: 'Manzanas', quantity: null, unit: null
    });
    expect(parseShoppingInput("  Pata muslo de pollo  ")).toEqual({
      name: 'Pata muslo de pollo', quantity: null, unit: null
    });
  });

  // Casos con cantidad numérica
  test('debería parsear cantidad numérica y nombre', () => {
    expect(parseShoppingInput("2 Manzanas")).toEqual({
      name: 'Manzanas', quantity: 2, unit: null
    });
    expect(parseShoppingInput("10 Hamburguesas")).toEqual({
      name: 'Hamburguesas', quantity: 10, unit: null
    });
  });

  test('debería parsear cantidad decimal y nombre', () => {
    expect(parseShoppingInput("1.5 Leche")).toEqual({
      name: 'Leche', quantity: 1.5, unit: null
    });
  });

  // Casos con cantidad en palabras
  test('debería parsear cantidad en palabra y nombre', () => {
    expect(parseShoppingInput("dos Manzanas")).toEqual({
      name: 'Manzanas', quantity: 2, unit: null
    });
    expect(parseShoppingInput("una Hamburguesa")).toEqual({
      name: 'Hamburguesa', quantity: 1, unit: null
    });
     expect(parseShoppingInput("Tres leches")).toEqual({
      name: 'Leches', quantity: 3, unit: null
    });
  });

  // Casos con unidad
  test('debería parsear cantidad, unidad y nombre', () => {
    expect(parseShoppingInput("2 kg Manzanas")).toEqual({
      name: 'Manzanas', quantity: 2, unit: 'kg'
    });
     expect(parseShoppingInput("1.5 lt Leche")).toEqual({
      name: 'Leche', quantity: 1.5, unit: 'lt'
    });
     expect(parseShoppingInput("un paquete Galletitas")).toEqual({
      name: 'Galletitas', quantity: 1, unit: 'paquete'
    });
     expect(parseShoppingInput("100 gr Queso")).toEqual({
      name: 'Queso', quantity: 100, unit: 'gr'
    });
  });

  // Casos con "de" después de la unidad
  test('debería parsear cantidad, unidad "de" y nombre', () => {
    expect(parseShoppingInput("2 kg de Manzanas")).toEqual({
      name: 'Manzanas', quantity: 2, unit: 'kg'
    });
    expect(parseShoppingInput("1.5 litros de Leche")).toEqual({
      name: 'Leche', quantity: 1.5, unit: 'lt' // Normaliza 'litros' a 'lt'
    });
     expect(parseShoppingInput("un paquete de Galletitas")).toEqual({
      name: 'Galletitas', quantity: 1, unit: 'paquete'
    });
  });
  
  // Casos con unidades plurales/singulares y normalización
  test('debería normalizar unidades comunes', () => {
    expect(parseShoppingInput("1 kilo de pan")).toEqual({ name: 'Pan', quantity: 1, unit: 'kg' });
    expect(parseShoppingInput("3 kilos de papas")).toEqual({ name: 'Papas', quantity: 3, unit: 'kg' });
    expect(parseShoppingInput("200 gramos de jamon")).toEqual({ name: 'Jamon', quantity: 200, unit: 'gr' });
    expect(parseShoppingInput("1 litro de agua")).toEqual({ name: 'Agua', quantity: 1, unit: 'lt' });
  });

  // Casos borde y limpieza
  test('debería manejar espacios extra y capitalización', () => {
    expect(parseShoppingInput("  2   kg   de   manzanas   ")).toEqual({
      name: 'Manzanas', quantity: 2, unit: 'kg'
    });
     expect(parseShoppingInput("dos hamburguesas")).toEqual({
      name: 'Hamburguesas', quantity: 2, unit: null
    });
  });

  test('debería devolver el input original si no puede parsear nombre', () => {
    expect(parseShoppingInput("2 kg de")).toEqual({
      name: '2 kg de', quantity: 2, unit: 'kg' // No pudo extraer nombre
    });
     expect(parseShoppingInput("dos")).toEqual({
      name: 'Dos', quantity: null, unit: null // Tratar "dos" como nombre, no cantidad
    });
  });
  
   test('no debería confundir palabras que parecen números/unidades en el nombre', () => {
    expect(parseShoppingInput("Leche dos pinos")).toEqual({ name: 'Leche dos pinos', quantity: null, unit: null });
    expect(parseShoppingInput("Sal kg fina")).toEqual({ name: 'Sal kg fina', quantity: null, unit: null });
  });

});