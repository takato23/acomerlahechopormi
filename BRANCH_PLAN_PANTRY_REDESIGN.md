# Plan de Desarrollo - Rama: feature/pantry-redesign

## 1. Objetivo General de la Rama

Esta rama tiene como objetivo implementar mejoras funcionales clave relacionadas con la despensa y la generación de recetas por IA, junto con un rediseño estético significativo de las secciones de recetas, adoptando un estilo visual claro, limpio y moderno.

**Funcionalidades Clave:**
*   Añadir ítems a la despensa por voz con auto-submit.
*   Generar recetas por IA basadas en los ingredientes de la despensa.
*   Autocompletar el planificador semanal con recetas generadas por IA.

**Mejoras Estéticas Clave:**
*   Rediseño de la lista y detalle de recetas (estilo claro/limpio).
*   Aplicación coherente de la nueva estética a otras pantallas relevantes.

## 2. Fases Detalladas

### Fase 0: Mejoras Funcionales Despensa
*   **Objetivo:** Mejorar la usabilidad de la entrada por voz y asegurar la obtención de datos de la despensa.
*   **Tareas:**
    *   **0.1 [Funcionalidad Voz]:** Implementar auto-submit en la entrada por voz de la despensa.
        *   Utilizar `useSpeechRecognition` (o similar) para obtener texto.
        *   Implementar lógica de debounce (~2 segundos de pausa).
        *   Llamar a `pantryParser.ts` (revisar/mejorar si es necesario) para extraer `quantity`, `unit`, `name`.
        *   Si el parseo es exitoso, llamar a `pantryService.addPantryItem`.
        *   Proporcionar feedback visual claro al usuario (escuchando, procesando, éxito/error).
        *   **Archivo Principal:** Probablemente `src/features/pantry/components/UnifiedPantryInput.tsx` o `PantryPage.tsx`.
    *   **0.2 [Validación Servicio]:** Confirmar que `pantryService.getPantryItems()` devuelve un array de ítems donde cada uno incluye el `name` del ingrediente asociado. (Confirmado, no requiere acción).

### Fase 1: Rediseño Estético - Lista de Recetas
*   **Objetivo:** Implementar el nuevo diseño visual para la lista de recetas.
*   **Tareas:**
    *   **1.1 [Componente]:** Crear `src/features/recipes/components/RecipeCard.tsx`.
    *   **1.2 [Estructura JSX]:** Implementar la estructura con `Card`, `img`, `CardHeader`, `CardTitle`, `CardContent`, `p` (descripción), `div` (metadata), `Button` (link).
    *   **1.3 [Estilos Tailwind]:** Aplicar clases para lograr el diseño "claro y limpio" (ver Guía de Diseño abajo): fondos blancos/`slate-50`, bordes `slate-200`, sombras `md`/`lg` (hover), `rounded-lg`, `overflow-hidden`, imagen `h-48 object-cover`, tipografía `Inter` (si se integra), colores `slate` y acento `emerald`, espaciado generoso (`p-4`, `mb-2`, `space-x-4`, etc.), `line-clamp`.
    *   **1.4 [Metadata]:** Implementar lógica condicional en `RecipeCard.tsx` para mostrar Tiempo Total (suma de `prep_time_minutes`, `cook_time_minutes`) con icono `Clock` y Porciones (`servings`) con icono `Users`.
    *   **1.5 [Refactorizar Lista]:** Modificar `src/features/recipes/pages/RecipeListPage.tsx` para importar y usar `RecipeCard` dentro del `map`, pasando `recipe` como prop.
    *   **1.6 [Layout Lista]:** Ajustar clases `grid` en `RecipeListPage.tsx` (ej. `gap-6`, `xl:grid-cols-4`).

### Fase 2: Funcionalidad - Generación Basada en Despensa
*   **Objetivo:** Permitir al usuario generar recetas usando los ingredientes de su despensa.
*   **Tareas:**
    *   **2.1 [UI]:** Añadir un nuevo botón o opción en `RecipeListPage.tsx` (cerca del botón "Generar con IA"), ej. "Usar mi Despensa". Podría ser un checkbox en el modal existente o un botón separado.
    *   **2.2 [Handler]:** Modificar `handleGenerateRecipe` en `RecipeListPage.tsx` (o crear una función separada) para manejar esta nueva opción.
    *   **2.3 [Obtener Despensa]:** Si se elige "Usar mi Despensa", llamar a `pantryService.getPantryItems()` para obtener la lista de ingredientes del usuario. Extraer solo los nombres.
    *   **2.4 [Construir Prompt]:** Crear un prompt diferente para Gemini que incluya la lista de ingredientes obtenidos. Ej: "Genera una receta de cocina usando principalmente los siguientes ingredientes: [lista de ingredientes]. [Opcional: Considera también las preferencias del usuario: ...]. Formatea la respuesta como JSON..."
    *   **2.5 [Llamada API]:** Llamar a la API de Gemini con el nuevo prompt.
    *   **2.6 [Procesar/Navegar]:** Extraer y parsear la respuesta JSON, navegar a la página de añadir/editar receta con los datos generados (igual que el flujo actual).

