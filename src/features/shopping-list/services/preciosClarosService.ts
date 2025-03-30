// import { ShoppingItem } from '../components/ShoppingListItem'; // Eliminado, no parece usarse
import { cleanIngredientText } from '@/lib/ingredientUtils'; // Corregido para apuntar al archivo copiado
import { toast } from 'sonner';

// Interfaces
export interface Store {
  id: string;
  banderaId: string;
  comercioId: string;
  banderaDescripcion: string;
  comercioRazonSocial: string;
  sucursalNombre: string;
  sucursalTipo: string;
  provincia: string;
  localidad: string;
  direccion: string;
  lat: number;
  lng: number;
  distanciaNumero: number;
  distanciaDescripcion: string;
}

export interface Product {
  id: string;
  marca: string;
  nombre: string;
  presentacion: string;
  precioMin: number;
  precioMax: number;
  cantSucursalesDisponible: number;
}

export interface ProductPrice {
  producto: Product;
  sucursal: Store;
  precioLista: number;
  precioOferta: number | null;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expires: number;
}

const CACHE_EXPIRATION = 30 * 60 * 1000; // 30 min
const REQUEST_TIMEOUT = 10000;
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000;
const BASE_URL = 'https://d3e6htiiul5ek9.cloudfront.net/prod';

