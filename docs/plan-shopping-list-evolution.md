# Plan de Acción: Evolución de la Lista de Compras - Fase 1 (Búsqueda Inicial)

## 1. Visión y Objetivo Centrado en el Usuario

### Objetivo Final para el Usuario

El objetivo principal de esta fase es **reducir la fricción y el tiempo que el usuario invierte en encontrar ítems específicos dentro de su propia lista de compras**, especialmente cuando esta se vuelve larga. Queremos que la gestión de la lista sea más fluida y menos propensa a errores por olvido o duplicación accidental.

### ¿Qué va a VER y Experimentar el Usuario?

Al finalizar esta fase inicial, el usuario **verá una nueva barra de búsqueda directamente en la parte superior de su lista de compras habitual**.

**La experiencia será la siguiente:**

1.  **Encontrar Fácilmente:** Al empezar a escribir en la barra de búsqueda (por ejemplo, "lech"), la lista de ítems de abajo se filtrará *instantáneamente*, mostrando solo aquellos que coincidan (como "Lechuga", "Leche Descremada").
2.  **Rapidez:** La búsqueda será rápida y no bloqueará la aplicación, incluso si la lista tiene muchos ítems.
3.  **Flexibilidad Mínima:** Podrá buscar por "tomate" y encontrar "tomates" (y viceversa).
4.  **Limpieza Sencilla:** Un pequeño botón con una 'X' permitirá borrar la búsqueda y volver a ver la lista completa con un solo clic.
5.  **Accesibilidad:** La funcionalidad será usable mediante teclado y será compatible con lectores de pantalla, anunciando cuántos resultados se encontraron.

**En resumen:** El usuario tendrá una herramienta simple e intuitiva para localizar rápidamente cualquier producto que haya añadido a su lista, haciendo la revisión y el marcado de ítems una tarea más ágil y menos tediosa.

*(Nota interna: Esta mejora se construye sobre una base de mayor estabilidad general de la app y garantiza la accesibilidad, contribuyendo a una experiencia global más sólida y confiable).*

---

## 2. Plan de Acción Técnico Detallado

**Principio Rector:** Entregar valor incremental centrado en el usuario, priorizando estabilidad y accesibilidad, mientras sentamos bases flexibles para el futuro sin sobre-ingeniería y cuestionando continuamente el paradigma de la "lista".

### Fase 0: Estabilización y Preparación Fundamental (Días 1-7 Aprox.)

*   **Paso 0.1: Auditoría y Corrección de Bugs Críticos**
    *   **Qué hace técnicamente:** Identificar y corregir los bugs más impactantes reportados (cuelgues con >50 ítems, errores cálculo precios, problemas sincronización). Usar herramientas de debugging, logs y análisis estático.
    *   **Por qué es importante:** Estabilidad es la base. Entregar features sobre una app inestable frustra más.
    *   **Cuidado/Riesgo:** Subestimar complejidad. Priorizar solo los *realmente* críticos.
    *   **Acción Específica (IDE Prompt):** `// TODO: Buscar y corregir causa raíz de cuelgue al renderizar >50 items en ShoppingListPage. Analizar límites de renderizado y uso de memoria.` / `// DEBUG: Revisar lógica de [funcion_calculo_precios] y manejo de errores/estados vacíos.`

*   **Paso 0.2: Baseline de Accesibilidad (A11y) en Lista Actual**
    *   **Qué hace técnicamente:** Asegurar que elementos interactivos *actuales* (checkbox, delete) sean focusables, tengan indicadores de foco visibles y `aria-labels`. Validar contraste mínimo (WCAG AA).
    *   **Por qué es importante:** Base accesible para construir encima.
    *   **Cuidado/Riesgo:** Requiere revisión manual además de automática.
    *   **Acción Específica (IDE Prompt):** `// A11Y: Revisar componente ListItem. Asegurar que Checkbox y Button (delete) son keyboard-focusable y tienen aria-label claro (ej. "Marcar [nombre_item] como comprado", "Eliminar [nombre_item]").` / `// A11Y: Verificar contraste de color entre texto del ítem y fondo, y estado checked/unchecked.`

