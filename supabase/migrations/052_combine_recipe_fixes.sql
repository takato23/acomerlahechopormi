-- Verificar y actualizar la estructura de la tabla recipes
CREATE TABLE IF NOT EXISTS recipes (
  id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  title text NOT NULL,
  description text,
  instructions text,
  prep_time_minutes integer,
  cook_time_minutes integer,
  servings integer,
  image_url text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone,
  is_favorite boolean DEFAULT false,
  is_public boolean DEFAULT false,
  is_generated_base boolean DEFAULT false,
  category_id uuid REFERENCES categories(id),
  tags text[] DEFAULT '{}',
  main_ingredients text[] DEFAULT '{}'
);

-- Verificar y actualizar la tabla recipe_ingredients
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  recipe_id uuid REFERENCES recipes(id) ON DELETE CASCADE NOT NULL,
  ingredient_id uuid REFERENCES ingredients(id),
  ingredient_name text NOT NULL,
  quantity numeric,
  unit text
);

-- Habilitar RLS
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;

-- Limpiar y recrear políticas
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON recipes;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON recipes;
DROP POLICY IF EXISTS "Enable update access for users based on user_id" ON recipes;
DROP POLICY IF EXISTS "Enable delete access for users based on user_id" ON recipes;

CREATE POLICY "Enable read access for authenticated users"
ON recipes FOR SELECT TO authenticated
USING (user_id = auth.uid() OR is_public = true);

CREATE POLICY "Enable insert access for authenticated users"
ON recipes FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Enable update access for users based on user_id"
ON recipes FOR UPDATE TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Enable delete access for users based on user_id"
ON recipes FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- Políticas para recipe_ingredients
DROP POLICY IF EXISTS "Enable read access for recipe ingredients" ON recipe_ingredients;
DROP POLICY IF EXISTS "Enable insert access for recipe ingredients" ON recipe_ingredients;
DROP POLICY IF EXISTS "Enable update access for recipe ingredients" ON recipe_ingredients;
DROP POLICY IF EXISTS "Enable delete access for recipe ingredients" ON recipe_ingredients;

CREATE POLICY "Enable read access for recipe ingredients"
ON recipe_ingredients FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM recipes 
  WHERE recipes.id = recipe_ingredients.recipe_id 
  AND (recipes.user_id = auth.uid() OR recipes.is_public = true)
));

CREATE POLICY "Enable insert access for recipe ingredients"
ON recipe_ingredients FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM recipes 
  WHERE recipes.id = recipe_ingredients.recipe_id 
  AND recipes.user_id = auth.uid()
));

CREATE POLICY "Enable update access for recipe ingredients"
ON recipe_ingredients FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM recipes 
  WHERE recipes.id = recipe_ingredients.recipe_id 
  AND recipes.user_id = auth.uid()
));

CREATE POLICY "Enable delete access for recipe ingredients"
ON recipe_ingredients FOR DELETE TO authenticated
USING (EXISTS (
  SELECT 1 FROM recipes 
  WHERE recipes.id = recipe_ingredients.recipe_id 
  AND recipes.user_id = auth.uid()
));

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_recipes_is_public ON recipes(is_public);
CREATE INDEX IF NOT EXISTS idx_recipes_title ON recipes USING gin(to_tsvector('spanish', title));
CREATE INDEX IF NOT EXISTS idx_recipes_tags ON recipes USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_ingredient_id ON recipe_ingredients(ingredient_id);

-- Verificar la estructura final
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('recipes', 'recipe_ingredients')
ORDER BY table_name, ordinal_position;

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
WHERE tablename IN ('recipes', 'recipe_ingredients')
ORDER BY tablename, policyname;