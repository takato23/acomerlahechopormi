# Configuración y Funcionamiento del Servicio `buscaPreciosService` en `cocina-organizada`

Este documento describe cómo el servicio `buscaPreciosService` (específicamente la versión `v2` encontrada en `src/services/buscaPreciosService.v2.ts`) interactúa con una API externa para obtener precios de productos. El scraping real no ocurre en este código, sino en la API externa.

## Resumen del Flujo

1.  **Recepción de Consulta:** El servicio recibe un término de búsqueda (nombre del producto).
2.  **Normalización:** La consulta se limpia y estandariza (minúsculas, sin acentos, espacios normalizados).
3.  **Verificación de Caché:** Se revisa si existen resultados válidos y recientes para la consulta normalizada en el `localStorage` del navegador. Si es así, se devuelven directamente.
4.  **Llamada a la API (si no hay caché):**
    *   Se construye la URL: `https://buscaprecios.onrender.com/?q=<consulta_original_codificada>`.
    *   Se realiza una petición HTTP `GET` a esa URL.
    *   Se incluye la cabecera `Origin` con el origen de la aplicación web (importante para CORS si la API lo requiere).
    *   Se implementa un sistema de **reintentos automáticos** con espera exponencial (y jitter) si la API devuelve errores 5xx, errores de red, o si la petición excede el **timeout** configurado (60 segundos por defecto).
5.  **Procesamiento de Respuesta:**
    *   Si la respuesta es exitosa (HTTP 200 OK), se parsea el cuerpo JSON.
    *   Se extraen los productos del campo `data.products`.
    *   Se **formatean** los datos de cada producto a la interfaz `BuscaPreciosProduct` definida localmente (se normalizan nombres de campos, se parsean precios, se asignan IDs si faltan, etc.).
    *   Los productos formateados se ordenan por precio.
6.  **Actualización de Caché:** Los resultados formateados se guardan en el `localStorage` asociados a la consulta normalizada, junto con una marca de tiempo.
7.  **Retorno de Resultados:** Se devuelven los productos formateados.
8.  **Manejo de Errores:** Si la API falla persistentemente después de los reintentos, se muestra un mensaje de error al usuario (`toast`) y se devuelve un array vacío.

## Código Clave (`src/services/buscaPreciosService.v2.ts`)

A continuación se muestra el código relevante que implementa la lógica descrita.

