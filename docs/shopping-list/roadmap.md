# Shopping List Optimization Roadmap

**Última actualización:** 16 de octubre de 2025

## Alcance y Contexto
- Página: `ShoppingListPage` (SPA consolidada con BuscaPrecios, Google Maps/Places y Ratoneando).
- Objetivo: mejorar performance percibida y resiliencia, elevar UX/accesibilidad, profundizar analítica/personalización y asegurar QA continua sin depender de terceros.
- Supuestos: pruebas `ShoppingListContent` vigentes, integraciones activas, no se requieren aprobaciones externas para quick wins <3 días.

## Marco de Priorización
- **Impacto** (A=alto, M=medio, B=bajo) ponderado 60%.
- **Esfuerzo estimado** (<3 días = Quick Win, 3-5 días = Medio, 6-8 días = Incremental mayor) ponderado 30%.
- **Riesgo/Dependencias** (Bajo/Medio/Alto) ponderado 10%.
- Priorización resultante: P0 (inmediato), P1 (semana corriente), P2 (siguiente semana), P3 (backlog trazador).

## Backlog Priorizado
| Prioridad | Iniciativa | Frente | Objetivo | Owner (tentativo) | Esfuerzo (días) | Dependencias | KPI / SLI clave | Instrumentación | Plan de pruebas |
|-----------|-----------|--------|----------|--------------------|-----------------|--------------|-----------------|------------------|-----------------|
| P0 (QW) | Precarga de estados y división de bundle crítico | Performance & Resiliencia | Reducir TTI y LCP inicial en >=15% | Santi B. (Shopping List FE) | 2 | Ninguna | TTI < 1.4s; LCP < 1.8s | Web Vitals (Vercel), Sentry Performance | Jest snapshot + medición Lighthouse script |
| P0 (QW) | Cache incremental de precios BuscaPrecios con SW y TTL | Performance & Resiliencia | Bajar 40% llamadas repetidas y evitar fallback | Maru P. (FE Performance) | 2 | SW existente en planning | Ratio cache-hit >70%; Error rate <1% | Supabase logs, Grafana panel BuscaPrecios | Unit tests SW + mock fetch, test integración pricing |
| P0 (QW) | Estados accesibles y navegación por teclado en ShoppingListContent | UX & Accesibilidad | Cumplir WCAG 2.2 AA en interacciones clave | Lara G. (UX Squad) | 2 | Revisión UX copy | `Accessibility score` >= 95; Tiempo de tarea accesible < 40s | Axe CI, Storybook a11y, RUM de focus eventos | Jest Testing Library + storyshots a11y |
| P1 | Virtualización de lista + batching Zustand | Performance & Resiliencia | Mantener FPS > 55 con >200 ítems | Maru P. | 4 | Revisión con store lead | FPS >55; commit tiempo render <35ms | React Profiler dumps, Web Vitals custom metric | React profiler tests + e2e carga masiva |
| P1 | Failover resiliente para Google Maps/Places (fallback lista) | Performance & Resiliencia | Garantizar funcionalidad sin mapa | Santi B. | 3 | QA para mocks en e2e | % sesiones con mapa caído <0.5%; Error handled 100% | Sentry alert fallbacks, synthetic check | Playwright offline scenario + Jest mocks |
| P1 | Onboarding ahorro con BuscaPrecios (variant messaging) | Analítica & Personalización | Incrementar clics "Ver ahorros" 12% | Diego C. (Growth) | 3 | Copys aprobados Growth | CTR ahorro +12%; conversión carrito >6% | Supabase Analytics events, Amplitude | A/B gating via LaunchDarkly + seguimiento event QA |
| P1 | Playwright smoke diario (add, generar, map fallback) | QA continua | Detectar regresiones <15 min | Pia R. (QA/SRE) | 3 | Pipeline CI listo | MTTR < 2h; cobertura smoke 3 flujos | GitHub Actions + Slack alert | Playwright suite + synthetic cron |
| P2 | Motor de recomendaciones de tienda personalizada | Analítica & Personalización | +8% selección de tienda sugerida | Diego C. | 6 | Modelo con Growth | Store suggestion opt-in >=50%; ahorro medio >=5% | Supabase edge logs, Feature flag metrics | Experiment AB + contract test Ratoneando |
| P2 | Contract tests para integraciones externas (BuscaPrecios, Ratoneando) | QA continua | Detectar cambios breaking antes de producción | Pia R. | 4 | QA mocks | Fallos contract 0 en prod; lead time aviso 24h | PactFlow, Slack alert | Pact tests + CI gate |
| P2 | Monitor de sincronización Supabase (latencia, retries) | Performance & Resiliencia | Mejorar confiabilidad sync 99% | Santi B. | 5 | Observabilidad SRE | Latencia P95 < 600ms; Retry rate <2% | Supabase logs, Grafana, PagerDuty | Integration tests + chaos test supabase |
| P3 | Vista adaptativa ahorro por hábitos (personalización avanzada) | Analítica & Personalización | +6 puntos NPS segmento heavy users | Diego C. | 7 | Datos Growth, Research | NPS segmento +6; bounce panel ahorro <25% | Amplitude cohort, Supabase DW | A/B multi-armed + QA heurística |
| P3 | Auditoría completa WCAG y dark mode | UX & Accesibilidad | Certificar AA completa | Lara G. | 6 | UX design system | a11y issues críticas = 0; adoption dark mode 20% | Axe CLI, UserZoom | Manual QA + scripts cypress a11y |

