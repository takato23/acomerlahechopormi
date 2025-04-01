- **Fase 5 - Vinculación de Ingredientes:** La creación de nuevos ingredientes desde el formulario de recetas no está implementada. Si un usuario busca un ingrediente que no existe en la tabla `ingredients`, no podrá añadirlo directamente desde el formulario de creación/edición de recetas.

# Registro de Funcionalidades Futuras

Este archivo lista las funcionalidades descritas en los planes que no se implementarán en la fase actual debido a su complejidad, dependencias externas no disponibles, o por estar explícitamente marcadas como futuras.

---

## Funcionalidad Despensa (Basado en pantry_redesign_plan_v2.md)

### Fase 2: Funciones Avanzadas e Integración Profunda
*   **Recordatorios de Caducidad:** La implementación completa de notificaciones push/in-app requiere un sistema de notificaciones dedicado y posiblemente tareas en segundo plano (backend). Se implementará el campo de fecha, pero no las alertas activas.
*   **Sugerencias "Cocinar con lo que hay":** Requiere lógica compleja de análisis de inventario y matching con recetas. Pendiente para una fase posterior de inteligencia.
*   **Inteligencia de Reposición (Lista Compra):** Requiere análisis de historial de consumo y niveles de stock. Pendiente para una fase posterior de inteligencia.
*   **Marcar como Comprado (Integración Lista Compra):** La oferta de añadir/actualizar en despensa al marcar en lista requiere coordinación entre ambos features. Pendiente hasta que la lista de compra esté más madura.
*   **Múltiples Despensas:** Añade complejidad significativa a la gestión de datos y UI. Pendiente.
*   **Integración con Planificación/Recetas:** La vinculación automática de ingredientes y el indicador "Disponible" requieren la implementación completa de esas secciones. Pendiente.
*   **Control de Desperdicio Básico:** Requiere UI y lógica adicional para marcar como desperdiciado. Pendiente.
*   **Integración con Lista de Compra:** Añadir a la lista desde despensa requiere la implementación de la lista. Pendiente.
*   **Soporte Dietas Especiales (Inicial):** El etiquetado y filtrado simple se puede implementar, pero la integración profunda con perfiles nutricionales es futura.

### Fase 3: Inteligencia y Automatización
*   **Importación Inteligente (OCR, Código Barras):** Requiere investigación y/o integración con APIs/SDKs externos o desarrollo de modelos propios. Marcado como futuro.
*   **Notificaciones Inteligentes (Caducidad Avanzada, Reposición Proactiva, Sugerencias Uso):** Dependen de sistemas de notificación y lógica de análisis avanzada. Marcado como futuro.
*   **Análisis y Sugerencias Avanzadas (Informe Desperdicio, Consumo, Optimización Compras, Dietas Avanzado):** Requieren recolección de datos a largo plazo y algoritmos complejos. Marcado como futuro.
*   **Compartir Despensa:** Implica cambios significativos en el modelo de datos y permisos. Marcado como futuro.
*   **Aprendizaje de Hábitos:** Requiere recolección y análisis de datos de uso. Marcado como futuro.

---

## Accesibilidad / Configuración Global

*   **Tamaño de Fuente Ajustable (Aplicación Global):** Aunque existe un contexto (`SettingsContext`) y un selector (`FontSizeSelector`) para *elegir* un tamaño de fuente preferido, la lógica para *aplicar* este tamaño globalmente (ej. modificando clases en `<body>` o el tamaño base de `rem`) no está implementada. Los componentes individuales (incluidos los de recetas) no se adaptarán automáticamente a esta preferencia hasta que se implemente la aplicación global de la configuración.

---

## Sección Recetas (Basado en recipes_enhancement_plan_and_analysis.md)

### Fase 8: Funcionalidades Avanzadas
*   **Exploración Pendiente:** La Fase 8 menciona explorar funcionalidades como sugerencias/generación IA, favoritos, calificaciones, etc. Estas funcionalidades requieren un análisis, diseño y especificación detallados antes de poder ser implementadas. Se registran aquí como pendientes de definición.
*   **Manejo de Ingredientes IA No Mapeados:** El manejo automático (ej. creación o vinculación sugerida) de ingredientes no mapeados por la IA requiere desarrollo adicional. Actualmente, el usuario debe añadirlos manualmente usando el buscador.