### Fase 1: Implementación del MVP de Búsqueda (Días 8-25 Aprox.)

*   **Paso 1.1: Añadir Input de Búsqueda UI**
    *   **Qué hace técnicamente:** Integrar `Input` (Shadcn/ui u otra lib) en `ShoppingListPage.tsx` (`CardHeader`). Incluir icono `Search` y botón `X` para limpiar.
    *   **Por qué es importante:** Interfaz principal para la nueva funcionalidad.
    *   **Cuidado/Riesgo:** Evitar desorden visual. Asegurar accesibilidad del input/botón (Paso 1.5).
    *   **Acción Específica (IDE Prompt):** `// FEATURE: Añadir Input component desde @/components/ui/input en CardHeader de ShoppingListPage.tsx. Añadir icono Search de lucide-react y Button con icono X para clear.`

*   **Paso 1.2: Estado y Lógica de Filtrado Frontend**
    *   **Qué hace técnicamente:** Introducir estado local (`useState`) para término de búsqueda. Crear función de filtrado (insensible mayús/minús). Aplicar `debounce` (300ms) al `onChange`. Usar `useMemo` para lista filtrada.
    *   **Por qué es importante:** Core lógico del filtrado, performance percibida (debounce), optimización (useMemo).
    *   **Cuidado/Riesgo:** Lógica inicial simple. Debounce crucial.
    *   **Acción Específica (IDE Prompt):** `// FEATURE: Añadir useState<string>('searchTerm') en ShoppingListPage.` / `// FEATURE: Crear función filterItems(items, term) que devuelva items filtrados por nombre (toLowerCase).` / `// PERF: Implementar debounce (300ms) en onChange del Input de búsqueda usando un custom hook o lib.` / `// PERF: Calcular lista filtrada usando useMemo basado en listItems y searchTerm.`

*   **Paso 1.3: Renderizado de Lista Filtrada**
    *   **Qué hace técnicamente:** Modificar mapeo de lista para usar la lista filtrada. Mostrar mensaje "No se encontraron ítems".
    *   **Por qué es importante:** Muestra el resultado de la búsqueda.
    *   **Cuidado/Riesgo:** Mensaje "No resultados" claro.
    *   **Acción Específica (IDE Prompt):** `// FEATURE: Modificar el .map en ShoppingListPage para usar la variable con la lista filtrada.` / `// UX: Añadir Párrafo condicional: if (listItems.length > 0 && filteredItems.length === 0) mostrar 'No se encontraron ítems para "[searchTerm]".'`

*   **Paso 1.4: Mejora Mínima de Búsqueda (Plurales)**
    *   **Qué hace técnicamente:** Ajustar `filterItems` para que búsqueda "tomate" encuentre "tomates" (lógica simple +/- 's').
    *   **Por qué es importante:** Mejora usabilidad basada en feedback sin gran complejidad.
    *   **Cuidado/Riesgo:** Mantenerlo simple, no caer en fuzzy search complejo aún.
    *   **Acción Específica (IDE Prompt):** `// FEATURE: Modificar filterItems para que la comparación toLowerCase() también pruebe añadiendo/quitando 's' al término de búsqueda.`

*   **Paso 1.5: Accesibilidad del Buscador**
    *   **Qué hace técnicamente:** Añadir `aria-label` al input. Implementar `aria-live="polite"` region que anuncie cantidad de resultados.
    *   **Por qué es importante:** Funcionalidad usable para todos.
    *   **Cuidado/Riesgo:** Anuncio `aria-live` conciso. Probar con lectores.
    *   **Acción Específica (IDE Prompt):** `// A11Y: Añadir aria-label="Buscar en mi lista de compras" al Input de búsqueda.` / `// A11Y: Crear div con role="status" aria-live="polite" que anuncie "${filteredItems.length} ítems encontrados" cuando cambie filteredItems.`

### Fase 2: Refinamiento y Monitoreo Inicial (Días 26-45 Aprox.)

