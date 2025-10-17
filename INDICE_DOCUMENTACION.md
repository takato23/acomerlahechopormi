# Índice Maestro de Documentación - "A comerla"

**Actualizado:** Octubre 2025  
**Propósito:** Navegación rápida a toda la documentación del proyecto

---

## 🎯 Empezar Aquí

Si eres nuevo en el proyecto, lee estos documentos en orden:

1. **[README.md](./README.md)** - Visión general, setup, y primeros pasos
2. **[Estado General](./estado-general-aplicaci-n.plan.md)** - Entender qué tenemos hoy
3. **[Resumen Ejecutivo](./RESUMEN_EJECUTIVO_PLAN.md)** - Entender hacia dónde vamos
4. **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Cómo contribuir

---

## 📊 Estado y Planificación

### Estado Actual
- **[📊 Estado General Aplicación](./estado-general-aplicaci-n.plan.md)**
  - Análisis completo de módulos implementados
  - Arquitectura técnica
  - Funcionalidades de IA
  - Brechas identificadas
  - Métricas y KPIs

### Planes de Desarrollo
- **[🎯 Plan de Optimización Completo](./PLAN_OPTIMIZACION_COMPLETO.md)**
  - 7 fases detalladas
  - Backend, Frontend, Testing, Features
  - 3 meses de roadmap
  - Tareas específicas con archivos

- **[⚡ Resumen Ejecutivo del Plan](./RESUMEN_EJECUTIVO_PLAN.md)**
  - Versión condensada del plan
  - KPIs y métricas de éxito
  - Inversión y recursos
  - Riesgos y mitigación

- **[✅ Quick Wins Checklist](./QUICK_WINS_CHECKLIST.md)**
  - Tareas accionables para 2 semanas
  - Alto impacto, bajo esfuerzo
  - Checklist trackeable

---

## 🎨 Visión y Producto

### Estrategia
- **[📄 Product Vision](./PRODUCT_VISION.md)**
  - Visión y misión
  - Objetivos corto/largo plazo
  - User personas
  - Modelo de monetización (hipótesis)

- **[🗺️ Roadmap](./ROADMAP.md)**
  - Fase MVP
  - Próximos pasos post-MVP
  - Ideas futuras (wishlist)

- **[🚀 Plan de Desarrollo](./PLAN_DESARROLLO.md)**
  - Prioridades de implementación
  - Diagramas de flujo
  - Fases detalladas

---

## 👨‍💻 Para Desarrolladores

### Guías de Código
- **[📏 Guidelines](./GUIDELINES.md)**
  - Convenciones de código
  - Estructura de proyecto
  - Mejores prácticas
  - Patrones comunes

- **[🤝 Contributing](./CONTRIBUTING.md)**
  - Setup del entorno
  - Flujo de trabajo Git
  - Proceso de PR
  - Estilo de commits

### Funcionalidad
- **[📋 Application Functionality Overview](./docs/APPLICATION_FUNCTIONALITY_OVERVIEW.md)**
  - Módulo por módulo
  - Archivos clave
  - Servicios y componentes
  - Estado de implementación

### Configuración
- **[🔧 BuscaPrecios Config](./BUSCAPRECIOS_CONFIG.md)**
  - Configuración del servicio de precios
  - API keys y endpoints

---

## 📖 Documentación Técnica Detallada

### Features (en `docs/`)

#### Despensa (Pantry)
- `pantry_redesign_plan_v2.md` - Plan de rediseño completo
- `pantry_input_redesign_plan.md` - Rediseño del input
- `pantry_smart_filter_plan.md` - Sistema de filtros
- `PANTRY_FUNCTIONALITY_OVERVIEW.md` - Funcionalidad actual

#### Planificación (Planning)
- `planning-notes.md` - Notas de desarrollo
- `PLANNING_AI_FALLBACK.md` - Estrategia de fallback IA
- `overnight_tasks_plan.md` - Tareas pendientes

#### Recetas (Recipes)
- `recipe_generation_enhancement_plan.md` - Mejoras generación IA
- `recipe_management_plan.md` - Gestión de recetas
- `recipe_tags_list_view_plan.md` - Sistema de tags
- `recipes_enhancement_plan_and_analysis.md` - Análisis completo
- `RECIPE_DEVELOPMENT_PLAN.md` - Plan de desarrollo

