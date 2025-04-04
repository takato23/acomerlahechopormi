# Plan Integral de Implementación: Rediseño y Mejora del Flujo "Añadir Ítem a Despensa"

**Objetivo General:** Optimizar radicalmente la experiencia de añadir ítems a la despensa, haciéndola rápida, intuitiva, flexible y adaptada al uso móvil, incorporando funcionalidades inteligentes y métodos de entrada modernos.

---

**Fase 0: Fundación - MVP Implementado y Depurado (Completado)**

*   **Acciones Realizadas:**
    *   Análisis de requisitos y puntos débiles del formulario original.
    *   Identificación y análisis del componente `QuickAddItemInput` existente.
    *   Diseño de un nuevo flujo basado en `UnifiedPantryInput` e `InteractivePreview`.
    *   Mejora del `pantryParser.ts` (múltiples formatos, números en texto).
    *   Creación de `UnifiedPantryInput.tsx`.
    *   Creación de `InteractivePreview.tsx` (con corrección de categoría y campo de caducidad).
    *   Integración de los componentes en `PantryPage.tsx`.
    *   Depuración de errores:
        *   Error 400 al crear ingredientes (columna `user_id` inexistente).
        *   Error 409 al añadir ítem (violación FK por `category_id` incorrecto).
        *   Error de UI en componente `Select` (`value=""`).
        *   Error de parseo para números en texto ("quince huevos").
        *   Error de parseo para números directos ("15 huevos").
    *   Ajuste de `categorySuggestor.ts` (IDs correctos, keyword "milanesas").
*   **Entregable:** MVP funcional del nuevo flujo de añadir ítems, integrado en la página de la despensa.

---

**Fase 1: Estabilización y Refinamiento del MVP**

