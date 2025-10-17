# Planning Notes – Fase 3 (PlanningPage)

## 2025-10-14
- Validamos la barra de herramientas con tres escenarios clave:
  - Estado sin clave de Gemini: el botón `Generar plan` se bloquea y la UI muestra el mensaje educativo. Confirmado que el badge nutricional cae a `0 kcal` sin provocar warnings.
  - Semana completa (7 días cargados): aparece la insignia `Plan listo`, se renderizan las métricas `7/7 completadas`, el promedio calórico y la etiqueta de objetivos energéticos en rango.
  - Cambios rápidos de vista: al alternar entre `Semana`, `Día` y `Dashboard` el store mantiene el `currentView` correcto sin parpadeos ni advertencias de doble render.
- Nuevas coberturas unitarias:
  - `src/features/planning/components/PlanningToolbar.test.tsx` ahora incluye casos de borde para los escenarios anteriores con `userEvent`.
  - Ajustamos dobles de prueba en `VisionUploadPanel.test.tsx` y `planningOrchestrator.test.ts` para reflejar las dependencias mínimas del toolbar y evitar errores en suites relacionadas.
- Ejecutamos `npm run test planning -- --coverage` para verificar que las suites de planificación se mantienen verdes con instrumentación. Resultado: comando finalizó con estado 0.
