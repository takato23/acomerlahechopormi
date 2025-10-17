# Shopping List Metrics & Instrumentation

**Última actualización:** 16 de octubre de 2025

## Visión General
- Stack base: Supabase (data y logging), BuscaPrecios (precios automáticos), Google Maps/Places (mapa tiendas), Ratoneando (ofertas), frontend Vite/React.
- Objetivo: asegurar observabilidad end-to-end, detectar degradaciones <15 min y habilitar personalización basada en datos confiables.
- Herramientas core elegidas:
  - **Frontend**: Sentry (errores + performance spans), Vercel Web Analytics/Web Vitals, Calibre (auditorías programadas) para validar percepción y RUM.
  - **Integraciones**: Grafana + Loki (métricas/ logs agregados), Checkly (synthetic), PactFlow (contratos).
  - **QA**: Playwright (smoke), Jest + Testing Library (unit/integration), MSW (mocks), Lighthouse CI (performance budgets).

## Métricas e Instrumentación por Integración

### BuscaPrecios
- **KPIs/SLIs**
  - `price_lookup_success_rate` ≥ 99% (SLI).
  - `cache_hit_ratio` ≥ 70% tras quick win.
  - `price_response_p95` ≤ 800 ms.
  - `savings_view_rate` ≥ 45% sesiones con resultados.
- **Instrumentación**
  - Logging Supabase table `shopping_price_requests` (campos: item_id, status, latency, source, cache_hit, timestamp).
  - Supabase Edge Function `logPricingMetrics` llamada desde `useBuscapreciosPricing` con sampling 100% hasta estabilizar.
  - Vercel Web Vitals custom metric `SavingsView` emitido vía `reportWebVitals`.
  - Grafana dashboard “Shopping-Prices” con alertas sobre `success_rate` y `p95 latency` (prometheus scraper desde Supabase webhook export).
- **Alertas**
  - PagerDuty `BUSCAPRECIOS-P1`: `price_lookup_success_rate < 96%` 5 min.
  - Slack `#shopping-alerts`: `cache_hit_ratio < 50%` 30 min => investigar SW.
  - Email Growth: variación `savings_view_rate` > ±10% día contra día.
- **Plan de validación**
  - Contract tests semanales con fixture precio real + fallback.
  - Synthetic query Checkly cada 10 min para ítems populares.
- **Acciones inmediatas (16 oct 2025)**
  - Validar y publicar mañana 17 oct los mocks MSW antes de habilitar el TTL en producción.
  - Re-medir `cache_hit_ratio` y `price_response_p95` en staging post despliegue.
  - Configurar webhook de alertas a Slack `#shopping-alerts` una vez habilitado el panel Grafana.

### Google Maps / Places
- **KPIs/SLIs**
  - `map_load_success` ≥ 99.2% por día.
  - `places_api_quota_usage` ≤ 80% cuota diaria.
  - `map_interaction_rate` ≥ 35% usuarios con mapa disponible.
  - `fallback_render_rate` ≤ 0.5% (monitor resiliencia).
- **Instrumentación**
  - Sentry breadcrumb `map_load` con estado (success/fail, error code).
  - Custom event `map_fallback_rendered` en Supabase `shopping_events`.
  - Google Cloud Monitoring exportado a Grafana (quota, errores 4xx/5xx).
  - RUM: Web Vitals `CLS` y `FID` en panel “Shopping Map”.
- **Alertas**
  - PagerDuty `MAPS-P2`: `map_load_success < 97%` 10 min.
  - Slack `#fe-performance`: `CLS > 0.15` o `FID > 100ms` en mapa >3 muestras.
  - Email SRE: `places_api_quota_usage > 75%` antes de las 18:00 local.
- **Validación**
  - Playwright scenario `map-fallback` con red bloqueada.
  - Chaos test mensual: introducir error 403 y observar fallback + alerta.
- **Acciones inmediatas (16 oct 2025)**
  - Solicitar a SRE acceso a Checkly y vista Grafana hoy; sin eso no se puede activar synthetic check del fallback.
  - Preparar escenario offline actualizado para el quick win del 21 oct y testear en staging.
  - Revisar quota usage tras habilitar fallback para asegurar margen <70% durante octubre.

### Ratoneando (Buscador de Ofertas)
- **KPIs/SLIs**
  - `offer_fetch_success` ≥ 98%.
  - `offers_click_through` ≥ 25% sesiones con ofertas.
  - `personalized_offer_conversion` ≥ 12% (post experimento).
  - `latency_p95` ≤ 1.2 s.
- **Instrumentación**
  - Supabase table `shopping_offer_requests` (status, latency, filters, item_tag).
  - Feature flag metrics (LaunchDarkly) para variantes personalizadas.
  - Amplitude funnel `Offers -> Click -> Add to List`.
  - Loki logs del proxy Ratoneando (status codes).
- **Alertas**
  - Slack `#growth-alerts`: `offers_click_through < 18%` 6h.
  - PagerDuty `OFFERS-P1`: `offer_fetch_success < 95%` 5 min.
  - Email Producto: `latency_p95 > 1.5s` 1h.
- **Validación**
  - Contract tests en PactFlow contra schema Ratoneando.
  - MSW mocks en unit tests (`OffersFinder`) con semillas rotativas.
  - Synthetic cron 30 min con consultas populares.
