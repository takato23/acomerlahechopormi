# Runbook: Gemini Vision Pipeline

**Última actualización:** 14 Oct 2025  
**Propietarios:** Equipo Planner IA (SRE contacto: ops@acomerla.app)

## 1. Señales de incidente
- **Errores 5xx / 502 en `/api/vision-intake`** por encima del 5 % durante 5 min (alerta PostHog `vision_edge_failed`).
- **Latencia P95 > 3.5 s** combinando `vision_latency_sample` (frontend) y `vision_edge_completed` (edge) en dashboard `Vision v1`.
- **`vision_fallback_triggered` > 12 %** en la cohorte activa.
- **Coste diario > 90 % presupuesto semanal** (evento `vision_cost_snapshot`).
- **Objetos expirados en Storage > 50** (consulta `select count(*) from vision_insights where image_expires_at < now()`).

## 2. Checklist de diagnóstico
1. Verificar estado del flag LaunchDarkly `vision_pipeline_enabled`.
2. Revisar logs recientes en Supabase: `supabase functions logs vision-intake --tail`.
3. Validar salud de API Google Gemini (`status.generativeai.google`).
4. Confirmar cuotas de Vision en Google Cloud (`gcloud beta services quotas list`).
5. Revisar consumo de almacenamiento `vision_insights` y objetos en bucket `vision-insights` (riesgo de TTL agotado / purga trabada).

## 3. Mitigación rápida
- **Degradación suave:** desactivar flag `vision_pipeline_enabled` (LaunchDarkly) → usuarios pasan al fallback heurístico.
- **Throttle por tamaño:** ajustar `VISION_MAX_FILE_BYTES` (Supabase secrets) a 2 MB temporalmente.
- **Costo excesivo:** subir `vision_cost_alert` → pipeline limita a 1 petición por minuto (feature flag pendiente).
- Comunicar vía banner persistente (frontend escucha flag) y publicar en Slack `#status-vision`.

## 4. Recuperación
1. Rehabilitar flag después de 30 min sin errores.
2. Ejecutar script de verificación manual:
   ```bash
   curl -H "Authorization: Bearer <token>" -F file=@fixtures/vision/batch-cook.jpg -F hash=test-hash \ 
     https://<supabase-project>.supabase.co/functions/v1/vision-intake
   ```
3. Revisar nuevos registros en `vision_insights` (campo `cache_hit`, `cost_usd`).
4. Actualizar métricas PostHog (dashboards exportados a Notion runbook).

## 5. Falsos positivos comunes
- **Token inválido:** encabezado `Authorization` faltante en el proxy `/api/vision-intake`.
- **Claves faltantes:** `GEMINI_VISION_API_KEY` no definido después de rotación. Confirma con `supabase secrets list`.
- **Respuesta 415:** tipo de archivo no permitido (`VISION_ALLOWED_MIME_TYPES`).

## 6. Comunicación
- Registrar incidente en Linear (equipo Ops) con etiqueta `vision`.
- Notificar a Marketing si el flag se desactiva >1h para ajustar campañas “Sube tu foto”.
- Post-mortem en Confluence dentro de 72h.
