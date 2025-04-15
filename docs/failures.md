# Failure Log – Event Bus Integration & Planning Autocomplete

## Fecha: 2025-04-14

### Contexto
- Se realizó la integración del event bus para que los ingredientes de recetas generadas se agreguen automáticamente a la lista de compras.
- Se probó la funcionalidad de autocompletar la planificación semanal (solo el lunes, las 4 comidas) en la ruta `/app/planning`.

### Observaciones de los logs
- Al intentar autocompletar las comidas del lunes, se produjo un error de permisos al guardar los ingredientes de la receta:

```
POST .../rest/v1/recipe_ingredients?... 403 (Forbidden)
planningStore.ts:336 Error saving recipe/meal for 2025-04-14 Desayuno: {code: '42501', details: null, hint: null, message: 'permission denied for table recipe_ingredients'}
```

- El resto del flujo de renderizado (`PlanningDayView`, `MealCard`, etc.) continuó normalmente, pero los ingredientes no se guardaron.

### Diagnóstico
- El error 403/42501 indica que el usuario autenticado no tiene permisos para insertar en la tabla `recipe_ingredients` en Supabase.
- Esto impide que, al autocompletar la planificación, se almacenen correctamente los ingredientes asociados a las recetas generadas.

### Acción tomada
- Se documenta el fallo aquí.
- Se continúa con el resto de tareas de integración y pruebas.

### Próximos pasos sugeridos
- Revisar las políticas RLS (Row Level Security) y permisos de la tabla `recipe_ingredients` en Supabase.
- Asegurarse de que el usuario autenticado tenga permisos de inserción para esa tabla.
- Si se requiere, contactar al administrador del backend para ajustar las políticas.

---

> Este fallo no impide la integración del event bus con la lista de compras, pero bloquea la persistencia de ingredientes en la planificación semanal.
