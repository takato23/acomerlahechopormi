import { ICacheManager, ICacheStrategy, CacheManagerOptions, CacheChangeEvent } from './types';
import { CacheEntry } from '../../types/suggestions';

/**
 * Implementación del gestor de caché utilizando IndexedDB
 */
export class CacheManager implements ICacheManager {
  private readonly options: CacheManagerOptions;
  private readonly dbName: string = 'shopping-list-cache';
  private readonly storeName: string = 'suggestions-store';
  private db: IDBDatabase | null = null;

  constructor(options: Partial<CacheManagerOptions> = {}) {
    const defaultOptions: CacheManagerOptions = {
      ttl: 1000 * 60 * 60, // 1 hora por defecto
      maxEntries: 1000,
      cleanupInterval: 1000 * 60 * 5, // 5 minutos
      namespace: undefined,
      strategy: undefined
    };

    this.options = { ...defaultOptions, ...options };

    this.initDB().then(() => {
      // Iniciar limpieza periódica
      setInterval(() => this.cleanup(), this.options.cleanupInterval);
    });
  }

  /**
   * Inicializa la base de datos IndexedDB
   */
  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * Obtiene una transacción para el almacén
   */
  private getStore(mode: IDBTransactionMode = 'readonly'): IDBObjectStore {
    if (!this.db) throw new Error('Database not initialized');
    const transaction = this.db.transaction(this.storeName, mode);
    return transaction.objectStore(this.storeName);
  }

  /**
   * Almacena datos en el caché
   */
  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    const finalKey = this.options.namespace ? `${this.options.namespace}:${key}` : key;

    // Verificar estrategia de caché si existe
    if (this.options.strategy) {
      const shouldCache = await this.options.strategy.shouldCache(finalKey, data);
      if (!shouldCache) return;
    }

    const entry: CacheEntry<T> & { key: string } = {
      key: finalKey,
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + (ttl || this.options.ttl)
    };

    return new Promise((resolve, reject) => {
      const store = this.getStore('readwrite');
      const request = store.put(entry);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.emitChange<T>({ 
          type: 'set', 
          key: finalKey, 
          data, 
          timestamp: Date.now() 
        });
        resolve();
      };
    });
  }

  /**
   * Recupera datos del caché
   */
  async get<T>(key: string): Promise<T | null> {
    const finalKey = this.options.namespace ? `${this.options.namespace}:${key}` : key;

    return new Promise((resolve, reject) => {
      const store = this.getStore();
      const request = store.get(finalKey);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const entry = request.result as (CacheEntry<T> & { key: string }) | undefined;
        
        if (!entry || entry.expiresAt < Date.now()) {
          resolve(null);
          if (entry) this.invalidate(finalKey); // Limpiar entrada expirada
          return;
        }

        resolve(entry.data);
      };
    });
  }

  /**
   * Invalida una entrada específica del caché
   */
  async invalidate(key: string): Promise<void> {
    const finalKey = this.options.namespace ? `${this.options.namespace}:${key}` : key;

    // Verificar estrategia de invalidación si existe
    if (this.options.strategy) {
      const shouldInvalidate = await this.options.strategy.shouldInvalidate(finalKey);
      if (!shouldInvalidate) return;
    }

    return new Promise((resolve, reject) => {
      const store = this.getStore('readwrite');
      const request = store.delete(finalKey);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.emitChange({ 
          type: 'invalidate', 
          key: finalKey, 
          timestamp: Date.now() 
        });
        resolve();
      };
    });
  }

  /**
   * Limpia las entradas expiradas del caché
   */
  async cleanup(): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('readwrite');
      const request = store.openCursor();
      const now = Date.now();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          const entry = cursor.value as CacheEntry<unknown>;
          if (entry.expiresAt < now) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve();
        }
      };
    });
  }

  /**
   * Vacía completamente el caché
   */
  async clear(): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('readwrite');
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.emitChange({ 
          type: 'clear', 
          timestamp: Date.now() 
        });
        resolve();
      };
    });
  }

  /**
   * Emite un evento de cambio en el caché
   */
  private emitChange<T>(event: CacheChangeEvent<T>): void {
    // Aquí se podría implementar un sistema de eventos
    // Por ahora solo lo loggeamos
    console.debug('[CacheManager] Change:', event);
  }
}