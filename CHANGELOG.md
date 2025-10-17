# Changelog - "A comerla"

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

---

## [Unreleased]

### En Progreso
- Optimización general de performance
- Sistema de notificaciones in-app
- Importación de recetas desde URL
- PWA (Progressive Web App) configuration

### Added
- Kit de branding Food Studio (`docs/branding/brand-book.md`, `docs/branding/assets.md`) y placeholders editoriales (`public/branding/*`).
- Integración inicial de Sentry (`src/lib/errorTracking.ts`, `src/components/ErrorBoundary.tsx`) con helpers de validación (`window.__A_COMERLA_THROW_TEST_ERROR__`).
- Sistema centralizado de notificaciones (`src/lib/notifications.ts`) aplicado en planning, pantry y sugerencias.
- Skeletons dedicados para Dashboard, Planning, ShoppingList y Recipes junto con `src/components/ui/skeleton.tsx`.
- Notificaciones dentro del store de sugerencias más tests RTL (`suggestionStore.test.ts`).
- Skeletons adicionales para Pantry (`PantrySkeleton`), el widget de recetas favoritas y contenido de la lista de compras con cobertura RTL para estados `isLoading`.

### Changed
- Landing page rediseñada con storytelling tipo food studio y CTA demo interactiva (`src/App.tsx`, `src/components/sections/*`).
- Sustituido `liquid-glass-react` por wrapper interno (`src/components/ui/LiquidGlass.tsx`) para compatibilidad con React 18 y evitar peer-dependency bloqueante.
- Migradas las llamadas directas a `toast.*` en recetas, shopping-list, onboarding e imagenes al wrapper `notify*` con copy unificado.
- Ajustado el diseño responsive de Pantry (filtros, controles) y Planning (toolbar, carrusel móvil y week view) para breakpoints 768 px/1024 px, activando el carrusel en `tablet`.
- Copy de toasts en pantry, shopping-list y recetas actualizado para seguir `docs/ui-patterns.md`, reutilizando `notifyAsync` en procesos largos y añadiendo cobertura RTL.

### Fixed
- Ajustada la configuración de testing (`jest.setup.ts`) para exponer los matchers de `@testing-library/jest-dom` y compatibilizar `GenerationContext` con arrays readonly.
- Polyfill global `TransformStream` añadido en `playwright.config.ts`; suite E2E (`vision-upload`) vuelve a pasar tras instalar navegadores de Playwright.

### Security
- `liquid-glass-react` eliminado; después de `npm audit fix` sólo permanecen advisories sin parche (`esbuild` ≤0.24.2 vía `vite-plugin-vercel` y `path-to-regexp` ≤6.2.2 vía `@vercel/routing-utils`). `brace-expansion` baja y `form-data@4.0.4` quedan controlados. Seguimiento y responsables documentados en `NEXT_ACTIONS.md`.

### Documentation
- Nueva guía de marca premium y especificación de assets en `docs/branding/*`.
- `NEXT_ACTIONS.md` y `PLAN_OPTIMIZACION_COMPLETO.md` actualizados para cerrar la Fase 0 (health check, vulnerabilidades, top bundles >50 KB).
- Nuevas secciones en `NEXT_ACTIONS.md` (Sentry, seguridad de dependencias) y backlog de optimización de bundles en `PLAN_OPTIMIZACION_COMPLETO.md`.
- `docs/ui-patterns.md` actualizado para documentar el uso de `notify*`, intents disponibles y guías de copy para toasts consistentes.
- `NEXT_ACTIONS.md` documenta quick wins de notificaciones y próximos ajustes de UX tras la migración de toasts.

---

## [0.2.0] - 2025-10-15

### 📚 Documentación

#### Añadido
- **Estado General**: Análisis completo del proyecto (`estado-general-aplicaci-n.plan.md`)
  - Inventario de módulos implementados (8/9 completos)
  - Arquitectura técnica detallada
  - Stack tecnológico documentado
  - Funcionalidades de IA catalogadas
  - Brechas y deuda técnica identificadas
  - Métricas de éxito propuestas

- **Plan de Optimización Completo** (`PLAN_OPTIMIZACION_COMPLETO.md`)
  - 7 fases detalladas de desarrollo
  - Fase 0: Auditoría y preparación
  - Fase 1: Estabilización backend
  - Fase 2: Optimización UX/UI
  - Fase 3: Performance y escalabilidad
  - Fase 4: Testing y QA
  - Fase 5: Features faltantes core
  - Fase 6: Polish y detalles
  - Fase 7: Preparación beta
  - Timeline: 3 meses
  - ~150+ tareas específicas con archivos

