# Plan de Rediseño: Despensa Atractiva y Funcional

## 1. Objetivos

*   Reemplazar la lista simple actual por una interfaz visualmente más atractiva e informativa.
*   Facilitar la visualización del estado de la despensa (qué hay, cantidades, vencimientos).
*   Mejorar la organización y búsqueda de ítems.
*   Integrar funcionalidades clave como fechas de vencimiento y categorización.

## 2. Propuesta de Diseño Holístico

*   **Vista Principal:** Cuadrícula (Grid) de tarjetas responsiva.
*   **Tarjeta de Ítem:** Mostrará Nombre, Imagen (si existe), Cantidad (con controles +/-), Unidad, Fecha de Vencimiento (con indicador visual), Categoría (icono/color).
*   **Agrupación:** Agrupar tarjetas por Categoría (con encabezados colapsables).
*   **Interacción:** Búsqueda por nombre, Filtros (categoría, por vencer, bajo stock).
*   **Feedback:** Animaciones fluidas al añadir, eliminar, actualizar y filtrar. Indicadores visuales claros.

## 3. Cambios en Modelo de Datos y Backend (Supabase)

### 3.1. Tabla `pantry_items`
*   **Añadir:** `category_id` (UUID, Nullable, FK a `categories.id`).
*   **Añadir:** `expiry_date` (DATE, Nullable).
*   **Añadir (Opcional):** `min_quantity` (FLOAT4, Nullable).
*   **Verificar:** `quantity` y `unit` deben permitir NULL (si se decide mantener esa flexibilidad, aunque el parser ahora pone defaults).

### 3.2. Tabla `ingredients`
*   **Añadir:** `image_url` (TEXT, Nullable).
*   **Verificar:** `category` (TEXT, Nullable) - ¿Usaremos este o el `category_id` de `pantry_items`? Se recomienda usar `category_id` en `pantry_items` para flexibilidad.

### 3.3. Tabla `categories` (Revisar/Crear si no existe globalmente)
*   `id` (UUID, PK)
*   `name` (TEXT, Not Null)
*   `icon` (TEXT, Nullable) - Nombre de icono (ej: lucide)
*   `color` (TEXT, Nullable) - Color Hex (ej: #ff0000)
*   `order` (INTEGER, Not Null, Default 0)
*   `user_id` (UUID, Nullable, FK a `auth.users`) - Para categorías personalizadas
*   `is_default` (BOOLEAN, Default false)

### 3.4. Obtención de Imágenes (Estrategia)
*   **Opción 1 (Simple):** Añadir URLs manualmente a la tabla `ingredients`.
*   **Opción 2 (Automática):** Al crear un ingrediente, buscar imagen en API externa (ej: Open Food Facts, Google Search API - requiere API keys y manejo de costos/límites).
*   **Opción 3 (Usuario):** Permitir al usuario subir una imagen (requiere Supabase Storage).

## 4. Plan de Implementación Frontend

### 4.1. Fase 1: Estructura y Datos Base (4-6 horas)
*   **Actualizar Tipos:** Modificar `PantryItem`, `Ingredient` en `types.ts` para incluir nuevos campos. Definir `Category` si no existe globalmente.
*   **Actualizar Servicio (`pantryService.ts`):**
    *   Modificar `getPantryItems` para hacer JOIN con `ingredients(name, image_url)` y `categories(name, icon, color)`.
    *   Modificar `addPantryItem` y `updatePantryItem` para manejar `category_id` y `expiry_date`.
*   **Actualizar Formulario (`AddPantryItemForm.tsx` / `QuickAddItemInput.tsx`):**
    *   Añadir input `type="date"` para `expiry_date`.
    *   Añadir selector de `category_id` (podría ser otro Combobox o un Select simple).
*   **Crear Componente `PantryItemCard.tsx`:**
    *   Recibe `item: PantryItem` como prop.
    *   Muestra `name`, `quantity`, `unit`.
    *   Incluye botones +/- (funcionales, llaman a `updatePantryItem`).
    *   Incluye botón de eliminar (funcional).
    *   (Placeholder para imagen y fecha).

### 4.2. Fase 2: Grid, Agrupación y Vencimiento (4-6 horas)
*   **Crear Componente `PantryGrid.tsx`:**
    *   Recibe `items: PantryItem[]`.
    *   Implementa la lógica para agrupar ítems por `category_id`.
    *   Renderiza una cuadrícula (CSS Grid o Flexbox wrap).
    *   Mapea los grupos y renderiza encabezados de categoría.
    *   Dentro de cada grupo, mapea los ítems y renderiza `PantryItemCard`.
*   **Integrar en `PantryPage.tsx`:** Reemplazar `PantryList` con `PantryGrid`.
*   **Mostrar Vencimiento en `PantryItemCard.tsx`:**
    *   Mostrar `expiry_date` formateada.
    *   Añadir lógica para calcular días restantes.
    *   Aplicar clases CSS condicionales (ej: `bg-yellow-100`, `text-red-600`) basadas en la proximidad del vencimiento. Usar `date-fns` o `dayjs` para manejo de fechas.
*   **Animaciones:** Aplicar `layout` a `PantryItemCard` y `AnimatePresence` a la lista dentro de `PantryGrid`.

### 4.3. Fase 3: Imágenes, Filtros y Búsqueda (3-5 horas)
*   **Mostrar Imágenes en `PantryItemCard.tsx`:**
    *   Mostrar `item.ingredients.image_url` si existe, con un placeholder si no.
*   **Crear Componente `PantryFilters.tsx`:**
    *   Input de texto para búsqueda por nombre.
    *   Select/Checkbox group para filtrar por categoría.
    *   Botones/Switch para filtrar por "Próximo a Vencer" / "Bajo Stock" (si se implementa `min_quantity`).
*   **Integrar Filtros en `PantryPage.tsx`:**
    *   Manejar estado para los filtros activos.
    *   Filtrar la lista `items` *antes* de pasarla a `PantryGrid`.
    *   Usar `useDebounce` para el input de búsqueda.
*   **Animaciones:** Animar la aparición/desaparición de ítems al filtrar (ya cubierto por `AnimatePresence` si se hace bien).

### 4.4. Fase 4: Pulido y Mejoras UX (2-4 horas)
*   **Edición Inline:** Explorar edición directa de cantidad/unidad en la tarjeta.
*   **Indicadores Visuales:** Mejorar los indicadores de estado (vencimiento, stock).
*   **Accesibilidad:** Revisar navegación por teclado y lectores de pantalla.
*   **Performance:** Optimizar re-renders, especialmente al filtrar/buscar.

## 5. Consideraciones Tecnológicas Específicas

*   **Imágenes:** Decidir estrategia (manual, API, subida). Considerar optimización y almacenamiento (Supabase Storage).
*   **Manejo de Fechas:** Usar librería como `date-fns` o `dayjs` para parsing, formateo y comparación de fechas de vencimiento.
*   **Estado de Filtros:** Puede manejarse en `PantryPage` con `useState` o llevarse a Zustand/URL si se vuelve complejo o necesita persistirse.
*   **Animaciones:** Usar `framer-motion` consistentemente. `layout` es clave para animaciones de reordenamiento/filtrado.

Este plan es más ambicioso y requerirá más tiempo, pero resultará en una experiencia de usuario mucho más rica y útil para la gestión de la despensa.