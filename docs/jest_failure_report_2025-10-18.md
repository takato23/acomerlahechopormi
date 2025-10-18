# Jest Failure Report — 18 Oct 2025

## 1. `src/stores/pantryStore.test.ts`
- **Problema observado:** Las pruebas ejecutan la implementación real de `pantryService`, provocando errores de autenticación Supabase (`Usuario no autenticado`).
- **Causa raíz:** En el archivo de test se importa `usePantryStore` **antes** de hacer `jest.mock('@/features/pantry/pantryService')`, por lo que el mock nunca intercepta las llamadas.
- **Acciones propuestas:**
  - Reordenar el archivo para mockear primero:
    ```ts
    jest.mock('@/features/pantry/pantryService');
    import { usePantryStore } from './pantryStore';
    ```
  - Alternativamente, usar `vi.mock`/`jest.mock` en un bloque superior y hacer `const { usePantryStore } = await import('./pantryStore');` dentro de `beforeEach`.
  - Añadir pruebas que validen el refresco de low stock una vez se mockee `getLowStockItems`.

## 2. `src/components/common/AnimatedTabs.test.tsx`
- **Problema observado:** `selectedTabs.includes` arroja `TypeError` porque `selectedTabs` es `undefined` durante la renderización.
- **Causa raíz:** El componente mantiene estado interno (`useState(activeTabIds)`) y no sincroniza cambios posteriores del prop `activeTabIds`. Las pruebas actualizan los props esperando un componente controlado.
- **Acciones propuestas:**
  1. Convertir el componente en controlado (usar directamente `activeTabIds` y disparar `onChange` sin `useState`).
  2. O ajustar el test para montar el componente sin actualizar props, usando callbacks para validar `onChange`.
  3. Añadir tests que cubran el modo multi-selección.

## Próximos pasos recomendados
- Priorizar el refactor de `AnimatedTabs` a patrón controlado + `useEffect` para sincronizar props → evitar estados desfasados en producción.
- Rehabilitar los mocks de `getLowStockItems` en `pantryStore.test.ts` una vez el mock se active correctamente.
