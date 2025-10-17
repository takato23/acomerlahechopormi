# IA en el Planificador

El motor de planificación utiliza Gemini para generar propuestas personalizadas. A partir de esta actualización, el comportamiento de las claves queda documentado así:

- **Clave del usuario**: si el perfil (`profiles.gemini_api_key`) tiene una clave válida, la UI habilita todos los flujos de generación (plan semanal, alternativas, vista avanzada) y los mensajes avisan que se está usando esa credencial personal.
- **Fallback del equipo**: cuando no hay clave personal pero la app dispone de `VITE_GEMINI_API_KEY`, el planificador sigue habilitado y se informa que se está usando la clave del equipo. Ese fallback se ejecuta también desde el backend al generar recetas nuevas.
- **Sin clave disponible**: si no existe ninguna de las dos, los botones de generación y las acciones rápidas quedan deshabilitados. En la UI se muestran avisos persistentes tanto en la página principal como en el modal de generación con instrucciones para cargar la clave desde Perfil → Preferencias.

La lógica que determina el estado vive en `planningStore.setUserProfile`, donde se normalizan las preferencias del usuario y se registra el origen de la clave (`user` o `env`). Los componentes (`PlanningToolbar`, `GenerationConfigModal`, etc.) reaccionan a ese estado para habilitar o no la generación y mostrar los mensajes correspondientes.

## Fallback heurístico de Vision (actualizado 14 Oct 2025)

Cuando Gemini Vision no responde o excede los 2 retrasos consecutivos, se activa `VisionFallbackEngine` para entregar un resultado degradado pero accionable:

- **Fuente de datos:**
  - Nombre del archivo (`pollo_batch.jpg` → tokens relevantes) y metadatos del upload.
  - Instantánea de la despensa (`usePantryStore.items`) para confirmar coincidencias, cantidades y frescura aproximada.
  - Contexto de planificación (próximas comidas, objetivo principal, tamaño del hogar) proveniente de `planningStore.preferences`.
- **Heurística:**
  - Tokenización por palabras significativas, normalizadas (`NFD`) para soportar acentos.
  - Cruce con despensa para asignar confianza (0.7 si hay match exacto, 0.45 si es inferido por palabras clave predefinidas).
  - Generación de acciones sugeridas: planificar una comida, verificar stock, asociar a misiones o proponer batch cooking según tamaño de hogar.
- **UX degradada:**
  - El insight se marca como `source: 'fallback'` y se comunica como heurístico.
  - Se emite evento PostHog `vision_fallback_triggered` con motivo `vision_request_failed`.
  - Contador visible en el panel (“Fallbacks hoy”) para monitorear degradaciones.
- **Reintentos:** el usuario puede reintentar manualmente; si la respuesta de Gemini llega posteriormente, actualiza la entrada manteniendo el historial en Supabase (`vision_insights.cache_hit = false`).

> Referencia técnica: `src/features/planning/vision/fallbackEngine.ts` y `src/stores/useGeminiVisionStore.ts`.
