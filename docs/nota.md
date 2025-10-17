Contexto general:
  - Proyecto: “A Comerla”, SPA Vite/React/TypeScript en /Users/
  santiagobalosky/Downloads/A comerla HECHA POR MI.
  - Requerimientos clave: onboarding guiado, perfil unificado, motor
  IA Gemini adaptado a preferencias, lista de compras inteligente con
  precios y nutrición, loop de aprendizaje, monetización gradual.

  Objetivos Sprint 1 (3 semanas):
  1. Migraciones y tipos:
     - Añadir a public.profiles las columnas: cuisine_preferences
  text[], preferred_meal_times jsonb, max_calories integer,
  household_size integer, onboarding_completed_at timestamptz,
  objectives jsonb (almacenar objetivo principal y meta ahorro
  semanal).
     - Crear script de backfill (Node/TS) para migrar datos antiguos
  (llenar nuevos campos con defaults sensatos).
     - Regenerar tipos TypeScript (`npm run generate:types` o
  equivalente) y actualizar src/lib/database.types.ts.
  2. Servicios de usuario:
     - Refactorizar src/features/user/services/PreferencesService.ts
  para leer/escribir los nuevos campos, limpiar referencias a columnas
  inexistentes.
     - Refactorizar src/features/user/userService.ts para exponer
  getters/setters de objetivos y equipo disponible.
     - Añadir pruebas unitarias (Jest) para ambos servicios cubriendo
  escenarios de defaults, migración y errores Supabase.
  3. Wizard de onboarding:
     - Crear nueva feature en src/features/onboarding/ con pasos:
       a. Objetivo principal (ahorro tiempo, ahorro dinero, salud).
       b. Preferencias dietarias y alergias (multiselect).
       c. Hábitos: tiempos preferidos (HH:MM) por comida, complejidad,
  minutos máximos.
       d. Inventario inicial (lista rápida con UnifiedPantryInput).
       e. Objetivos cuantitativos: calorías diarias objetivo,
  presupuesto semanal, tamaño del hogar.
       f. Confirmación y CTA “Generar primera semana”.
     - Persistencia de estado parcial en localStorage
  (`onboarding_draft_v1`) y sincronización con Supabase al finalizar
  (update profiles + insertar ítems iniciales en pantry si el usuario
  lo confirma).
     - UI basada en componentes shadcn/tailwind, accesible y mobile-
  first. Recordar copy breve, friendly.
     - Integrar un hook de navegación bloqueada si hay cambios no
  guardados.
  4. Telemetría:
     - Implementar wrapper posthog/analytics en src/lib/analytics.ts.
     - Emitir eventos: onboarding_step_view, onboarding_step_submit,
  onboarding_completed, first_plan_requested.
  5. Post-onboarding:
     - Tras completar wizard, disparar generación inicial:
  llamar a generateRecipeForSlot para desayuno/almuerzo/cena y a
  generateShoppingList (aunque sea placeholder actual). Registrar
  errores y mostrar feedback.
  6. Documentación:
     - Actualizar docs/APPLICATION_FUNCTIONALITY_OVERVIEW.md con estado
  real de dashboard y onboarding.
     - Reescribir docs/NEXT_STEPS_PLAN_V1.md alineado al nuevo roadmap
  (Epics 1-5).
     - Crear docs/data_strategy.md (modelo cache precios, nutrición,
  métricas) y docs/monetization_plan.md (tiers freemium/premium/
  familiar, requisitos).
     - Añadir sección Sprint 1 en docs/overnight_tasks_plan.md con
  resumen diario (tareas completadas, bloqueos, próximos pasos).
  7. Pruebas y verificación:
     - Añadir pruebas con React Testing Library para wizard
  (transiciones, persistencia, validaciones).
     - Ejecutar `npm run test` y documentar resultados.
     - Documentar manual QA checklist (camino feliz, error Supabase,
  reconexión wizard, generación inicial fallida).

  Convenciones y estándares:
  - TypeScript estricto, 2 espacios, tailwind/shadcn.
  - Comentarios solo para lógica no obvia.
  - Mantener eslint y prettier (ejecutar `npm run lint` si existe).
  - Dividir PRs por tópico: migraciones+tipos, servicios+tests,
  wizard+telemetría, documentación.
  - No regenerar código auto si no es necesario (evitar reescribir
  mockData salvo cambios puntuales).

  Reglas de ejecución y persistencia:
  - Mantén un Kanban interno (puede ser checklist markdown) con tareas
  “TODO/In Progress/Done”; no avances de tarea nueva si la anterior no
  superó lint/tests.
  - Cada jornada (o bloque significativo) actualiza docs/
  overnight_tasks_plan.md con:
    - ✅ Tareas completadas
    - 🚧 Bloqueos o riesgos (con plan de mitigación)
    - ⏭️ Próximos pasos
  - Si encuentras discrepancias en el schema real, ajusta migraciones y
  documenta la decisión.
  - No cierres el sprint sin: migraciones aplicadas localmente, wizard
  funcional, tests verdes, documentación actualizada.
  - Antes de finalizar, ejecutar `npm run build` para confirmar que no
  hay errores de tipo.
  - Reportar manualmente los comandos ejecutados relevantes y sus
  resultados (resumen, no dump completo) al finalizar cada PR.
  - Mantén logs de pruebas en docs/overnight_tasks_plan.md (sección
  “Verificaciones”).
  - En caso de bloqueos externos (API keys, permisos), documenta en
  docs/overnight_tasks_plan.md y crea TODO en roadmap.

  Criterios de aceptación Sprint 1:
  - Perfil actualizado en DB y accesible desde UI; PreferencesService
  sin columnas inexistentes.
  - Onboarding wizard guarda datos y reanuda progresos.
  - Evento onboarding_completed se envía exactamente una vez por
  usuario.
  - Tras onboarding, se generan al menos 3 recetas y una lista (aunque
  placeholder).
  - Documentación actualizada según listado.
  - Suite jest completa sin fallos.

  Recursos:
  - Código fuente actual (ver pruebas previas en src/features/…).
  - Supabase CLI disponible; ejecutar migraciones en entorno local
  (crear archivo SQL en supabase/migrations/ con timestamp adecuado).
  - Unifica cambios en rama dedicada (ej. feature/sprint1-onboarding).

  Entrega final:
  - Checklist verificada.
  - Reporte final en docs/overnight_tasks_plan.md con resumen Sprint 1,
  deudas técnicas y sugerencias próximo sprint.
  - PRs con descripción siguiendo Convencional Commits y notas de
  pruebas (`npm run test`, `npm run build`, pasos manuales wizard).

  Persiste en este plan hasta completarlo. No te detengas ante errores:
  investiga, corrige o documenta fallback y continua.
