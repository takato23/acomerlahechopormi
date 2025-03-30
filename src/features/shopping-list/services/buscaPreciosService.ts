// Define the product interface
export interface BuscaPreciosProduct {
  id: string;
  nombre: string;
  precio: number;
  imagen: string;
  tienda: string;
  url: string;
}

// Function to search for products
export const searchProducts = async (query: string): Promise<BuscaPreciosProduct[]> => {
  try {
    console.log('🔍 Iniciando búsqueda con consulta:', query);

    const apiUrl = `https://buscaprecios.onrender.com/?q=${encodeURIComponent(query)}`;
    console.log('📡 URL de la API:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        // 'Origin': window.location.origin // Origin header might cause CORS issues if not needed
      }
    });
    
    if (!response.ok) {
      console.error('🚫 Error HTTP:', response.status, response.statusText);
      throw new Error(`Error en la API: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Respuesta de la API:', {
      failedScrapers: data.failedScrapers,
      productCount: data.products?.length || 0,
      timestamp: data.timestamp
    });

    if (!data.products || !Array.isArray(data.products)) {
      console.error('❌ Formato de respuesta inválido:', data);
      throw new Error('Formato de respuesta inválido');
    }

    console.log('📦 Muestra de productos:', data.products.slice(0, 2));

    const formattedProducts = formatProducts(data);
    console.log('✨ Productos formateados:', formattedProducts.length);

    return formattedProducts;
  } catch (error) {
    console.error('❌ Error al buscar productos:', error);
    if (error instanceof Error) {
      console.error('Detalles del error:', error.message);
      if (error.stack) console.error('Stack:', error.stack);
    }
    throw error; // Re-throw the error so the caller can handle it
  }
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