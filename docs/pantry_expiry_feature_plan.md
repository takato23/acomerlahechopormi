# Plan de Desarrollo: Gestión Despensa v1 (Fechas Vencimiento y Filtro)

**Objetivo:** Implementar la capacidad de registrar y visualizar fechas de vencimiento en la despensa, y filtrar por ítems próximos a vencer, sentando las bases para futuras funciones anti-desperdicio.

**Rama Git:** `feature/pantry-expiry-v1`

---

## Fases Principales:

1.  **Backend y Modelo de Datos:** Añadir el campo `expiry_date` y soporte en servicios.
2.  **Frontend - Lógica y Estado:** Integrar el campo en el store y servicios del frontend.
3.  **Frontend - UI:** Modificar la UI de la despensa para mostrar y editar la fecha, y añadir el filtro/vista.

---

## Pasos Técnicos Detallados:

**1. Backend y Modelo de Datos:**
    *   **1.1. Crear Migración:**
        *   Archivo: `supabase/migrations/030_add_pantry_expiry_date.sql`
        *   Contenido:
            ```sql
            -- Add expiry_date column to pantry_items table
            ALTER TABLE public.pantry_items
            ADD COLUMN expiry_date DATE NULL;

            -- Optional: Add an index for potentially faster filtering/sorting
            CREATE INDEX idx_pantry_items_expiry_date ON public.pantry_items (expiry_date) WHERE expiry_date IS NOT NULL;
            ```
    *   **1.2. Aplicar Migración:**
        *   Acción: Solicitar al usuario ejecutar `supabase db push`.
    *   **1.3. Regenerar Tipos Supabase:**
        *   Acción: Ejecutar `supabase gen types typescript --schema public > src/lib/database.types.ts`.

**2. Frontend - Lógica y Estado:**
    *   **2.1. Actualizar Tipos Frontend:**
        *   Archivo: `src/features/pantry/types.ts` (o `src/types/pantryTypes.ts`).
        *   Acción: Añadir `expiry_date?: string | null;` a la interfaz `PantryItem`.
    *   **2.2. Actualizar Servicio Frontend (`pantryService.ts`):**
        *   Archivo: `src/features/pantry/pantryService.ts`.
        *   Acción: Modificar `addPantryItem` y `updatePantryItem` para aceptar y enviar `expiry_date`.
    *   **2.3. Actualizar Store (`pantryStore.ts`):**
        *   Archivo: `src/stores/pantryStore.ts`.
        *   Acción:
            *   Modificar `addItem`/`updateItem` para manejar `expiry_date`.
            *   Añadir estado `filterExpiryDays: number | null = null;`.
            *   Añadir acción `setExpiryFilter(days: number | null)`.
            *   Modificar `fetchItems` o lógica de filtrado para usar `filterExpiryDays`.

**3. Frontend - UI:**
    *   **3.1. Localizar Componentes UI Despensa:**
        *   Acción: Identificar componentes como `PantryList.tsx`, `PantryListItem.tsx`, `PantryForm.tsx`, `PantryPage.tsx`.
    *   **3.2. Modificar Formulario Añadir/Editar:**
        *   Archivo: (Componente de formulario).
        *   Acción: Añadir `<Input type="date">` o similar para `expiry_date`.
    *   **3.3. Modificar Visualización Ítem:**
        *   Archivo: (Componente de ítem de lista/tarjeta).
        *   Acción: Mostrar `expiry_date` formateado y con indicador visual si está próximo a vencer.
    *   **3.4. Añadir Control de Filtro:**
        *   Archivo: (Componente de página de despensa).
        *   Acción: Añadir UI (Select/botones) para seleccionar filtro de días y llamar a `setExpiryFilter`.

---