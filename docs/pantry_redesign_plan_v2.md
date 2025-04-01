# Plan de Rediseño Integral: Funcionalidad "Despensa"

**Visión:** Transformar la "Despensa" de un simple inventario a un centro inteligente de gestión de alimentos, profundamente integrado con la planificación de comidas, listas de compras y hábitos del usuario, con el objetivo de optimizar la organización, reducir el desperdicio y facilitar una alimentación consciente.

**Perspectiva del Usuario Experimentado (1 mes de uso):**

*   **Fricciones Iniciales:** Dificultad para añadir artículos rápidamente, falta de unidades estándar, gestión de cantidades poco intuitiva (especialmente para artículos a granel vs. envasados), ausencia de fechas de caducidad.
*   **Necesidades Emergentes:** Poder vincular artículos de la despensa directamente a recetas planificadas, saber qué falta para una receta específica, recibir alertas de caducidad, gestionar múltiples lugares de almacenamiento (nevera, congelador, despensa principal).
*   **Oportunidades Avanzadas:** Importar inventario inicial fácilmente (foto, ticket), seguimiento de precios, sugerencias de recetas basadas en stock, control de desperdicio, soporte para dietas/restricciones, compartir despensa con otros miembros del hogar.
*   **Workarounds Comunes:** Usar notas genéricas para caducidades, añadir el mismo artículo varias veces con diferentes "estados" (ej. "Tomates (para ensalada)", "Tomates (para salsa)"), no usar la función por la alta fricción inicial.

---

## Fase 1: Usabilidad Core y Estabilidad (Duración estimada: 4-6 Sprints)

**Objetivos:**

*   Establecer una base sólida y fácil de usar para la gestión básica del inventario.
*   Reducir drásticamente la fricción al añadir y actualizar artículos.
*   Asegurar la estabilidad y rendimiento de la funcionalidad core.

**Funcionalidades Clave:**

1.  **Rediseño UI/UX:**
    *   Interfaz más limpia y visualmente atractiva.
    *   Flujo de adición rápida optimizado (menos pasos, autocompletado inteligente basado en historial y productos populares).
    *   Vista de lista/cuadrícula configurable.
    *   Búsqueda y filtrado básicos (nombre, categoría).
2.  **Gestión de Artículos - Fundamentos:**
    *   **Campos Esenciales:** Nombre, Categoría (autodetectada/seleccionable), Cantidad, Unidad (lista predefinida y personalizable, soporte para "unidad", "kg", "litro", "paquete", etc.).
    *   **Adición Múltiple:** Posibilidad de añadir varios artículos seguidos sin cerrar el formulario/modal.
    *   **Edición y Eliminación Sencillas:** Gestos intuitivos o botones claros para modificar/eliminar.
    *   **Importación Básica:** Opción para importar desde una lista de texto simple (un artículo por línea).
3.  **Categorización Inicial:**
    *   Sistema de categorías por defecto robusto y personalizable.
    *   Sugerencia automática de categoría al añadir artículo.
4.  **Estabilidad y Rendimiento:**
    *   Optimización de consultas a la base de datos.
    *   Pruebas unitarias y de integración exhaustivas.

**Métricas Potenciales:**

*   Tiempo promedio para añadir un artículo.
*   Tasa de adopción de la función Despensa (usuarios activos / usuarios totales).
*   Número de artículos promedio por usuario en la despensa.
*   Feedback cualitativo sobre facilidad de uso (encuestas, entrevistas).
*   Índice de errores/crashes relacionados con la despensa.

---

## Fase 2: Funciones Avanzadas e Integración Profunda (Duración estimada: 6-8 Sprints)

**Objetivos:**

*   Enriquecer la información de cada artículo para una gestión más detallada.
*   Integrar la despensa de forma nativa con la planificación de comidas y la lista de la compra.
*   Soportar casos de uso más complejos (múltiples ubicaciones, control de desperdicio).

**Funcionalidades Clave:**

1.  **Gestión Detallada de Inventario:**
    *   **Fecha de Caducidad/Consumo Preferente:** Con recordatorios opcionales.
    *   **Ubicación:** Definir y asignar múltiples ubicaciones (Despensa, Nevera, Congelador, etc.). Filtrar por ubicación.
    *   **Precio (Opcional):** Registrar coste por artículo/unidad para seguimiento de gastos.
    *   **Notas:** Campo libre para detalles adicionales.
    *   **Niveles de Stock:** Definir niveles mínimo/máximo deseado por artículo.