- **Resumen Ejecutivo** (`RESUMEN_EJECUTIVO_PLAN.md`)
  - Plan condensado de 3 meses
  - KPIs y métricas de éxito
  - Inversión estimada ($213 en 3 meses)
  - Riesgos y mitigaciones
  - Quick wins identificados
  - Roadmap visual por mes

- **Quick Wins Checklist** (`QUICK_WINS_CHECKLIST.md`)
  - Tareas accionables para 2 semanas
  - 26 horas de trabajo con alto impacto
  - Checklist trackeable
  - Comandos útiles incluidos
  - Criterios de verificación

- **Índice de Documentación** (`INDICE_DOCUMENTACION.md`)
  - Navegación completa de docs
  - Organización por tema
  - Mapa visual de documentación
  - Checklist onboarding desarrolladores
  - 40+ documentos catalogados

- **Next Actions** (`NEXT_ACTIONS.md`)
  - Punto de entrada para nuevos devs
  - Plan de primera semana
  - Comandos esenciales
  - Dashboard de métricas
  - Workflow diario recomendado

- **CHANGELOG.md** (este archivo)
  - Tracking de cambios del proyecto
  - Formato Keep a Changelog

#### Modificado
- **README.md**
  - Estado actual actualizado (MVP avanzado)
  - Features implementadas listadas
  - Links a nueva documentación
  - Sección de documentación reorganizada

---

## [0.1.0] - 2025-10-XX

### Estado Inicial Documentado

#### ✅ Módulos Completamente Implementados

**Autenticación** (`features/auth/`)
- Login y registro con Supabase Auth
- Contexto global de autenticación
- Protección de rutas
- Gestión de sesiones persistentes

**Despensa** (`features/pantry/`)
- CRUD completo de ítems
- Sistema de categorías con acordeón
- Marcado de favoritos con panel lateral
- Filtrado avanzado y búsqueda
- Vista múltiple (Grid/Lista/Acordeón)
- Input unificado con parser inteligente
- Scanner de códigos de barras
- Input por voz
- Store Zustand

**Recetas** (`features/recipes/`)
- CRUD completo de recetas
- Vista lista, detalle y formulario
- Generación con IA (Google Gemini)
- Sistema de favoritos
- Filtrado por tags
- Store Zustand
- Gestión de historial
- Métricas de variedad

**Planificación** (`features/planning/`)
- Calendario semanal interactivo
- Vista doble: semanal (desktop) y diaria (móvil)
- Drag & drop con @dnd-kit
- Generación de plan semanal con IA
- Sistema de plantillas
- Análisis nutricional integrado
- Estados de cumplimiento
- Motor de planificación separado
- Verificación de ingredientes vs despensa
- Estadísticas semanales
- Store Zustand

**Lista de Compras** (`features/shopping-list/`)
- Generación automática desde plan semanal
- Comparación inteligente con despensa
- Marcar ítems como comprados (persistente)
- Agrupación por categorías
- Búsqueda de precios (BuscaPrecios, Precios Claros)
- Mapa interactivo de tiendas (Leaflet)
- Tiendas favoritas
- Store Zustand

**Perfil de Usuario** (`features/user/`)
- Vista y edición de perfil completo
- Avatar con upload
- Preferencias dietéticas completas
- Alergias y restricciones
- Dificultad preferida
- Tiempo máximo de preparación
- Ingredientes excluidos
- Equipamiento disponible
- Clave API de Google Gemini

**Onboarding** (`features/onboarding/`)
- Flujo completo de bienvenida
- Captura de objetivos (ahorro/calorías)
- Restricciones dietéticas
- Despensa inicial
- Generación automática del primer plan
- Store Zustand

**Dashboard** (`features/dashboard/`)
- Widget de plan del día
- Widget de lista de compras
- Recetas favoritas (placeholder)
- Items con bajo stock (pendiente lógica)
- Sugerencia diaria "¿Qué cocino hoy?" (IA)
- Animaciones con Framer Motion

#### 🟡 Módulos Parcialmente Implementados

**Ingredientes** (`features/ingredients/`)
- Servicio backend funcional (sin UI propia)
- Tabla maestra de ingredientes
- Normalización (singular/plural, capitalización)
- `findOrCreateIngredient` funcionando
- Usado por Despensa y Recetas

**Sugerencias** (`features/suggestions/`)
- Servicio básico de IA
- Generación de alternativas de comidas
- Usado en contexto de planificación

#### 🔴 Brechas Críticas Identificadas

**Backend:**
1. Sincronización Despensa-Planificador no automática
2. Error handling no estandarizado globalmente
3. Queries Supabase no optimizadas
4. Errores 500 documentados en `failures.md`

**Frontend:**
5. Performance: Virtualización solo en shopping list
6. Responsive: Algunos módulos no optimizados para móvil
7. Estados de carga genéricos
8. Accesibilidad no validada

