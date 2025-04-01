import { CacheEntry, CacheConfig } from './types';

const DEFAULT_TTL = 60 * 60 * 1000; // 1 hora
const DEFAULT_MAX_ENTRIES = 100;
const DEFAULT_CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutos
const CACHE_STORAGE_KEY = 'app_lru_cache';

export class LRUCacheManager<T> {
  private cache: Map<string, CacheEntry<T>>;
  private usageOrder: string[]; // Array para mantener el orden LRU (el más reciente al final)
  private config: CacheConfig;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null; // Usar ReturnType para compatibilidad Node/Browser

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      ttl: config?.ttl ?? DEFAULT_TTL,
      maxEntries: config?.maxEntries ?? DEFAULT_MAX_ENTRIES,
      cleanupInterval: config?.cleanupInterval ?? DEFAULT_CLEANUP_INTERVAL,
    };
    // Inicializar vacíos antes de cargar para evitar errores si localStorage falla
    this.cache = new Map();
    this.usageOrder = [];
    this.loadCacheFromStorage(); // Carga el caché y el orden desde localStorage
    this.startAutoCleanup();
  }

  private loadCacheFromStorage(): void {
    try {
      const storedData = localStorage.getItem(CACHE_STORAGE_KEY);
      if (storedData) {
        const parsed = JSON.parse(storedData);
        // Validar estructura básica
        if (parsed && typeof parsed.cache === 'object' && Array.isArray(parsed.usageOrder)) {
            // Reconstruir el Map desde el objeto plano
            this.cache = new Map(Object.entries(parsed.cache));
            this.usageOrder = parsed.usageOrder;
            // Asegurar consistencia: eliminar claves de usageOrder que no estén en cache
            this.usageOrder = this.usageOrder.filter(key => this.cache.has(key));
            // Limpiar expirados al cargar y asegurar consistencia final
            this.cleanup(true);
        } else {
            console.warn("Invalid cache structure found in localStorage. Resetting cache.");
            this.resetCache();
        }
      } else {
        // No hay datos, inicializar vacíos (ya hecho en constructor)
      }
    } catch (error) {
      console.error("Error loading cache from localStorage:", error);
      this.resetCache(); // Resetear si hay error de parseo
    }
  }

  private saveCacheToStorage(): void {
    try {
      // Convertir el Map a un objeto plano antes de guardar
      const dataToStore = {
        cache: Object.fromEntries(this.cache),
        usageOrder: this.usageOrder,
      };
      localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(dataToStore));
    } catch (error) {
      console.error("Error saving cache to localStorage:", error);
      // Considerar estrategias si localStorage está lleno (ej. limpiar más agresivamente)
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          console.warn("LocalStorage quota exceeded. Attempting to clear older cache entries.");
          // Intentar liberar espacio eliminando las más antiguas
          const entriesToRemove = Math.ceil(this.usageOrder.length * 0.1); // Eliminar 10%
          for(let i = 0; i < entriesToRemove && this.usageOrder.length > 0; i++) {
              const keyToRemove = this.usageOrder.shift();
              if (keyToRemove) {
                  this.cache.delete(keyToRemove);
              }
          }
          // Intentar guardar de nuevo después de limpiar
          try {
              const reducedDataToStore = {
                  cache: Object.fromEntries(this.cache),
                  usageOrder: this.usageOrder,
              };
              localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(reducedDataToStore));
          } catch (retryError) {
              console.error("Failed to save cache even after cleanup:", retryError);
          }
      }
    }
  }

  private updateUsageOrder(key: string): void {
    // Elimina la clave si ya existe para moverla al final
    const index = this.usageOrder.indexOf(key);
    if (index > -1) {
      this.usageOrder.splice(index, 1);
    }
    // Añade la clave al final (más reciente)
    this.usageOrder.push(key);
  }

  async set(key: string, value: T, ttl?: number): Promise<void> {
    const expiry = Date.now() + (ttl ?? this.config.ttl);
    const entry: CacheEntry<T> = { key, value, expiry };

    this.cache.set(key, entry);
    this.updateUsageOrder(key);

    // Aplicar política de evicción si se supera maxEntries
    this.evict();
    this.saveCacheToStorage();
  }

  async get(key: string): Promise<T | null> {
    const entry = this.cache.get(key);

    if (entry) {
      // Verificar si ha expirado
      if (Date.now() > entry.expiry) {
        await this.invalidate(key); // Elimina si está expirado (esto también guarda)
        return null;
      }
      // Actualizar orden LRU porque se accedió
      this.updateUsageOrder(key);
      this.saveCacheToStorage(); // Guardar el nuevo orden
      return entry.value;
    }
    return null;
  }

  async invalidate(key: string): Promise<void> {
    if (this.cache.has(key)) {
        this.cache.delete(key);
        const index = this.usageOrder.indexOf(key);
        if (index > -1) {
          this.usageOrder.splice(index, 1);
        }
        this.saveCacheToStorage();
    }
  }

  // Elimina las entradas más antiguas (LRU) si se supera maxEntries
  private evict(): void {
    let evicted = false;
    while (this.usageOrder.length > this.config.maxEntries) {
      const keyToRemove = this.usageOrder.shift(); // Elimina el primero (el menos reciente)
      if (keyToRemove) {
        this.cache.delete(keyToRemove);
        evicted = true;
      }
    }
    // No es necesario guardar aquí directamente, se guarda en set() o get()
  }

  // Limpia entradas expiradas
  async cleanup(forceSave: boolean = false): Promise<void> {
    const now = Date.now();
    let changed = false;
    const validKeys = new Set<string>();

    // Iterar sobre las claves actuales para verificar expiración
    for (const key of this.usageOrder) {
        const entry = this.cache.get(key);
        if (entry && now > entry.expiry) {
            this.cache.delete(key); // Eliminar del Map
            changed = true;
        } else if (entry) {
            validKeys.add(key); // Mantener si es válido
        }
    }

    // Reconstruir usageOrder solo con las claves válidas y en el orden correcto
    if (changed) {
        this.usageOrder = this.usageOrder.filter(key => validKeys.has(key));
    }

    // Guardar si hubo cambios o si se forzó
    if (changed || forceSave) {
        this.saveCacheToStorage();
    }
  }

  private startAutoCleanup(): void {
    // Limpiar cualquier timer existente
    if (this.cleanupTimer !== null) {
      clearInterval(this.cleanupTimer);
    }
    // Iniciar nuevo timer si el intervalo es válido
    if (this.config.cleanupInterval > 0) {
        this.cleanupTimer = setInterval(() => {
          this.cleanup();
        }, this.config.cleanupInterval);
    }
  }

  stopAutoCleanup(): void {
    if (this.cleanupTimer !== null) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  // Método para resetear el caché completamente
  private resetCache(): void {
      this.cache.clear();
      this.usageOrder = [];
      try {
          localStorage.removeItem(CACHE_STORAGE_KEY);
      } catch (error) {
          console.error("Error removing cache from localStorage during reset:", error);
      }
  }

  // Método público para limpiar todo el caché si es necesario
  async clearAll(): Promise<void> {
      this.resetCache();
      this.stopAutoCleanup(); // Detener limpieza automática al borrar todo
  }
}