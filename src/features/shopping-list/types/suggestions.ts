/**
 * Tipos base para el sistema de sugerencias
 */

export interface Suggestion {
  id: string;
  name: string;
  category?: string;
  frequency: number;
  lastUsed?: Date;
  defaultUnit?: string;
  score?: number;
}

export interface SuggestionFilter {
  searchText: string;
  category?: string;
  limit?: number;
}

export interface RankingFactors {
  frequency: number;    // Peso por frecuencia de uso
  recency: number;      // Peso por uso reciente
  exactMatch: number;   // Peso por coincidencia exacta
  categoryMatch: number;// Peso por coincidencia de categoría
}

export interface CacheConfig {
  ttl: number;          // Tiempo de vida en milisegundos
  maxEntries: number;   // Número máximo de entradas en caché
  cleanupInterval: number; // Intervalo de limpieza en milisegundos
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}