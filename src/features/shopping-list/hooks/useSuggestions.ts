import { useState, useCallback, useEffect } from 'react';
import { Suggestion, SuggestionFilter } from '../types/suggestions';
import { SuggestionService } from '../services/suggestionService';

/**
 * Hook personalizado para gestionar las sugerencias
 */
export function useSuggestions(options: {
  onSelect?: (suggestion: Suggestion) => void;
  category?: string;
  maxSuggestions?: number;
}) {
  const { onSelect, category, maxSuggestions = 5 } = options;
  
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Instanciar el servicio (podría moverse a un contexto si se necesita compartir)
  const suggestionService = new SuggestionService();

  /**
   * Busca sugerencias basadas en el texto de entrada
   */
  const searchSuggestions = useCallback(async (searchText: string) => {
    if (!searchText.trim() || searchText.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const filter: SuggestionFilter = {
        searchText,
        category,
        limit: maxSuggestions
      };

      const results = await suggestionService.getSuggestions(filter);
      setSuggestions(results);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al buscar sugerencias'));
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [category, maxSuggestions]);

  /**
   * Maneja la selección de una sugerencia
   */
  const handleSelect = useCallback(async (suggestion: Suggestion) => {
    try {
      await suggestionService.learnFromSelection(suggestion);
      onSelect?.(suggestion);
    } catch (err) {
      console.error('Error al procesar selección:', err);
    }
  }, [onSelect]);

  /**
   * Obtiene las sugerencias más frecuentes
   */
  const getFrequentSuggestions = useCallback(async (limit?: number) => {
    try {
      return await suggestionService.getFrequentSuggestions(limit);
    } catch (err) {
      console.error('Error al obtener sugerencias frecuentes:', err);
      return [];
    }
  }, []);

  return {
    suggestions,
    loading,
    error,
    searchSuggestions,
    handleSelect,
    getFrequentSuggestions
  };
}

export default useSuggestions;