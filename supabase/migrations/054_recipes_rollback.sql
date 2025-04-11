-- Función para hacer rollback si algo falla
CREATE OR REPLACE FUNCTION rollback_recipe_changes() 
RETURNS void AS $$
BEGIN
  -- Guardar datos antiguos en una tabla temporal
  CREATE TEMP TABLE IF NOT EXISTS recipes_backup AS 
  SELECT * FROM recipes;
  
  CREATE TEMP TABLE IF NOT EXISTS recipe_ingredients_backup AS 
  SELECT * FROM recipe_ingredients;

  -- Si algo falla, restaurar desde el backup
  IF EXISTS (
    SELECT 1 FROM recipes 
    WHERE tags IS NULL 
    OR main_ingredients IS NULL 
    OR is_favorite IS NULL 
    OR is_public IS NULL
  ) THEN
    -- Restaurar datos
    TRUNCATE TABLE recipes;
    INSERT INTO recipes SELECT * FROM recipes_backup;
    
    TRUNCATE TABLE recipe_ingredients;
    INSERT INTO recipe_ingredients SELECT * FROM recipe_ingredients_backup;
    
    RAISE NOTICE 'Se realizó rollback debido a datos inválidos';
  END IF;

  -- Limpiar tablas temporales
  DROP TABLE IF EXISTS recipes_backup;
  DROP TABLE IF EXISTS recipe_ingredients_backup;
END;
$$ LANGUAGE plpgsql;

-- Crear un trigger para verificar integridad después de cada operación
CREATE OR REPLACE FUNCTION verify_recipe_integrity()
RETURNS trigger AS $$
BEGIN
  -- Verificar campos requeridos
  IF NEW.title IS NULL OR NEW.user_id IS NULL THEN
    RAISE EXCEPTION 'title y user_id son requeridos';
  END IF;

  -- Asegurar valores por defecto
  NEW.is_favorite := COALESCE(NEW.is_favorite, false);
  NEW.is_public := COALESCE(NEW.is_public, false);
  NEW.tags := COALESCE(NEW.tags, '{}');
  NEW.main_ingredients := COALESCE(NEW.main_ingredients, '{}');
  NEW.updated_at := COALESCE(NEW.updated_at, CURRENT_TIMESTAMP);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_recipe_integrity
  BEFORE INSERT OR UPDATE ON recipes
  FOR EACH ROW
  EXECUTE FUNCTION verify_recipe_integrity();

-- Verificar estado actual
SELECT COUNT(*) as total_recipes,
       COUNT(*) FILTER (WHERE tags IS NOT NULL) as valid_tags,
       COUNT(*) FILTER (WHERE main_ingredients IS NOT NULL) as valid_main_ingredients,
       COUNT(*) FILTER (WHERE is_favorite IS NOT NULL) as valid_favorites,
       COUNT(*) FILTER (WHERE is_public IS NOT NULL) as valid_public,
       COUNT(*) FILTER (WHERE updated_at IS NOT NULL) as valid_updated
FROM recipes;

-- Ejecutar rollback si es necesario
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM recipes 
    WHERE tags IS NULL 
    OR main_ingredients IS NULL 
    OR is_favorite IS NULL 
    OR is_public IS NULL
  ) THEN
    PERFORM rollback_recipe_changes();
  END IF;
END $$;