## Calendario Quick Wins (16–25 octubre 2025)
| Fecha | Iniciativa | Owner | Dependencias | Estado actual | Próxima acción |
|-------|------------|-------|--------------|---------------|----------------|
| 16 oct (jue) | Precarga estados & split bundle crítico | Santi B. | Feature flags establecidos | En progreso (branch `feat/split-bundle`, TTI 1.62 s, LCP 1.92 s en Calibre) | Completar mediciones Lighthouse en staging y documentar resultados antes de habilitar flag `shoppingList.splitLoad` |
| 17 oct (vie) | Cache incremental BuscaPrecios | Maru P. | QA mock fetch listo | Preparado | Validar MSW fixtures mañana 17 oct y re-medir `cache_hit_ratio` tras despliegue en staging |
| 18 oct (sáb) | Estados accesibles + navegación teclado | Lara G. | Copy UX | Programado | Coordinar piloto accesibilidad y kit de comunicación con soporte antes del sábado |
| 20 oct (lun) | Smoke Playwright inicial (add/generate) | Pia R. | CI config QA | Programado | Obtener token Slack de Growth hoy 16 oct y probar cron manual |
| 21 oct (mar) | Failover Google Maps (fallback cards) | Santi B. | QA scenarios offline | Bloqueado (sin acceso Checkly) | Escalar a SRE para habilitar Checkly + vista Grafana hoy 16 oct, replanificar si acceso no llega el 20 oct |
| 22 oct (mié) | Alertas eventos BuscaPrecios (Supabase) | Santi B. | Métricas definidas | Pendiente | Configurar dashboard una vez habilitada vista Grafana; preparar webhook Slack `#shopping-alerts` |
| 23 oct (jue) | Dashboard Web Vitals + reporte diario | Maru P. | Grafana acceso | Pendiente | Confirmar vista con SRE y cargar template FE Performance |
| 24 oct (vie) | KPI Ahorro tracked (evento `offers_savings_view`) | Diego C. | Growth ETL | En preparación | Confirmar ETL con Growth y probar evento en sandbox LaunchDarkly |
| 25 oct (sáb) | QA mocks actualizados (BuscaPrecios/Ratoneando) | Pia R. | QA env | Pendiente | Descargar nuevos snapshots Ratoneando el 18 oct y actualizar `tests/contracts` |

## Hitos Incrementales (26 octubre – 22 noviembre)
| Semana | Enfoque | Objetivos | Resultados esperados |
|--------|---------|-----------|---------------------|
| 26-30 oct | Rendimiento avanzado | Virtualización lista + batching Zustand; monitoreo Supabase en beta | FPS >55 en staging; tablero latencia P95 listo |
| 3-7 nov | Analítica & Personalización | Onboarding ahorro A/B live 20%; modelo recomendación tienda diseño | Experimento activo; criterios éxito firmados |
| 10-14 nov | QA continua | Contract tests externos en CI; smoke Playwright ampliado (map fallback) | Builds bloquean integraciones rotas; falso positivo <5% |
| 17-22 nov | UX & Accesibilidad | Auditoría WCAG prioritaria, dark mode diseño final | Issues críticos resueltos; plan rollout design system |

