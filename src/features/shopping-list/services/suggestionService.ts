import { CacheManager } from '../lib/cache/CacheManager';
import { Suggestion, SuggestionFilter } from '../types/suggestions';
import { supabase } from '@/lib/supabaseClient'; // Importar cliente Supabase

// Asumir una tabla 'shopping_suggestions' con columnas:
// id (uuid), user_id (uuid), name (text), category (text, nullable),
// frequency (int4), last_used (timestamptz), default_unit (text, nullable)

/**
 * Servicio para gestionar las sugerencias de la lista de compras
 */
export class SuggestionService {
  private readonly cacheManager: CacheManager;
  private readonly CACHE_NAMESPACE = 'shopping-suggestions';
  private readonly CACHE_TTL = 1000 * 60 * 60 * 24; // 24 horas
  private readonly SUGGESTIONS_TABLE = 'shopping_suggestions'; // Nombre de la tabla

  constructor() {
    this.cacheManager = new CacheManager({
      namespace: this.CACHE_NAMESPACE,
      ttl: this.CACHE_TTL,
      maxEntries: 1000,
      cleanupInterval: 1000 * 60 * 60 // 1 hora
    });
  }

  /**
   * Obtiene el ID del usuario actual (simplificado)
   * En una app real, esto vendría del contexto de autenticación
   */
  private async getCurrentUserId(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id ?? null;
  }

  /**
   * Obtiene sugerencias basadas en el texto de búsqueda
   */
  async getSuggestions(filter: SuggestionFilter): Promise<Suggestion[]> {
    const cacheKey = this.getCacheKey(filter);
    const cached = await this.cacheManager.get<Suggestion[]>(cacheKey);
    if (cached) {
      console.debug(`[SuggestionService] Cache hit for key: ${cacheKey}`);
      return cached;
    }
    console.debug(`[SuggestionService] Cache miss for key: ${cacheKey}`);

    const suggestions = await this.fetchSuggestionsFromDB(filter);
    if (suggestions.length > 0) {
      await this.cacheManager.set(cacheKey, suggestions);
    }
    return suggestions;
  }

  /**
   * Aprende de la selección del usuario (Upsert en DB)
   */
  async learnFromSelection(suggestion: Suggestion): Promise<void> {
    const userId = await this.getCurrentUserId();
    if (!userId) return; // No hacer nada si no hay usuario

    // Usar un upsert para crear o actualizar la sugerencia
    const { error } = await supabase
      .from(this.SUGGESTIONS_TABLE)
      .upsert({
        // Si la sugerencia tiene ID (vino de DB), usarlo para actualizar.
        // Si no tiene ID (es nueva o parseada), se creará una nueva fila
        // y necesitaremos una forma de identificarla (ej: user_id y name como clave compuesta o generar ID)
        // Simplificación: Asumimos que siempre intentamos actualizar por nombre y user_id
        // Esto requiere una política RLS y potencialmente un índice en (user_id, name)
        user_id: userId,
        name: suggestion.name, // Clave principal junto con user_id
        category: suggestion.category,
        frequency: suggestion.frequency + 1, // Incrementar frecuencia
        last_used: new Date().toISOString(), // Actualizar fecha
        default_unit: suggestion.defaultUnit
      }, {
        onConflict: 'user_id, name' // Especificar columnas para detectar conflicto
      });

    if (error) {
      console.error('Error learning from selection:', error);
      throw error;
    }

    // Invalidar cachés relevantes (frecuentes y búsqueda específica)
    await this.cacheManager.invalidate(`frequent:5`); // Invalidar frecuentes (ej: top 5)
    await this.cacheManager.invalidate(`frequent:10`); // Invalidar frecuentes (ej: top 10)
    const searchCacheKey = this.getCacheKey({ searchText: suggestion.name });
    await this.cacheManager.invalidate(searchCacheKey); // Invalidar búsqueda específica
  }

  /**
   * Obtiene las sugerencias más frecuentes
   */
  async getFrequentSuggestions(limit: number = 5): Promise<Suggestion[]> {
    const cacheKey = `frequent:${limit}`;
    const cached = await this.cacheManager.get<Suggestion[]>(cacheKey);
    if (cached) {
      console.debug(`[SuggestionService] Cache hit for frequent key: ${cacheKey}`);
      return cached;
    }
    console.debug(`[SuggestionService] Cache miss for frequent key: ${cacheKey}`);

    const suggestions = await this.fetchFrequentFromDB(limit);
    if (suggestions.length > 0) {
      await this.cacheManager.set(cacheKey, suggestions);
    }
    return suggestions;
  }

  /**
   * Genera una clave de caché basada en los filtros
   */
  private getCacheKey(filter: SuggestionFilter): string {
    const { searchText, category, limit } = filter;
    // Normalizar searchText a minúsculas para consistencia del caché
    return `${searchText.toLowerCase()}:${category || 'all'}:${limit || 'default'}`;
  }

  /**
   * Busca sugerencias en la base de datos (Supabase)
   */
  private async fetchSuggestionsFromDB(filter: SuggestionFilter): Promise<Suggestion[]> {
    const userId = await this.getCurrentUserId();
    if (!userId) return [];

    let query = supabase
      .from(this.SUGGESTIONS_TABLE)
      .select('id, name, category, frequency, last_used, default_unit')
      .eq('user_id', userId)
      // Buscar coincidencias parciales al inicio del nombre (case-insensitive)
      .ilike('name', `${filter.searchText}%`) 
      .order('frequency', { ascending: false }) // Ordenar por frecuencia
      .order('last_used', { ascending: false, nullsFirst: false }); // Luego por recencia

    if (filter.category) {
      query = query.eq('category', filter.category);
    }

    if (filter.limit) {
      query = query.limit(filter.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching suggestions from DB:', error);
      return [];
    }

    // Mapear nombres de columna DB a nombres de interfaz Suggestion
    return (data || []).map(item => ({
      id: item.id,
      name: item.name,
      category: item.category ?? undefined,
      frequency: item.frequency ?? 0,
      lastUsed: item.last_used ? new Date(item.last_used) : undefined,
      defaultUnit: item.default_unit ?? undefined
    }));
  }

  /**
   * Actualiza una sugerencia en la base de datos (Ya cubierto por learnFromSelection/upsert)
   */
  // private async updateSuggestionInDB(suggestion: Suggestion): Promise<void> { ... }

  /**
   * Obtiene las sugerencias más frecuentes de la base de datos (Supabase)
   */
  private async fetchFrequentFromDB(limit: number): Promise<Suggestion[]> {
     const userId = await this.getCurrentUserId();
    if (!userId) return [];

    const { data, error } = await supabase
      .from(this.SUGGESTIONS_TABLE)
      .select('id, name, category, frequency, last_used, default_unit')
      .eq('user_id', userId)
      .order('frequency', { ascending: false })
      .order('last_used', { ascending: false, nullsFirst: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching frequent suggestions from DB:', error);
      return [];
    }
    
    return (data || []).map(item => ({
      id: item.id,
      name: item.name,
      category: item.category ?? undefined,
      frequency: item.frequency ?? 0,
      lastUsed: item.last_used ? new Date(item.last_used) : undefined,
      defaultUnit: item.default_unit ?? undefined
    }));
  }
}