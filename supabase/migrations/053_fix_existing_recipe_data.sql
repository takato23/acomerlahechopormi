ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS is_generated_base BOOLEAN DEFAULT FALSE NOT NULL;

-- Asegurar que los campos de text[] estén inicializados correctamente
UPDATE recipes 
SET tags = '{}' 
WHERE tags IS NULL;

UPDATE recipes 
SET main_ingredients = '{}' 
WHERE main_ingredients IS NULL;

-- Asegurar que los campos booleanos tengan valores por defecto
UPDATE recipes 
SET is_favorite = false 
WHERE is_favorite IS NULL;

UPDATE recipes 
SET is_public = false 
WHERE is_public IS NULL;

UPDATE recipes 
SET is_generated_base = false 
WHERE is_generated_base IS NULL;

-- Actualizar timestamps faltantes
UPDATE recipes 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- Asegurar que ingredient_name esté presente en recipe_ingredients
UPDATE recipe_ingredients ri
SET ingredient_name = i.name
FROM ingredients i
WHERE ri.ingredient_id = i.id 
AND ri.ingredient_name IS NULL;

-- Limpiar ingredientes huérfanos
DELETE FROM recipe_ingredients
WHERE recipe_id NOT IN (SELECT id FROM recipes);

-- Verificar integridad de datos
SELECT COUNT(*) as total_recipes,
       COUNT(CASE WHEN tags IS NULL THEN 1 END) as null_tags,
       COUNT(CASE WHEN main_ingredients IS NULL THEN 1 END) as null_main_ingredients,
       COUNT(CASE WHEN is_favorite IS NULL THEN 1 END) as null_favorites,
       COUNT(CASE WHEN is_public IS NULL THEN 1 END) as null_public,
       COUNT(CASE WHEN updated_at IS NULL THEN 1 END) as null_updated
FROM recipes;

SELECT COUNT(*) as total_ingredients,
       COUNT(CASE WHEN ingredient_name IS NULL THEN 1 END) as null_names,
       COUNT(CASE WHEN recipe_id IS NULL THEN 1 END) as null_recipe_ids
FROM recipe_ingredients;