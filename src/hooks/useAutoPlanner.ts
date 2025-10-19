import { useCallback, useState } from 'react';
import { usePlanningStore } from '@/stores/planningStore';
import type { MealType } from '@/features/planning/types';

export interface AutoPlannerRequest {
  startDate: string;
  endDate: string;
  mealTypes?: MealType[];
  dayNames?: string[];
  mode?: 'optimize-pantry' | 'flexible-suggestions';
  styleModifier?: string | null;
}

export function useAutoPlanner() {
  const handleAutocompleteWeek = usePlanningStore((state) => state.handleAutocompleteWeek);
  const [isPlanning, setIsPlanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const planWeek = useCallback(
    async (request: AutoPlannerRequest) => {
      setIsPlanning(true);
      setError(null);

      const days = request.dayNames ?? [
        'Lunes',
        'Martes',
        'Miércoles',
        'Jueves',
        'Viernes',
        'Sábado',
        'Domingo',
      ];

      const meals = request.mealTypes ?? ['Desayuno', 'Almuerzo', 'Merienda', 'Cena'];

      try {
        await handleAutocompleteWeek(request.startDate, request.endDate, {
          mode: request.mode ?? 'optimize-pantry',
          days,
          meals,
          styleModifier: request.styleModifier ?? undefined,
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'No se pudo generar la planificación automática',
        );
      } finally {
        setIsPlanning(false);
      }
    },
    [handleAutocompleteWeek],
  );

  const resetError = useCallback(() => setError(null), []);

  return {
    planWeek,
    isPlanning,
    error,
    resetError,
  };
}