#### Lista de Compras (Shopping List)
- `shopping_list_design_analysis.md` - Análisis de diseño
- `shopping_list_improvement_plan.md` - Plan de mejoras
- `shopping_list_layout_plan.md` - Layout responsive
- `shopping_list_ui_implementation_plan.md` - Implementación UI
- `shopping_list_optimization_plan.md` - Optimizaciones
- `shopping_list_flow_analysis.md` - Análisis de flujo
- `shopping_list_drag_drop_persistence.md` - Drag & drop
- `shopping_list_mockups.md` - Mockups
- `shopping_list_high_fidelity_mockups.md` - Mockups alta fidelidad
- `verification-notes-shopping-map.md` - Verificación mapa

#### Usuario (User)
- `user_profile_plan.md` - Plan perfil de usuario

#### Sistema de Categorías
- `category_system_architecture.md` - Arquitectura
- `category_system_design.md` - Diseño
- `category_system_implementation_plan.md` - Plan implementación
- `category_keywords_system.md` - Sistema de keywords
- `categorias.csv` - Datos de categorías

#### IA y Generación
- `gemini_vision_architecture.md` - Arquitectura visión IA
- `predictive_system_implementation.md` - Sistema predictivo
- `runbooks/vision_pipeline.md` - Pipeline de visión

#### Onboarding
- (No hay doc específica, ver código en `src/features/onboarding/`)

### UI/UX
- `docs/branding/brand-book.md` - Identidad Food Studio v1
- `docs/branding/assets.md` - Kit de assets y copy base
- `ui-patterns.md` - Patrones de UI
- `quick_add_usability_analysis.md` - Análisis usabilidad
- `pantry_ux_ideal_vs_actual.md` - UX ideal vs actual
- `complex_ui_implementation_analysis.md` - Análisis UI compleja

### Arquitectura
- `app_development_plan.md` - Plan desarrollo app
- `NEXT_STEPS_PLAN_V1.md` - Siguientes pasos
- `STRATEGIC_EVOLUTION_PLAN_V1.md` - Evolución estratégica

---

## 🐛 Bugs y Issues

- **[⚠️ Failures](./failures.md)** - Errores documentados
- **[🔴 Consola Errores Planificador](./consola%20errores%20planificador.md)** - Errores específicos planificador
- **[📝 Future Features](./future_features.md)** - Features futuras y pendientes

---

## 🔬 Testing

### Configuración
- `jest.config.js` - Configuración Jest
- `jest.setup.js` - Setup de tests
- `playwright.config.ts` - Config E2E
- `tests/e2e/` - Tests end-to-end

### Coverage
- Ver `coverage/` después de `npm run test:coverage`
- `coverage/lcov-report/index.html` - Reporte HTML

---

## 🗄️ Base de Datos

### Migraciones
- `supabase/migrations/` - 12 archivos SQL
  - `000_create_base_tables.sql`
  - `001_complete_schema.sql`
  - `002_populate_keywords.sql`
  - `003_create_profiles_trigger.sql`
  - `004_create_category_keywords_and_corrections.sql`
  - `20251012090000_add_profiles_onboarding_fields.sql`
  - `20251013000000_add_missing_profile_fields.sql`
  - `20251014103000_create_vision_insights.sql`
  - `20251014121000_add_vision_storage.sql`
  - Y más...

### Scripts
- `run_migrations.sh` - Ejecutar migraciones
- `apply_migrations.sh` - Aplicar migraciones

---

## 🚀 Deployment

### Scripts
- `npm run dev` - Desarrollo local
- `npm run build` - Build producción
- `npm run preview` - Preview build
- `npm run test` - Tests
- `npm run test:e2e` - Tests E2E
- `npm run lint` - Linter

### Configuración
- `vite.config.ts` - Config Vite
- `tsconfig.json` - TypeScript config
- `tailwind.config.js` - Tailwind config
- `postcss.config.js` - PostCSS config
- `eslint.config.js` - ESLint config

---

## 📁 Estructura del Proyecto

