import { CacheConfig, CacheEntry } from '../../types/suggestions';

/**
 * Interfaz base para el gestor de caché
 */
export interface ICacheManager {
  /**
   * Almacena datos en el caché
   * @param key Clave única para identificar los datos
   * @param data Datos a almacenar
   * @param ttl Tiempo de vida en milisegundos (opcional)
   */
  set<T>(key: string, data: T, ttl?: number): Promise<void>;

  /**
   * Recupera datos del caché
   * @param key Clave de los datos a recuperar
   * @returns Los datos almacenados o null si no existen o están expirados
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Invalida una entrada específica del caché
   * @param key Clave de la entrada a invalidar
   */
  invalidate(key: string): Promise<void>;

  /**
   * Limpia las entradas expiradas del caché
   */
  cleanup(): Promise<void>;

  /**
   * Vacía completamente el caché
   */
  clear(): Promise<void>;
}

/**
 * Interfaz para la estrategia de caché
 */
export interface ICacheStrategy {
  /**
   * Determina si se deben cachear los datos
   * @param key Clave de los datos
   * @param value Datos a cachear
   */
  shouldCache(key: string, value: any): Promise<boolean>;

  /**
   * Determina si se debe invalidar una entrada
   * @param key Clave de la entrada
   */
  shouldInvalidate(key: string): Promise<boolean>;
}

/**
 * Opciones de configuración para el CacheManager
 */
export interface CacheManagerOptions extends CacheConfig {
  namespace?: string;      // Espacio de nombres para aislar el caché
  strategy?: ICacheStrategy; // Estrategia de caché personalizada
}

/**
 * Evento emitido cuando cambia el caché
 */
export interface CacheChangeEvent<T> {
  type: 'set' | 'invalidate' | 'clear';
  key?: string;
  data?: T;
  timestamp: number;
}