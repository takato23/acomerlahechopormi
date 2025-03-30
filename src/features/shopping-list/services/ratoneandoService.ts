// import { ShoppingItem } from '@/context/contexts/ShoppingContext'; // Eliminado - Contexto no existe aquí
import { cleanIngredientText } from '@/lib/ingredientUtils'; // Ruta correcta
import { toast } from 'sonner';

// Interfaces
export interface RatoneandoStore {
  id: string;
  name: string;
  chain: string;
  address: string;
  latitude: number;
  longitude: number;
  distance?: number;
}

export interface RatoneandoProduct {
  id: string;
  name: string;
  brand: string;
  description: string;
  price: number;
  original_price?: number;
  discount_percentage?: number;
  unit: string;
  image_url?: string;
  store_id: string;
}

// Estructura para almacenar productos agrupados por tienda
export interface RatoneandoProductsByStore {
  item: any; // Usar any temporalmente para ShoppingItem
  stores: {
    store: RatoneandoStore;
    products: RatoneandoProduct[];
  }[];
  bestPrice: number;
  bestStore?: RatoneandoStore;
  originalPrice: number;
  savings: number;
  savingsPercentage: number;
  searchStatus: 'success' | 'not_found' | 'pending' | 'error';
  errorMessage?: string;
}

// Tiempo de caché en milisegundos (30 minutos)
const CACHE_EXPIRATION = 30 * 60 * 1000;

// URL de la API - esto puede ser configurado con un valor por defecto
const API_URL = 'https://api.ratoneando.ar'; // URL por defecto

class RatoneandoService {
  private storesCache: Map<string, { data: RatoneandoStore[], expires: number }> = new Map();
  private productsCache: Map<string, { data: RatoneandoProduct[], expires: number }> = new Map();
  private apiKey: string | null = null;
  private baseUrl: string = API_URL;
  private retryCount: number = 3; // Intentos de retry para las peticiones
  private retryDelay: number = 1000; // Tiempo entre reintentos (ms)
  private serviceStatus: { status: 'available' | 'degraded' | 'unavailable', error: string | null } = { 
    status: 'unavailable', 
    error: null 
  };

  constructor() {
    // Intentar cargar la API key desde localStorage
    this.apiKey = localStorage.getItem('ratoneando_api_key');
    
    // Configurar URL base si está almacenada
    const savedBaseUrl = localStorage.getItem('ratoneando_api_url');
    if (savedBaseUrl) {
      this.baseUrl = savedBaseUrl;
    }
    
    console.log('RatoneandoService inicializado. API Key presente:', !!this.apiKey);

    // Initial service status check if API key exists
    if (this.apiKey) {
      this.testConnection()
        .then(isAvailable => {
          this.serviceStatus = {
            status: isAvailable ? 'available' : 'unavailable',
            error: isAvailable ? null : 'No se pudo conectar al servicio'
          };
          console.log('Estado inicial del servicio Ratoneando:', this.serviceStatus.status);
        })
        .catch(error => {
          this.serviceStatus = {
            status: 'unavailable',
            error: `Error de conexión: ${error instanceof Error ? error.message : String(error)}`
          };
          console.error('Error al verificar estado inicial de Ratoneando:', error);
        });
    }
  }

  getServiceStatus() {
    return this.serviceStatus;
  }

  setApiKey(key: string) {
    this.apiKey = key;
    localStorage.setItem('ratoneando_api_key', key);
    this.clearCache(); // Limpiar caché al cambiar la API key
    console.log('API Key de Ratoneando actualizada');
    
    // Update service status after setting new key
    this.testConnection()
      .then(isAvailable => {
        this.serviceStatus = {
          status: isAvailable ? 'available' : 'unavailable',
          error: isAvailable ? null : 'No se pudo conectar al servicio con la nueva API key'
        };
        
        if (isAvailable) {
          toast.success('API key de Ratoneando configurada y servicio disponible');
        } else {
          toast.error('API key guardada, pero el servicio no responde correctamente');
        }
      })
      .catch(error => {
        this.serviceStatus = {
          status: 'unavailable',
          error: `Error de conexión: ${error instanceof Error ? error.message : String(error)}`
        };
        toast.error('Error al verificar la conexión con Ratoneando');
      });
  }

  getApiKey(): string | null {
    return this.apiKey;
  }