## Experimentos A/B
1. **Ahorro Proactivo en Generar Lista**
   - Hipótesis: mostrar estimación de ahorro (BuscaPrecios) en CTA “Generar lista” aumenta la tasa de generación completada ≥10%.
   - Segmento: usuarios logueados con al menos 5 ítems en despensa activa.
   - Métrica primaria: `shopping_list_auto_generate_conversion`. Secundaria: `average_savings_view`.
   - Diseño: Control = CTA actual; Variante = CTA con badge ahorro y microcopy personalizado. Randomización 50/50 mediante LaunchDarkly flag `shoppingList.ctaSavings`. Duración: mínimo 7 días o 15k sesiones.
   - Criterio de éxito: uplift ≥10% con p<0.05 y sin degradar NPS (-1 más).

2. **Recomendación Personalizada de Tienda Cercana**
   - Hipótesis: destacar la tienda sugerida por Ratoneando + historial Supabase aumenta selección de tienda sugerida ≥8%.
   - Segmento: usuarios con historial compras >3 y consultas mapa en últimos 30 días.
   - Métrica primaria: `suggested_store_selected`. Secundarias: tiempo en mapa, `offers_click_through`.
   - Diseño: Control = listado por distancia; Variante = card hero con recomendación personalizada + ahorro estimado. Randomización 40/60 (más tráfico a control para baseline). Duración: 10 días.
   - Criterio de éxito: uplift ≥8% con significancia; sin incremento de errores mapa (>0.5%).

3. **Flujo Accesible de Marcado de Comprados**
   - Hipótesis: añadir atajos de teclado y feedback auditivo reduce tiempo de marcar ítems completados en ≥15% para usuarios con lector de pantalla.
   - Segmento: cohortes que usan teclas de navegación (detected via RUM) y usuarios beta accesibilidad.
   - Métrica primaria: tiempo medio de toggle (`toggle_item_duration`). Secundaria: errores toggles.
   - Diseño: Control = toggles estándar; Variante = atajos `Cmd+Enter`, `Shift+Space` + aria-live. 50/50 durante 7 días.
   - Criterio éxito: reducción ≥15% sin aumentar errores.

## Plan de QA Continua
- **Smoke E2E**: Playwright suite (`add item`, `generate list`, `map fallback`) ejecutada en cada PR y cron 2x día. Reportes en Slack `#qa-shopping-list` con SLO “tiempo de detección <15 min”.
- **Contract Tests**: PactFlow para BuscaPrecios y Ratoneando; mocks versionados en `tests/contracts/**`; verificación nocturna con aviso a integraciones.
- **Mocks y Fixtures**: renovar fixtures cada 7 días; script `npm run update:mocks` (Agregar) con validación de schema.
- **RUM**: Sentry + Vercel Web Analytics capturando Web Vitals, fallos JS y navegación teclado. Alertas automáticas al superar SLAs definidos en `metrics.md`.
- **Synthetic Monitoring**: Checkly (QA/SRE) para `generate list` y `offers finder` 5 min; fallback a PagerDuty si 3 fallos seguidos.
- **Chaos / Resiliencia**: tests semanales de desconexión Supabase y latencia 400ms en BuscaPrecios usando `npm run test:chaos` (a definir).
- **Release Checklist**: gating en CI requiriendo smoke verde, coverage > baseline, contract tests aprobar, sin alertas críticas 24h previas.

## Comunicación y Gestión
- **Tablero**: Linear proyecto `SHOP-LIST-OPT` con columnas (Backlog, In Progress, QA, Ready). Actualización diaria.
- **Stakeholders**: FE Performance (Maru P.), UX (Lara G.), Growth (Diego C.), QA/SRE (Pia R.). Sync semanal martes 10:00 ART.
- **Riesgos Clave**: posibles cuotas de Google Maps (alerta 3 días antelación), latencia Ratoneando >1s (escalado Growth), cambios API BuscaPrecios (contratos).

## Weekly Update – Semana del 13 al 19 de octubre 2025
- **Progreso**: Backlog priorizado alineado; quick wins calendarizado (16-25 oct); definición de KPIs e instrumentación inicial completada; A/B tests diseñados y enviados a Growth para revisión copy.
- **Bloqueos**: acceso a tablero Grafana (requiere confirmación SRE, ETA lunes 20 oct); pendiente confirmación de segmentos de Growth para experimento tiendas.
- **Próximos pasos**: ejecutar quick wins 16-21 oct según calendario; configurar Playwright cron + Slack alertas; instrumentar eventos Supabase y dashboards Web Vitals; coordinar sesión de accesibilidad con QA jueves 23 oct.
