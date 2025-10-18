# Dependency Audit — jsPDF & posthog-js (18 Oct 2025)

## jsPDF (`^2.5.1`)
- **Uso actual:** Exportación PDF en `src/features/shopping-list/components/ShoppingListToolbar.tsx`.
- **Carga:** Import dinámico (`await import('jspdf')`) → solo se descarga al exportar.
- **Verificaciones pendientes:**
  - [ ] Confirmar tamaño final del bundle tras la adición (revisar `bundle-stats.html`).
  - [ ] Evaluar reemplazo por `pdf-lib` o generación server-side si aparece lag en móviles.
  - [ ] Añadir prueba e2e/manual para validar acentos/utf-8 en PDFs.

## posthog-js (`^1.276.0`)
- **Uso actual:** Wrapper en `src/utils/analytics.ts` que inicializa PostHog si hay clave (`VITE_POSTHOG_KEY`).
- **Estado:** Aunque mantenido en dependencias, `ShoppingListPage.tsx` tiene tracking desactivado por defecto (`trackEvent` solo hace `console.log`).
- **Próximos pasos:**
  - [ ] Decidir si se reinstala el tracking real (activar `enableTelemetry()` en `analytics.ts`).
  - [ ] Añadir bandera de entorno (`VITE_ENABLE_ANALYTICS`) para controlar la inicialización.
  - [ ] Validar que el reset de la base no elimina tablas/vistas usadas por PostHog (no aplica si solo se usa PostHog Cloud).

## Recomendaciones generales
- Ejecutar `npm ls jspdf posthog-js` tras reinstalaciones para evitar duplicados en lockfile.
- Documentar en `.env.example` las variables requeridas (`VITE_POSTHOG_KEY`, `VITE_POSTHOG_HOST`).
