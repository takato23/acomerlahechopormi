-- Asegúrate de que RLS esté habilitado para la tabla pantry_items
-- Puedes hacerlo desde el Dashboard de Supabase (Authentication -> Policies -> pantry_items -> Enable RLS)
-- o con el siguiente comando SQL:
-- ALTER TABLE public.pantry_items ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si es necesario (opcional, usar con precaución)
-- DROP POLICY IF EXISTS "Allow authenticated users to select their own pantry items" ON public.pantry_items;
-- DROP POLICY IF EXISTS "Allow authenticated users to insert their own pantry items" ON public.pantry_items;
-- DROP POLICY IF EXISTS "Allow authenticated users to update their own pantry items" ON public.pantry_items;
-- DROP POLICY IF EXISTS "Allow authenticated users to delete their own pantry items" ON public.pantry_items;

-- 1. Política SELECT: Permitir leer propios ítems
CREATE POLICY "Allow authenticated users to select their own pantry items"
ON public.pantry_items
FOR SELECT
TO authenticated -- Aplica a usuarios autenticados
USING (auth.uid() = user_id); -- Condición: el user_id de la fila debe coincidir con el uid del usuario actual

-- 2. Política INSERT: Permitir insertar ítems propios
CREATE POLICY "Allow authenticated users to insert their own pantry items"
ON public.pantry_items
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id); -- Condición: el user_id que se intenta insertar debe coincidir con el uid del usuario actual

-- 3. Política UPDATE: Permitir actualizar ítems propios
CREATE POLICY "Allow authenticated users to update their own pantry items"
ON public.pantry_items
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id) -- Condición para qué filas se pueden actualizar
WITH CHECK (auth.uid() = user_id); -- Condición adicional sobre los datos actualizados (opcional pero bueno para user_id)

-- 4. Política DELETE: Permitir eliminar ítems propios
CREATE POLICY "Allow authenticated users to delete their own pantry items"
ON public.pantry_items
FOR DELETE
TO authenticated
USING (auth.uid() = user_id); -- Condición: solo se pueden eliminar filas cuyo user_id coincida con el uid del usuario actual

-- Nota: Asegúrate de que la columna 'user_id' en 'pantry_items' tenga una referencia (Foreign Key)
-- a la tabla 'auth.users' para que auth.uid() funcione correctamente y para mantener la integridad referencial.
-- Si no existe, puedes añadirla con:
-- ALTER TABLE public.pantry_items
-- ADD CONSTRAINT pantry_items_user_id_fkey
-- FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
-- (Considera si ON DELETE CASCADE es apropiado para tu caso de uso)