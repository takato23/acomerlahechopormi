import { SearchTermRecord } from './types';
export type { SearchTermRecord }; // Re-exportar el tipo

const SEARCH_HISTORY_KEY = 'app_search_history';
const MAX_HISTORY_ENTRIES = 50; // Límite para no llenar localStorage

export class LocalSuggestionManager {
  private history: Map<string, SearchTermRecord>;

  constructor() {
    // Inicializar vacío antes de cargar
    this.history = new Map();
    this.loadHistoryFromStorage();
  }

  private loadHistoryFromStorage(): void {
    try {
      const storedData = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (storedData) {
          const parsed = JSON.parse(storedData);
          // Validar que sea un objeto antes de crear el Map
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
              this.history = new Map(Object.entries(parsed));
              // Opcional: Limpiar entradas muy viejas o inconsistentes al cargar
              this.enforceHistoryLimit(); // Asegurar límite al cargar
          } else {
              console.warn("Invalid search history structure found in localStorage. Resetting history.");
              this.resetHistory();
          }
      }
    } catch (error) {
      console.error("Error loading search history from localStorage:", error);
      this.resetHistory(); // Resetear si hay error de parseo
    }
  }

  private saveHistoryToStorage(): void {
    try {
      // Aplicar límite antes de guardar
      this.enforceHistoryLimit();
      // Convertir Map a objeto plano para guardar
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(Object.fromEntries(this.history)));
    } catch (error) {
      console.error("Error saving search history to localStorage:", error);
       // Considerar estrategias si localStorage está lleno
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          console.warn("LocalStorage quota exceeded while saving search history. Older entries might be lost.");
          // Podríamos intentar eliminar las más antiguas aquí también si fuera crítico
      }
    }
  }

  // Asegura que el historial no exceda el límite, eliminando las más antiguas (menos usadas recientemente)
  private enforceHistoryLimit(): void {
     if (this.history.size > MAX_HISTORY_ENTRIES) {
        // Convertir a array, ordenar por lastUsed (ascendente, las más viejas primero)
        const sortedEntries = Array.from(this.history.values()).sort((a, b) => a.lastUsed - b.lastUsed);
        const entriesToRemove = this.history.size - MAX_HISTORY_ENTRIES;
        console.log(`History limit exceeded. Removing ${entriesToRemove} oldest entries.`);
        for (let i = 0; i < entriesToRemove; i++) {
            // Usar lowercase para la clave del Map consistentemente
            this.history.delete(sortedEntries[i].term.toLowerCase());
        }
     }
  }

  /**
   * Registra un término de búsqueda en el historial local.
   * Incrementa la frecuencia si ya existe, actualiza la fecha de último uso.
   * @param term El término de búsqueda a registrar.
   */
  addSearchTerm(term: string): void {
    if (!term || term.trim().length < 2) return; // Evitar guardar términos vacíos o muy cortos

    const trimmedTerm = term.trim();
    const lowerCaseTerm = trimmedTerm.toLowerCase(); // Usar lowercase como clave del Map
    const now = Date.now();
    const existing = this.history.get(lowerCaseTerm);

    if (existing) {
      existing.frequency += 1;
      existing.lastUsed = now;
    } else {
      // Guardar el término original para mostrarlo correctamente
      this.history.set(lowerCaseTerm, { term: trimmedTerm, frequency: 1, lastUsed: now });
    }
    this.saveHistoryToStorage(); // Guarda después de cada adición/actualización
  }

  /**
   * Obtiene una lista de sugerencias del historial local.
   * @param limit El número máximo de sugerencias a devolver.
   * @returns Un array de SearchTermRecord ordenado por frecuencia (desc) y luego por uso reciente (desc).
   */
  getSuggestions(limit: number = 5): SearchTermRecord[] {
    const suggestions = Array.from(this.history.values());

    // Ordenar: Más frecuente primero, si igual frecuencia, más reciente primero
    suggestions.sort((a, b) => {
      if (b.frequency !== a.frequency) {
        return b.frequency - a.frequency;
      }
      return b.lastUsed - a.lastUsed;
    });

    return suggestions.slice(0, limit);
  }

  /**
   * Limpia completamente el historial de búsqueda local.
   */
  clearHistory(): void {
      this.resetHistory();
  }

  // Método privado para resetear el historial
  private resetHistory(): void {
      this.history.clear();
      try {
          localStorage.removeItem(SEARCH_HISTORY_KEY);
      } catch (error) {
          console.error("Error removing search history from localStorage during reset:", error);
      }
  }
}

// Instancia Singleton para fácil acceso global (considerar DI para mejor testeo/mantenibilidad)
export const localSuggestionManager = new LocalSuggestionManager();