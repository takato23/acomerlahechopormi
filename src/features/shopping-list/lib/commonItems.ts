// src/features/shopping-list/lib/commonItems.ts

/**
 * Lista predefinida de ítems comunes para sugerencias rápidas.
 * Se puede expandir según sea necesario.
 */
export const COMMON_SHOPPING_ITEMS: string[] = [
  // Lácteos y Huevos
  'Leche', 'Huevos', 'Queso', 'Yogur', 'Manteca', 'Crema',
  // Carnes y Aves
  'Carne Picada', 'Pollo', 'Milanesas', 'Bife', 'Pescado', 'Jamón',
  // Frutas
  'Manzanas', 'Bananas', 'Naranjas', 'Limones', 'Frutillas', 'Uvas',
  // Verduras
  'Cebolla', 'Papa', 'Tomate', 'Lechuga', 'Zanahoria', 'Ajo', 'Morrón', 'Zapallo',
  // Almacén
  'Arroz', 'Fideos', 'Pan', 'Aceite', 'Vinagre', 'Sal', 'Azúcar', 'Harina', 'Galletitas', 'Café', 'Té', 'Yerba', 'Lentejas', 'Garbanzos', 'Atún', 'Salsa de Tomate',
  // Bebidas
  'Agua', 'Gaseosa', 'Jugo', 'Cerveza', 'Vino',
  // Limpieza
  'Papel Higiénico', 'Rollo de Cocina', 'Detergente', 'Lavandina', 'Jabón',
  // Otros
  'Pilas',
  // ... añadir más según sea necesario
];

/**
 * Prepara los datos para react-d3-cloud a partir de la lista fija.
 * Asigna un valor base y algo de aleatoriedad para variar tamaños.
 */
export const getWordCloudDataFromCommonItems = (): { text: string; value: number }[] => {
  const baseValue = 30; // Valor base para tamaño
  return COMMON_SHOPPING_ITEMS.map(item => ({
    text: item,
    // Asignar un valor pseudo-aleatorio basado en el nombre para variar tamaños
    value: baseValue + (item.length % 15) + Math.floor(Math.random() * 10),
  }));
};