DROP FUNCTION IF EXISTS create_recipe_with_ingredients CASCADE;

CREATE OR REPLACE FUNCTION create_recipe_with_ingredients(
  recipe_title TEXT,
  recipe_description TEXT,
  recipe_instructions TEXT[],
  recipe_prep_time INTEGER,
  recipe_cook_time INTEGER,
  recipe_servings INTEGER,
  recipe_image_url TEXT,
  recipe_tags TEXT[],
  recipe_ingredients JSON[]
) RETURNS JSON AS $$
DECLARE
  new_recipe_id UUID;
  ingredient_data JSON;
  ingredient_name TEXT;
  ingredient_quantity TEXT;
  ingredient_quantity_numeric NUMERIC;
  ingredient_unit TEXT;
  existing_ingredient_id UUID;
  recipe_result JSON;
BEGIN
  -- Insertar la receta primero
  INSERT INTO recipes (
    title,
    description,
    instructions,
    prep_time_minutes,
    cook_time_minutes,
    servings,
    image_url,
    tags,
    user_id
  ) VALUES (
    recipe_title,
    recipe_description,
    recipe_instructions,
    recipe_prep_time,
    recipe_cook_time,
    recipe_servings,
    recipe_image_url,
    recipe_tags,
    auth.uid()
  ) RETURNING id INTO new_recipe_id;

  -- Procesar cada ingrediente
  FOREACH ingredient_data IN ARRAY recipe_ingredients
  LOOP
    -- Extraer los datos del ingrediente del JSON
    ingredient_name := ingredient_data->>'name';
    ingredient_quantity := ingredient_data->>'quantity';
    ingredient_unit := ingredient_data->>'unit';

    -- Buscar si el ingrediente ya existe (sin user_id)
    SELECT id INTO existing_ingredient_id
    FROM ingredients
    WHERE name = ingredient_name
    LIMIT 1;

    -- Si no existe, crear el ingrediente (sin user_id)
    IF existing_ingredient_id IS NULL THEN
      INSERT INTO ingredients (name)
      VALUES (ingredient_name)
      RETURNING id INTO existing_ingredient_id;
    END IF;

    -- Convertir ingredient_quantity a numérico
    BEGIN
      -- Intentar convertir a numérico
      ingredient_quantity_numeric := ingredient_quantity::NUMERIC;
    EXCEPTION WHEN OTHERS THEN
      -- Si falla, usar NULL
      ingredient_quantity_numeric := NULL;
    END;

    -- Relacionar el ingrediente con la receta
    INSERT INTO recipe_ingredients (
      recipe_id,
      ingredient_id,
      quantity,
      unit
    ) VALUES (
      new_recipe_id,
      existing_ingredient_id,
      ingredient_quantity_numeric,
      ingredient_unit
    );
  END LOOP;

  -- Devolver información sobre la receta creada
  SELECT json_build_object(
    'id', id,
    'title', title,
    'created_at', created_at
  ) INTO recipe_result
  FROM recipes
  WHERE id = new_recipe_id;

  RETURN recipe_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