  setBaseUrl(url: string) {
    this.baseUrl = url;
    localStorage.setItem('ratoneando_api_url', url);
    this.clearCache(); // Limpiar caché al cambiar la URL base
    
    // Update status after URL change
    this.testConnection().then(isAvailable => {
      this.serviceStatus.status = isAvailable ? 'available' : 'unavailable';
    });
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  // Utilidad para limpiar el caché
  clearCache() {
    this.storesCache.clear();
    this.productsCache.clear();
    console.log('Caché de Ratoneando limpiado');
  }

  // Método para probar la conexión con la API
  async testConnection(): Promise<boolean> {
    if (!this.apiKey) return false;
    
    try {
      const response = await fetch(`${this.baseUrl}/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(5000) // 5 segundos de timeout
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error al probar conexión con Ratoneando:', error);
      return false;
    }
  }

  // Método con reintentos para solicitudes fetch
  private async fetchWithRetry(url: string, options: RequestInit = {}, retries = this.retryCount): Promise<Response> {
    try {
      console.log(`Ratoneando: Llamando a ${url}`);
      const response = await fetch(url, options);
      
      // Log response status
      console.log(`Ratoneando: Respuesta de ${url} - Status: ${response.status}`);
      
      // Si la respuesta no es exitosa y aún tenemos reintentos disponibles
      if (!response.ok && retries > 0) {
        console.log(`Error en la solicitud (${response.status}). Reintentando... ${retries} intentos restantes`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.fetchWithRetry(url, options, retries - 1);
      }
      
      return response;
    } catch (error) {
      // Si hay un error de red y aún tenemos reintentos disponibles
      if (retries > 0) {
        console.log(`Error de red: ${error instanceof Error ? error.message : 'Error desconocido'}. Reintentando... ${retries} intentos restantes`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.fetchWithRetry(url, options, retries - 1);
      }
      
      console.error(`Error después de ${this.retryCount} intentos:`, error);
      throw error;
    }
  }

  // Método para simular precios cuando no hay API key configurada
  private simulatePrices(items: any[], stores: RatoneandoStore[]): RatoneandoProductsByStore[] { // Ajustado tipo item
    console.log('Simulando precios para', items.length, 'items en', stores.length, 'tiendas');
    
    // Si no hay tiendas, crear algunas simuladas
    if (stores.length === 0) {
      stores = this.simulateNearbyStores(-34.603722, -58.381592); // Buenos Aires coordinates as default
    }
    
    return items.map(item => {
      // Generar un precio base aleatorio entre 100 y 1000
      const basePrice = Math.floor(Math.random() * 900) + 100;
      
      // Crear productos simulados para cada tienda
      const storeProducts = stores.map(store => {
        // Variación de precio por tienda (±20%)
        const variation = (Math.random() * 0.4) - 0.2;
        const storePrice = basePrice * (1 + variation);
        
        // Crear algunos productos para esta tienda
        const products: RatoneandoProduct[] = [];
        const productCount = Math.floor(Math.random() * 3) + 1;
        
        for (let i = 0; i < productCount; i++) {
          // Variación de precio por producto (±10%)
          const productVariation = (Math.random() * 0.2) - 0.1;
          const productPrice = storePrice * (1 + productVariation);
          
          // Decidir aleatoriamente si este producto está en oferta
          const isOffer = Math.random() > 0.7;
          const discountPercentage = isOffer ? Math.floor(Math.random() * 30) + 5 : 0;
          const originalPrice = isOffer ? productPrice * (1 + (discountPercentage / 100)) : undefined;
          
          products.push({
            id: `sim-${store.id}-${item.name}-${i}`,
            name: `${item.name} ${i > 0 ? i + 1 : ''}`,
            brand: ['Marca A', 'Marca B', 'Marca C', 'Marca Propia'][Math.floor(Math.random() * 4)],
            description: `${item.name} de calidad premium`,
            price: Math.round(productPrice * 100) / 100,
            original_price: originalPrice ? Math.round(originalPrice * 100) / 100 : undefined,
            discount_percentage: isOffer ? discountPercentage : undefined,
            unit: item.unit || 'unidad',
            store_id: store.id
          });
        }
        
        // Ordenar productos por precio
        products.sort((a, b) => a.price - b.price);
        
        return {
          store,
          products
        };
      });
      
      // Encontrar el mejor precio
      let bestPrice = Infinity;
      let bestStore: RatoneandoStore | undefined;
      
      storeProducts.forEach(storeData => {
        if (storeData.products.length > 0) {
          const lowestPrice = storeData.products[0].price;
          if (lowestPrice < bestPrice) {
            bestPrice = lowestPrice;
            bestStore = storeData.store;
          }
        }
      });
      
      // Precio de referencia (promedio + 15%)
      const avgPrice = storeProducts.reduce((sum, store) => {
        if (store.products.length > 0) {
          return sum + store.products[0].price;
        }
        return sum;
      }, 0) / storeProducts.length;
      
      const referencePrice = avgPrice * 1.15;
      const estimatedPrice = item.estimatedPrice || referencePrice; // Asumiendo que item tiene estimatedPrice
      
      // Calcular ahorro
      const originalPrice = estimatedPrice;
      const savings = originalPrice - bestPrice;
      const savingsPercentage = originalPrice > 0 ? (savings / originalPrice) * 100 : 0;
      
      // Multiplicar por cantidad
      const finalBestPrice = bestPrice * item.quantity; // Asumiendo que item tiene quantity
      const finalOriginalPrice = originalPrice * item.quantity;
      
      return {
        item,
        stores: storeProducts,
        bestPrice: finalBestPrice,
        bestStore,
        originalPrice: finalOriginalPrice,
        savings: savings * item.quantity,
        savingsPercentage,
        searchStatus: 'success' as const
      };
    });
  }

  // Método para obtener tiendas cercanas
  async getNearbyStores(latitude: number, longitude: number, radius: number = 5): Promise<RatoneandoStore[]> {
    if (!this.apiKey) {
      console.log('No hay API key configurada, simulando tiendas cercanas');
      // Simular tiendas si no hay API key
      return this.simulateNearbyStores(latitude, longitude);
    }

    const cacheKey = `stores:${latitude},${longitude},${radius}`;
    const cached = this.storesCache.get(cacheKey);
    
    if (cached && cached.expires > Date.now()) {
      console.log('Usando tiendas en caché de Ratoneando');
      return cached.data;
    }

    try {
      console.log(`Buscando tiendas cercanas en ${latitude},${longitude} con radio ${radius}km`);
      
      const response = await this.fetchWithRetry(`${this.baseUrl}/stores/nearby?lat=${latitude}&lng=${longitude}&radius=${radius}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Error de API: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Respuesta de API de tiendas:', data);
      
      if (!data.stores || !Array.isArray(data.stores)) {
        console.error('Formato de respuesta inesperado:', data);
        throw new Error('Formato de respuesta inesperado');
      }
      
      const stores: RatoneandoStore[] = data.stores || [];

      // Guardar en caché
      this.storesCache.set(cacheKey, {
        data: stores,
        expires: Date.now() + CACHE_EXPIRATION
      });

      // Update service status
      this.serviceStatus = {
        status: 'available',
        error: null
      };
      
      return stores;
    } catch (error) {
      console.error('Error obteniendo tiendas cercanas:', error);
      
      // Update service status
      this.serviceStatus = {
        status: 'degraded',
        error: error instanceof Error ? error.message : 'Error desconocido obteniendo tiendas'
      };
      
      // Si falla, simular tiendas
      return this.simulateNearbyStores(latitude, longitude);
    }
  }
  
  // Método para simular tiendas cercanas
  private simulateNearbyStores(latitude: number, longitude: number): RatoneandoStore[] {
    const stores: RatoneandoStore[] = [
      {
        id: 'sim-1',
        name: 'SuperMax Centro',
        chain: 'SuperMax',
        address: 'Av. Principal 123',
        latitude: latitude + (Math.random() * 0.01),
        longitude: longitude + (Math.random() * 0.01),
        distance: Math.random() * 2
      },
      {
        id: 'sim-2',
        name: 'HiperMercado Sur',
        chain: 'HiperMercado',
        address: 'Calle Sur 456',
        latitude: latitude - (Math.random() * 0.01),
        longitude: longitude - (Math.random() * 0.01),
        distance: Math.random() * 3 + 1
      },
      {
        id: 'sim-3',
        name: 'MegaMarket Express',
        chain: 'MegaMarket',
        address: 'Av. Norte 789',
        latitude: latitude + (Math.random() * 0.02),
        longitude: longitude - (Math.random() * 0.02),
        distance: Math.random() * 4 + 2
      },
      {
        id: 'sim-4',
        name: 'EconoCompras',
        chain: 'EconoCompras',
        address: 'Calle Oeste 234',
        latitude: latitude - (Math.random() * 0.015),
        longitude: longitude + (Math.random() * 0.015),
        distance: Math.random() * 3 + 1.5
      }
    ];
    
    console.log('Tiendas simuladas generadas:', stores.length);
    return stores;
  }

  // Método para buscar productos
  async searchProducts(query: string, storeIds: string[] = []): Promise<RatoneandoProduct[]> {
    if (!query.trim()) return [];

    if (!this.apiKey) {
      console.log('No hay API key configurada, simulando búsqueda de productos para:', query);
      // Simular productos si no hay API key
      return this.simulateProductSearch(query, storeIds);
    }

    const cleanedQuery = cleanIngredientText(query);
    const cacheKey = `products:${cleanedQuery}:${storeIds.join(',')}`;
    const cached = this.productsCache.get(cacheKey);
    
    if (cached && cached.expires > Date.now()) {
      console.log(`Usando productos en caché de Ratoneando para "${cleanedQuery}"`);
      return cached.data;
    }

    try {
      console.log(`Buscando productos con: "${cleanedQuery}" en tiendas:`, storeIds);
      
      const storesParam = storeIds.length > 0 ? `&stores=${storeIds.join(',')}` : '';
      const response = await this.fetchWithRetry(`${this.baseUrl}/products/search?q=${encodeURIComponent(cleanedQuery)}${storesParam}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Error de API: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Respuesta de API de productos:', data);
      
      if (!data.products || !Array.isArray(data.products)) {
        console.error('Formato de respuesta inesperado:', data);
        throw new Error('Formato de respuesta inesperado');
      }
      
      const products: RatoneandoProduct[] = data.products || [];
      
      console.log(`Encontrados ${products.length} productos para "${cleanedQuery}"`);

      // Guardar en caché
      this.productsCache.set(cacheKey, {
        data: products,
        expires: Date.now() + CACHE_EXPIRATION
      });

      // Update service status after successful call
      this.serviceStatus = {
        status: 'available',
        error: null
      };

      return products;
    } catch (error) {
      console.error(`Error buscando productos para "${cleanedQuery}":`, error);
      
      // Update service status
      this.serviceStatus = {
        status: 'degraded',
        error: error instanceof Error ? error.message : 'Error desconocido buscando productos'
      };
      
      // Si falla, simular productos
      return this.simulateProductSearch(query, storeIds);
    }
  }
  
  // Método para simular búsqueda de productos
  private simulateProductSearch(query: string, storeIds: string[]): RatoneandoProduct[] {
    const products: RatoneandoProduct[] = [];
    
    // Si no se proporcionaron IDs de tiendas, usar tiendas simuladas
    if (storeIds.length === 0) {
      storeIds = ['sim-1', 'sim-2', 'sim-3', 'sim-4'];
    }
    
    // Generar de 5 a 15 productos simulados
    const productCount = Math.floor(Math.random() * 10) + 5;
    
    for (let i = 0; i < productCount; i++) {
      // Elegir tienda aleatoria de las proporcionadas
      const storeId = storeIds[Math.floor(Math.random() * storeIds.length)];
      
      // Precio base entre 100 y 1000
      const basePrice = Math.floor(Math.random() * 900) + 100;
      
      // Decidir si está en oferta
      const isOffer = Math.random() > 0.7;
      const discountPercentage = isOffer ? Math.floor(Math.random() * 30) + 5 : 0;
      const originalPrice = isOffer ? basePrice * (1 + (discountPercentage / 100)) : undefined;
      
      // Marcas simuladas
      const brands = ['Marca A', 'Marca B', 'Marca C', 'Marca Propia', 'Premium', 'Económica'];
      const brand = brands[Math.floor(Math.random() * brands.length)];
      
      // Variantes del nombre de búsqueda
      const variants = ['', ' Premium', ' Especial', ' Económico', ' Grande', ' Pequeño'];
      const nameVariant = variants[Math.floor(Math.random() * variants.length)];
      
      products.push({
        id: `sim-product-${i}`,
        name: `${query}${nameVariant}`,
        brand: brand,
        description: `${query} de calidad ${Math.random() > 0.5 ? 'premium' : 'estándar'}`,
        price: Math.round(basePrice * 100) / 100,
        original_price: originalPrice ? Math.round(originalPrice * 100) / 100 : undefined,
        discount_percentage: isOffer ? discountPercentage : undefined,
        unit: Math.random() > 0.3 ? 'unidad' : ['kg', 'g', 'l', 'ml'][Math.floor(Math.random() * 4)],
        store_id: storeId
      });
    }
    
    console.log(`Generados ${products.length} productos simulados para "${query}"`);
    return products;
  }

  // Método para optimizar la lista de compras
  async optimizeShoppingList(
    items: any[], // Asegurar que use any para items
    stores: RatoneandoStore[]
  ): Promise<RatoneandoProductsByStore[]> {
    if (!this.apiKey) {
      console.log('No hay API key configurada, simulando optimización de lista de compras');
      // Simular optimización si no hay API key
      return this.simulatePrices(items, stores);
    }
    
    if (items.length === 0 || stores.length === 0) {
      return [];
    }

    console.log(`Optimizando ${items.length} items para ${stores.length} tiendas con Ratoneando`);
    const storeIds = stores.map(store => store.id);
    const pendingItems = items.filter(item => !item.completed); // Asumiendo que item tiene completed

    try {
      // Procesar los items en lotes para no sobrecargar la API
      const BATCH_SIZE = 5;
      const results: RatoneandoProductsByStore[] = [];
      
      for (let i = 0; i < pendingItems.length; i += BATCH_SIZE) {
        const batch = pendingItems.slice(i, i + BATCH_SIZE);
        console.log(`Procesando lote ${Math.floor(i/BATCH_SIZE) + 1} de ${Math.ceil(pendingItems.length/BATCH_SIZE)}`);
        
        const batchPromises = batch.map(async (item) => {
          try {
            // Buscar productos para este item
            const cleanedName = cleanIngredientText(item.name); // Asumiendo que item tiene name
            console.log(`Buscando productos para ${cleanedName}...`);
            const products = await this.searchProducts(cleanedName, storeIds);
            
            if (products.length === 0) {
              console.log(`No se encontraron productos para ${cleanedName}`);
              return {
                item,
                stores: [],
                bestPrice: item.estimatedPrice || 0, // Asumiendo que item tiene estimatedPrice
                originalPrice: item.estimatedPrice || 0,
                savings: 0,
                savingsPercentage: 0,
                searchStatus: 'not_found' as const
              };
            }
            
            // Agrupar productos por tienda
            const storeProductsMap = new Map<string, {
              store: RatoneandoStore,
              products: RatoneandoProduct[]
            }>();
            
            // Primero, asegurar que todas las tiendas estén en el mapa
            stores.forEach(store => {
              storeProductsMap.set(store.id, {
                store,
                products: []
              });
            });
            
            // Luego, agregar los productos a sus respectivas tiendas
            products.forEach(product => {
              const storeData = storeProductsMap.get(product.store_id);
              if (storeData) {
                storeData.products.push(product);
              }
            });
            
            // Convertir el mapa a un array y ordenar los productos por precio en cada tienda
            const storeProducts = Array.from(storeProductsMap.values());
            storeProducts.forEach(store => {
              store.products.sort((a, b) => a.price - b.price);
            });
            
            // Encontrar el mejor precio
            let bestPrice = Infinity;
            let bestStore: RatoneandoStore | undefined;
            
            storeProducts.forEach(storeData => {
              if (storeData.products.length > 0) {
                const lowestPrice = storeData.products[0].price;
                if (lowestPrice < bestPrice) {
                  bestPrice = lowestPrice;
                  bestStore = storeData.store;
                }
              }
            });
            
            if (bestPrice === Infinity) {
              bestPrice = item.estimatedPrice || 0;
            }
            
            // Calcular ahorro
            const originalPrice = item.estimatedPrice || bestPrice;
            const savings = originalPrice - bestPrice;
            const savingsPercentage = originalPrice > 0 ? (savings / originalPrice) * 100 : 0;
            
            // Multiplicar por cantidad
            const finalBestPrice = bestPrice * item.quantity; // Asumiendo que item tiene quantity
            const finalOriginalPrice = originalPrice * item.quantity;
            
            return {
              item,
              stores: storeProducts,
              bestPrice: finalBestPrice,
              bestStore,
              originalPrice: finalOriginalPrice, 
              savings: savings * item.quantity,
              savingsPercentage,
              searchStatus: 'success' as const
            };
          } catch (error) {
            console.error(`Error procesando item ${item.name}:`, error);
            return {
              item,
              stores: [],
              bestPrice: item.estimatedPrice || 0,
              originalPrice: item.estimatedPrice || 0,
              savings: 0,
              savingsPercentage: 0,
              searchStatus: 'error' as const,
              errorMessage: `Error: ${error instanceof Error ? error.message : String(error)}`
            };
          }
        });
        
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        
        // Pequeña pausa entre lotes
        if (i + BATCH_SIZE < pendingItems.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      console.log(`Optimización completada para ${results.length} items`);
      return results;
    } catch (error) {
      console.error('Error general en optimizeShoppingList:', error);
      
      // Update service status
      this.serviceStatus = {
        status: 'degraded',
        error: error instanceof Error ? error.message : 'Error desconocido optimizando lista'
      };
      
      toast.error('Error en el servicio de optimización', {
        description: 'Se utilizarán precios estimados'
      });
      
      // Si falla, simular precios
      return this.simulatePrices(items, stores);
    }
  }
}

export const ratoneandoService = new RatoneandoService();