*   **Objetivo:** Asegurar la robustez, corregir problemas visuales menores y realizar las primeras mejoras basadas en el uso inicial.

    *   **Paso 1.1: Pruebas Unitarias del Parser**
        *   **a. Acción:** Implementar pruebas unitarias exhaustivas para `pantryParser.ts`.
        *   **b. Cómo:** Usar Jest/Vitest. Crear casos de prueba para todos los formatos de entrada definidos (Cantidad Unidad Nombre, Nombre Cantidad Unidad, Cantidad Nombre, NumeroTexto Nombre, Unidad de Nombre, Solo Nombre), incluyendo casos límite, espacios extra, mayúsculas/minúsculas y diferentes unidades. Verificar que cantidad, unidad (normalizada) y nombre se extraen correctamente. Probar el manejo de errores (`empty_input`, `unparseable`).
        *   **c. Herramientas:** Jest/Vitest, TypeScript, Node.js.
        *   **d. Rol:** Desarrollador.
        *   **e. Entregable:** Suite de pruebas unitarias para `pantryParser.ts` con alta cobertura, integrada en el flujo de CI si existe.

    *   **Paso 1.2: Pruebas Unitarias del Sugeridor de Categoría**
        *   **a. Acción:** Implementar pruebas unitarias para `categorySuggestor.ts`.
        *   **b. Cómo:** Usar Jest/Vitest. Probar con nombres de ítems que coincidan con `exactMatch` y `partialMatch` de diferentes categorías. Verificar que se devuelve el ID de categoría correcto. Probar casos donde no debería haber sugerencia.
        *   **c. Herramientas:** Jest/Vitest, TypeScript, Node.js.
        *   **d. Rol:** Desarrollador.
        *   **e. Entregable:** Suite de pruebas unitarias para `categorySuggestor.ts`.

    *   **Paso 1.3: Pruebas de Componentes UI**
        *   **a. Acción:** Implementar pruebas para `UnifiedPantryInput.tsx` e `InteractivePreview.tsx`.
        *   **b. Cómo:** Usar React Testing Library (o similar). Simular la entrada de texto, el click en "Añadir", verificar que la `InteractivePreview` se muestra con los datos correctos. Simular cambios en el Select de categoría y en el input de fecha. Simular clicks en los botones de Confirmar, Cancelar y Editar Detalles, verificando que se llaman los callbacks correspondientes.
        *   **c. Herramientas:** React Testing Library, Jest/Vitest, TypeScript.
        *   **d. Rol:** Desarrollador Frontend.
        *   **e. Entregable:** Pruebas de componente que validen la interacción y el flujo de datos dentro de los componentes UI.

    *   **Paso 1.4: Corrección de Advertencias de Animación (Framer Motion)**
        *   **a. Acción:** Investigar y corregir las advertencias de Framer Motion sobre animación de `backgroundColor` y `color`.
        *   **b. Cómo:** Identificar los componentes que usan `motion` y tienen efectos hover o de aparición/desaparición (probablemente botones, `InteractivePreview`). Asegurarse de que los valores iniciales y finales de las propiedades animadas (`backgroundColor`, `color`) sean compatibles o definir explícitamente valores iniciales animables en el `style`. Puede requerir ajustar cómo se aplican los estilos (ej: usar variables CSS directamente en lugar de `hsl(var(--...))` si causa conflicto).
        *   **c. Herramientas:** Navegador (Consola de Desarrollador), Framer Motion, CSS/TailwindCSS.
        *   **d. Rol:** Desarrollador Frontend.
        *   **e. Entregable:** Consola del navegador limpia de advertencias de Framer Motion relacionadas con colores. Animaciones visualmente fluidas.

    *   **Paso 1.5: Refinamiento Inicial de Keywords y Parser**
        *   **a. Acción:** Añadir más palabras clave comunes a `categorySuggestor.ts` y refinar la lógica del `pantryParser.ts` basándose en pruebas iniciales y feedback.
        *   **b. Cómo:** Recopilar ejemplos de ítems comunes que no se parsean o categorizan bien. Añadir las keywords faltantes a `MOCK_CATEGORY_KEYWORDS`. Ajustar las regex o la lógica de estrategias en `pantryParser.ts` si es necesario para casos comunes no cubiertos.
        *   **c. Herramientas:** Editor de código, Feedback de pruebas.
        *   **d. Rol:** Desarrollador/Analista Funcional.
        *   **e. Entregable:** Archivos `pantryParser.ts` y `categorySuggestor.ts` actualizados con mejoras. Mayor precisión en parseo y sugerencias.

---

**Fase 2: Funcionalidades Inteligentes y Detalles Clave**

*   **Objetivo:** Añadir valor mediante la sugerencia automática de fechas y la inclusión de más detalles opcionales en el flujo rápido.

    *   **Paso 2.1: Implementar Sugerencia de Fecha de Vencimiento**
        *   **a. Acción:** Añadir lógica para sugerir una fecha de vencimiento basada en la categoría del ítem.
        *   **b. Cómo:**
            1.  Definir un mapeo `categoryDurations: { [categoryId: string]: number }` (ej: `{ meat: 3, dairy: 7, vegetables: 5 }`) en un archivo de configuración o directamente en `InteractivePreview.tsx` (o un helper).
            2.  Crear una función `suggestExpiryDate(categoryId)` que calcule `Hoy + duration` para categorías perecederas.
            3.  Modificar el `useEffect` en `InteractivePreview.tsx`: cuando `selectedCategoryId` cambie a una categoría perecedera *y* el campo `expiryDate` esté vacío, llamar a `suggestExpiryDate` y actualizar el estado `expiryDate` con el valor formateado (YYYY-MM-DD).
        *   **c. Herramientas:** TypeScript, React, Date manipulation (ej: `date-fns`).
        *   **d. Rol:** Desarrollador Frontend.
        *   **e. Entregable:** Campo de fecha de caducidad pre-rellenado automáticamente en la `InteractivePreview` para categorías relevantes, permitiendo al usuario sobrescribirlo.

    *   **Paso 2.2: Añadir Campos Opcionales (Ubicación, Precio) a Preview**
        *   **a. Acción:** Permitir añadir Ubicación y Precio directamente desde la `InteractivePreview`.
        *   **b. Cómo:**
            1.  Añadir inputs para "Ubicación" (texto) y "Precio" (número) dentro del `AccordionContent` en `InteractivePreview.tsx`.
            2.  Añadir estados locales (`location`, `price`) en `InteractivePreview.tsx` para manejar estos inputs.
            3.  Incluir `location` y `price` en el objeto `finalData` dentro de `handleConfirm` en `InteractivePreview.tsx`.
            4.  Asegurarse de que `CreatePantryItemData` incluya estos campos y que `pantryService.addPantryItem` los maneje y los inserte en la tabla `pantry_items` (la migración `007` ya añadió las columnas).
        *   **c. Herramientas:** React, TypeScript, HTML forms.
        *   **d. Rol:** Desarrollador Frontend/Fullstack.
        *   **e. Entregable:** Posibilidad de añadir ubicación y precio desde la vista previa interactiva.

