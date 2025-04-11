-- Limpiar todas las políticas existentes
DROP POLICY IF EXISTS "recipes_select_policy" ON "public"."recipes";
DROP POLICY IF EXISTS "recipes_insert_policy" ON "public"."recipes";
DROP POLICY IF EXISTS "recipes_update_policy" ON "public"."recipes";
DROP POLICY IF EXISTS "recipes_delete_policy" ON "public"."recipes";

DROP POLICY IF EXISTS "recipe_ingredients_select_policy" ON "public"."recipe_ingredients";
DROP POLICY IF EXISTS "recipe_ingredients_insert_policy" ON "public"."recipe_ingredients";
DROP POLICY IF EXISTS "recipe_ingredients_update_policy" ON "public"."recipe_ingredients";
DROP POLICY IF EXISTS "recipe_ingredients_delete_policy" ON "public"."recipe_ingredients";

-- Habilitar RLS
ALTER TABLE "public"."recipes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."recipe_ingredients" ENABLE ROW LEVEL SECURITY;

-- Políticas para recipes
CREATE POLICY "recipes_select_policy" ON "public"."recipes"
FOR SELECT TO authenticated
USING (
  user_id = auth.uid() OR 
  is_public = true
);

CREATE POLICY "recipes_insert_policy" ON "public"."recipes"
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
);

CREATE POLICY "recipes_update_policy" ON "public"."recipes"
FOR UPDATE TO authenticated
USING (
  auth.uid() = user_id
)
WITH CHECK (
  auth.uid() = user_id
);

CREATE POLICY "recipes_delete_policy" ON "public"."recipes"
FOR DELETE TO authenticated
USING (
  auth.uid() = user_id
);

-- Políticas para recipe_ingredients
CREATE POLICY "recipe_ingredients_select_policy" ON "public"."recipe_ingredients"
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM recipes
    WHERE recipes.id = recipe_ingredients.recipe_id
    AND (recipes.user_id = auth.uid() OR recipes.is_public = true)
  )
);

CREATE POLICY "recipe_ingredients_insert_policy" ON "public"."recipe_ingredients"
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM recipes
    WHERE recipes.id = recipe_ingredients.recipe_id
    AND recipes.user_id = auth.uid()
  )
);

CREATE POLICY "recipe_ingredients_update_policy" ON "public"."recipe_ingredients"
FOR UPDATE TO authenticated
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

CREATE POLICY "recipe_ingredients_delete_policy" ON "public"."recipe_ingredients"
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM recipes
    WHERE recipes.id = recipe_ingredients.recipe_id
    AND recipes.user_id = auth.uid()
  )
);

-- Verificar que las políticas se crearon correctamente
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
WHERE tablename IN ('recipes', 'recipe_ingredients')
ORDER BY tablename, policyname;