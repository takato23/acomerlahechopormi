import { useEffect } from 'react';
import { usePlanningStore } from '@/stores/planningStore';
import { usePantryStore } from '@/stores/pantryStore';

/**
 * Hook personalizado que sincroniza automáticamente los cambios del pantry
 * con el planificador de comidas
 */
export function usePlanningPantrySync() {
  const syncWithPantry = usePlanningStore((state) => state.syncWithPantry);
  const pantryItems = usePantryStore((state) => state.items);

  useEffect(() => {
    // Sincronizar cuando cambian los items del pantry
    syncWithPantry();
  }, [pantryItems, syncWithPantry]);

  return {
    // El hook no retorna nada específico, solo maneja la sincronización
  };
}