*   **Paso 2.1: Optimización de Rendimiento Post-MVP**
    *   **Qué hace técnicamente:** Perfilar filtrado/renderizado con listas largas (200+ ítems). Considerar virtualización (`react-window`) *solo si necesario*.
    *   **Por qué es importante:** Asegura escalabilidad razonable.
    *   **Cuidado/Riesgo:** Virtualización añade complejidad. Medir antes de implementar.
    *   **Acción Específica (IDE Prompt):** `// PERF: Perfilar componente ShoppingListPage con React DevTools Profiler bajo carga (simular 300 items). Identificar cuellos de botella.` / `// PERF (Condicional): Si se confirma bottleneck, investigar integración de react-window para el ul.`

*   **Paso 2.2: Tracking Básico Anonimizado (Uso de Búsqueda)**
    *   **Qué hace técnicamente:** Trackear eventos *anonimizados*: `search_initiated`, `search_cleared`, `search_results_found` (con buckets: 0, 1-5, 6+). *No trackear término*. Validar privacidad.
    *   **Por qué es importante:** Valida adopción y patrones básicos de uso, respetando ética.
    *   **Cuidado/Riesgo:** Riesgo de error en anonimización. Empezar mínimo.
    *   **Acción Específica (IDE Prompt):** `// ANALYTICS: Integrar llamada a trackEvent('search_initiated') en handler (debounced) cuando searchTerm pasa de vacío a no-vacío.` / `// ANALYTICS: Integrar trackEvent('search_results_found', { resultCountBucket: calculateBucket(filteredItems.length) }) cuando filteredItems cambia.`

*   **Paso 2.3: Auditoría A11y Post-Implementación**
    *   **Qué hace técnicamente:** Pruebas manuales con teclado y lectores de pantalla (VoiceOver/NVDA) del flujo completo.
    *   **Por qué es importante:** Validación final de accesibilidad.
    *   **Cuidado/Riesgo:** Consume tiempo. Puede requerir ajustes.
    *   **Acción Específica (IDE Prompt):** `// QA: Realizar testeo manual de accesibilidad (Keyboard navigation, VoiceOver/NVDA) para la funcionalidad de búsqueda completa.`

### Fase 3: Pausa Estratégica y Preparación Futura (Días 46+ Continuo)

*   **Paso 3.1: Análisis de Datos y Feedback del MVP**
    *   **Qué hace técnicamente:** Revisar analytics anonimizados y feedback cualitativo.
    *   **Por qué es importante:** Informa próximos pasos (¿filtros? ¿mejorar búsqueda?).
    *   **Cuidado/Riesgo:** Evitar conclusiones precipitadas.
    *   **Acción Específica (IDE Prompt):** `N/A (Análisis fuera del IDE)`

*   **Paso 3.2: Prototipado Interno Exploratorio (No-Compromiso)**
    *   **Qué hace técnicamente:** Explorar (Figma/Storybook/ramas) UI/UX de filtros O investigar fuzzy matching ligero (`fuse.js`). *No mergear*.
    *   **Por qué es importante:** Prepara posibles siguientes pasos sin compromiso, manteniendo visión futura y escepticismo paradigmático.
    *   **Cuidado/Riesgo:** Evitar sobre-inversión. Timeboxing.
    *   **Acción Específica (IDE Prompt):** `// EXPLORATORY (branch: feat/explore-filters): Crear variaciones UI en Storybook para filtros por categoría.` / `// EXPLORATORY (branch: feat/explore-fuzzy-search): Evaluar integración y performance de fuse.js para filterItems.`

*   **Paso 3.3: Reflexión Arquitectónica y Paradigmática (Documentación/Discusión)**
    *   **Qué hace técnicamente:** Documentar/discutir implicaciones arquitectónicas de IA, event sourcing, o modelos no centrados en "listas".
    *   **Por qué es importante:** Siembra semillas para evolución técnica consciente.
    *   **Cuidado/Riesgo:** Evitar abstracción excesiva. Enfocar en medio plazo.
    *   **Acción Específica (IDE Prompt):** `// DOCS: Crear/actualizar ADR reflexionando sobre impacto de IA/event-sourcing en modelo de datos/APIs de lista de compras.`