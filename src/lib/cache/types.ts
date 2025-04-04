export interface CacheEntry<T> {
  key: string;
  value: T;
  expiry: number; // Timestamp de expiración (ttl)
}

export interface CacheConfig {
  ttl: number; // Tiempo de vida en milisegundos
  maxEntries: number; // Máximo de entradas
  cleanupInterval: number; // Intervalo de limpieza automática en milisegundos
}