# Plan de Rediseño del Flujo de Añadir Ítems a la Despensa (MVP)

## 1. Objetivo del MVP

El objetivo de esta primera fase (Minimum Viable Product) es mejorar significativamente la experiencia de añadir ítems a la despensa desde dispositivos móviles, enfocándonos en:

*   **Velocidad y Fluidez:** Reducir drásticamente la fricción al añadir ítems mediante una entrada de texto inteligente mejorada.
*   **Flexibilidad:** Permitir correcciones rápidas de la información parseada (especialmente la categoría) sin necesidad de abrir un formulario completo.
*   **Detalles Clave:** Facilitar la adición opcional de información relevante como la fecha de caducidad directamente en el flujo rápido.
*   **Base para el Futuro:** Establecer la arquitectura y los componentes base para futuras iteraciones que incluirán escaneo de códigos de barras y entrada por voz.

## 2. Componentes Afectados y Nuevos

*   **Nuevo:** `UnifiedPantryInput.tsx`: Componente principal que encapsulará la lógica de entrada de texto y la presentación de la vista previa interactiva. Reemplazará funcionalmente al `QuickAddItemInput` actual en la `PantryPage`.
*   **Modificado:** `pantryParser.ts`: Se mejorará significativamente su lógica para entender más formatos de entrada y proveer mejor feedback.
*   **Modificado:** `categorySuggestor.ts`: Se revisará y potencialmente ajustará su integración con el nuevo flujo.
*   **Nuevo/Rediseñado:** `InteractivePreview.tsx`: Componente para mostrar la información parseada y permitir correcciones in-situ (categoría, caducidad). Reemplaza la funcionalidad de `PreviewAndConfirm`.
*   **Modificado:** `PantryPage.tsx`: Se integrará el nuevo `UnifiedPantryInput`.
*   **Relegado:** `AddPantryItemForm.tsx`: Su uso principal pasará a ser la edición detallada de ítems existentes, accesible desde la vista previa o la lista de la despensa.
*   **Modificado:** `pantryService.ts`: Asegurar que la función `addPantryItem` (o una nueva variante si es necesario) acepte los datos del nuevo flujo.

## 3. Funcionalidades Clave del MVP

### 3.1. Mejora del Parseo de Texto (`pantryParser.ts`)

*   **Formatos Soportados:**
    *   `[Cantidad] [Unidad] [Nombre]` (Ej: "2 kg Harina")
    *   `[Nombre] [Cantidad] [Unidad]` (Ej: "Leche 1 litro")
    *   `[Nombre] [Cantidad]` (Unidad por defecto: "unidad", Ej: "Manzanas 5")
    *   `[Nombre]` (Cantidad por defecto: 1, Unidad por defecto: "unidad", Ej: "Pan")
*   **Manejo de Unidades:** Reconocer y normalizar unidades comunes (kg, gr, g, l, lt, ml, unidad, unidades, paquete, paq, lata, botella, bot, etc.). Permitir unidades personalizadas.
*   **Feedback:** Si la entrada es ambigua o no se puede parsear, mostrar un mensaje claro al usuario (ej: "Intenta 'Cantidad Unidad Nombre'").

### 3.2. Vista Previa Interactiva (`InteractivePreview.tsx`)

*   **Visualización Clara:** Mostrar Nombre, Cantidad y Unidad parseados de forma destacada.
*   **Corrección de Categoría:**
    *   Mostrar la categoría sugerida por `categorySuggestor.ts`.
    *   Incluir un componente `Select` (dropdown) poblado con las `availableCategories` para permitir al usuario corregir la categoría fácilmente.
*   **Detalles Opcionales (Expandibles):**
    *   Una sección colapsada por defecto ("Añadir Detalles").
    *   Al expandir, mostrar un input de tipo `date` para añadir/editar la **Fecha de Caducidad**.
*   **Acciones:**
    *   Botón "Confirmar y Añadir Otro": Guarda el ítem y limpia el input para el siguiente.
    *   Botón "Confirmar y Cerrar": Guarda el ítem y cierra/limpia el flujo.
    *   Botón/Enlace "Editar Detalles": Descarta la preview y abre el `AddPantryItemForm` pre-rellenado con los datos parseados para edición completa.
    *   Botón "Cancelar": Descarta la entrada y la preview.

### 3.3. Integración (`UnifiedPantryInput.tsx` en `PantryPage.tsx`)

*   El nuevo componente tendrá un `Input` de texto y un botón "Añadir".
*   Al presionar "Añadir" o "Enter", se llama al `pantryParser`.
*   Si el parseo es exitoso, se muestra el componente `InteractivePreview` (posiblemente en un Popover o Dialog modal pequeño).
*   Si el parseo falla, se muestra un toast de error.

## 4. Consideraciones Técnicas

*   **Estado:** Gestionar el estado del input, los datos parseados, la categoría seleccionada, la fecha de caducidad opcional y el estado de carga/envío (usar `useState`, `useReducer` o Zustand si la complejidad aumenta).
*   **Servicio:** Utilizar `pantryService.addPantryItem` pasando el objeto `CreatePantryItemData` construido desde la vista previa interactiva.
*   **UI:** Reutilizar componentes de Shadcn UI (`Input`, `Button`, `Select`, `Popover`, `Dialog`, `DatePicker` si se usa).
*   **Feedback:** Usar `sonner` para mostrar toasts de éxito y error.

## 5. Criterios de Aceptación (Ejemplos)

*   **Dado** que el usuario introduce "2 litros leche" en el `UnifiedPantryInput`, **cuando** presiona "Añadir", **entonces** se muestra la `InteractivePreview` con Cantidad=2, Unidad="litros", Nombre="leche".
*   **Dado** que la `InteractivePreview` muestra la categoría sugerida "Lácteos", **cuando** el usuario selecciona "Bebidas" en el dropdown de categoría, **entonces** la categoría seleccionada se actualiza a "Bebidas".
*   **Dado** que el usuario está en la `InteractivePreview`, **cuando** expande "Añadir Detalles" y selecciona una fecha en el input de caducidad, **entonces** la fecha de caducidad se almacena.
*   **Dado** que el usuario ha corregido la categoría a "Bebidas" y añadido una fecha de caducidad, **cuando** presiona "Confirmar y Cerrar", **entonces** se llama a `addPantryItem` con los datos correctos y se muestra un toast de éxito.
*   **Dado** que el usuario introduce "cebollas", **cuando** presiona "Añadir", **entonces** la `InteractivePreview` muestra Cantidad=1, Unidad="unidad", Nombre="cebollas" y sugiere la categoría "Verduras".

## 6. Próximos Pasos (Post-MVP)

Una vez validado el MVP, las siguientes iteraciones se enfocarán en:

*   **Iteración 2:** Integración de escaneo de códigos de barras.
*   **Iteración 3:** Añadir campos opcionales de ubicación y precio en la vista previa interactiva.
*   **Iteración 4:** Implementación de entrada por voz.
*   **Iteración 5:** Mejorar la integración contextual (añadir desde Lista de Compra/Recetas).