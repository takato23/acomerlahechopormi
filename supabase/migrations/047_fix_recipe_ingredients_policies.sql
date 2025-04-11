-- Limpiar políticas existentes
DROP POLICY IF EXISTS "recipe_ingredients_select_policy" ON public.recipe_ingredients;
DROP POLICY IF EXISTS "recipe_ingredients_insert_policy" ON public.recipe_ingredients;
DROP POLICY IF EXISTS "recipe_ingredients_update_policy" ON public.recipe_ingredients;
DROP POLICY IF EXISTS "recipe_ingredients_delete_policy" ON public.recipe_ingredients;

-- Política de selección (permite ver ingredientes de recetas propias y públicas)
CREATE POLICY "recipe_ingredients_select_policy"
ON public.recipe_ingredients
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM recipes
    WHERE recipes.id = recipe_ingredients.recipe_id
    AND (
      recipes.user_id = auth.uid()
      OR recipes.is_public = true
    )
  )
);

-- Política de inserción (solo para recetas propias)
CREATE POLICY "recipe_ingredients_insert_policy"
ON public.recipe_ingredients
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM recipes
    WHERE recipes.id = recipe_ingredients.recipe_id
    AND recipes.user_id = auth.uid()
  )
);

-- Política de actualización (solo ingredientes de recetas propias)
CREATE POLICY "recipe_ingredients_update_policy"
ON public.recipe_ingredients
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM recipes
    WHERE recipes.id = recipe_ingredients.recipe_id
    AND recipes.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM recipes
    WHERE recipes.id = recipe_ingredients.recipe_id
    AND recipes.user_id = auth.uid()
  )
);

-- Política de eliminación (solo ingredientes de recetas propias)
CREATE POLICY "recipe_ingredients_delete_policy"
ON public.recipe_ingredients
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM recipes
    WHERE recipes.id = recipe_ingredients.recipe_id
    AND recipes.user_id = auth.uid()
  )
);

-- Asegurarnos que RLS está habilitado
ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;

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
WHERE tablename = 'recipe_ingredients'
ORDER BY policyname;