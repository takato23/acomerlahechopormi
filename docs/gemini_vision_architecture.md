# Gemini Vision Pipeline Architecture

## Contexto y objetivos
- **Fecha:** 14 Oct 2025
- **Equipo:** Planner IA (Frontend, Backend, Data, Producto)
- **Meta roadmap:** Entregar visión accionable para el planificador semanal con latencia <3s (P95) y coste por insight ≤ USD 0.012, habilitando sugerencias basadas en fotos de ingredientes/preparaciones.

La integración actual de Gemini solo cubre generación textual. Este documento define la arquitectura extremo a extremo para:
1. Subir imágenes (web y mobile web) con accesibilidad AA.
2. Ejecutar Gemini Vision 1.5 Flash/Pro según contexto, normalizar la respuesta y estimar costes.
3. Cachear resultados, registrar métricas y exponerlos a la UI/Planner.
4. Habilitar fallback determinístico cuando Vision no responda o esté degradado.

## Flujo de alto nivel
1. El usuario abre `VisionUploadPanel` y selecciona imágenes (`<input type="file" accept="image/*" capture="environment">`). Opcional: arrastrar/soltar y cámara móvil.
2. El componente invoca `useGeminiVision()` → `useGeminiVisionStore` para gestionar estado (uploads, colas, errores, insights).
3. El hook calcula hash SHA-256 (front) y consulta la store local (`insightsByHash`) + Supabase (`vision_insights`) para cache caliente.
4. Si cache miss, envía `POST /api/vision-intake` con metadata (hash, tamaño, tipo contenido, userId, featureFlag snapshot).
5. `api/vision-intake` valida JWT, verifica LaunchDarkly flag `vision_pipeline_enabled`, evalúa cuotas y reintentos.
6. El edge function usa `GeminiVisionClient` (new util in `src/lib/geminiVisionClient.ts`) para generar insights:
   - Selecciona modelo (`1.5-flash` default, `1.5-pro` si se necesita OCR detallado).
   - Adjunta prompt sistemático (ver documento de prompts AI) + contexto del usuario (idioma, restricciones) trimmado a 512 tokens.
   - Registra tiempo inicio/fin, tokens y coste (precio tomado desde `GEMINI_PRICING_CONFIG`).
7. Normalización con `VisionNormalizer` (module in `src/features/planning/vision/normalizer.ts`):
   - Extrae ingredientes (nombre, cantidad estimada, nivel confianza).
   - Detecta categoría (pantry/fresco/preparado) y acciones sugeridas (consumir hoy, preparar batch, etc.).
   - Genera `insight_summary` y `structured_insights` (JSON schema versionado `vision_insight_v1`).
8. Persiste en Supabase (`vision_insights`) con estado `completed` y publica `insight_ready` evento PostHog.
9. Store recibe respuesta, actualiza UI, y ofrece botones "Añadir al plan" / "Mover a despensa" / "Crear misión".
10. En caso de fallo, se activa fallback heurístico (`VisionFallbackEngine`) combinando detección local + reglas definidas en `docs/PLANNING_AI_FALLBACK.md`.

## Componentes Frontend
### `VisionUploadPanel` (`src/features/planning/components/VisionUploadPanel.tsx`)
- Drag & drop, soporte teclado completo, foco visible, `aria-live` para estado de procesos.
- Muestra historial reciente (últimas 10 fotos) con badges de confianza y coste estimado.
- Exposición de shortcuts (`?` abre modal accesible documentado en README accesibilidad).
- Respeta `prefers-reduced-motion`; animaciones via Framer Motion con variantes `reduced`.
- Gating por feature flag: cuando `vision_pipeline_enabled` está desactivado en LaunchDarkly, la UI queda en modo solo lectura y muestra banner de mantenimiento.

