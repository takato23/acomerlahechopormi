# Análisis y Plan de Mejoras: Sección de Recetas

Este documento resume el análisis de la experiencia de usuario para el MVP (Producto Mínimo Viable) de la sección de Recetas, define un estado ideal futuro y propone un plan de implementación iterativo para alcanzarlo.

## 1. Estado Inicial (MVP - Fases 1-3 del Plan Original)

Basado en `recipe_management_plan.md`, el MVP implementado incluiría:

*   **Funcionalidad:** CRUD básico (Crear, Leer Lista/Detalle, Actualizar, Eliminar) para recetas personales.
*   **Datos:** Título, Descripción (opcional), Instrucciones (opcional), Ingredientes (Nombre, Cantidad, Unidad como texto libre).
*   **UI:**
    *   `RecipeListPage`: Lista simple con tarjetas mostrando solo el título. Botón "Añadir".
    *   `RecipeDetailPage`: Muestra detalles básicos (título, desc, instr, lista ingredientes). Botones Editar/Eliminar.
    *   `AddEditRecipePage`: Formulario para campos básicos y lista dinámica de ingredientes de texto.
*   **Limitaciones Clave:** Sin búsqueda/filtros, sin imágenes, sin tiempos/porciones, sin tags, sin vinculación de ingredientes a base de datos/despensa, sin integración con otras secciones, UI/UX básica sin refinamiento específico ni optimización móvil avanzada.

## 2. Simulación de Experiencia del MVP (Resumen 12 Perfiles)

La simulación indicó que el MVP sería funcionalmente mínimo pero **insatisfactorio** para la mayoría de los usuarios debido a la falta de características esenciales:

*   **Usuarios Generales (Ana, Carlos, Elena, Miguel, Isabel, Carmen):** Lo encontrarían básico, lento (añadir ingredientes), poco informativo (lista simple) y carente de herramientas clave (búsqueda, filtros, caducidad/precio no aplicable aquí pero sí la falta de info útil). Calificaciones promedio: **2.5-3 / 5**.
*   **Usuarios con Necesidades Específicas (David, Laura):** Totalmente insuficiente por falta de datos (tiempos, nutrición, tags) y filtros. Calificaciones promedio: **1.5-2 / 5**.
*   **Usuarios Técnicos/Diseño (Sofia, Ricardo, Pablo):** Reconocerían la base CRUD pero criticarían la falta de pulido UI/UX, funcionalidades, optimización y accesibilidad. Calificaciones promedio: **2.5-3.5 / 5**.
*   **Usuarios con Necesidades de Accesibilidad (Javier, Isabel):** Usabilidad muy limitada sin controles grandes, etiquetas ARIA completas, contraste adecuado y tamaño de fuente ajustable. Calificaciones promedio: **2-3 / 5** (asumiendo accesibilidad base).

**Conclusión MVP:** Funciona para guardar datos, pero no ofrece una experiencia útil ni agradable para la gestión real de recetas.

## 3. Definición del Estado Ideal (Objetivo 5/5)

Para una experiencia óptima y altamente satisfactoria, la sección de Recetas debería incluir:

*   **Visualización Rica y Eficiente:** Tarjetas atractivas (con imagen, info clave), diseño responsivo/compacto móvil, agrupación visual (por tipo, etc.).
*   **Búsqueda y Filtrado Potentes:** Por título, ingredientes, tags, tiempo, tipo, etc.
*   **Información Completa:** Imagen, tiempos, porciones, ingredientes vinculados (idealmente), instrucciones claras, tags. (Opcional: Nutrición, Calificaciones).
*   **Creación/Edición Inteligente:** Formulario intuitivo, autocompletado de ingredientes, subida de imagen. (Opcional: Parseo).
*   **Integración Holística:** Con Planificación, Lista de Compras, Despensa.
*   **Personalización/Descubrimiento:** Favoritos, sugerencias IA, generación IA.
*   **Accesibilidad Completa:** Controles, contraste, fuente, navegación por teclado/lector.

## 4. Análisis de Brechas (MVP vs. Ideal)

Las diferencias entre el MVP y el estado ideal son enormes, abarcando:

*   **Presentación Visual:** De texto básico a tarjetas ricas con imágenes.
*   **Descubrimiento:** De nada a búsqueda y filtros potentes.
*   **Riqueza de Datos:** De mínimo a información completa (tiempos, porciones, tags, etc.).
*   **Eficiencia de Entrada:** De texto libre a autocompletado/parseo.
*   **Conectividad:** De aislada a integrada con otras secciones.
*   **Inteligencia:** De estática a personalizada/generativa (IA).
*   **UI/UX y Accesibilidad:** De cruda a pulida y universalmente accesible.

## 5. Nuevo Plan de Implementación Iterativo (8 Fases)

Se propone un enfoque gradual para construir hacia el estado ideal:

1.  **Fase 1: MVP CRUD Básico:** Implementar Fases 1-3 de `recipe_management_plan.md` (DB, Servicio, UI básica CRUD).
2.  **Fase 2: Refinamiento UI/UX Inicial y Responsive:** Aplicar principios de Despensa (responsive, tarjetas/listas compactas móvil, `EmptyState`) a las páginas de Recetas. Mejorar UI de formularios.
3.  **Fase 3: Búsqueda y Filtrado Básicos:** Añadir búsqueda por título y filtros simples (ej. por tags si se añaden).
4.  **Fase 4: Mejora de Datos de Receta:** Añadir campos a DB y UI (imagen, tiempos, porciones, tags). Implementar subida de imágenes.
5.  **Fase 5: Vinculación de Ingredientes:** Refactorizar para usar `ingredient_id` (FK), implementar autocompletado/selección en formulario. (Paso complejo pero clave para integración).
6.  **Fase 6: Integraciones:** Conectar con Planificación y Lista de Compras. (Opcional: Mostrar disponibilidad Despensa).
7.  **Fase 7: Accesibilidad Completa:** Revisión exhaustiva (contraste, etiquetas) e implementación de tamaño de fuente ajustable.
8.  **Fase 8: Funcionalidades Avanzadas:** Explorar IA (sugerencias, generación), favoritos, calificaciones, etc.

Este plan permite entregar valor incrementalmente, empezando por la funcionalidad core y añadiendo capas de refinamiento, información, integración y características avanzadas de forma progresiva.