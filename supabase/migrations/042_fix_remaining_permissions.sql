-- Asegurar que todas las tablas tengan RLS habilitado
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS shopping_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pantry_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS meal_plan_entries ENABLE ROW LEVEL SECURITY;

-- Política para perfiles: los usuarios solo pueden ver/editar su propio perfil
DROP POLICY IF EXISTS "Users can manage their own profile" ON profiles;
CREATE POLICY "Users can manage their own profile"
ON profiles
FOR ALL
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Política para items de lista de compras
DROP POLICY IF EXISTS "Users can manage their shopping list items" ON shopping_list_items;
CREATE POLICY "Users can manage their shopping list items"
ON shopping_list_items
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Política para items de despensa
DROP POLICY IF EXISTS "Users can manage their pantry items" ON pantry_items;
CREATE POLICY "Users can manage their pantry items"
ON pantry_items
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Política para planificación de comidas
DROP POLICY IF EXISTS "Users can manage their meal plan entries" ON meal_plan_entries;
CREATE POLICY "Users can manage their meal plan entries"
ON meal_plan_entries
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Asegurar que los usuarios puedan ver todas las recetas públicas además de las suyas
DROP POLICY IF EXISTS "Users can view public and own recipes" ON recipes;
CREATE POLICY "Users can view public and own recipes"
ON recipes
FOR SELECT
USING (
    auth.uid() = user_id
    OR user_id IS NULL
    OR EXISTS (
        SELECT 1
        FROM meal_plan_entries
        WHERE meal_plan_entries.recipe_id = recipes.id
        AND meal_plan_entries.user_id = auth.uid()
    )
);

-- Asegurar que los usuarios solo puedan modificar sus propias recetas
DROP POLICY IF EXISTS "Users can manage their own recipes" ON recipes;
CREATE POLICY "Users can manage their own recipes"
ON recipes
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Política para ingredientes de recetas
DROP POLICY IF EXISTS "Users can manage ingredients of their recipes" ON recipe_ingredients;
CREATE POLICY "Users can manage ingredients of their recipes"
ON recipe_ingredients
FOR ALL
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

-- Comentarios explicativos
COMMENT ON POLICY "Users can manage their own profile" ON profiles IS 'Permite a los usuarios gestionar solo su propio perfil';
COMMENT ON POLICY "Users can manage their shopping list items" ON shopping_list_items IS 'Permite a los usuarios gestionar solo sus propios items de lista de compras';
COMMENT ON POLICY "Users can manage their pantry items" ON pantry_items IS 'Permite a los usuarios gestionar solo sus propios items de despensa';
COMMENT ON POLICY "Users can manage their meal plan entries" ON meal_plan_entries IS 'Permite a los usuarios gestionar solo sus propias entradas de planificación';
COMMENT ON POLICY "Users can view public and own recipes" ON recipes IS 'Permite a los usuarios ver recetas públicas, propias y las que están en su planificación';
COMMENT ON POLICY "Users can manage their own recipes" ON recipes IS 'Permite a los usuarios gestionar solo sus propias recetas';
COMMENT ON POLICY "Users can manage ingredients of their recipes" ON recipe_ingredients IS 'Permite a los usuarios gestionar ingredientes solo de sus propias recetas';