```
A comerla HECHA POR MI/
├── README.md                           # 👈 START HERE
├── INDICE_DOCUMENTACION.md            # Este archivo
├── estado-general-aplicaci-n.plan.md  # Estado actual
├── PLAN_OPTIMIZACION_COMPLETO.md      # Plan detallado
├── RESUMEN_EJECUTIVO_PLAN.md          # Plan resumido
├── QUICK_WINS_CHECKLIST.md            # Acción inmediata
│
├── PRODUCT_VISION.md                  # Visión producto
├── ROADMAP.md                         # Roadmap
├── GUIDELINES.md                      # Guías código
├── CONTRIBUTING.md                    # Contribución
│
├── docs/                              # Documentación detallada
│   ├── *.md                          # 40+ documentos
│   └── runbooks/                     # Guías operacionales
│
├── src/                               # Código fuente
│   ├── features/                     # Módulos dominio
│   ├── components/                   # Componentes UI
│   ├── stores/                       # Zustand stores
│   ├── lib/                          # Utilidades
│   └── types/                        # TypeScript types
│
├── supabase/                          # Backend
│   ├── migrations/                   # SQL
│   └── functions/                    # Edge Functions
│
├── tests/                             # Tests E2E
└── coverage/                          # Coverage reports
```

---

## 🔍 Buscar por Tema

### Por Feature
- **Despensa:** Busca "pantry" en docs/
- **Recetas:** Busca "recipe" en docs/
- **Planificación:** Busca "planning" en docs/
- **Lista Compras:** Busca "shopping" en docs/
- **Usuario:** Busca "user" o "profile" en docs/

### Por Tipo
- **Planes:** Archivos con `_plan.md`
- **Análisis:** Archivos con `_analysis.md`
- **Diseño:** Archivos con `design` o `mockup`
- **Arquitectura:** Archivos con `architecture`

### Por Estado
- **Implementado:** Ver `APPLICATION_FUNCTIONALITY_OVERVIEW.md`
- **En Progreso:** Ver `PLAN_OPTIMIZACION_COMPLETO.md`
- **Futuro:** Ver `future_features.md`

---

## 🎓 Recursos de Aprendizaje

### Stack Tecnológico
- [React Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Shadcn/UI](https://ui.shadcn.com)
- [Zustand](https://docs.pmnd.rs/zustand)
- [React Router](https://reactrouter.com)

### Librerías Específicas
- [@dnd-kit](https://docs.dndkit.com) - Drag & drop
- [date-fns](https://date-fns.org) - Manipulación fechas
- [Framer Motion](https://www.framer.com/motion/) - Animaciones
- [React Hook Form](https://react-hook-form.com) - Formularios
- [Zod](https://zod.dev) - Validación

---

## 📞 Soporte y Contacto

### Issues y Bugs
1. Revisar `failures.md`
2. Buscar en Issues de GitHub
3. Crear nuevo issue con template

### Preguntas
1. Revisar FAQ (cuando exista)
2. Buscar en documentación
3. Preguntar en canal de dev

---

## ✅ Checklist de Onboarding Desarrollador

Para nuevos developers en el equipo:

- [ ] Leer README.md
- [ ] Setup entorno local (siguiendo CONTRIBUTING.md)
- [ ] Leer Estado General
- [ ] Leer Guidelines
- [ ] Ejecutar `npm run dev` exitosamente
- [ ] Ejecutar `npm run test` exitosamente
- [ ] Explorar codebase (`src/features/`)
- [ ] Hacer primer PR (fix typo, documentación, etc.)
- [ ] Tomar tarea de Quick Wins Checklist

---

## 📝 Mantener Documentación Actualizada

### Al Implementar Features
1. Actualizar `APPLICATION_FUNCTIONALITY_OVERVIEW.md`
2. Marcar tarea como completada en plan relevante
3. Actualizar `estado-general-aplicaci-n.plan.md` si es cambio mayor

### Al Encontrar Bugs
1. Documentar en `failures.md` si es crítico
2. Crear issue en GitHub
3. Añadir a backlog

### Al Tomar Decisiones Arquitectónicas
1. Documentar en ADR (Architecture Decision Record)
2. Actualizar `GUIDELINES.md` si afecta convenciones

---

**Este documento es un índice vivo. Actualízalo cuando añadas o reorganices documentación.**

---

## 🗺️ Mapa Visual de Documentación

```
                    README.md
                        |
        +---------------+---------------+
        |                               |
   Estado General              Visión & Roadmap
        |                               |
        v                               v
  Plan Optimización              Product Vision
        |
        +-- Quick Wins Checklist
        |
        +-- Guidelines & Contributing
        |
        +-- docs/
            |
            +-- Features Plans
            +-- Architecture Docs
            +-- UI/UX Analysis
            +-- Testing Docs
```

---

**Última actualización:** Octubre 2025  
**Mantenedor:** Equipo A comerla  
**Frecuencia de revisión:** Mensual o cuando haya cambios mayores
