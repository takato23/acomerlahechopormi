-- Función para verificar el estado completo del sistema
CREATE OR REPLACE FUNCTION verify_recipe_system_state()
RETURNS TABLE (
  check_name text,
  status text,
  details jsonb
) AS $$
DECLARE
  v_recipes_count integer;
  v_ingredients_count integer;
  v_missing_fields text[];
BEGIN
  -- 1. Verificar estructura de datos
  check_name := 'Estructura de Tablas';
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name IN ('recipes', 'recipe_ingredients')
  ) THEN
    status := 'OK';
    details := jsonb_build_object(
      'tables_present', ARRAY['recipes', 'recipe_ingredients']
    );
  ELSE
    status := 'ERROR';
    details := jsonb_build_object(
      'message', 'Faltan tablas principales'
    );
  END IF;
  RETURN NEXT;

  -- 2. Verificar políticas RLS
  check_name := 'Políticas RLS';
  WITH required_policies AS (
    SELECT unnest(ARRAY[
      'Enable read access for authenticated users',
      'Enable insert access for authenticated users',
      'Enable update access for users based on user_id',
      'Enable delete access for users based on user_id'
    ]) AS policy_name
  )
  SELECT array_agg(rp.policy_name)
  INTO v_missing_fields
  FROM required_policies rp
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'recipes'
    AND policyname = rp.policy_name
  );

  IF v_missing_fields IS NULL THEN
    status := 'OK';
    details := jsonb_build_object(
      'policies_count', (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'recipes')
    );
  ELSE
    status := 'ERROR';
    details := jsonb_build_object(
      'missing_policies', v_missing_fields
    );
  END IF;
  RETURN NEXT;

  -- 3. Verificar índices
  check_name := 'Índices';
  WITH required_indexes AS (
    SELECT unnest(ARRAY[
      'idx_recipes_user_id',
      'idx_recipes_is_public',
      'idx_recipes_title',
      'idx_recipes_tags',
      'idx_recipe_ingredients_recipe_id',
      'idx_recipe_ingredients_ingredient_id'
    ]) AS index_name
  )
  SELECT array_agg(ri.index_name)
  INTO v_missing_fields
  FROM required_indexes ri
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = ri.index_name
  );

  IF v_missing_fields IS NULL THEN
    status := 'OK';
    details := jsonb_build_object(
      'indexes_present', true
    );
  ELSE
    status := 'ERROR';
    details := jsonb_build_object(
      'missing_indexes', v_missing_fields
    );
  END IF;
  RETURN NEXT;

  -- 4. Verificar triggers
  check_name := 'Triggers';
  IF EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'ensure_recipe_integrity'
  ) THEN
    status := 'OK';
    details := jsonb_build_object(
      'trigger_present', true
    );
  ELSE
    status := 'ERROR';
    details := jsonb_build_object(
      'message', 'Falta trigger de integridad'
    );
  END IF;
  RETURN NEXT;

  -- 5. Verificar backup
  check_name := 'Punto de Retorno';
  IF EXISTS (
    SELECT 1 FROM migration_history WHERE version = '056'
  ) THEN
    status := 'OK';
    details := jsonb_build_object(
      'backup_available', true,
      'created_at', (SELECT created_at FROM migration_history WHERE version = '056')
    );
  ELSE
    status := 'WARNING';
    details := jsonb_build_object(
      'message', 'No se encontró punto de retorno'
    );
  END IF;
  RETURN NEXT;

  -- 6. Verificar integridad de datos
  check_name := 'Integridad de Datos';
  SELECT COUNT(*) INTO v_recipes_count FROM recipes;
  SELECT COUNT(*) INTO v_ingredients_count FROM recipe_ingredients;

  WITH invalid_data AS (
    SELECT 
      COUNT(*) FILTER (WHERE title IS NULL) as null_titles,
      COUNT(*) FILTER (WHERE user_id IS NULL) as null_users,
      COUNT(*) FILTER (WHERE tags IS NULL) as null_tags,
      COUNT(*) FILTER (WHERE main_ingredients IS NULL) as null_ingredients
    FROM recipes
  )
  SELECT 
    CASE 
      WHEN (SELECT null_titles + null_users + null_tags + null_ingredients FROM invalid_data) = 0
      THEN 'OK'
      ELSE 'ERROR'
    END,
    jsonb_build_object(
      'total_recipes', v_recipes_count,
      'total_ingredients', v_ingredients_count,
      'invalid_data', (SELECT row_to_json(invalid_data) FROM invalid_data)
    )
  INTO status, details;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Ejecutar verificación
SELECT * FROM verify_recipe_system_state();

-- Mostrar resumen
WITH verification_results AS (
  SELECT * FROM verify_recipe_system_state()
)
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM verification_results WHERE status = 'ERROR')
    THEN 'Sistema requiere atención'
    WHEN EXISTS (SELECT 1 FROM verification_results WHERE status = 'WARNING')
    THEN 'Sistema funcional con advertencias'
    ELSE 'Sistema completamente funcional'
  END as overall_status,
  COUNT(*) FILTER (WHERE status = 'OK') as passed_checks,
  COUNT(*) FILTER (WHERE status = 'WARNING') as warnings,
  COUNT(*) FILTER (WHERE status = 'ERROR') as errors,
  jsonb_object_agg(check_name, details) FILTER (WHERE status != 'OK') as issues_found
FROM verification_results;