---

**Fase 3: Métodos de Entrada Avanzados**

*   **Objetivo:** Ofrecer alternativas modernas y rápidas para añadir ítems, reduciendo aún más la fricción.

    *   **Paso 3.1: Implementar Escaneo de Códigos de Barras**
        *   **a. Acción:** Añadir funcionalidad para escanear códigos de barras usando la cámara.
        *   **b. Cómo:**
            1.  **Investigación:** Evaluar librerías React para escaneo (ej: `react-qr-barcode-scanner`, `@zxing/library`) o considerar integración con APIs nativas si se planea PWA/App.
            2.  **UI:** Añadir un botón "Escanear" cerca del `UnifiedPantryInput`. Al pulsarlo, abrir un modal o vista con el visor de la cámara.
            3.  **Lógica:** Implementar la captura del código de barras.
            4.  **Integración:** Una vez obtenido el código, decidir la acción:
                *   *Opción A (Simple):* Rellenar el `UnifiedPantryInput` con el número del código para búsqueda manual posterior.
                *   *Opción B (Avanzada):* Consultar una API externa (ej: Open Food Facts API) con el código para obtener nombre, categoría, etc., y pre-rellenar la `InteractivePreview`. Implementar fallback si no se encuentra.
            5.  **Permisos:** Manejar permisos de cámara.
        *   **c. Herramientas:** Librería de escaneo JS/React, API de Open Food Facts (opcional), HTML Media API, React.
        *   **d. Rol:** Desarrollador Frontend.
        *   **e. Entregable:** Funcionalidad de escaneo de códigos de barras integrada en el flujo de añadir ítems.

    *   **Paso 3.2: Implementar Entrada por Voz**
        *   **a. Acción:** Permitir al usuario dictar los ítems a añadir.
        *   **b. Cómo:**
            1.  **Investigación:** Utilizar la Web Speech API (SpeechRecognition) disponible en navegadores modernos. Evaluar alternativas cloud si se requiere mayor precisión o soporte offline.
            2.  **UI:** Añadir un botón "Dictar" (icono de micrófono) cerca del `UnifiedPantryInput`.
            3.  **Lógica:** Al pulsar, iniciar el reconocimiento de voz. Al finalizar, obtener el texto transcrito.
            4.  **Integración:** Pasar el texto transcrito al `pantryParser` (igual que la entrada de texto manual) para intentar extraer la información y mostrar la `InteractivePreview`.
            5.  **Permisos:** Manejar permisos de micrófono.
            6.  **Feedback:** Proveer feedback visual/auditivo durante el dictado.
        *   **c. Herramientas:** Web Speech API, React.
        *   **d. Rol:** Desarrollador Frontend.
        *   **e. Entregable:** Funcionalidad de entrada por voz integrada en el flujo de añadir ítems.

---

**Fase 4: Mejora Continua**

