# Plan de Tareas para Desarrollo Nocturno

## Tareas de Alta Prioridad (4-6 horas)

### 1. Optimización de la Lista de Compras
- [ ] Implementar virtualización para listas largas usando `react-virtual` o similar
- [ ] Añadir drag-and-drop para reordenar ítems
- [ ] Implementar agrupación por categorías
- [ ] Mejorar la búsqueda y filtrado de ítems

### 2. Mejoras en la Búsqueda de Precios
- [ ] Implementar caché local para resultados frecuentes
- [ ] Añadir historial de precios por producto
- [ ] Mejorar la presentación de resultados con gráficos de tendencias
- [ ] Optimizar las llamadas a la API

### 3. Integración con el Mapa
- [ ] Implementar geolocalización del usuario
- [ ] Añadir clustering de marcadores para mejor rendimiento
- [ ] Implementar rutas hacia tiendas seleccionadas
- [ ] Añadir filtros por radio de distancia

## Tareas de Media Prioridad (2-4 horas)

### 4. Mejoras en la UX
- [ ] Añadir tooltips informativos
- [ ] Mejorar feedback visual de acciones
- [ ] Implementar atajos de teclado
- [ ] Añadir animaciones de transición suaves

### 5. Optimización de Datos
- [ ] Implementar sistema de sincronización offline
- [ ] Mejorar el manejo de errores y reintentos
- [ ] Optimizar consultas a Supabase
- [ ] Implementar lazy loading de imágenes

### 6. Integración con Otras Funcionalidades
- [ ] Conectar con sistema de recetas
- [ ] Integrar con gestión de despensa
- [ ] Implementar sistema de sugerencias automáticas
- [ ] Añadir exportación/importación de listas

## Tareas de Baja Prioridad (1-2 horas)

### 7. Documentación y Testing
- [ ] Documentar componentes principales
- [ ] Añadir tests unitarios básicos
- [ ] Crear guía de contribución
- [ ] Documentar API y tipos

### 8. Mejoras de Accesibilidad
- [ ] Mejorar navegación por teclado
- [ ] Añadir etiquetas ARIA faltantes
- [ ] Optimizar contraste de colores
- [ ] Mejorar mensajes de screen readers

## Orden de Implementación Propuesto

1. **Primera Fase** (Primeras 4 horas)
   - Virtualización de listas
   - Geolocalización y mejoras del mapa
   - Sistema de caché local
   - Mejoras básicas de UX

2. **Segunda Fase** (Siguientes 4 horas)
   - Integración con recetas/despensa
   - Sistema offline
   - Drag-and-drop y categorías
   - Documentación esencial

3. **Fase Final** (Últimas 4 horas)
   - Testing
   - Accesibilidad
   - Pulido general
   - Documentación final

## Notas Importantes

- Cada tarea incluirá sus propios tests unitarios
- Se mantendrá un registro de cambios detallado
- Se priorizará la estabilidad sobre nuevas características
- Se mantendrán backups frecuentes del código

## Sprint 1 - 2025-10-12

### Kanban (2025-10-12)
- **TODO**
  - Wrapper de analíticas y eventos `onboarding_*`
  - Flujo post-onboarding (generación recetas + lista)
  - Actualización de documentación (`APPLICATION_FUNCTIONALITY_OVERVIEW`, `NEXT_STEPS_PLAN_V1`, `data_strategy`, `monetization_plan`)
  - Checklist QA manual y cobertura (`npm run test`, `npm run test:coverage`, `npm run build`)
- **In Progress**
  - Diseño integral del planificador/onboarding (estado global, persistencia, integración servicios)
  - Regenerar types (`npm run generate:types`) y validar `src/lib/database.types.ts`
- **Done**
  - Migración `supabase/migrations/20251012090000_add_profiles_onboarding_fields.sql` aplicada con éxito en entorno local (2025-10-12)
  - Script `backfillProfiles` preparado (pendiente ejecución documentada)
  - Refactor `PreferencesService` y `userService` con pruebas unitarias verdes

### Verificaciones
- 2025-10-12: Usuario reporta migración aplicada exitosamente (`supabase/migrations/20251012090000_add_profiles_onboarding_fields.sql`). Aún no se ejecuta `npm run generate:types` tras el cambio.
- `npm run test` → fallan suites por configuración de alias (`@/features/recipes/recipeService` ausente), incompatibilidad `import.meta.env` en Jest y asserts desactualizados en `InteractivePreview`. Registrar soluciones pendientes tras ajustes de configuración/mocks y refactor tests.
- `npm run build` → errores de tipo en módulo de despensa (promesas vs strings, props requeridas, tipos inexistentes en stores). Requiere refactor futuro; build aún no pasa.
- `npm run test -- src/features/user/userService.test.ts` → pasa (mocks manuales de Supabase, cubre mapeo de campos y subida de avatar).
- `npm run test -- src/features/user/services/PreferencesService.test.ts` → pasa (valida cache, normalización y reset de preferencias).

### Tareas/Siguientes pasos (⏭️)
- Ejecutar `npm run generate:types` y validar cambios en `src/lib/database.types.ts`.
- Documentar resultados de `npm run build` cuando se ejecute nuevamente.
- Definir y consensuar arquitectura integral del planificador/onboarding antes de implementar UI.

### Decisiones y notas (2025-10-12)
- Consolidar diseño del planificador antes de escribir código para asegurar coherencia con despensa, sugerencias y lista de compras.
- Mantener registro explícito de dependencias con servicios Supabase y stores existentes para minimizar regresiones.

### Riesgos (🚧)
- Configuración actual de Jest no soporta `import.meta.env`; se requerirá mockear variables o ajustar transformaciones.
- Dependencias faltantes (`@/features/recipes/recipeService`) bloquean suites relacionadas; evaluar mocks o paths alternos.

## Consultas Pendientes

Necesitaré confirmación sobre:
1. ¿Priorizar alguna tarea específica?
2. ¿Hay límites de recursos a considerar?
3. ¿Preferencias específicas de UX/UI?
4. ¿Integración con algún servicio adicional?

## Entregables Esperados

Al finalizar el período, tendrás:
1. Código actualizado y documentado
2. Tests implementados
3. Documentación actualizada
4. Informe de cambios realizados
5. Lista de próximos pasos recomendados
