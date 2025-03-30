/**
 * Utilidad para parsear la entrada del usuario en la lista de compras,
 * intentando extraer cantidad, unidad y nombre del ítem.
 */

export interface ParsedShoppingInput { // Añadir export
  name: string;
  quantity: number | null;
  unit: string | null;
}

// Mapeo simple de palabras numéricas a números
const numberWords: { [key: string]: number } = {
  un: 1, uno: 1, una: 1,
  dos: 2,
  tres: 3,
  cuatro: 4,
  cinco: 5,
  seis: 6,
  siete: 7,
  ocho: 8,
  nueve: 9,
  diez: 10,
  // Añadir más si es necesario
};

// Unidades comunes (simplificado)
const commonUnits = ['kg', 'kilo', 'kilos', 'gr', 'gramo', 'gramos', 'lt', 'litro', 'litros', 'paquete', 'paquetes', 'lata', 'latas', 'botella', 'botellas', 'unidad', 'unidades'];

/**
 * Parsea una cadena de texto para extraer cantidad, unidad y nombre.
 * Ejemplo: "2 kg de manzanas" -> { quantity: 2, unit: 'kg', name: 'manzanas' }
 * Ejemplo: "dos hamburguesas" -> { quantity: 2, unit: null, name: 'hamburguesas' }
 * @param input Texto ingresado por el usuario
 * @returns Objeto con name, quantity (opcional) y unit (opcional)
 */
export function parseShoppingInput(input: string): ParsedShoppingInput {
  let remainingInput = input.trim().toLowerCase();
  let quantity: number | null = null;
  let unit: string | null = null;

  // 1. Buscar cantidad numérica o palabra al inicio
  const numberMatch = remainingInput.match(/^(\d+(\.\d+)?)\s+/); // Números como 1, 2.5
  const wordMatch = remainingInput.match(/^([a-zA-Záéíóúñ]+)\s+/); // Palabras como "dos"

  if (numberMatch) {
    quantity = parseFloat(numberMatch[1]);
    remainingInput = remainingInput.substring(numberMatch[0].length).trim();
  } else if (wordMatch && numberWords[wordMatch[1]]) {
    quantity = numberWords[wordMatch[1]];
    remainingInput = remainingInput.substring(wordMatch[0].length).trim();
  }

  // 2. Buscar unidad común después de la cantidad (si existe)
  if (quantity !== null) {
    const unitMatch = remainingInput.match(/^([a-zA-Záéíóúñ]+)\s+(de\s+)?/); // "kg de", "paquetes"
    if (unitMatch && commonUnits.includes(unitMatch[1])) {
      unit = unitMatch[1];
      // Normalizar unidades (ej: kilos -> kg)
      if (unit === 'kilo' || unit === 'kilos') unit = 'kg';
      if (unit === 'gramo' || unit === 'gramos') unit = 'gr';
      if (unit === 'litro' || unit === 'litros') unit = 'lt';
      // ... otras normalizaciones
      
      remainingInput = remainingInput.substring(unitMatch[0].length).trim();
    }
  }

  // 3. Lo que queda es el nombre del ítem. Limpiar y capitalizar.
  let name = remainingInput.trim();
  
  // Si después de quitar cantidad y unidad, solo queda "de" o nada,
  // consideramos que no hay nombre válido extraído y usamos el input original.
  if (!name || name === 'de') {
     name = input; // Usar el input original directamente
  } else {
      // Capitalizar primera letra y eliminar "De " al inicio si quedó
      name = name
        .replace(/^./, (char) => char.toUpperCase())
        .replace(/^De\s+/, '');
  }

  return {
    name: name || input, // Si no queda nombre, devolver input original
    quantity,
    unit,
  };
}

// --- Ejemplos de uso ---
/*
console.log(parseShoppingInput("2 kg de manzanas"));
// { name: 'Manzanas', quantity: 2, unit: 'kg' }

console.log(parseShoppingInput("dos hamburguesas"));
// { name: 'Hamburguesas', quantity: 2, unit: null }

console.log(parseShoppingInput("1.5 litros de leche"));
// { name: 'Leche', quantity: 1.5, unit: 'lt' }

console.log(parseShoppingInput("un paquete galletitas"));
// { name: 'Galletitas', quantity: 1, unit: 'paquete' }

console.log(parseShoppingInput("Pata muslo de pollo"));
// { name: 'Pata muslo de pollo', quantity: null, unit: null }

console.log(parseShoppingInput("Aceite"));
// { name: 'Aceite', quantity: null, unit: null }
*/