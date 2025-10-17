import { create } from 'zustand';
import { suggestionService } from '../services/suggestionService';
import { notifyError, notifyInfo, notifySuccess } from '@/lib/notifications';
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

      const suggestions = response.suggestions ?? [];

      set({
        suggestions,
        isLoading: false,
        lastUpdated: new Date(),
      });

      if (suggestions.length > 0) {
        notifySuccess('Tenemos nuevas sugerencias para vos', {
          description: 'Revisá el panel para ver las ideas más relevantes según tu despensa.',
        });
      } else {
        notifyInfo('No encontramos sugerencias nuevas', {
          description: 'Probá a actualizar tu despensa o preferencias para obtener mejores resultados.',
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      set({
        error: message,
        isLoading: false,
      });
      notifyError('No pudimos generar nuevas sugerencias', {
        description: message,
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