- **Acciones inmediatas (16 oct 2025)**
  - Abrir ticket con Ratoneando para timeouts 504 y solicitar export de logs en <24h.
  - Ajustar temporalmente la frecuencia de requests si `offer_fetch_success` se mantiene <98% mañana.
  - Coordinar con Growth la entrega del token Slack para registrar alertas de CTR antes del 17 oct.

### Supabase (Core Data)
- **KPIs/SLIs**
  - `sync_success_rate` ≥ 99% (mutaciones lista).
  - `sync_latency_p95` ≤ 600 ms (lectura/escritura).
  - `error_rate` ≤ 0.5% (mutaciones fallidas).
  - `replication_delay` ≤ 2 s (si Replica activa).
- **Instrumentación**
  - Supabase logs `shopping_sync_events` con `user_id`, `action`, `latency`, `retry_count`.
  - Grafana dashboard “Supabase Shopping” con métricas nativas + ingest webhook.
  - Sentry performance span `supabase.rpc` con tags `action` y `status`.
  - Database triggers para contar retries (tabla `shopping_list_retry_metrics`).
- **Alertas**
  - PagerDuty `SUPABASE-P1`: `sync_success_rate < 97%` 5 min.
  - Slack `#qa-shopping-list`: `retry_count_avg > 1.5` 30 min.
  - Email SRE: `replication_delay > 5 s` 15 min.
- **Validación**
  - Integration tests `shoppingListService.test.ts` extendidos con casos de fallo.
  - Chaos script (inyectar latencia artificial) semanal.
  - Playwright scenario `offline -> online` validando cola local.
- **Acciones inmediatas (16 oct 2025)**
  - Crear panel dedicado a `sync_latency_p95` y `retry_count` en Grafana una vez concedido el acceso.
  - Planificar prueba de caos de latencia 400 ms para semana del 21 oct y documentar resultados.
  - Actualizar `shoppingListService.test.ts` con caso de retry >1 antes del 24 oct.

## Monitorización y Testing por Capa
- **Frontend**
  - *Herramientas*: Sentry, Vercel Web Analytics, Calibre, Lighthouse CI.
  - *Justificación*: Sentry unifica errores + transacciones; Vercel ofrece Web Vitals en tiempo real; Calibre y Lighthouse permiten presupuestos y regresiones automatizadas.
  - *Métricas clave*: LCP, FID, CLS, TTI, FPS promedio virtualización, porcentaje de uso teclado.

- **Integraciones**
  - *Herramientas*: Grafana + Loki, Checkly, PactFlow.
  - *Justificación*: Grafana/Loki centralizan métricas y logs de externos; Checkly habilita monitoreo sintético near-real; PactFlow asegura contratos versionados.
  - *Métricas clave*: tasas de éxito, latencias P95, quota usage, uptime synthetic.

- **QA / Automatización**
  - *Herramientas*: Playwright (e2e cron y PR), Jest + RTL (unit/integration), MSW (mocks y contract harness), GitHub Actions (pipeline), Codecov (coverage), Axe CI (a11y), Pact CLI.
  - *Justificación*: Playwright cubre flujos críticos sin depender de terceros; Jest/RTL cubre lógica de store; MSW evita hitting APIs reales; Axe CI automatiza accesibilidad mínima.
  - *KPIs QA*: smoke_pass_rate ≥ 99%, false_positive_rate ≤ 5%, coverage crítica ≥ 85%, tiempo detección < 15 min.

## Matriz de Alertas
| Severidad | Trigger | Canal | Owner vacaciones |
|-----------|---------|-------|------------------|
| P1 | API success rate < SLA (cualquiera) | PagerDuty on-call (QA/SRE) | Pia R. → backup: Martín L. |
| P1 | Supabase sync down | PagerDuty + SMS | Santi B. |
| P2 | Web Vitals degradados 20% | Slack `#fe-performance` | Maru P. |
| P2 | CTR ofertas cae 10% | Slack `#growth-alerts` | Diego C. |
| P3 | Accesibilidad Axe falla 3 runs | Linear ticket auto + email UX | Lara G. |

## Flujo de Datos e Integración
1. **Frontend** emite eventos (`shopping_events`) vía Supabase Edge y Web Analytics (Vercel) → almacenamiento en Supabase + export diario a BigQuery (Growth).
2. **Integraciones externas** reportan métricas vía webhooks/custom exporters (BuscaPrecios, Ratoneando) → Grafana/Loki → alertas.
3. **QA pipelines** corren en GitHub Actions → resultados a Slack (`#qa-shopping-list`) y almacenamiento histórico en Supabase `qa_runs`.
4. **RUM Web Vitals** → Vercel / Sentry → dashboards compartidos con FE Performance.

## Procedimientos de Instrumentación
- **Deploy**: toda feature que emita nuevo evento debe registrar schema en `docs/events/shopping_list.yaml` (añadir) y actualizar `metrics.md`.
- **Revisión**: Growth valida nomenclatura eventos martes; QA/SRE revisa alertas viernes.
- **Retención**: tablas métricas crudas 90 días; agregados 365 días en BigQuery.
- **Seguridad**: datos personales se hash-ean antes de persistir en métricas; respetar GDPR/LPDP.