**Testing:**
9. Cobertura de tests ~40% (objetivo: 80%)
10. Tests E2E muy limitados
11. No hay CI/CD pipeline

#### 📊 Métricas Baseline

**Build:**
- Bundle size: ~600KB (objetivo: <500KB)
- TypeScript errors: 0

**Performance:**
- Lighthouse score: ~70 (objetivo: 90+)

**Testing:**
- Unit test coverage: ~40% (objetivo: 80%)
- E2E tests: Framework ready, tests mínimos

**Code Quality:**
- TODOs/FIXMEs: 33 identificados
- ESLint errors: 0
- Security vulnerabilities: TBD

#### 🛠️ Stack Tecnológico

**Frontend:**
- React 18 + TypeScript + Vite
- Tailwind CSS + Shadcn/UI (Radix)
- Zustand + Context API
- React Router v6
- Framer Motion
- Lucide React
- date-fns

**Backend:**
- Supabase (Auth + PostgreSQL + Storage + Edge Functions)

**IA:**
- Google Gemini (@google/generative-ai)

**Otros:**
- Leaflet + react-leaflet (Mapas)
- @dnd-kit (Drag & Drop)
- Jest + React Testing Library (Tests)
- Playwright (E2E)

#### 🗄️ Base de Datos

**Tablas principales:**
- `profiles` - Perfiles de usuario
- `ingredients` - Tabla maestra
- `pantry_items` - Inventario
- `recipes` - Recetas
- `recipe_ingredients` - Ingredientes de recetas
- `planned_meals` - Comidas planificadas
- `shopping_list_items` - Items de compras
- `planning_templates` - Plantillas
- `vision_insights` - Resultados visión IA
- `category_keywords` - Keywords
- Y más...

**Migraciones:** 12 archivos SQL en `supabase/migrations/`

---

## Tipos de Cambios

- **Añadido** (`Added`) - Para funcionalidad nueva
- **Modificado** (`Changed`) - Para cambios en funcionalidad existente
- **Obsoleto** (`Deprecated`) - Para funcionalidad que será removida
- **Removido** (`Removed`) - Para funcionalidad removida
- **Corregido** (`Fixed`) - Para corrección de bugs
- **Seguridad** (`Security`) - Para vulnerabilidades

---

## Convenciones

### Versionado

**Formato:** MAJOR.MINOR.PATCH

- **MAJOR:** Cambios incompatibles en API
- **MINOR:** Funcionalidad nueva compatible hacia atrás
- **PATCH:** Bug fixes compatibles hacia atrás

### Fechas

Formato: YYYY-MM-DD

### Commits

Seguir Conventional Commits:
```
feat(scope): descripción corta

Descripción detallada opcional.

BREAKING CHANGE: descripción de cambio incompatible (si aplica)
```

**Tipos:**
- `feat` - Nueva funcionalidad
- `fix` - Corrección de bug
- `docs` - Cambios en documentación
- `style` - Formateo, sin cambio de código
- `refactor` - Refactorización de código
- `test` - Añadir/corregir tests
- `chore` - Cambios en build, deps, etc.

**Scopes comunes:**
- `pantry`, `recipes`, `planning`, `shopping-list`
- `user`, `auth`, `onboarding`, `dashboard`
- `ui`, `api`, `db`, `config`

---

## Hitos Futuros

### [0.3.0] - Estabilización (Estimado: 2025-11-15)
- Error handling global implementado
- Validación Zod completa
- Quick wins UX completados
- Responsive 100% funcional
- Cobertura tests > 60%

### [0.4.0] - Optimización (Estimado: 2025-12-15)
- Performance Lighthouse > 85
- Virtualización implementada
- React Query para caché
- Bundle < 500KB
- Cobertura tests > 75%

### [0.5.0] - Features Completas (Estimado: 2026-01-15)
- Notificaciones in-app
- Importación recetas URL
- Dashboard widgets completos
- PWA básico
- Cobertura tests > 80%

### [1.0.0] - Beta Pública (Estimado: 2026-01-31)
- Production-ready
- Tests E2E completos
- Documentación usuario completa
- Security audit passed
- Monitoring configurado
- 50+ beta testers

---

## Links Útiles

- [Product Vision](./PRODUCT_VISION.md)
- [Roadmap](./ROADMAP.md)
- [Contributing](./CONTRIBUTING.md)
- [Guidelines](./GUIDELINES.md)
- [Estado General](./estado-general-aplicaci-n.plan.md)
- [Plan de Optimización](./PLAN_OPTIMIZACION_COMPLETO.md)

---

**Mantener este archivo actualizado con cada merge a main.**
