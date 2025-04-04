# Plan Estratégico de Evolución: A Comerla App (Post-NextSteps)

**Visión General:** Transformar "A Comerla" de una aplicación funcional a una herramienta indispensable, inteligente y robusta para la gestión de comidas, optimizada en todos los aspectos y preparada para el crecimiento futuro.

**Metodología Propuesta:** Adopción de un enfoque Agile (Scrum o Kanban) con ciclos de desarrollo cortos (ej. sprints de 2 semanas) para permitir la iteración rápida, la adaptación al feedback y la entrega continua de valor.

---

**Fase 1: Fundación Sólida y Pulido de Experiencia (Duración estimada: 1-2 meses)**

*   **Objetivo:** Optimizar el rendimiento percibido, mejorar la consistencia de la UX/UI, y establecer una base sólida de pruebas y monitorización.
*   **Prioridades:** Rendimiento Frontend, UX/UI, Pruebas.
*   **Tareas Clave:**
    *   **1.1 Optimización Frontend:**
        *   Análisis Bundle (`vite-bundle-visualizer`), code-splitting, lazy loading.
        *   Optimización Imágenes (lazy loading, formatos modernos, tamaños responsivos).
        *   Rendimiento React (React DevTools, `memo`, `useCallback`, `useMemo`, optimización Zustand).
    *   **1.2 Revisión y Pulido UX/UI:**
        *   Auditoría de Consistencia de Diseño.
        *   Auditoría Básica de Accesibilidad (WCAG A/AA).
        *   Mejora de Mensajes de Feedback (carga, éxito, error).
        *   (Opcional) Onboarding para nuevas funcionalidades.
    *   **1.3 Fortalecimiento de Pruebas:**
        *   Aumentar cobertura Unit/Integration (Jest) para servicios y lógica clave.
        *   Configurar y crear pruebas E2E (Playwright/Cypress) para flujos críticos.
    *   **1.4 Monitorización Básica:**
        *   Implementar logging centralizado de errores (Sentry, Logtail, etc.).

---

**Fase 2: Mantenimiento Proactivo y Preparación para Escalar (Duración estimada: 1-2 meses)**

*   **Objetivo:** Reducir deuda técnica, asegurar la mantenibilidad, optimizar backend y prepararse para escalar.
*   **Prioridades:** Salud del Código, Seguridad, Optimización Backend, Costos.
*   **Tareas Clave:**
    *   **2.1 Refactorización Técnica:**
        *   Revisión de código y aplicación de patrones de diseño.
        *   Refactorización de Estado Global (Zustand/Context).
        *   Extracción de Componentes Reutilizables.
    *   **2.2 Mantenimiento y Seguridad:**
        *   Actualización Regular de Dependencias.
        *   Análisis de Vulnerabilidades (`npm audit`, Snyk).
        *   Auditoría Seguridad Supabase (RLS, validación, API Keys).
        *   Validación de Entradas (Frontend/Backend).
    *   **2.3 Optimización Backend y Costos:**
        *   Optimización Supabase (análisis consultas, índices DB).
        *   Revisión/Optimización Funciones Edge.
        *   Análisis y Optimización de Costos (Supabase, Gemini API).

---

**Fase 3: Innovación - Análisis Nutricional (Duración estimada: 2-3 meses)**

*   **Objetivo:** Introducir análisis nutricional de recetas y planes de comida.
*   **Justificación:** Alto valor para usuarios conscientes de la salud, diferenciación.
*   **Impacto Potencial:** Mayor engagement, posible base para funcionalidades premium.
*   **Sub-fase 3.1: Investigación y Diseño**
    *   Investigar y seleccionar API nutricional externa (Edamam, Nutritionix, USDA).
    *   Diseñar almacenamiento de datos nutricionales (DB, caching).
    *   Diseñar UI para mostrar información nutricional (detalle receta, tarjeta, planificación).
*   **Sub-fase 3.2: Implementación Backend**
    *   Crear `nutritionService.ts` para interactuar con API externa.
    *   Modificar `recipeService.ts` para obtener y guardar datos nutricionales al crear/actualizar recetas.
    *   Implementar lógica para calcular totales nutricionales en `planningService.ts` o similar.
*   **Sub-fase 3.3: Implementación Frontend**
    *   Modificar `RecipeDetailPage.tsx` para mostrar detalles nutricionales.
    *   (Opcional) Modificar `RecipeCard.tsx` para mostrar resumen.
    *   Modificar `PlanningPage.tsx` para mostrar totales diarios/semanales.
*   **Sub-fase 3.4: Pruebas y Validación**
    *   Probar precisión del análisis y manejo de errores de API externa.
    *   Validar cálculo de totales.

---

**Fase 4: Mejora Continua e Iteración (Ciclo Permanente)**

*   **Objetivo:** Mantener la aplicación saludable, relevante y alineada con usuarios y negocio.
*   **Actividades Recurrentes (ej. cada 1-3 meses):**
    *   Recopilación y Análisis de Feedback y Métricas.
    *   Priorización de Backlog (mejoras, bugs, ideas).
    *   Ciclos Cortos de Desarrollo (Sprints).
    *   Revisiones Técnicas Continuas (seguridad, rendimiento, costos, dependencias).
    *   Refinamiento de Funcionalidades IA (prompts, modelos).
    *   Revisión Estratégica Periódica.