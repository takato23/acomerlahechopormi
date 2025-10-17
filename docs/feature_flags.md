# Feature Flags A Comerla (actualizado 14 Oct 2025)

| Flag | Ámbito | Descripción | Propietario | Estado por defecto |
| --- | --- | --- | --- | --- |
| `vision_pipeline_enabled` | Planner IA | Habilita el pipeline Gemini Vision (upload + insights). Controla acceso por cohortes desde LaunchDarkly. | Producto/IA | Desactivado (rollout por etapas) |
| `vision_cost_alert` | Ops/Finanzas | Enciende alerta de coste elevado y aplica throttling suave cuando se supera 85% del presupuesto semanal. | Backend/Ops | Activado |

**Notas operativas**
- Los flags viven en LaunchDarkly, proyecto `a-comerla-app`, entorno `production` / `staging`.
- Mantener sincronizado el estado en `docs/gemini_vision_architecture.md` y en los dashboards PostHog.
- Para experimentos A/B, crear flags derivados (`vision_upload_ui_test`, etc.) pero nunca usar `vision_pipeline_enabled` para experimentos.
- Frontend consume flags mediante `FeatureFlagsProvider` (`VITE_LAUNCHDARKLY_CLIENT_KEY`); si el flag cae en `false`, `VisionUploadPanel` queda deshabilitado y el store pasa a modo offline.