*   **Objetivo:** Refinar y optimizar el flujo basándose en el uso real y el feedback. Esta fase es cíclica.

    *   **Paso 4.1: Recopilación de Feedback**
        *   **a. Acción:** Recopilar activamente feedback de los usuarios sobre el nuevo flujo.
        *   **b. Cómo:** Mediante encuestas, entrevistas, análisis de uso (si se implementa), o canales de comunicación directa. Preguntar sobre facilidad de uso, precisión del parser/sugerencias, utilidad de las nuevas funciones.
        *   **c. Herramientas:** Formularios, Herramientas de análisis (opcional), Comunicación directa.
        *   **d. Rol:** Product Owner/Analista Funcional/Equipo de Desarrollo.
        *   **e. Entregable:** Informe consolidado de feedback de usuarios.

    *   **Paso 4.2: Iteración sobre Parser y Sugerencias**
        *   **a. Acción:** Refinar continuamente `pantryParser.ts` y `categorySuggestor.ts`.
        *   **b. Cómo:** Basándose en el feedback y nuevos casos de uso identificados, añadir más keywords, ajustar la lógica de parseo, mejorar el manejo de ambigüedades. Considerar permitir a los usuarios sugerir correcciones.
        *   **c. Herramientas:** Editor de código, Pruebas unitarias.
        *   **d. Rol:** Desarrollador.
        *   **e. Entregable:** Versiones mejoradas de los módulos de parseo y sugerencia.

    *   **Paso 4.3: Optimización de UI/UX**
        *   **a. Acción:** Realizar ajustes finos en la interfaz y la experiencia de usuario.
        *   **b. Cómo:** Modificar el layout, los textos, los botones, las animaciones, el feedback visual/táctil basándose en el feedback y las pruebas de usabilidad.
        *   **c. Herramientas:** Editor de código, Herramientas de diseño (Figma, etc.), Pruebas A/B (opcional).
        *   **d. Rol:** Diseñador UX/UI, Desarrollador Frontend.
        *   **e. Entregable:** Interfaz de usuario más pulida y eficiente.

    *   **Paso 4.4: Monitorización de Rendimiento**
        *   **a. Acción:** Monitorizar el rendimiento del flujo, especialmente el parseo y las llamadas a servicios.
        *   **b. Cómo:** Utilizar herramientas de profiling del navegador, monitorizar tiempos de respuesta de la API (si aplica, ej: Open Food Facts). Identificar y optimizar cuellos de botella.
        *   **c. Herramientas:** Navegador (Performance tab), Herramientas de monitorización APM (opcional).
        *   **d. Rol:** Desarrollador Fullstack.
        *   **e. Entregable:** Flujo de añadir ítems optimizado en rendimiento.

---

## Consideraciones Adicionales para Ejecución Autónoma

Estas recomendaciones están diseñadas para permitir que una IA (como Gemini 2.5) ejecute este plan de forma autónoma, eficaz y sin intervención manual.

### 🔄 Estructura de Ejecución Autónoma
- Cada paso debe subdividirse internamente en subtareas claras.
- Los errores deben registrarse automáticamente en un archivo `@/failures.md`.
- Las funcionalidades aún no implementables (por falta de definición, dependencia externa, etc.) deben registrarse en `@/future_features.md`.

### 🧠 Reglas de Decisión Autónoma
- Priorizar:
  1. Lo que ya esté parcialmente implementado.
  2. Soluciones visuales rápidas para validar la interacción.
  3. Implementaciones fáciles de iterar en fases siguientes.

### 📐 Estándares de Código y Diseño
- Componentes reutilizables y modulares.
- Diseño mobile-first.
- Cada funcionalidad visible debe tener una versión navegable, aunque sea mínima.

### 📊 Registro de Avances
- Al finalizar cada paso, generar un resumen con:
  - ✅ Tareas completadas
  - ❌ Problemas detectados
  - 🔧 Decisiones técnicas tomadas
  - ⏭️ Recomendaciones para la fase siguiente

### 📣 Contenido para Redes o Presentación
- Cada fase debe producir al menos un resultado visual compartible (screenshot, grabación, vista previa funcional).
- Guardar en una carpeta tipo `/media/shareables/` para revisión o difusión.