2.  **Integración con Planificación y Recetas:**
    *   **Vinculación Automática:** Al añadir una receta al planificador, descontar ingredientes disponibles en la despensa (con confirmación del usuario).
    *   **Indicador "Disponible":** Mostrar en las recetas qué ingredientes ya se tienen.
    *   **Sugerencias "Cocinar con lo que hay":** Recomendar recetas basadas en el stock actual (especialmente artículos próximos a caducar).
3.  **Integración con Lista de la Compra:**
    *   **Añadir a la Lista:** Botón directo desde un artículo en despensa (ej. "Añadir a la lista para reponer").
    *   **Inteligencia de Reposición:** Sugerir añadir a la lista artículos por debajo del nivel mínimo o consumidos frecuentemente.
    *   **Marcar como Comprado:** Al marcar un ítem en la lista de la compra, ofrecer añadirlo/actualizarlo en la despensa.
4.  **Funcionalidades Avanzadas:**
    *   **Múltiples Despensas:** Soporte para gestionar inventarios separados (ej. casa principal, casa de vacaciones).
    *   **Control de Desperdicio Básico:** Marcar artículos como "desperdiciados" y ver estadísticas simples.
    *   **Soporte Dietas Especiales (Inicial):** Etiquetar artículos (sin gluten, vegano, etc.) y filtrar por etiqueta.
    *   **Gestión de Artículos a Granel vs. Envasados:** Mejorar la lógica de cantidades/unidades para estos casos.

**Métricas Potenciales:**

*   Porcentaje de recetas planificadas con ingredientes vinculados a la despensa.
*   Tasa de conversión de "sugerencia de reposición" a "artículo añadido a la lista".
*   Uso de la función de ubicación y filtrado.
*   Número de artículos marcados como "próximos a caducar".
*   Reducción reportada de desperdicio (si se implementa seguimiento).
*   Adopción de funciones avanzadas (múltiples despensas, etiquetas de dieta).

---

## Fase 3: Inteligencia y Automatización (Duración estimada: 8+ Sprints - Iterativa)

**Objetivos:**

*   Minimizar el esfuerzo manual para mantener la despensa actualizada.
*   Proporcionar insights y automatizaciones inteligentes para optimizar compras y consumo.
*   Personalizar la experiencia basada en los hábitos del usuario.

**Funcionalidades Clave:**

1.  **Importación Inteligente:**
    *   **Importación por Foto/Ticket (OCR):** Analizar fotos de tickets de compra o estanterías para añadir artículos automáticamente (requiere investigación de APIs externas o desarrollo de modelo propio).
    *   **Importación por Código de Barras:** Escanear códigos para identificar y añadir productos (requiere base de datos de productos).
2.  **Notificaciones Inteligentes:**
    *   **Alertas de Caducidad Avanzadas:** Notificaciones push/in-app configurables (X días antes, etc.).
    *   **Alertas de Reposición Proactiva:** Basadas en niveles de stock, historial de consumo y planificación futura.
    *   **Sugerencias de Uso:** "Tienes X a punto de caducar, ¿qué tal esta receta?".
3.  **Análisis y Sugerencias Avanzadas:**
    *   **Informe de Desperdicio Detallado:** Análisis de qué se desperdicia más, posibles causas y consejos.
    *   **Análisis de Consumo:** Patrones de uso de ingredientes.
    *   **Optimización de Compras:** Sugerencias para comprar cantidades óptimas basadas en consumo y caducidad.
    *   **Soporte Dietas Avanzado:** Vinculación con perfiles nutricionales, alertas de alérgenos.
4.  **Personalización y Colaboración:**
    *   **Compartir Despensa:** Permitir que múltiples usuarios vean/gestionen una despensa compartida (familia, compañeros de piso).
    *   **Aprendizaje de Hábitos:** Ajustar sugerencias y recordatorios según el comportamiento del usuario.

**Métricas Potenciales:**

*   Tasa de éxito y precisión de la importación por foto/ticket/código de barras.
*   Tasa de clics/acción en notificaciones inteligentes.
*   Uso de informes de desperdicio y consumo.
*   Tasa de adopción de la función de compartir despensa.
*   Satisfacción del usuario con la inteligencia y automatización (encuestas).
*   Reducción medible del desperdicio de alimentos (si es posible rastrear).

---

## Estrategias Técnicas Transversales: Caché, Sugerencias y Fallbacks

Para mejorar la resiliencia, performance y experiencia de usuario en escenarios de conectividad limitada o fallos de API, se implementarán las siguientes estrategias técnicas:

