# Documentación Funcional: Sección de Despensa

Este documento describe las funcionalidades clave implementadas en la sección de Despensa de la aplicación "A Comerla" y los archivos principales asociados a cada una. Sirve como referencia técnica y para prevenir regresiones.

## 1. Carga y Visualización Básica de Items

*   **Descripción:** Obtiene los ítems de la despensa del usuario desde la base de datos y los muestra en la interfaz. Permite cambiar entre vista de cuadrícula y vista de lista.
*   **Archivos Clave:**
    *   `src/features/pantry/PantryPage.tsx`: Componente principal de la página, orquesta la carga de datos y el renderizado.
    *   `src/features/pantry/pantryService.ts`: Contiene `getPantryItems()` para interactuar con Supabase.
    *   `src/features/pantry/types.ts`: Define la interfaz `PantryItem`.
    *   `src/stores/pantryStore.ts`: Gestiona el estado global de `pantryItems` y `isLoading`.
    *   `src/features/pantry/components/PantryItemsView.tsx`: Componente que decide si renderizar `PantryGrid` o `PantryList`.
    *   `src/features/pantry/components/PantryGrid.tsx`: Muestra los ítems en formato cuadrícula.
    *   `src/features/pantry/PantryList.tsx`: Muestra los ítems en formato de lista/tabla.
    *   `src/features/pantry/components/PantryItemCard.tsx`: Tarjeta individual para la vista de cuadrícula.
    *   `src/features/pantry/components/PantryListItemRow.tsx`: Fila individual para la vista de lista.

## 2. Agrupación por Categorías (Colapsables)

*   **Descripción:** Los ítems se agrupan visualmente por su categoría asignada. Cada categoría se muestra como una sección colapsable/expandible mediante un componente de acordeón.
*   **Archivos Clave:**
    *   `src/features/pantry/PantryPage.tsx`: Calcula `processedItems` (ítems agrupados) usando `useMemo`.
    *   `src/features/pantry/components/PantryItemsView.tsx`: Implementa el `Accordion` de `shadcn/ui` para mostrar los grupos. Renderiza `AccordionItem`, `AccordionTrigger`, `AccordionContent`.
    *   `src/components/ui/accordion.tsx`: Componente base de `shadcn/ui`.
    *   `src/features/pantry/types.ts`: Define la interfaz `Category`.
    *   `src/features/pantry/pantryService.ts`: Contiene `getCategories()`.

## 3. Gestión de Favoritos

*   **Descripción:** Permite a los usuarios marcar ítems como favoritos para destacarlos y acceder a ellos rápidamente. Incluye marcado en tarjetas/filas, filtro por tags, opción en selector de categorías y un panel lateral dedicado.
*   **Archivos Clave:**
    *   `supabase/migrations/020_add_pantry_item_favorite_flag.sql`: Añade la columna `is_favorite` a la tabla `pantry_items`.
    *   `src/features/pantry/types.ts`: Actualiza la interfaz `PantryItem` con `is_favorite`.
    *   `src/features/pantry/pantryService.ts`: Modifica `getPantryItems` para incluir `is_favorite`. Añade `toggleFavoritePantryItem()`.
    *   `src/stores/pantryStore.ts`: Añade la acción `toggleFavorite` para manejar el estado global y la interacción con el servicio.
    *   `src/features/pantry/PantryPage.tsx`: Define `handleToggleFavorite` y lo pasa a `PantryItemsView`.
    *   `src/features/pantry/components/PantryItemsView.tsx`: Recibe y pasa `onToggleFavorite` a `PantryGrid`/`PantryList`.
    *   `src/features/pantry/components/PantryGrid.tsx`: Recibe y pasa `onToggleFavorite` a `PantryItemCard`.
    *   `src/features/pantry/PantryList.tsx`: Recibe y pasa `onToggleFavorite` a `PantryListItemRow`.
    *   `src/features/pantry/components/PantryItemCard.tsx`: Muestra el botón de estrella (⭐) y llama a `onToggleFavorite`.
    *   `src/features/pantry/components/PantryListItemRow.tsx`: Muestra el botón de estrella (⭐) y llama a `onToggleFavorite`.
    *   `src/features/pantry/components/FavoriteTags.tsx`: Nuevo componente que muestra los tags de favoritos clickeables.
    *   `src/features/pantry/components/CategorySelect.tsx`: Componente de selector de categorías mejorado que incluye la opción "Favoritos".
    *   `src/features/pantry/components/PantryFiltersSection.tsx`: Integra `FavoriteTags` y `CategorySelect`, maneja el filtrado por tag/selector.
    *   `src/features/pantry/components/FavoriteItemsSheet.tsx`: Nuevo componente para el panel lateral de favoritos.
    *   `src/components/layout/Sidebar.tsx`: Añade el botón para abrir el `FavoriteItemsSheet`.
    *   `src/components/layout/AppLayout.tsx`: Maneja el estado de apertura del `FavoriteItemsSheet` y pasa las props necesarias.