class CacheManager<T> {
  private cache = new Map<string, CacheEntry<T>>();

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (entry && Date.now() < entry.expires) {
      return entry.data;
    }
    this.cache.delete(key);
    return null;
  }

  set(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expires: Date.now() + CACHE_EXPIRATION,
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

const makeRequest = async <T>(url: string, retries = MAX_RETRIES): Promise<T> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
    return await response.json();
  } catch (error) {
    if (retries > 0) {
      await new Promise(r => setTimeout(r, RETRY_DELAY));
      return makeRequest(url, retries - 1);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

const storesCache = new CacheManager<Store[]>();

const serviceStatus = {
  status: 'available' as 'available' | 'degraded' | 'unavailable',
  error: null as string | null,
  usingAlternativeAPI: false
};

export const preciosClarosService = {
  checkServiceAvailability: async (): Promise<boolean> => {
    try {
      const response = await fetch(`${BASE_URL}/sucursales?lat=-34.603684&lng=-58.381559&limit=1`);
      if (!response.ok) {
        serviceStatus.status = 'unavailable';
        serviceStatus.error = 'El servicio no está respondiendo';
        return false;
      }
      serviceStatus.status = 'available';
      serviceStatus.error = null;
      return true;
    } catch (error) {
      serviceStatus.status = 'unavailable';
      serviceStatus.error = error instanceof Error ? error.message : 'Error de conexión';
      return false;
    }
  },

  getServiceStatus: () => ({...serviceStatus}),

  clearCache: () => {
    storesCache.clear();
  },

  getStoresNearby: async (lat: number, lng: number, limit = 10): Promise<Store[]> => {
    const cacheKey = `${lat}-${lng}-${limit}`;
    const cachedStores = storesCache.get(cacheKey);
    if (cachedStores) return cachedStores;

    try {
      const data = await makeRequest<{ sucursales: Store[] }>(`${BASE_URL}/sucursales?lat=${lat}&lng=${lng}&limit=${limit}`);
      const stores = data.sucursales;
      storesCache.set(cacheKey, stores);
      return stores;
    } catch (error) {
      toast.error('Error obteniendo tiendas cercanas');
      return [];
    }
  },

  searchProducts: async (query: string, storeIds: string[] = []): Promise<Product[]> => {
    if (!query.trim()) return [];

    const params = new URLSearchParams({ string: cleanIngredientText(query), limit: '10' }); // Usar cleanIngredientText
    if (storeIds.length) params.append('array_sucursales', storeIds.join(','));

    try {
      const data = await makeRequest<{ productos: Product[] }>(`${BASE_URL}/productos?${params}`);
      return data.productos;
    } catch (error) {
      toast.error('Error buscando productos');
      return [];
    }
  },

  getProductPrices: async (productId: string, storeIds: string[]): Promise<ProductPrice[]> => {
    if (!storeIds.length) return [];

    const params = new URLSearchParams({ id_producto: productId, array_sucursales: storeIds.join(',') });

    try {
      const data = await makeRequest<{ precios: ProductPrice[] }>(`${BASE_URL}/productos/precios?${params}`);
      return data.precios;
    } catch (error) {
      toast.error('Error obteniendo precios del producto');
      return [];
    }
  },

  findBestPricesForShoppingList: async (
    items: Array<{ id: string; name: string; quantity: string; unit: string }>, // Ajustar tipo si es necesario
    storeIds: string[]
  ): Promise<Array<{
    item: { id: string; name: string; quantity: string; unit: string }; // Ajustar tipo si es necesario
    stores: Array<{
      store: Store;
      prices: Array<{ product: Product; price: number; isOferta: boolean }>;
    }>;
    bestPrice: number;
    bestStore?: Store;
    originalPrice: number;
    savings: number;
    savingsPercentage: number;
    searchStatus: 'success' | 'not_found' | 'pending' | 'error';
    errorMessage?: string;
  }>> => {
    const results = await Promise.all(
      items.map(async (item) => {
        try {
          // Buscar productos que coincidan con el item
          const products = await preciosClarosService.searchProducts(item.name, storeIds);
          
          if (products.length === 0) {
            return {
              item,
              stores: [],
              bestPrice: 0,
              originalPrice: 0,
              savings: 0,
              savingsPercentage: 0,
              searchStatus: 'not_found' as const
            };
          }

          // Obtener precios para cada producto en las tiendas seleccionadas
          const storeResults = await Promise.all(
            products.slice(0, 3).map(async (product) => {
              const prices = await preciosClarosService.getProductPrices(product.id, storeIds);
              return { product, prices };
            })
          );

          // Agrupar resultados por tienda
          const storeMap = new Map<string, {
            store: Store;
            prices: Array<{ product: Product; price: number; isOferta: boolean }>;
          }>();

          storeResults.forEach(({ product, prices }) => {
            prices.forEach((price) => {
              const storeId = price.sucursal.id;
              if (!storeMap.has(storeId)) {
                storeMap.set(storeId, {
                  store: price.sucursal,
                  prices: []
                });
              }
              const store = storeMap.get(storeId)!;
              store.prices.push({
                product,
                price: price.precioOferta || price.precioLista,
                isOferta: price.precioOferta !== null
              });
            });
          });

          const stores = Array.from(storeMap.values());
          
          // Encontrar el mejor precio
          let bestPrice = Infinity;
          let bestStore: Store | undefined;
          stores.forEach(({ store, prices }) => {
            const minPrice = Math.min(...prices.map(p => p.price));
            if (minPrice < bestPrice) {
              bestPrice = minPrice;
              bestStore = store;
            }
          });

          // Calcular precio original (máximo encontrado)
          const originalPrice = Math.max(
            ...stores.flatMap(s => s.prices.map(p => p.price))
          );

          const savings = originalPrice - bestPrice;
          const savingsPercentage = (savings / originalPrice) * 100;

          return {
            item,
            stores,
            bestPrice: bestPrice === Infinity ? 0 : bestPrice,
            bestStore,
            originalPrice: originalPrice === -Infinity ? 0 : originalPrice,
            savings,
            savingsPercentage,
            searchStatus: 'success' as const
          };
        } catch (error) {
          console.error('Error buscando precios para:', item.name, error);
          return {
            item,
            stores: [],
            bestPrice: 0,
            originalPrice: 0,
            savings: 0,
            savingsPercentage: 0,
            searchStatus: 'error' as const,
            errorMessage: error instanceof Error ? error.message : 'Error desconocido'
          };
        }
      })
    );

    return results;
  }
};