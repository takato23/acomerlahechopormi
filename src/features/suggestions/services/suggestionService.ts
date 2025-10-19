import { suggestionEngine } from '@/lib/suggestions/SuggestionEngine';
import type { SuggestionRequest, SuggestionResponse } from '../types';

/**
 * Servicio para manejar las sugerencias de recetas usando IA o fallbacks locales
 */
class SuggestionService {
  public async getSuggestions(request: SuggestionRequest): Promise<SuggestionResponse> {
    try {
      const context = request.context ?? { pantryItems: [], recipes: [], plannedMeals: [] };
      return await suggestionEngine.generateSuggestions(request, {
        pantryItems: context.pantryItems ?? [],
        recipes: context.recipes ?? [],
        plannedMeals: context.plannedMeals ?? [],
      });
    } catch (error) {
      console.error('Error en getSuggestions:', error);
      return {
        suggestions: [],
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }
}

// Exportamos una única instancia del servicio
export const suggestionService = new SuggestionService();
