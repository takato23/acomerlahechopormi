-- Asegurarnos que las tablas tengan RLS activado
ALTER TABLE "public"."recipes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."recipe_ingredients" ENABLE ROW LEVEL SECURITY;

-- Restablecer todas las políticas para recipes
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON "public"."recipes";
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON "public"."recipes";
DROP POLICY IF EXISTS "Enable update access for users based on user_id" ON "public"."recipes";
DROP POLICY IF EXISTS "Enable delete access for users based on user_id" ON "public"."recipes";

CREATE POLICY "Enable read access for authenticated users"
ON "public"."recipes"
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR 
  is_public = true
);

CREATE POLICY "Enable insert access for authenticated users"
ON "public"."recipes"
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
);

CREATE POLICY "Enable update access for users based on user_id"
ON "public"."recipes"
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
);

CREATE POLICY "Enable delete access for users based on user_id"
ON "public"."recipes"
FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()
);

-- Restablecer todas las políticas para recipe_ingredients
DROP POLICY IF EXISTS "Enable read access for recipe ingredients" ON "public"."recipe_ingredients";
DROP POLICY IF EXISTS "Enable insert access for recipe ingredients" ON "public"."recipe_ingredients";
DROP POLICY IF EXISTS "Enable update access for recipe ingredients" ON "public"."recipe_ingredients";
DROP POLICY IF EXISTS "Enable delete access for recipe ingredients" ON "public"."recipe_ingredients";

CREATE POLICY "Enable read access for recipe ingredients"
ON "public"."recipe_ingredients"
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM recipes 
    WHERE recipes.id = recipe_ingredients.recipe_id 
    AND (recipes.user_id = auth.uid() OR recipes.is_public = true)
  )
);

CREATE POLICY "Enable insert access for recipe ingredients"
ON "public"."recipe_ingredients"
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM recipes 
    WHERE recipes.id = recipe_ingredients.recipe_id 
    AND recipes.user_id = auth.uid()
  )
);

CREATE POLICY "Enable update access for recipe ingredients"
ON "public"."recipe_ingredients"
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM recipes 
    WHERE recipes.id = recipe_ingredients.recipe_id 
    AND recipes.user_id = auth.uid()
  )
);

CREATE POLICY "Enable delete access for recipe ingredients"
ON "public"."recipe_ingredients"
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM recipes 
    WHERE recipes.id = recipe_ingredients.recipe_id 
    AND recipes.user_id = auth.uid()
  )
);

-- Agregar índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_recipes_is_public ON recipes(is_public);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_ingredient_id ON recipe_ingredients(ingredient_id);

-- Verificar que todo quedó bien
SELECT 
    schemaname,
    tablename,
    policyname,
    roles,
    permissive,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('recipes', 'recipe_ingredients')
ORDER BY tablename, policyname;