### `useGeminiVisionStore` (`src/stores/useGeminiVisionStore.ts`)
Estado principal:
- `uploads`: cola de archivos con progreso.
- `insights`: diccionario `{id, hash, status, insight}`.
- `cache`: `insightsByHash` para lookup O(1).
- `costTracker`: acumulados por día y mes (`totalTokens`, `totalUSD`).
- `latency`: métricas por petición (para SLO UI).
- `fallbackStats`: contador de usos heurísticos.
Acciones clave:
- `uploadPhotos(files: FileList|File[])` → normaliza y envía lotes (máx 5 simultáneos).
- `fetchInsightByHash(hash)` → consulta Supabase REST.
- `requestVision({ hash, file, metadata })` → llama API y maneja retires exponenciales (max 2).
- `ingestInsight(payload)` → mergea con planificador (vía callback `onInsightReady`).
- `dismissInsight(id)` y `resetError()`.
Persistencia: `zustand/middleware` `subscribeWithSelector` + `sessionStorage` para mantener historial sesión.

### `useGeminiVision` (`src/hooks/useGeminiVision.ts`)
- Hook del componente para orquestar flujos, exponer `upload`, `status`, `insights`, `openFilePicker`.
- Integra LaunchDarkly vía `useFeatureFlags` (marca `offline` si el flag se desactiva) y añade `featureFlags` al metadata enviado al backend.
- Emite telemetría PostHog (wrapper `analytics.ts`) con eventos `vision_upload_started`, `vision_insight_ready`, `vision_latency_sample`, `vision_cost_snapshot` y `vision_fallback_triggered`.
- Expone helper `applyToPlanner(insight)` → delega en `planningStore.generateFromInsight` (nuevo método).

### `FeatureFlagsProvider` (`src/context/FeatureFlagsContext.tsx`)
- Inicializa LaunchDarkly en el cliente (`VITE_LAUNCHDARKLY_CLIENT_KEY`) y sincroniza el flag `vision_pipeline_enabled` para toda la app.
- Ofrece `track(event, data)` y `visionPipelineEnabled` al resto de módulos (incluyendo Vision y planner).
- Identifica al usuario autenticado en LaunchDarkly y actualiza el flag en caliente (`change:vision_pipeline_enabled`).

### Utilidades adicionales
- `src/lib/geminiVisionClient.ts`: wrap de `GoogleGenerativeAI` con métodos `generateVisionInsights` y medición.
- `src/features/planning/vision/normalizer.ts`: mapea respuesta a schema interno.
- `src/features/planning/vision/fallbackEngine.ts`: heurística (regex ingredientes, comparación con pantry, historial misiones).
- Tipos compartidos en `src/types/vision.ts`.

## Backend: Edge Function `api/vision-intake`
- Rutas: `POST` (procesa), `GET?hash=` (cache fetch sin re-ejecutar), `OPTIONS` (CORS).
- Autenticación: validar `Authorization` bearer (`sb-access-token`), usar Supabase Admin (`createClient` con service role env) para RLS bypass controlado.
- Controles: tamaño imagen ≤ 4MB, formatos `image/jpeg/png/webp/heic` (convertir HEIC → JPEG vía `imagescript`).
- Caching: hash + user + modelo. Si `status='completed'` y `<30d`, retorna cache (marca `cache_hit=true`) y rehusa la imagen almacenada si `image_expires_at` sigue vigente.
- Persistencia de imagen: sube el archivo original al bucket privado `vision-insights` en Supabase Storage con TTL (`VISION_STORAGE_TTL_DAYS`). Cada request purga hasta 5 objetos expirados y limpia metadata (`image_storage_path`).
- Costeo: `inputTokens`, `outputTokens`, `usdCost = (tokens_in * price_in + tokens_out * price_out) / 1e6`. Precios desde `supabase.functions.env.GEMINI_PRICING_JSON`.
- Observabilidad: log estructurado (`console.log`), emisión PostHog server-side (`vision_edge_completed`, `vision_edge_failed`, `vision_edge_cache_hit`) y métricas (`latencyMs`, `costUsd`).
- Flags: `VISION_PIPELINE_ENABLED` (env) para kill switch rápido + LaunchDarkly en frontend (ver FeatureFlagsProvider); si está deshabilitado, responde 503 con `pipeline_disabled` y la UI queda en modo fallback.

