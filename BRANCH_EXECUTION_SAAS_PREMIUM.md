# Plan de Ejecución SaaS Premium (Oct 17 2025)

> Punto de partida: rama `feature/branding-food-studio` mergeable. Objetivo: completar streams 2-7 en ramas separadas con PRs autocontenidas.

## 0. Convenciones generales
- Base branch por defecto: `feature/recipe-category-tabs` hasta que integremos con `main`.
- Nomenclatura ramas: `feature/<stream>-<slug>` o `docs/<slug>` para documentación pura.
- Cada PR incluye: checklist de pruebas (`npm run lint`, `npm run test`, `npm run test:e2e`), resumen ejecutivo, notas de toggles LaunchDarkly/PostHog y etiquetas de hipótesis.
- Variables nuevas en `.env.sample` + `docs/feature_flags.md` actualizado.

## 1. Onboarding & Monetización
- **Rama** `feature/onboarding-paywall`
- **Deliverables**
  - Wizard 4 pasos (`src/features/onboarding/wizard/*`) con dataset demo Chef Aurora (`src/lib/demoData/chefAurora.ts`).
  - Paywall escalonado Free/Pro/Enterprise con componentes `PricingPlans`, `UpgradePrompt` y modales de upsell.
  - Integración Stripe Billing (SDK `@stripe/stripe-js` + edge function stub en `api/stripe-proxy.ts`) y Mercado Pago latam (`@mercadopago/sdk-js`).
  - Nueva ruta `/app/admin/store-settings` (actualizar router + layout, crear página en `src/pages/admin/StoreSettingsPage.tsx`).
  - Zustand store `billingStore` + hooks Supabase (`useBillingPortal`).
  - Evento PostHog `plan.upgrade` y límites por plan en `src/stores/planLimitsStore.ts`.
- **Pruebas**: unitarias para wizard, mocks Stripe/Mercado Pago, integración Supabase (mock). Playwright flujo onboarding + upgrade.

## 2. Experiencia UX Premium
- **Rama** `feature/ux-premium-nav`
- **Deliverables**
  - Navegación "Planificar / Operar / Analizar" (Navbar, Sidebar, Breadcrumbs).
  - Demo pública `/studio/chef-aurora` sin login; usar dataset demo.
  - Comparador de precios en shopping list (`src/features/shopping-list/components/PriceComparator.tsx`) integrando supermercados (usar BuscaPrecios + caching IndexedDB).
  - Actualizar microcopy profesional; documentar en `docs/content-guidelines.md`.
  - Añadir skeletons y estados vacíos premium.
- **Pruebas**: RT + Playwright para demo pública y comparador.

## 3. Instrumentación & Observabilidad
- **Rama** `feature/instrumentation-suite`
- **Deliverables**
  - PostHog y Sentry inicializados en `src/main.tsx` (ya parte de base, validar config) + definir tipos en `src/lib/analytics.ts`.
  - Dashboards base documentados en `docs/analytics/README.md` + `docs/analytics/posthog-dashboard.md` y `docs/analytics/sentry-playbook.md`.
  - Service worker + IndexedDB (`src/service-worker.ts`, `src/lib/offline/`) para modo offline.
  - LaunchDarkly wrapper (`src/lib/featureFlags.ts`) y flags registrados en `docs/feature_flags.md`.
- **Pruebas**: Unit tests para clients, E2E offline (Playwright), verificación de feature flags.

## 4. CI/CD y DevOps
- **Rama** `feature/devops-enterprise`
- **Deliverables**
  - Workflows GH Actions: `ci-lint.yml`, `ci-test.yml`, `ci-e2e.yml`, `ci-build.yml`, `ci-bundle-report.yml`, `ci-vercel-preview.yml`, `ci-supabase-migrations.yml`.
  - Bundle stats comentario (usar `actions/github-script`).
  - Integración Vercel preview deploy + Slack notifications (`VERCEL_TOKEN`, `SLACK_WEBHOOK_URL`).
  - Uptime monitor + logging (Logflare/Datadog) (documentar en `docs/ops/logging.md`).
  - Automatizar `run_migrations.sh` en pipeline.
- **Pruebas**: ejecutar pipelines en rama demo, adjuntar logs.

## 5. Operaciones & GTM
- **Rama** `feature/ops-gtm`
- **Deliverables**
  - Centro de ayuda in-app (`src/features/support/HelpCenter.tsx`) + widget tickets (Zendesk/Freshdesk script with feature flag `helpdesk_widget`).
  - Flujos NPS/feedback (`src/features/feedback/NpsModal.tsx`, `Supabase` table migrations `20251017*_create_feedback_tables.sql`).
  - `docs/gtm-plan.md`: buyer personas, cronograma, assets, KPIs.
  - Checklist legal/compliance en `docs/legal-compliance.md` (GDPR, CCPA, nutrición, WCAG AA).
- **Pruebas**: unit tests feedback store, integration with Supabase mocks.

## 6. Roadmap & Backlog
- **Rama** `docs/roadmap-2025q4`
- **Deliverables**
  - Actualizar `ROADMAP.md` con trimestres Q4 2025 – Q3 2026 por stream.
  - `NEXT_ACTIONS.md` tabla priorizada (título, owner, impacto, esfuerzo, dependencias).
  - Ritual workflow (`docs/team/cadence.md`).
  - Actualizar `RESUMEN_EJECUTIVO_PLAN.md` con progreso incremental.

## 7. Cierre & QA
- **Rama** `chore/release-saas-premium`
- **Deliverables**
  - Consolidar changelog, `RESUMEN_EJECUTIVO_PLAN.md`, `docs/feature_flags.md` actualizados.
  - Ejecutar lint/test/test:e2e; adjuntar resultados y coverage.
  - PR maestro enlazando ramas anteriores; checklist de seguridad (claves en `.env.sample`).

## Dependencias Externas
- Stripe + Mercado Pago claves (usar variables stub `VITE_STRIPE_PUBLISHABLE_KEY`, etc.).
- LaunchDarkly, PostHog, Sentry, Slack webhooks documentados en `.env.sample`.
- Supabase migraciones con scripts en `supabase/migrations/`.

## Tracking de Hipótesis
- Precios y métricas marcadas como “Hipótesis” en todos los componentes y docs (seguir convención en brand book).
- Registrar en `docs/analytics/hypothesis_log.md` (crear en rama instrumentation).

## Checklist antes de cada PR
1. `npm install` (si se agregan dependencias nuevas) + `npm audit` opcional.
2. `npm run lint` (con `/max-warnings 0` solucionado en archivo tocado).
3. `npm run test`.
4. `npm run test:e2e`.
5. Actualizar `.env.sample` y notas en PR.
6. Adjuntar capturas o gifs para cambios visuales.

---

**Nota:** Mantener este documento actualizado conforme completemos ramas. Añadir secciones de riesgos o bloqueos en cada PR.