### 1. Gestión de Caché Local Optimizada (LRU)

*   **Objetivo:** Gestionar eficientemente el caché local (`localStorage`) para sugerencias y otros datos temporales, evitando el crecimiento desmedido y priorizando la información más relevante.
*   **Implementación:** Se utilizará un `CacheManager` con las siguientes características:
    *   **Lógica LRU (Least Recently Used):** Las entradas menos usadas recientemente serán las primeras candidatas a ser eliminadas cuando se alcance el límite. Se mantendrá un registro del orden de uso.
    *   **Límite de Entradas (`maxEntries`):** Número máximo configurable de elementos en el caché.
    *   **Tiempo de Vida (`ttl`):** Tiempo máximo configurable que una entrada permanece válida.
    *   **Limpieza Automática:** Proceso periódico (`cleanupInterval`) para eliminar entradas expiradas y aplicar la política LRU si se supera `maxEntries`.
    *   **Persistencia:** El estado del caché (datos y orden LRU) se guardará en `localStorage`.
*   **Beneficios:** Acceso rápido a datos frecuentes, reducción de llamadas a API, funcionamiento offline básico para ciertas consultas, control del uso de `localStorage`.

### 2. Sugerencias Locales y Fallback

*   **Objetivo:** Proveer sugerencias útiles (ej. en campos de búsqueda o adición rápida) incluso cuando la API no responde, basándose en la actividad previa del usuario.
*   **Implementación:** Se creará un `LocalSuggestionManager`:
    *   **Historial de Búsqueda:** Registrará los términos que el usuario busca o los ítems que añade frecuentemente.
    *   **Almacenamiento Local:** Guardará este historial en `localStorage`, incluyendo frecuencia y fecha de último uso.
    *   **Recuperación:** Permitirá obtener una lista de los términos/ítems más frecuentes o recientes.
    *   **Límite:** Tendrá un número máximo de entradas para evitar ocupar demasiado espacio.
*   **Uso como Fallback:** Si una consulta a la API para obtener sugerencias falla, el sistema recurrirá a `LocalSuggestionManager` para mostrar términos del historial del usuario.

### 3. Manejo Inteligente de Fallos de API (Fallback UX)

*   **Objetivo:** Ofrecer una experiencia de usuario controlada y útil cuando las llamadas a la API fallan de forma persistente (tras reintentos).
*   **Implementación (Ej. en búsqueda de productos/ítems):**
    *   **Reintentos con Backoff:** Implementar una estrategia de reintentos (ej. 3 intentos) con un tiempo de espera creciente entre ellos antes de considerar el fallo como definitivo.
    *   **Notificación Clara:** Mostrar un mensaje de error no intrusivo pero claro (ej. `toast`) indicando el problema y la acción de fallback.
    *   **Mostrar Sugerencias Locales:** Utilizar `LocalSuggestionManager` para mostrar el historial de búsqueda/ítems recientes del usuario.
    *   **Mostrar Sugerencias por Defecto:** Complementar las sugerencias locales con una lista predefinida de ítems comunes (ej. "Leche", "Pan", "Huevos") si las locales no son suficientes.
    *   **Botón "Reintentar":** Ofrecer una opción clara para que el usuario pueda volver a intentar la última operación fallida manualmente.
*   **Beneficios:** Reduce la frustración del usuario, mantiene la aplicación parcialmente funcional, guía al usuario hacia acciones alternativas.

---


**Metodología Propuesta:**

*   **Agile (Scrum/Kanban):** Sprints de 2 semanas, con planificación, revisión y retrospectiva. Kanban podría ser adecuado para la Fase 3, más continua e iterativa.
*   **Desarrollo Iterativo:** Lanzar funcionalidades clave de cada fase lo antes posible para obtener feedback temprano.
*   **Pruebas de Usabilidad:** Realizar pruebas con usuarios reales al final de cada fase (o incluso antes para prototipos de UI).
*   **Monitorización Continua:** Seguimiento de métricas clave y rendimiento.

**Próximos Pasos:**

1.  **Revisión y Aprobación:** Discutir este plan con el equipo y stakeholders para refinarlo y obtener la aprobación.
2.  **Diseño Detallado (Fase 1):** Crear wireframes, mockups y especificaciones técnicas para las funcionalidades de la Fase 1.
3.  **Desglose Técnico:** Dividir las funcionalidades en tareas más pequeñas para el backlog del primer sprint.

---