## 4. Filtrado y Búsqueda

*   **Descripción:** Permite a los usuarios buscar ítems por nombre y filtrar por categoría (incluyendo la categoría virtual "Favoritos").
*   **Archivos Clave:**
    *   `src/features/pantry/PantryPage.tsx`: Mantiene el estado `filters` y calcula `processedItems` aplicando los filtros. Define `handleFilterChange`.
    *   `src/features/pantry/components/PantryFiltersSection.tsx`: Contiene los inputs de búsqueda y el selector de categoría (`CategorySelect`). Llama a `onFilterChange`.
    *   `src/features/pantry/components/CategorySelect.tsx`: Componente de selector de categorías.
    *   `src/features/pantry/components/FavoriteTags.tsx`: Permite filtrar por nombre al hacer clic en un tag.

## 5. Selección Múltiple y Acciones

*   **Descripción:** Permite entrar en un modo de selección para elegir varios ítems y aplicar acciones masivas (actualmente solo eliminar).
*   **Archivos Clave:**
    *   `src/features/pantry/PantryPage.tsx`: Mantiene los estados `isSelectionMode` y `selectedItems`. Define `handleSelectItem`, `handleDeleteSelected`, `handleSelectAll`, `handleDeselectAll`.
    *   `src/features/pantry/components/PantrySelectionControls.tsx`: Componente que muestra los controles de selección (Seleccionar, Cancelar, Eliminar Seleccionados, etc.).
    *   `src/features/pantry/components/PantryItemCard.tsx`: Muestra el checkbox y maneja el resaltado cuando `isSelectionMode` es true.
    *   `src/features/pantry/components/PantryListItemRow.tsx`: Muestra el checkbox y maneja el resaltado cuando `isSelectionMode` es true.
    *   `src/features/pantry/pantryService.ts`: Contiene `deleteMultiplePantryItems()`.

## 6. Vaciar Despensa

*   **Descripción:** Permite eliminar todos los ítems de la despensa del usuario con un diálogo de confirmación.
*   **Archivos Clave:**
    *   `src/features/pantry/pantryService.ts`: Añade la función `clearPantry()`.
    *   `src/features/pantry/components/ClearPantryDialog.tsx`: Nuevo componente para el diálogo de confirmación.
    *   `src/features/pantry/components/PantryFiltersSection.tsx`: Integra `ClearPantryDialog` y recibe `onClearPantry`.
    *   `src/features/pantry/PantryPage.tsx`: Define `handleClearPantry` (que llama a `clearPantry` y `loadData`) y lo pasa a `PantryFiltersSection`.

## 7. Añadir/Editar Items

*   **Descripción:** Funcionalidad para agregar nuevos ítems (a través del input unificado) y editar existentes (aún pendiente de implementar completamente en la UI rediseñada, pero la lógica base existe).
*   **Archivos Clave:**
    *   `src/features/pantry/components/UnifiedPantryInput.tsx`: Input principal para añadir ítems rápidamente.
    *   `src/features/pantry/pantryService.ts`: Contiene `addPantryItem()` y `updatePantryItem()`.
    *   `src/stores/pantryStore.ts`: Contiene las acciones `addItem` y `updateItem`.
    *   `src/features/pantry/PantryPage.tsx`: Define `handleEditItem` y `handleEditRequestFromUnifiedInput`.
    *   `src/features/pantry/components/PantryItemCard.tsx` / `PantryListItemRow.tsx`: Contienen los botones de editar.

## 8. Estilos Visuales

*   **Descripción:** Ajustes visuales para mejorar la apariencia, incluyendo el efecto "glassy" en las tarjetas y el contraste en los encabezados de categoría.
*   **Archivos Clave:**
    *   `src/features/pantry/components/PantryItemCard.tsx`: Aplica clases `bg-card/80 backdrop-blur-md rounded-lg`.
    *   `src/features/pantry/components/PantryItemsView.tsx`: Aplica clases `border rounded-md overflow-hidden` a `AccordionItem` y `bg-primary/20` a `AccordionTrigger`.
    *   `tailwind.config.js`: Define los colores base y animaciones.
    *   `src/index.css`: Define las variables CSS para los temas light/dark.