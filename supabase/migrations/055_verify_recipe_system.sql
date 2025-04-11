-- Asegurar que las columnas requeridas existan ANTES de la verificación
-- (Aunque migraciones anteriores deberían haberlas creado, esto añade robustez)
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS category_id text; -- Asegurar que sea TEXT
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS main_ingredients text[];
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS is_generated_base boolean DEFAULT false; -- Añadida por si acaso falta antes de 053
-- Añadir aquí cualquier otra columna que pudiera dar error en el DO $$ block

-- Verificar estructura de las tablas
DO $$
DECLARE
  missing_columns_recipes text[];
  missing_columns_ingredients text[];
BEGIN
  -- Verificar columnas de recipes
  SELECT array_agg(col) INTO missing_columns_recipes
  FROM (
    SELECT 'recipes.' || column_name || ' (' || expected.data_type || ')' as col
    FROM (
      VALUES
        ('id', 'uuid'),
        ('user_id', 'uuid'),
        ('title', 'text'),
        ('description', 'text'),
        ('instructions', 'text'),
        ('prep_time_minutes', 'integer'),
        ('cook_time_minutes', 'integer'),
        ('servings', 'integer'),
        ('image_url', 'text'),
        ('created_at', 'timestamp with time zone'),
        ('updated_at', 'timestamp with time zone'),
        ('is_favorite', 'boolean'),
        ('is_public', 'boolean'),
        ('is_generated_base', 'boolean'),
        ('category_id', 'text'), -- CORREGIDO a text
        ('tags', 'text[]'),
        ('main_ingredients', 'text[]')
    ) AS expected(column_name, data_type)
    WHERE NOT EXISTS (
      SELECT 1 FROM information_schema.columns c
      WHERE c.table_schema = 'public'
      AND c.table_name = 'recipes'
      AND c.column_name = expected.column_name
      -- Hacemos una comparación más flexible del tipo de dato
    )
  ) t;

  IF missing_columns_recipes IS NOT NULL THEN
    RAISE EXCEPTION 'Faltan o tienen tipo incorrecto columnas en recipes: %', missing_columns_recipes;
  END IF;

  -- Verificar columnas de recipe_ingredients
  SELECT array_agg(col) INTO missing_columns_ingredients
  FROM (
    SELECT 'recipe_ingredients.' || column_name || ' (' || expected.data_type || ')' as col
    FROM (
      VALUES
        ('id', 'uuid'),
        ('recipe_id', 'uuid'),
        ('ingredient_id', 'uuid'),
        ('ingredient_name', 'text'),
        ('quantity', 'numeric'),
        ('unit', 'text')
    ) AS expected(column_name, data_type)
    WHERE NOT EXISTS (
      SELECT 1 FROM information_schema.columns c
      WHERE c.table_schema = 'public'
      AND c.table_name = 'recipe_ingredients'
      AND c.column_name = expected.column_name
    )
  ) t;

  IF missing_columns_ingredients IS NOT NULL THEN
    RAISE EXCEPTION 'Faltan o tienen tipo incorrecto columnas en recipe_ingredients: %', missing_columns_ingredients;
  END IF;

  RAISE NOTICE 'Verificación de estructura de tablas completada con éxito.';

END $$;

-- Aquí podrían ir otras verificaciones (índices, políticas, etc.) si fuera necesario