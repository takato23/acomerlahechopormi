import { localSuggestionManager, SearchTermRecord } from '@/lib/suggestions/LocalSuggestionManager'; // Asumiendo alias @
// import { toast } from 'sonner'; // Asumimos que toast está disponible globalmente o inyectado

// Define the product interface
export interface BuscaPreciosProduct {
  id: string;
  nombre: string;
  precio: number;
  imagen: string;
  tienda: string;
  url: string;
}

// Define los tipos de resultado posibles
export type SearchProductsSuccess = { error: false; products: BuscaPreciosProduct[] };
export type SearchProductsError = { error: true; fallbackSuggestions: SearchTermRecord[]; originalError: Error };
export type SearchProductsResult = SearchProductsSuccess | SearchProductsError;

// Sugerencias por defecto (podrían venir de config)
const DEFAULT_SUGGESTIONS: SearchTermRecord[] = [
    { term: "Leche", frequency: 0, lastUsed: 0 },
    { term: "Pan", frequency: 0, lastUsed: 0 },
    { term: "Huevos", frequency: 0, lastUsed: 0 },
    { term: "Arroz", frequency: 0, lastUsed: 0 },
    { term: "Fideos", frequency: 0, lastUsed: 0 },
];

// Function to search for products with retries and fallback
export const searchProducts = async (query: string, isRetryAttempt = false): Promise<SearchProductsResult> => {
  console.log(`🔍 Iniciando búsqueda con consulta: "${query}" ${isRetryAttempt ? '(Reintento)' : ''}`);

  // Registrar término de búsqueda si no es un reintento manual explícito
  if (!isRetryAttempt) {
      localSuggestionManager.addSearchTerm(query);
  }

  const maxAttempts = 3;
  let attempts = 0;
  const apiUrl = `https://buscaprecios.onrender.com/?q=${encodeURIComponent(query)}`;
  console.log('📡 URL de la API:', apiUrl);

  while (attempts < maxAttempts) {
    try {
      // Backoff exponencial simple
      if (attempts > 0) {
        const delay = Math.pow(2, attempts - 1) * 1000; // 1s, 2s
        console.log(`⏳ Reintento ${attempts}/${maxAttempts-1} esperando ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(15000) // Timeout de 15 segundos por intento
      });

      if (!response.ok) {
        // Errores 5xx son candidatos a reintento, 4xx usualmente no
        if (response.status >= 500 && attempts < maxAttempts - 1) {
            console.warn(`⚠️ Error HTTP ${response.status} (Intento ${attempts + 1}). Reintentando...`);
            attempts++;
            continue; // Saltar al siguiente intento del while
        } else {
            console.error(`🚫 Error HTTP ${response.status} definitivo:`, response.statusText);
            throw new Error(`Error en la API: ${response.status}`);
        }
      }

      const data = await response.json();
      console.log('✅ Respuesta de la API recibida (Intento ${attempts + 1})');

      if (!data.products || !Array.isArray(data.products)) {
        console.error('❌ Formato de respuesta inválido:', data);
        throw new Error('Formato de respuesta inválido');
      }

      const formattedProducts = formatProducts(data);
      console.log('✨ Productos formateados:', formattedProducts.length);

      // Éxito!
      return { error: false, products: formattedProducts };

    } catch (error) {
      attempts++;
      console.error(`❌ Error en intento ${attempts}/${maxAttempts} para "${query}":`, error);

      // Si se alcanzan los reintentos o es un error no recuperable (ej. timeout, red)
      if (attempts >= maxAttempts || (error instanceof Error && (error.name === 'AbortError' || error.message.includes('NetworkError')))) {
        console.error(`❌ Fallo definitivo al buscar "${query}" después de ${attempts} intentos.`);
        // toast.error(`Error al buscar "${query}". Mostrando sugerencias locales.`); // Notificar al usuario

        // --- Lógica de Fallback ---
        const recentSearches = localSuggestionManager.getSuggestions(3);
        const combinedSuggestions = [...recentSearches];
        const recentTerms = new Set(recentSearches.map(s => s.term.toLowerCase()));

        DEFAULT_SUGGESTIONS.forEach(def => {
            if (combinedSuggestions.length < 5 && !recentTerms.has(def.term.toLowerCase())) {
                combinedSuggestions.push(def);
            }
        });

        console.log('💡 Sugerencias de fallback:', combinedSuggestions);
        return {
            error: true,
            fallbackSuggestions: combinedSuggestions,
            originalError: error instanceof Error ? error : new Error(String(error))
        };
      }
      // Si no, el loop while continuará para el siguiente reintento
    }
  }

  // Este punto no debería alcanzarse si la lógica es correcta, pero por si acaso:
  console.error(`❌ Fallo inesperado al buscar "${query}" fuera del loop.`);
  return {
      error: true,
      fallbackSuggestions: DEFAULT_SUGGESTIONS.slice(0, 5), // Fallback mínimo
      originalError: new Error("Fallo inesperado en la lógica de búsqueda")
  };
};

// Helper function to format products
const formatProducts = (data: any): BuscaPreciosProduct[] => {
  if (!data || !data.products || !Array.isArray(data.products)) {
    console.error('❌ Formato de datos inválido:', data);
    return [];
  }

  console.log('📦 Productos recibidos:', data.products);

  const formattedProducts = data.products
    .filter((item: any) => { // Added type annotation
      console.log('🔍 Evaluando producto:', item);
      
      if (!item) {
        console.log('❌ Producto nulo o indefinido');
        return false;
      }
      
      // Solo requerimos que tenga nombre o título y algún tipo de precio
      const hasValidName = item.name || item.title;
      const hasValidPrice = item.price !== undefined && item.price !== null;
      
      if (!hasValidName || !hasValidPrice) {
        console.log('❌ Producto inválido:', {
          hasValidName,
          hasValidPrice,
          name: item.name || item.title,
          price: item.price
        });
        return false;
      }
      
      console.log('✅ Producto válido:', {
        name: item.name || item.title,
        price: item.price,
        image: item.image,
        link: item.link
      });
      return true;
    })
    .map((item: any) => { // Added type annotation
      const formattedProduct = {
        id: item.id || `product-${Math.random().toString(36).substring(2, 9)}`,
        nombre: item.name || item.title || 'Producto sin nombre',
        precio: typeof item.price === 'string' ? parseFloat(item.price.replace(/[^0-9.-]+/g,"")) : (item.price || 0), // Clean price string
        imagen: item.image || item.img || item.imagen || '/placeholder.svg', // Use placeholder
        tienda: item.store || item.tienda || item.comercio || 'Tienda no especificada',
        url: item.link || item.url || '#'
      };
      console.log('✨ Producto formateado:', formattedProduct);
      return formattedProduct;
    })
    .sort((a: BuscaPreciosProduct, b: BuscaPreciosProduct) => a.precio - b.precio); // Añadido tipo explícito

  console.log('🎁 Productos finales:', formattedProducts);
  return formattedProducts;
};

// Get price range from product list
export const getPriceRange = (products: BuscaPreciosProduct[]) => {
  if (!products.length) return { min: 0, max: 0, avg: 0 };
  
  const prices = products.map(p => p.precio).filter(p => !isNaN(p)); // Filter out NaN prices
  if (!prices.length) return { min: 0, max: 0, avg: 0 };

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const sum = prices.reduce((a, b) => a + b, 0);
  const avg = sum / prices.length;
  
  return { min, max, avg };
};

// Get a list of unique stores from products
export const getStores = (products: BuscaPreciosProduct[]) => {
  return Array.from(new Set(products.map(p => p.tienda)));
};

// Filter products by price range and store
export const filterProducts = (
  products: BuscaPreciosProduct[],
  filters: { priceRange?: [number, number], stores?: string[] }
) => {
  return products.filter(product => {
    if (filters.priceRange && 
        (product.precio < filters.priceRange[0] || 
         product.precio > filters.priceRange[1])) {
      return false;
    }
    
    if (filters.stores && 
        filters.stores.length > 0 && 
        !filters.stores.includes(product.tienda)) {
      return false;
    }
    
    return true;
  });
};

// Filter relevant products based on search term
export const filterRelevantProducts = (products: BuscaPreciosProduct[], searchTerm: string): BuscaPreciosProduct[] => {
  const normalizedSearchTerm = searchTerm.toLowerCase().trim();
  if (!normalizedSearchTerm) return products; // Return all if search term is empty

  const exactMatches = products.filter(product => 
    product.nombre.toLowerCase().includes(normalizedSearchTerm)
  );
  
  if (exactMatches.length > 0) {
    return exactMatches;
  }
  
  // If no exact matches, try partial word matches
  const partialMatches = products.filter(product => {
    const productName = product.nombre.toLowerCase();
    const searchWords = normalizedSearchTerm.split(/\s+/).filter(Boolean); // Split and remove empty strings
    // Check if *all* search words are included in the product name
    return searchWords.every(word => productName.includes(word)); 
  });
  
  // Return partial matches only if they exist, otherwise return all products (or maybe empty?)
  // Returning all might be confusing if there are no good matches. Let's return partial or empty.
  return partialMatches; 
};