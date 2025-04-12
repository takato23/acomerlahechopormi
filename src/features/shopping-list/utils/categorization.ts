// src/features/shopping-list/utils/categorization.ts

// Mapeo de palabras clave (en minúsculas) a nombres de categoría (en inglés, según logs)
// Puedes expandir y ajustar esto según tus necesidades.
const categoryKeywords: { [category: string]: string[] } = {
  'produce': ['fruta', 'verdura', 'manzana', 'platano', 'banana', 'naranja', 'limon', 'papa', 'patata', 'cebolla', 'ajo', 'tomate', 'lechuga', 'espinaca', 'zanahoria', 'brocoli', 'aguacate', 'palta'],
  'dairy': ['leche', 'queso', 'yogur', 'yogurt', 'manteca', 'mantequilla', 'crema', 'huevo'], // Huevo suele ir aquí
  'meat': ['carne', 'pollo', 'pavo', 'cerdo', 'res', 'ternera', 'vaca', 'bife', 'chuleta', 'jamon', 'salchicha', 'tocino', 'bacon'],
  'fish': ['pescado', 'salmon', 'atun', 'merluza', 'sardina', 'camaron', 'langostino'],
  'pantry': ['arroz', 'pasta', 'fideo', 'lenteja', 'garbanzo', 'frijol', 'poroto', 'harina', 'azucar', 'sal', 'aceite', 'vinagre', 'conserva', 'lata', 'pan', 'galleta', 'cereal'],
  'beverages': ['agua', 'jugo', 'zumo', 'refresco', 'gaseosa', 'soda', 'cerveza', 'vino', 'cafe', 'te'],
  'frozen': ['congelado', 'helado', 'pizza congelada'],
  'bakery': ['pan', 'torta', 'pastel', 'factura', 'croissant'],
  'cleaning': ['limpieza', 'detergente', 'lavandina', 'lejia', 'jabon', 'papel higienico', 'servilleta'],
  'other': [], // Categoría por defecto si no hay coincidencia
};

// Función para obtener la categoría basada en el nombre del ítem
export function getCategoryForItem(itemName: string): string | null {
  if (!itemName) {
    return null; // O quizás 'other' si prefieres siempre tener una categoría
  }

  const lowerItemName = itemName.toLowerCase().trim();

  // Iterar sobre las categorías y sus palabras clave
  for (const category in categoryKeywords) {
    const keywords = categoryKeywords[category];
    // Usar some para detenerse en la primera coincidencia
    const match = keywords.some(keyword => lowerItemName.includes(keyword));
    if (match) {
      return category; // Devolver el nombre de la categoría (e.g., 'meat')
    }
  }

  // Si no se encontró ninguna coincidencia específica, devolver null o 'other'
  // Por ahora devolvemos null para que en el store se sepa que no se auto-asignó.
  // Podrías cambiarlo a 'other' si siempre quieres una categoría.
  return null;
  // return 'other';
}

// --- NUEVO: Mapeo para mostrar categorías ---
const categoryDisplayNames: { [key: string]: { name: string; icon: string } } = {
  'produce': { name: "Frutas y Verduras", icon: "🍎" },
  'dairy': { name: "Lácteos y Huevos", icon: "🥛" },
  'meat': { name: "Carnes", icon: "🥩" },
  'fish': { name: "Pescados", icon: "🐟" },
  'pantry': { name: "Almacén", icon: "🥫" },
  'beverages': { name: "Bebidas", icon: "🥤" },
  'frozen': { name: "Congelados", icon: "❄️" },
  'bakery': { name: "Panadería", icon: "🍞" },
  'cleaning': { name: "Limpieza", icon: "🧼" },
  'other': { name: "Otros", icon: "🛒" },
  'Sin Categoría': { name: "Sin Categoría", icon: "❓" }, // Para los ítems agrupados como 'Sin Categoría'
};

// --- NUEVO: Función para obtener el nombre e icono para mostrar ---
export function getDisplayCategory(internalCategoryName: string | null | undefined): string {
  const key = internalCategoryName || 'Sin Categoría'; // Usar 'Sin Categoría' si es null o undefined
  const displayInfo = categoryDisplayNames[key];

  if (displayInfo) {
    return `${displayInfo.icon} ${displayInfo.name}`;
  }

  // Fallback por si llega una categoría inesperada
  return `❓ ${key}`; 
}
