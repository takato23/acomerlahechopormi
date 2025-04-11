# Depuración de Errores Post-Rediseño Despensa (30/Mar/2025)

## Problema
Errores persistentes 500 Internal Server Error en el servidor de desarrollo Vite, impidiendo la carga de la aplicación, a pesar de corregir errores de sintaxis y tipos en los archivos del feature `pantry`.

## Limitación Actual
No se puede acceder directamente a los logs detallados del **terminal del servidor Vite**. Los logs de la consola del navegador solo muestran el error 500 genérico, no la causa raíz (archivo/línea específica del crash). Se necesita la salida del terminal donde se ejecuta `npm run dev` para un diagnóstico preciso.

## Próximos Pasos (Plan B - Sin Logs del Servidor)
1. Revisar archivos de configuración (`vite.config.ts`, `tsconfig.json`).
2. Revisar archivos core (`src/main.tsx`, `src/App.tsx`).
3. Considerar limpieza de caché/dependencias.

---
*Nota: Se han corregido múltiples errores de sintaxis JSX, tipos y alias en los siguientes archivos:*
* `src/features/pantry/types.ts`
* `src/features/pantry/PantryPage.tsx`
* `src/features/pantry/AddPantryItemForm.tsx`
* `src/features/pantry/components/PantryListItemRow.tsx`
* `src/features/pantry/components/PantryItemCard.tsx`
* `src/features/pantry/pantryService.ts`
* `src/components/ui/tooltip.tsx`

## Resolución Error 403 (permission denied) en INSERT de `shopping_list_items` (Julio 2024)

**Problema:**

Se recibía constantemente un error `HTTP 403 Forbidden` con el mensaje `code: '42501', message: 'permission denied for table shopping_list_items'` al intentar insertar un nuevo ítem en la lista de compras desde la aplicación, a pesar de que el usuario estaba correctamente autenticado.

**Proceso de Diagnóstico (Iterativo y con Desvíos):**

El proceso de diagnóstico fue largo porque el síntoma (error de permisos) apuntaba inicialmente a las Row Level Security (RLS) Policies, que son la causa más común en Supabase.

1.  **Verificación RLS Básica:** Se confirmó que RLS estaba habilitado para la tabla `shopping_list_items`.
2.  **Política INSERT:** Se creó y verificó múltiples veces la política para permitir inserciones:
    ```sql
    CREATE POLICY "Users can insert items"
    ON public.shopping_list_items
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);
    ```
3.  **Política SELECT:** Se añadió la política `SELECT` correspondiente para permitir leer los ítems propios (necesaria para `insert(...).select()`):
    ```sql
    CREATE POLICY "Enable read access for own items"
    ON public.shopping_list_items
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
    ```
4.  **Verificación Frontend:** Se confirmó mediante `console.log` que el código frontend (en `ShoppingListPage.tsx`) estaba obteniendo correctamente el `user.id` del usuario autenticado y lo estaba incluyendo en el objeto pasado a `supabase.from('shopping_list_items').insert({...})`.
5.  **Configuración Columna `user_id`:** Se verificó la columna `user_id` en la tabla. Inicialmente permitía nulos (`IS NULLABLE`). Se modificó para que fuera `NOT NULL` (`Allow Nullable` desmarcado), ya que es una mejor práctica para RLS y elimina ambigüedades, aunque no fue la causa raíz directa.
6.  **Limpieza de Políticas RLS:** Se revisaron todas las políticas activas para la tabla y se eliminaron políticas conflictivas o innecesarias preexistentes, como políticas `ALL` o políticas aplicadas al rol `public` que interferían con las específicas para `authenticated`.
7.  **Descarte de Triggers:** Se verificó que no hubiera triggers `BEFORE INSERT` conflictivos (el existente `handle_updated_at` era `BEFORE UPDATE`).
8.  **Prueba Clave - SQL Editor:** Se intentó ejecutar un `INSERT` simple directamente desde el SQL Editor de Supabase. **El error `permission denied` persistió**, lo que finalmente descartó cualquier problema en el código frontend y apuntó exclusivamente a la configuración de la base de datos.

**Causa Raíz:**

El problema real no estaba en las políticas RLS (que filtran *filas*), sino en los permisos básicos a nivel de tabla (`GRANT`). El rol `authenticated` no tenía permiso explícito para realizar la operación `INSERT` en la tabla `shopping_list_items`, ni el permiso `USAGE` en el schema `public`.

**Solución:**

Ejecutar los siguientes comandos `GRANT` en el SQL Editor de Supabase (como rol `postgres`):

```sql
-- Otorgar permiso de inserción en la tabla al rol autenticado
GRANT INSERT ON TABLE public.shopping_list_items TO authenticated;

-- Otorgar permiso de uso del schema al rol autenticado
GRANT USAGE ON SCHEMA public TO authenticated;
```

**Lección Aprendida:**

El error `42501: permission denied for table ...` en Supabase/PostgreSQL puede ser engañoso. Si bien a menudo se debe a políticas RLS incorrectas, **también puede significar que faltan los permisos `GRANT` básicos** (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) para el rol en cuestión sobre la tabla, o el permiso `USAGE` sobre el schema. Si las políticas RLS parecen correctas y el problema persiste (especialmente si falla desde el SQL Editor), **verificar los `GRANT`s** con consultas a `information_schema.role_table_grants` y `information_schema.usage_privileges` es un paso crucial.