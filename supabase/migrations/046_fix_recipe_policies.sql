-- Limpiar políticas existentes
DROP POLICY IF EXISTS "recipes_select_policy" ON public.recipes;
DROP POLICY IF EXISTS "recipes_insert_policy" ON public.recipes;
DROP POLICY IF EXISTS "recipes_update_policy" ON public.recipes;
DROP POLICY IF EXISTS "recipes_delete_policy" ON public.recipes;

-- Política de selección (permite ver recetas propias y públicas)
CREATE POLICY "recipes_select_policy"
ON public.recipes
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() 
  OR is_public = true
);

-- Política de inserción (solo el usuario autenticado)
CREATE POLICY "recipes_insert_policy"
ON public.recipes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Política de actualización (solo recetas propias)
CREATE POLICY "recipes_update_policy"
ON public.recipes
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Política de eliminación (solo recetas propias)
CREATE POLICY "recipes_delete_policy"
ON public.recipes
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Asegurarnos que RLS está habilitado
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

-- Verificar las políticas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'recipes'
ORDER BY policyname;