### Fase 3: Rediseño Estético - Detalle de Receta
*   **Objetivo:** Aplicar el estilo visual a la página de detalle.
*   **Tareas:**
    *   **3.1 [Identificar/Crear]:** Localizar o crear el componente de página `src/features/recipes/pages/RecipeDetailPage.tsx`.
    *   **3.2 [Layout]:** Definir estructura (ej. columna única, dos columnas).
    *   **3.3 [Estilos]:** Aplicar consistentemente la Guía de Diseño: imagen principal grande, tipografía, colores, espaciado, estilo de listas para ingredientes/instrucciones, estilo de botones de acción.

### Fase 4: Funcionalidad - Autocompletar Planificador Semanal
*   **Objetivo:** Añadir botón para llenar la semana con recetas generadas por IA.
*   **Tareas:**
    *   **4.1 [Identificar/Crear]:** Localizar o crear componentes/servicios del planificador (`PlanningPage.tsx`, `planningService.ts`?).
    *   **4.2 [UI]:** Añadir botón "Autocompletar Semana" (o similar) en `PlanningPage.tsx`.
    *   **4.3 [Lógica Generación]:** Implementar handler que:
        *   Determine cuántas recetas generar (ej. 7 cenas).
        *   Decida la base para la generación (¿usar despensa? ¿preferencias? ¿aleatorio?).
        *   Llame repetidamente a la lógica de generación de recetas (probablemente reutilizando la función de Fase 2 o la llamada directa a Gemini).
        *   Maneje errores si fallan algunas generaciones.
    *   **4.4 [Actualizar Planificador]:** Actualizar el estado/UI del planificador con las recetas generadas asignadas a los días/comidas correspondientes.

### Fase 5: Rediseño Estético - Otras Pantallas (Ejemplos)
*   **Objetivo:** Extender coherencia visual.
*   **Tareas (Ejemplos):**
    *   **5.1 [Dashboard]:** Revisar `DashboardPage.tsx`, aplicar estilos a títulos, tarjetas de resumen (si existen), usar colores y fuentes de la guía.
    *   **5.2 [Forms]:** Revisar `AddEditRecipePage.tsx`, `AddPantryItemForm.tsx`, `UserProfilePage.tsx`, etc. Asegurar uso consistente de componentes Shadcn (`Input`, `Textarea`, `Button`, `Label`) con estilos y colores de la guía.

### Fase 6: Pulido y Pruebas Finales
*   **Objetivo:** Refinar y validar la implementación.
*   **Tareas:**
    *   **6.1 [Pruebas Funcionales]:** Probar exhaustivamente el auto-submit por voz, la generación basada en despensa y el autocompletado del planificador.
    *   **6.2 [Optimización Imágenes]:** Considerar si las imágenes generadas por IA o subidas necesitan optimización (ej. compresión, formatos modernos como WebP) o si Supabase Storage/CDN lo maneja adecuadamente.
    *   **6.3 [Revisión Estilos]:** Revisión final de la coherencia visual, responsividad en diferentes tamaños de pantalla, y accesibilidad.

## 3. Guía de Diseño (Resumen)

*   **Estilo General:** Claro, limpio, espaciado, contenido primero.
*   **Base:** Shadcn UI + Tailwind CSS.
*   **Paleta:**
    *   Fondos: Blanco (`#FFFFFF`), Gris Claro (`#F8FAFC`).
    *   Texto: Gris Muy Oscuro (`#0F172A`), Gris Oscuro (`#334155`), Gris Medio (`#64748B`).
    *   Acento Principal: Verde Esmeralda (`#10B981`).
    *   Acento Hover: Verde Esmeralda Oscuro (`#059669`).
*   **Tipografía:** Inter (Sans-serif). Ajustar pesos y tamaños para jerarquía.
*   **Tarjetas:** `bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden hover:shadow-lg`.
*   **Iconos:** `lucide-react`, consistentes en tamaño y color (`slate-500` o `emerald-600`).

## 4. Consideraciones Técnicas

*   **API Keys:** Gemini API Key, Stability AI API Key (manejadas como secretos).
*   **Servicios Externos:** Google Gemini, Stability AI.
*   **Supabase:** Auth, Database (Postgres), Edge Functions, Storage.
*   **Frontend:** React, Vite, Zustand, TanStack Query (si se usa), Shadcn UI, Tailwind CSS.
*   **Parseo de Voz/Texto:** Robustez de `pantryParser.ts`.
*   **Rendimiento:** Carga de imágenes, múltiples llamadas a API en Fase 4.