# Plan de Implementación: Filtro Inteligente "Necesito Comprar"

## 1. Objetivo

Implementar un filtro/vista en la Despensa que muestre automáticamente los ítems cuyo stock actual (`quantity`) es igual o menor a un nivel mínimo definido por el usuario (`min_quantity`), y permitir añadirlos fácilmente a la Lista de Compras.

## 2. Cambios en Modelo de Datos y Backend (Supabase)

### 2.1. Tabla `pantry_items`
*   **Añadir Columna:** `min_quantity` (FLOAT4, Nullable, Default NULL).
    ```sql
    ALTER TABLE public.pantry_items
    ADD COLUMN IF NOT EXISTS min_quantity FLOAT4 NULL;
    ```
*   **Comentario:** Añadir comentario a la columna.
    ```sql
    COMMENT ON COLUMN public.pantry_items.min_quantity IS 'Minimum desired quantity for this item. Used for "low stock" alerts.';
    ```

## 3. Cambios en Servicios

### 3.1. `pantryService.ts`
*   **`addPantryItem`:** Modificar para aceptar `min_quantity` opcional en `CreatePantryItemData` y pasarlo al `insert`.
*   **`updatePantryItem`:** Modificar para aceptar `min_quantity` opcional en `UpdatePantryItemData` y pasarlo al `update`.

### 3.2. `shoppingListService.ts` (Lista de Compras)
*   **Nueva Función:** `addMultipleToShoppingList(items: Array<{ name: string; quantity?: number | null; unit?: string | null }>)`
    *   Recibe un array de objetos con la información básica de los ítems a añadir.
    *   Itera sobre el array y llama a `addShoppingListItem` para cada uno.
    *   Podría optimizarse para hacer una única inserción múltiple si Supabase lo permite fácilmente.
    *   Debe manejar errores y devolver un resultado agregado (ej: cuántos se añadieron con éxito).

## 4. Cambios en Frontend

### 4.1. Tipos (`src/features/pantry/types.ts`)
*   Añadir `min_quantity?: number | null;` a `PantryItem`.
*   Añadir `min_quantity?: number | null;` a `CreatePantryItemData`.
*   Añadir `min_quantity?: number | null;` a `UpdatePantryItemData`.

### 4.2. Formulario (`AddPantryItemForm.tsx`)
*   Añadir un nuevo `Input` (type="number", step="any", min="0") para `min_quantity`.
*   Añadir estado local para `minQuantity`.
*   Poblar/resetear estado en `useEffect`.
*   Incluir `min_quantity` en `baseData` dentro de `handleSubmit`.

### 4.3. Filtros (`PantryFilters.tsx`)
*   Añadir un nuevo `Switch` o `Button` para activar/desactivar el filtro "Necesito Comprar".
*   Añadir props `showLowStockOnly: boolean;` y `onShowLowStockOnlyChange: (show: boolean) => void;`.

### 4.4. Página (`PantryPage.tsx`)
*   Añadir estado `showLowStockOnly`.
*   Pasar estado y setter a `PantryFilters`.
*   Modificar `filteredItems` (lógica `useMemo`):
    *   Añadir un paso de filtrado que se active si `showLowStockOnly` es `true`.
    *   Este paso debe incluir solo ítems donde `item.min_quantity` tenga valor y `item.quantity <= item.min_quantity`.
*   Añadir estado `selectedItemsForShoppingList: Set<string>` para trackear los IDs de los ítems seleccionados en la vista "Necesito Comprar".
*   Añadir función `handleToggleShoppingListSelection(itemId: string)`.
*   Añadir función `handleAddSelectedToShoppingList`:
    *   Obtiene los ítems completos correspondientes a los IDs en `selectedItemsForShoppingList`.
    *   Formatea los datos necesarios (`name`, `quantity`=1 por defecto?, `unit`).
    *   Llama a `addMultipleToShoppingList`.
    *   Muestra feedback (toast).
    *   Limpia la selección.
*   Renderizar condicionalmente el botón "Añadir Seleccionados a Lista" cuando `showLowStockOnly` esté activo y haya ítems seleccionados.
*   Pasar `showLowStockOnly`, `selectedItemsForShoppingList` y `handleToggleShoppingListSelection` a `PantryAccordionList`.

### 4.5. Lista/Fila (`PantryAccordionList.tsx` y `PantryListItemRow.tsx`)
*   **`PantryAccordionList.tsx`:** Recibir y pasar las nuevas props (`showLowStockOnly`, `selectedItemsForShoppingList`, `handleToggleShoppingListSelection`) a `PantryListItemRow`.
*   **`PantryListItemRow.tsx`:**
    *   Recibir las nuevas props.
    *   Renderizar condicionalmente un `Checkbox` al inicio de la fila **solo si** `showLowStockOnly` es `true`.
    *   El `Checkbox` estará marcado si `selectedItemsForShoppingList.has(item.id)`.
    *   El `onCheckedChange` del `Checkbox` llamará a `handleToggleShoppingListSelection(item.id)`.
    *   (Opcional) Añadir un indicador visual (ej: icono de alerta) si `item.quantity <= item.min_quantity` (visible siempre, no solo en el modo filtro).

## 5. Fases de Implementación (Estimado)

1.  **Backend y Tipos:** Añadir columna `min_quantity`, actualizar tipos y servicios (1-2 horas).
2.  **Formulario:** Añadir input `min_quantity` al formulario de edición (1 hora).
3.  **Filtro UI:** Añadir switch/botón en `PantryFilters` y estado en `PantryPage` (1 hora).
4.  **Lógica de Filtrado:** Implementar filtrado por `min_quantity` en `PantryPage` (1 hora).
5.  **Selección y Acción:** Añadir checkboxes en `PantryListItemRow`, estado de selección y botón/función "Añadir a Lista" en `PantryPage` (2-3 horas).

Este plan introduce la funcionalidad de "Necesito Comprar" de forma integrada.