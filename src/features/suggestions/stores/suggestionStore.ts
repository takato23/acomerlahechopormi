import { create } from 'zustand';
import { suggestionService } from '../services/suggestionService';
import type { SuggestionRequest, RecipeSuggestion } from '../types';

interface SuggestionState {
  // Estado
  suggestions: RecipeSuggestion[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;

  // Acciones
  getSuggestions: (request: SuggestionRequest) => Promise<void>;
  clearSuggestions: () => void;
  clearError: () => void;
}

export const useSuggestionStore = create<SuggestionState>((set) => ({
  // Estado inicial
  suggestions: [],
  isLoading: false,
  error: null,
  lastUpdated: null,

  // Acción para obtener sugerencias
  getSuggestions: async (request: SuggestionRequest) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await suggestionService.getSuggestions(request);
      
      if (response.error) {
        throw new Error(response.error);
      }

      set({
        suggestions: response.suggestions,
        isLoading: false,
        lastUpdated: new Date(),
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error desconocido',
        isLoading: false,
      });
    }
  },

  // Acción para limpiar sugerencias
  clearSuggestions: () => {
    set({
      suggestions: [],
      lastUpdated: null,
    });
  },

  // Acción para limpiar errores
  clearError: () => {
    set({ error: null });
  },
}));