## Supabase: Tabla `vision_insights`
```sql
create table vision_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  image_hash text not null,
  storage_path text,
  status text not null default 'processing',
  model text not null,
  prompt_version text not null,
  raw_response jsonb,
  normalized_insight jsonb,
  cost_tokens_in integer default 0,
  cost_tokens_out integer default 0,
  cost_usd numeric(10,4) default 0,
  latency_ms integer,
  cache_hit boolean default false,
  error_message text,
  image_storage_path text,
  image_expires_at timestamptz,
  image_content_type text,
  created_at timestamptz default now(),
  processed_at timestamptz,
  constraint vision_insights_unique unique (user_id, image_hash)
);
```
Campos `image_storage_path` + `image_expires_at` sincronizan con Supabase Storage (`vision-insights`) para auditoría y TTL automática.
Políticas RLS:
- `for select` `using (auth.uid() = user_id)`
- `for insert` `with check (auth.uid() = user_id)`
- `for update` solo servicio (`auth.role() = 'service_role'`).
Índices: `btree (user_id, created_at desc)` y `btree (image_hash)` para cache lookup.

## Integración con Planner
- `planningStore` tendrá `generateFromInsight(insightId | normalizedData)` → crea borradores de comidas y sugiere misiones.
- `PlanningPage` renderiza `VisionUploadPanel` en barra lateral (colapsable) + CTA en mobile.
- Insights alimentan `MissionKanbanBoard` (cuando se implemente) via `pendingInsights` selector.

## Caching y costes
- Cache frontend: hash en store (válido sesión).
- Cache Supabase: TTL 30 días configurable (`VISION_CACHE_TTL_DAYS`).
- Cost tracker: store acumula y envía a PostHog (`vision_cost_snapshot` event). Backend inserta costos por fila para auditoría.
- Alertas:
  - SLO latencia <3s (P95) → monitor en Grafana / PostHog dashboard.
  - Ratio fallbacks <8% (`fallbackStats`).
  - Coste semanal vs presupuesto (alerta Slack si >85%).

## Fallback heurístico
1. Extrae ingredientes del nombre archivo (`pollocebolla.jpg` → heurística).<br>
2. Corre OCR ligero (`Tesseract.js` en worker) si Vision falla por completo.
3. Usa inventario (`pantryStore.items`) + historial `recentMeals` para sugerir acciones.
4. Muestra UI degradada con mensaje persistente, CTA para reintentar o reportar.
5. Registra evento `vision_fallback_triggered` con motivo.

## Instrumentación
- PostHog (frontend): `vision_upload_started`, `vision_insight_ready`, `vision_latency_sample`, `vision_cost_snapshot`, `vision_fallback_triggered`, `vision_cache_hit` (cuando se recicla hash).
- PostHog (edge): `vision_edge_completed`, `vision_edge_failed`, `vision_edge_cache_hit` con payload `{hash, model, latencyMs, costUsd}`; se envían vía `POST /capture` si `POSTHOG_API_KEY` está definido.
- LaunchDarkly: flags `vision_pipeline_enabled`, `vision_cost_alert`. Documentar toggles en `docs/feature_flags.md`.
- Logs Supabase Edge: formato `[vision-intake] {"event":"..."}` + requestId para correlación con PostHog.

