# Planning Component Review (Oct 18, 2025)

## PlanningBoard.tsx
- [ ] Validar comportamiento de drag & drop en dispositivos táctiles; actualmente solo usa `PointerSensor` con `distance: 6`. Considerar `TouchSensor` para móviles.
- [ ] Confirmar que `updatePlannedMeal` persiste cambios de `meal_plan_id` tras el movimiento (la llamada no pasa explícitamente el plan id).
- [ ] Revisar accesibilidad: los botones "Añadir" se renderizan para cada slot, pero los `Card` Draggables usan `<button>` sin `aria-grabbed`. Agregar atributos ARIA.
- [ ] Evaluar paginado/secciones para semanas con muchas comidas (grid 7x4 crece verticalmente).
- [ ] Optimizar `mealsBySlot`: usar `useMemo` con clave estable; considerar memoización por fecha para evitar renders grandes.

## PlanningHistory.tsx
- [ ] Confirmar que `fetchMealPlanHistory()` respeta `currentStartDate/currentEndDate`; hoy se llama en cada render sin comprobar `isLoading`.
- [ ] Duplicar plan: revisar que el toast de éxito/errores se muestre (el store lo maneja, pero aquí no hay feedback visual).
- [ ] Skeleton genérico de 16px puede mejorarse con layout similar a la tarjeta real.
- [ ] Botón "Aplicar" debería deshabilitarse mientras `applyTemplateToCurrentWeek` está in-flight.

## useAutoPlanner.ts
- [ ] Hook asume que `handleAutocompleteWeek` lanza errores; confirmar que el store propaga excepciones (ahora encapsula `toast` y puede no lanzar).
- [ ] `planWeek` fuerza `styleModifier` a `undefined` cuando no se pasa; validar si backend necesita `null`.
- [ ] Considerar exponer `setIsPlanning(false)` tras error antes del toast para evitar "flash" en UI.

## Pending follow-ups
- Añadir pruebas unitarias para drag & drop (`@dnd-kit`) simulando movimiento entre slots.
- Documentar cómo se integran plantillas históricas con `meal_plan_id`.
- Crear historias de Storybook para `PlanningBoard` y `PlanningHistory` con datos mock para QA visual.
