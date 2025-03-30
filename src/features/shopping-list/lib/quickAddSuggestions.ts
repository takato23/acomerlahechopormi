// src/features/shopping-list/lib/quickAddSuggestions.ts

/**
 * Define las sugerencias rápidas de cantidad/unidad para productos comunes.
 * La clave es una versión normalizada (lowercase) del nombre del producto.
 * El valor es un array de objetos { label: string, quantity: number, unit: string }.
 */
export const quickAddSuggestions: Record<string, { label: string; quantity: number; unit: string }[]> = {
  // Lácteos y Huevos
  leche: [
    { label: '1 L', quantity: 1, unit: 'L' },
    { label: 'Caja (6L)', quantity: 6, unit: 'L' },
    { label: '500 ml', quantity: 500, unit: 'ml' },
  ],
  huevos: [
    { label: '6 u', quantity: 6, unit: 'u' },
    { label: '12 u', quantity: 12, unit: 'u' },
    { label: '1 u', quantity: 1, unit: 'u' },
  ],
  queso: [ // Muy genérico, difícil sugerir cantidad
    { label: '200 g', quantity: 200, unit: 'g' },
    { label: '500 g', quantity: 500, unit: 'g' },
  ],
  yogur: [
    { label: '1 u', quantity: 1, unit: 'u' },
    { label: 'Pack (4u)', quantity: 4, unit: 'u' },
  ],
  manteca: [ // o Mantequilla
    { label: '200 g', quantity: 200, unit: 'g' },
  ],

  // Carnes y Aves
  'carne picada': [
    { label: '500 g', quantity: 500, unit: 'g' },
    { label: '1 kg', quantity: 1, unit: 'kg' },
  ],
  pollo: [ // Podría ser pechuga, entero, etc.
    { label: '1 kg', quantity: 1, unit: 'kg' },
    { label: '2 kg', quantity: 2, unit: 'kg' },
    { label: '1 u (entero)', quantity: 1, unit: 'u' },
  ],
  milanesas: [ // Podría ser por unidad o peso
     { label: '500 g', quantity: 500, unit: 'g' },
     { label: '1 kg', quantity: 1, unit: 'kg' },
     { label: '4 u', quantity: 4, unit: 'u' },
  ],

  // Frutas y Verduras (Ejemplos, muy variable)
  manzanas: [
    { label: '1 kg', quantity: 1, unit: 'kg' },
    { label: '4 u', quantity: 4, unit: 'u' },
  ],
  bananas: [
    { label: '1 kg', quantity: 1, unit: 'kg' },
    { label: '6 u', quantity: 6, unit: 'u' },
  ],
  cebolla: [
    { label: '1 kg', quantity: 1, unit: 'kg' },
    { label: '2 u', quantity: 2, unit: 'u' },
  ],
  papa: [ // o Patata
    { label: '1 kg', quantity: 1, unit: 'kg' },
    { label: '2 kg', quantity: 2, unit: 'kg' },
  ],
  tomate: [
     { label: '1 kg', quantity: 1, unit: 'kg' },
     { label: '500 g', quantity: 500, unit: 'g' },
  ],

  // Almacén
  arroz: [
    { label: '1 kg', quantity: 1, unit: 'kg' },
    { label: '500 g', quantity: 500, unit: 'g' },
  ],
  fideos: [ // o Pasta
    { label: '500 g', quantity: 500, unit: 'g' },
  ],
  pan: [ // Muy genérico
    { label: '1 kg', quantity: 1, unit: 'kg' },
    { label: '1 u (lactal)', quantity: 1, unit: 'u' },
  ],
  aceite: [
    { label: '1 L', quantity: 1, unit: 'L' },
    { label: '500 ml', quantity: 500, unit: 'ml' },
  ],
  azucar: [ // o Azúcar
    { label: '1 kg', quantity: 1, unit: 'kg' },
  ],
  harina: [
    { label: '1 kg', quantity: 1, unit: 'kg' },
  ],
  atun: [ // o Atún
    { label: 'Lata (170g)', quantity: 1, unit: 'u' },
    { label: 'Pack (3 latas)', quantity: 3, unit: 'u' },

  ],

  // Bebidas
  agua: [
    { label: '1.5 L', quantity: 1.5, unit: 'L' },
    { label: 'Pack (6x1.5L)', quantity: 6, unit: 'u' }, // Unidad 'u' para pack
    { label: '500 ml', quantity: 500, unit: 'ml' },
  ],
  'coca cola': [ // Ejemplo marca
    { label: '2.25 L', quantity: 2.25, unit: 'L' },
    { label: '1.5 L', quantity: 1.5, unit: 'L' },
    { label: 'Lata (354ml)', quantity: 1, unit: 'u' },
  ],

  // Limpieza (Ejemplos)
  'papel higienico': [
    { label: 'Pack (4u)', quantity: 4, unit: 'u' },
    { label: 'Pack (12u)', quantity: 12, unit: 'u' },
  ],
  detergente: [
     { label: '750 ml', quantity: 750, unit: 'ml' },
  ],

  // Añadir más productos comunes aquí...
};

/**
 * Función helper para obtener sugerencias para un nombre de producto normalizado.
 */
export const getSuggestionsForProduct = (productName: string): { label: string; quantity: number; unit: string }[] | undefined => {
  const normalizedName = productName.toLowerCase().trim();
  // Podríamos añadir lógica más inteligente aquí (ej. buscar "leche descremada" -> "leche")
  return quickAddSuggestions[normalizedName];
};