## Variables de entorno clave
- `SUPABASE_SERVICE_ROLE_KEY` (Edge) – requerido por la función `vision-intake` para leer/escribir en `vision_insights`.
- `GEMINI_VISION_API_KEY` (Edge) – clave primaria para llamadas Vision; fallback a `GEMINI_API_KEY`.
- `GEMINI_PRICING_JSON` (Edge) – override opcional para coste por token.
- `VISION_PIPELINE_ENABLED` – toggle de emergencia (default `true`). Se sincroniza con LaunchDarkly.
- `VISION_MAX_FILE_BYTES`, `VISION_ALLOWED_MIME_TYPES`, `VISION_CACHE_TTL_DAYS` – controles operativos de payload.
- `VISION_STORAGE_BUCKET` (default `vision-insights`), `VISION_STORAGE_TTL_DAYS`, `VISION_STORAGE_SIGNED_URL_SECONDS`, `VISION_STORAGE_PURGE_BATCH` – configuración de bucket y TTL.
- `POSTHOG_API_KEY` y `POSTHOG_HOST` (Edge) – habilitan eventos `vision_edge_*`.
- `ALLOWED_ORIGIN` – cabecera CORS compartida (`supabase/functions/_shared/cors.ts`).
- Frontend: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_POSTHOG_KEY`, `VITE_POSTHOG_HOST`, `VITE_LAUNCHDARKLY_CLIENT_KEY`, `VITE_USE_MOCK_AUTH` (solo dev/e2e).

## Plan de rollout y monitoreo (Oct 2025)
1. **Beta restringida (semana 42-43):** habilitar flag `vision_pipeline_enabled` solo para equipo interno + 20 usuarios power mediante grupos LaunchDarkly.
   - Métricas obligatorias en Dashboard PostHog “Vision v1” (latencia, coste, fallbacks, conversión a plan).
   - Alertas Slack (`#ops-alerts`) vía PostHog cuando:
     - Latencia P95 > 3.5s durante 10 min.
     - Coste diario > 90% del presupuesto configurado.
     - Fallback rate > 12% por hora.
2. **Soft launch (semana 44):** expandir al 25% de usuarios premium + cohorts que usan planner semanal ≥3 veces.
   - Activar logging estructurado en Supabase Edge + guardado en `vision_insights`.
   - Ejecutar test de regresión manual en mobile (ver plan en `docs/runbooks/vision_pipeline.md`).
3. **GA (semana 45) condicionada:** activar flag al 100% solo si KPIs objetivo se mantienen durante 5 días consecutivos:
   - Latencia P95 <3s.
   - Coste medio por insight ≤ USD 0.012.
   - Fallback rate ≤8%.
   - Engagement: ≥35% de insights terminan en acción de plan (`vision_apply_clicked`).
4. **Observabilidad continua:**
   - Crear panel Grafana “Gemini Vision SLA” con datos de Supabase Metrics (latencia/errores) + PostHog.
   - Alertas automáticas crean incidente en Linear (label `vision`) mediante Zapier webhook.
   - Revisión semanal con Data para ajustar caching/pricing.

**Monitoreo de mitigación:** si se dispara alerta crítica, deshabilitar flag (LaunchDarkly) y comunicar fallback en UI (banner persistente). Coordinación con Marketing para messaging.

## Roadmap & dependencias
- **Semana 42 (14-18 Oct):** implementar tabla + store básico + panel UI MVP + fallback V1.
- **Semana 43:** integrar con planner + métricas PostHog + doc accesibilidad.
- **Semana 44:** mobile polish, caching CDN, experimentos A/B (LaunchDarkly).

## Hand-off checklist
- Tests: unit (`useGeminiVisionStore.test.ts`), integration (`VisionUploadPanel.test.tsx`), contrato edge (`vision-intake.test.ts`), E2E Playwright (`tests/e2e/vision-upload.spec.ts`).
- Playwright: escenario `vision-upload-to-plan.spec.ts`.
- Documentos relacionados: actualizar `README.md` (setup claves), `docs/PLANNING_AI_FALLBACK.md` (sección heurística), crear `docs/feature_flags.md`.
- Operaciones: runbook incidentes en `docs/runbooks/vision_pipeline.md` (to-do).
