-- Verificar y actualizar la estructura de la tabla recipes
ALTER TABLE recipes 
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS prep_time_minutes integer,
  ADD COLUMN IF NOT EXISTS cook_time_minutes integer,
  ADD COLUMN IF NOT EXISTS servings integer,
  ADD COLUMN IF NOT EXISTS is_favorite boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES categories(id),
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Asegurar que los campos requeridos no sean nulos
ALTER TABLE recipes
  ALTER COLUMN title SET NOT NULL,
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN is_favorite SET DEFAULT false,
  ALTER COLUMN is_public SET DEFAULT false;

-- Actualizar las columnas de tiempo si están vacías
UPDATE recipes 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- Agregar índices para búsqueda
CREATE INDEX IF NOT EXISTS idx_recipes_title_search ON recipes USING gin(to_tsvector('spanish', title));
CREATE INDEX IF NOT EXISTS idx_recipes_tags ON recipes USING gin(tags);

-- Asegurar que recipe_ingredients tenga la estructura correcta
ALTER TABLE recipe_ingredients
  ADD COLUMN IF NOT EXISTS ingredient_name text NOT NULL,
  ADD COLUMN IF NOT EXISTS quantity numeric,
  ADD COLUMN IF NOT EXISTS unit text,
  ADD COLUMN IF NOT EXISTS ingredient_id uuid REFERENCES ingredients(id);

-- Verificar estructura final
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('recipes', 'recipe_ingredients')
ORDER BY table_name, ordinal_position;