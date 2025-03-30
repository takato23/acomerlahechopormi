import { describe, expect, test } from '@jest/globals';
import { parsePantryInput } from '../pantryParser';

describe('parsePantryInput', () => {
  // Tests para números escritos en texto
  test('maneja números en texto correctamente', () => {
    expect(parsePantryInput('una docena de huevos')).toEqual({
      quantity: 1,
      unit: 'doc',
      ingredientName: 'huevos',
    });

    expect(parsePantryInput('medio kilo de azúcar')).toEqual({
      quantity: 0.5,
      unit: 'kg',
      ingredientName: 'azúcar',
    });

    expect(parsePantryInput('dos litros de leche')).toEqual({
      quantity: 2,
      unit: 'lt',
      ingredientName: 'leche',
    });
  });

  // Tests para formato Cantidad Unidad Nombre
  test('maneja formato "Cantidad Unidad Nombre"', () => {
    expect(parsePantryInput('2 kg harina')).toEqual({
      quantity: 2,
      unit: 'kg',
      ingredientName: 'harina',
    });

    expect(parsePantryInput('1.5 lt leche')).toEqual({
      quantity: 1.5,
      unit: 'lt',
      ingredientName: 'leche',
    });
  });

  // Tests para formato Nombre Cantidad Unidad
  test('maneja formato "Nombre Cantidad Unidad"', () => {
    expect(parsePantryInput('harina 1 kg')).toEqual({
      quantity: 1,
      unit: 'kg',
      ingredientName: 'harina',
    });

    expect(parsePantryInput('leche 1.5 litros')).toEqual({
      quantity: 1.5,
      unit: 'lt',
      ingredientName: 'leche',
    });
  });

  // Tests para nombres compuestos con "de"
  test('maneja nombres compuestos con "de" correctamente', () => {
    expect(parsePantryInput('1 kg de azúcar')).toEqual({
      quantity: 1,
      unit: 'kg',
      ingredientName: 'azúcar',
    });

    expect(parsePantryInput('paquete de café')).toEqual({
      quantity: 1,
      unit: 'paquete',
      ingredientName: 'café',
    });
  });

  // Tests para entradas sin unidad
  test('maneja entradas sin unidad explicita', () => {
    expect(parsePantryInput('5 manzanas')).toEqual({
      quantity: 5,
      unit: 'u',
      ingredientName: 'manzanas',
    });

    expect(parsePantryInput('manzanas')).toEqual({
      quantity: 1,
      unit: 'u',
      ingredientName: 'manzanas',
    });
  });

  // Tests para docenas y pares
  test('maneja docenas y pares correctamente', () => {
    expect(parsePantryInput('una docena de huevos')).toEqual({
      quantity: 1,
      unit: 'doc',
      ingredientName: 'huevos',
    });

    expect(parsePantryInput('dos docenas huevos')).toEqual({
      quantity: 2,
      unit: 'doc',
      ingredientName: 'huevos',
    });

    expect(parsePantryInput('un par de medias')).toEqual({
      quantity: 1,
      unit: 'par',
      ingredientName: 'medias',
    });
  });

  // Tests para entradas inválidas o vacías
  test('maneja entradas inválidas o vacías', () => {
    expect(parsePantryInput('')).toBeNull();
    expect(parsePantryInput('   ')).toBeNull();
  });
});