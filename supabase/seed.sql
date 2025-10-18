-- Seed data for local Supabase development
-- 1. Default categories ------------------------------------------------------
INSERT INTO public.categories (id, name, icon, color, "order", is_default)
VALUES
  ('produce', 'Frutas y Verduras', 'carrot', '#4ade80', 1, true),
  ('protein', 'Proteínas', 'beef', '#fca5a5', 2, true),
  ('grains', 'Granos y Cereales', 'bread', '#facc15', 3, true),
  ('dairy_and_eggs', 'Lácteos y Huevos', 'milk', '#bfdbfe', 4, true)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  "order" = EXCLUDED."order",
  is_default = EXCLUDED.is_default;

-- 2. Measurement units catalogue --------------------------------------------
INSERT INTO public.measurement_units (id, name, abbreviation, unit_group, description)
VALUES
  ('gram', 'Gramo', 'g', 'weight', 'Unidad básica de peso para ingredientes sólidos.'),
  ('kilogram', 'Kilogramo', 'kg', 'weight', 'Equivale a 1000 gramos.'),
  ('milliliter', 'Mililitro', 'ml', 'volume', 'Unidad para mediciones pequeñas de volumen.'),
  ('liter', 'Litro', 'l', 'volume', 'Equivale a 1000 mililitros.'),
  ('unit', 'Unidad', 'ud', 'quantity', 'Cuenta piezas individuales.'),
  ('cup', 'Taza', 'cup', 'volume', 'Medida estándar de cocina (aprox. 240 ml).')
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  abbreviation = EXCLUDED.abbreviation,
  unit_group = EXCLUDED.unit_group,
  description = EXCLUDED.description;

-- 3. Sample recipes (requires at least one user in auth.users) ---------------
WITH existing_user AS (
  SELECT id
  FROM auth.users
  ORDER BY created_at
  LIMIT 1
),
inserted_recipe AS (
  INSERT INTO public.recipes (
    id,
    user_id,
    title,
    description,
    instructions,
    servings,
    prep_time_minutes,
    cook_time_minutes,
    is_public,
    is_generated_base,
    is_favorite
  )
  SELECT
    gen_random_uuid() AS id,
    existing_user.id AS user_id,
    'Ensalada Mediterránea' AS title,
    'Ensalada fresca con vegetales, queso feta y aderezo de limón.' AS description,
    '1. Cortar vegetales. 2. Mezclar con queso. 3. Aliñar y servir.' AS instructions,
    2 AS servings,
    15 AS prep_time_minutes,
    0 AS cook_time_minutes,
    true AS is_public,
    false AS is_generated_base,
    false AS is_favorite
  FROM existing_user
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.recipes
    WHERE title = 'Ensalada Mediterránea'
  )
  RETURNING id, user_id
),
inserted_ingredients AS (
  INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit)
  SELECT inserted_recipe.id, ingredient_name, quantity, unit
  FROM inserted_recipe
  JOIN (
    VALUES
      ('Tomate cherry', 200::numeric, 'g'),
      ('Pepino', 1::numeric, 'unit'),
      ('Queso feta', 100::numeric, 'g'),
      ('Aceite de oliva', 30::numeric, 'ml'),
      ('Jugo de limón', 15::numeric, 'ml')
  ) AS seed_items(ingredient_name, quantity, unit) ON TRUE
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.recipe_ingredients ri
    WHERE ri.recipe_id = inserted_recipe.id
  )
  RETURNING 1
)
SELECT 'Inserted mediterranean salad recipe' AS message
WHERE EXISTS (SELECT 1 FROM inserted_recipe);

-- Additional sample: pasta primavera ----------------------------------------
WITH existing_user AS (
  SELECT id
  FROM auth.users
  ORDER BY created_at
  LIMIT 1
),
inserted_recipe AS (
  INSERT INTO public.recipes (
    id,
    user_id,
    title,
    description,
    instructions,
    servings,
    prep_time_minutes,
    cook_time_minutes,
    is_public,
    is_generated_base,
    is_favorite
  )
  SELECT
    gen_random_uuid(),
    existing_user.id,
    'Pasta Primavera Rápida',
    'Pasta con vegetales salteados y salsa ligera.',
    '1. Cocinar la pasta. 2. Saltear vegetales. 3. Mezclar y servir.',
    4,
    10,
    12,
    true,
    false,
    false
  FROM existing_user
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.recipes
    WHERE title = 'Pasta Primavera Rápida'
  )
  RETURNING id, user_id
),
inserted_ingredients AS (
  INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, unit)
  SELECT inserted_recipe.id, ingredient_name, quantity, unit
  FROM inserted_recipe
  JOIN (
    VALUES
      ('Pasta corta', 320::numeric, 'g'),
      ('Pimiento rojo', 1::numeric, 'unit'),
      ('Calabacín', 1::numeric, 'unit'),
      ('Aceite de oliva', 30::numeric, 'ml'),
      ('Ajo', 2::numeric, 'unit')
  ) AS seed_items(ingredient_name, quantity, unit) ON TRUE
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.recipe_ingredients ri
    WHERE ri.recipe_id = inserted_recipe.id
  )
  RETURNING 1
)
SELECT 'Inserted pasta primavera recipe' AS message
WHERE EXISTS (SELECT 1 FROM inserted_recipe);