```typescript
// Interfaces (Define la estructura esperada de los datos)
export interface BuscaPreciosProduct {
  id: string;
  nombre: string;
  precio: number;
  imagen: string;
  tienda: string;
  url: string;
}

interface CacheEntry {
  timestamp: number;
  data: BuscaPreciosProduct[];
}

interface Cache {
  [normalizedQuery: string]: CacheEntry;
}

// Constantes importantes
const API_URL = 'https://buscaprecios.onrender.com/?q=';
const CACHE_KEY = 'buscaPreciosCache';
const DEFAULT_CACHE_DURATION = 15 * 60 * 1000; // 15 minutos
const DEFAULT_RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 2000,
  maxDelay: 10000,
  factor: 2,
};
const DEFAULT_TIMEOUT = 60000; // 60 segundos

// --- Funciones de Gestión de Caché (localStorage) ---
const getCache = (): Cache => { /* ... */ };
const setCache = (cache: Cache) => { /* ... */ };
const getCachedResult = (normalizedQuery: string, cacheDuration: number): BuscaPreciosProduct[] | null => { /* ... */ };
const updateCache = (normalizedQuery: string, data: BuscaPreciosProduct[]) => { /* ... */ };

// --- Normalización de Consulta ---
const normalizeQuery = (query: string): string => {
  return query
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remove accents
};

// --- Fetch con Reintentos y Timeout ---
const fetchWithRetry = async (url: string, options: RequestInit, retryConfig: Required<RetryConfig>, timeout: number): Promise<Response> => {
  let attempts = 0;
  let delay = retryConfig.initialDelay;

  while (attempts <= retryConfig.maxRetries) {
    attempts++;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      console.log(`📡 Attempt ${attempts} fetching: ${url}`);
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        return response;
      }

      // No reintentar errores 4xx (errores del cliente)
      if (response.status >= 400 && response.status < 500) {
         console.error(`🚫 Non-retryable HTTP error: ${response.status} ${response.statusText}`);
         throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      // Error reintentable (5xx, red)
      console.warn(`⚠️ Attempt ${attempts} failed with status ${response.status}. Retrying in ${delay}ms...`);

    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        console.error(`⏱️ Attempt ${attempts} timed out after ${timeout}ms.`);
      } else {
        console.error(`❌ Attempt ${attempts} failed with error:`, error.message);
      }

      if (attempts > retryConfig.maxRetries) {
        console.error('🚫 Max retries reached. Throwing error.');
        throw error;
      }
      console.warn(`Retrying in ${delay}ms...`);
    }

    // Espera con jitter antes de reintentar
    await new Promise(resolve => setTimeout(resolve, delay + Math.random() * 1000));
    delay = Math.min(delay * retryConfig.factor, retryConfig.maxDelay);
  }
  throw new Error('Max retries reached without success.');
};

// --- Formateo de Productos (Adaptación de la respuesta de la API) ---
const formatProducts = (data: any): BuscaPreciosProduct[] => {
  if (!data || !data.products || !Array.isArray(data.products)) {
    console.error('❌ Invalid data format received from API:', data);
    return [];
  }

  const formattedProducts = data.products
    .filter((item: any) => { /* Filtra items inválidos */ })
    .map((item: any) => ({
      id: item.id || `product-${Math.random().toString(36).substring(2, 9)}`,
      nombre: item.name || item.title || 'Producto sin nombre',
      // Parsea el precio de forma más robusta
      precio: typeof item.price === 'string' ? parseFloat(item.price.replace(/[^0-9.,]/g, '').replace(',', '.')) : (item.price || 0),
      imagen: item.image || item.img || item.imagen || '/placeholder.svg',
      tienda: item.store || item.tienda || item.comercio || 'Tienda no especificada',
      url: item.link || item.url || '#'
    }))
    .sort((a: BuscaPreciosProduct, b: BuscaPreciosProduct) => a.precio - b.precio);

  return formattedProducts;
};


// --- Función Principal de Búsqueda ---
export const searchProducts = async (query: string, options: SearchOptions = {}): Promise<BuscaPreciosProduct[]> => {
  const {
    useCache = true,
    cacheDuration = DEFAULT_CACHE_DURATION,
    retryConfig = {},
    timeout = DEFAULT_TIMEOUT,
  } = options;

  const normalizedQuery = normalizeQuery(query);
  if (!normalizedQuery) return [];

  // 1. Revisar Caché
  if (useCache) {
    const cachedData = getCachedResult(normalizedQuery, cacheDuration);
    if (cachedData) return cachedData;
  }

  // 2. Llamar a la API con Reintentos
  const apiUrl = `${API_URL}${encodeURIComponent(query)}`; // Usa la query original para la API
  const effectiveRetryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };

  try {
    const response = await fetchWithRetry(
      apiUrl,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Origin': window.location.origin // Importante para CORS
        }
      },
      effectiveRetryConfig,
      timeout
    );

    const data = await response.json();

    // 3. Formatear Productos
    const formattedProducts = formatProducts(data);

    // 4. Actualizar Caché
    if (useCache) {
      updateCache(normalizedQuery, formattedProducts);
    }

    return formattedProducts;

  } catch (error: any) {
    console.error(`❌ Final error after retries for query "${query}":`, error.message);
    // toast.error(`Error al buscar "${query}". Intenta de nuevo más tarde.`); // (UI Feedback)
    return []; // Devolver array vacío en caso de error final
  }
};

// --- Funciones Utilitarias Adicionales ---
// export const getPriceRange = (products: BuscaPreciosProduct[]) => { /* ... */ };
// export const getStores = (products: BuscaPreciosProduct[]) => { /* ... */ };
// export const filterProducts = (products: BuscaPreciosProduct[], filters: { /* ... */ }) => { /* ... */ };
// export const filterRelevantProducts = (products: BuscaPreciosProduct[], searchTerm: string): BuscaPreciosProduct[] => { /* ... */ };

```

## Para Replicar por otra IA

Para que otra IA replique esta funcionalidad, necesitaría:

1.  **Entender el flujo:** Explicar que se conecta a una API externa (`https://buscaprecios.onrender.com/`) para obtener los datos.
2.  **Implementar la llamada a la API:** Usar `fetch` o una librería similar para hacer peticiones `GET` a la URL construida.
3.  **Implementar caché:** Usar `localStorage` o un mecanismo similar para guardar y recuperar resultados basados en la consulta normalizada.
4.  **Implementar reintentos:** Crear una lógica para reintentar la petición `fetch` en caso de errores específicos (5xx, red, timeout) con espera exponencial.
5.  **Implementar timeout:** Usar `AbortController` para cancelar peticiones lentas.
6.  **Formatear la respuesta:** Adaptar la estructura JSON recibida de la API a la estructura de datos deseada (`BuscaPreciosProduct`).
7.  **Manejar errores:** Capturar errores de red, de API y de procesamiento, y devolver un resultado consistente (ej. array vacío).
8.  **Normalizar consultas:** Implementar una función para limpiar los términos de búsqueda.

Proporcionar el código TypeScript anterior como referencia principal será muy útil.