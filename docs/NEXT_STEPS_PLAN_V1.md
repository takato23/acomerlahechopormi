# Plan de Desarrollo Detallado: Próximos Pasos

**Estado Actual:**

*   Se ha completado la implementación del plan `BRANCH_PLAN_PANTRY_REDESIGN.md`.
*   Funcionalidades clave implementadas:
    *   Auto-submit por voz en despensa (con correcciones de feedback).
    *   Categorización automática de ítems en despensa (con correcciones).
    *   Rediseño visual de lista y detalle de recetas.
    *   Generación de recetas IA basada en despensa.
    *   Autocompletado IA del planificador semanal.
    *   Aplicación coherente de estilos en Dashboard y formularios principales.
*   La rama `feature/pantry-redesign` está actualizada en el repositorio remoto.

---

**Fase 1: Perfil de Usuario Completo (Prioridad 3 Revisada)**

*   **Objetivo:** Implementar la funcionalidad completa de la página de perfil, incluyendo nuevas opciones de personalización y su integración con la generación de recetas IA.
*   **Sub-fase 1.1: Backend y Tipos**
    *   **Tarea 1.1.1:** Crear nueva migración SQL (`supabase/migrations/XXX_add_profile_details.sql`) para añadir las columnas `excluded_ingredients TEXT[] NULL` y `available_equipment TEXT[] NULL` a la tabla `public.profiles`.
    *   **Tarea 1.1.2:** Ejecutar el comando `npx supabase db push` (o equivalente) para aplicar la migración.
    *   **Tarea 1.1.3:** Ejecutar el comando `npx supabase gen types typescript --project-id <your-project-ref> --schema public > src/lib/database.types.ts` para actualizar tipos.
    *   **Tarea 1.1.4:** Revisar/Ajustar `userService.updateUserProfile` en `src/features/user/userService.ts` para manejar arrays.
*   **Sub-fase 1.2: Frontend - UI Perfil (`UserProfilePage.tsx`)**
    *   **Tarea 1.2.1:** Mostrar `email` y `avatar_url`.
    *   **Tarea 1.2.2:** UI para `dietary_preference` (`Select` o `RadioGroup`).
    *   **Tarea 1.2.3:** UI para `difficulty_preference` (`Select` o `RadioGroup`).
    *   **Tarea 1.2.4:** UI para `max_prep_time` (`Input` numérico o `Slider`).
    *   **Tarea 1.2.5:** UI para `allergies_restrictions` (`Textarea`).
    *   **Tarea 1.2.6:** UI para `excluded_ingredients` (Componente "Tags Input").
    *   **Tarea 1.2.7:** UI para `available_equipment` (`Checkboxes` + "Otro").
    *   **Tarea 1.2.8:** Conectar UI para leer datos de `useAuth().profile`.
    *   **Tarea 1.2.9:** Implementar botón "Guardar Cambios" llamando a `userService.updateUserProfile`.
*   **Sub-fase 1.3: Integración - Generación IA**
    *   **Tarea 1.3.1:** Refactorizar `buildRecipePrompt` (en `generationService.ts`) para aceptar todas las preferencias del perfil y despensa.
    *   **Tarea 1.3.2:** Modificar texto del prompt para incluir todas las restricciones/preferencias.
    *   **Tarea 1.3.3:** Modificar llamadas a generación IA (`RecipeListPage`, `PlanningPage`) para pasar las preferencias desde `useAuth().profile`.

---

**Fase 2: Botón "Qué cocino hoy" (Prioridad 4 Nueva)**

*   **Objetivo:** Añadir funcionalidad rápida en Dashboard para sugerencia de receta personalizada.
*   **Sub-fase 2.1: UI (`DashboardPage.tsx`)**
    *   **Tarea 2.1.1:** Añadir botón "Qué cocino hoy?".
    *   **Tarea 2.1.2:** Añadir área (`Card`) para mostrar receta sugerida.
    *   **Tarea 2.1.3:** Añadir botón "Probar otra".
*   **Sub-fase 2.2: Lógica (`DashboardPage.tsx`)**
    *   **Tarea 2.2.1:** Implementar handler `handleSuggestRecipe`.
    *   **Tarea 2.2.2:** Obtener perfil (`useAuth`) y despensa (`pantryService`).
    *   **Tarea 2.2.3:** Llamar a `generationService.generateSingleRecipe` pasando preferencias y despensa.
    *   **Tarea 2.2.4:** Mostrar receta generada en la UI.
    *   **Tarea 2.2.5:** Implementar handler para "Probar otra".
    *   **Tarea 2.2.6:** Manejar estados de carga y error.

---

**Fase 3: Planificación Semanal (Manual - Revisión/Completar) (Prioridad 5 Original)**

*   **Objetivo:** Asegurar funcionalidad completa y pulir UI de planificación manual.
*   **Tarea 3.1:** Revisar `PLAN_DESARROLLO.md` (Prioridad 4 original) y `PlanningPage.tsx`.
*   **Tarea 3.2:** Verificar/Implementar CRUD manual completo (añadir/editar/eliminar comidas).
*   **Tarea 3.3:** Implementar refinamientos UI de `PLAN_DESARROLLO.md` (líneas 218-236).

---

**Fase 4: Lista de Compras (Básica) (Prioridad 6 Original)**

*   **Objetivo:** Implementar generación básica de lista de compras.
*   **Tarea 4.1:** Implementar `shoppingListService.ts` con `generateShoppingList`.
*   **Tarea 4.2:** Implementar UI básica en `ShoppingListPage.tsx`.

---

**Fase 5: Refinamientos UI (RecipeList, etc.) (Prioridad 7 Original)**

*   **Objetivo:** Aplicar mejoras finales de UI.
*   **Tarea 5.1:** Implementar refinamientos UI de `PLAN_DESARROLLO.md` para `RecipeListPage.tsx` (líneas 198-216).
*   **Tarea 5.2:** Revisión general de consistencia y pulido.