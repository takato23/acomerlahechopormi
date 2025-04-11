-- Guardar punto de retorno
CREATE OR REPLACE FUNCTION save_recipes_state() 
RETURNS void AS $$
BEGIN
  -- Crear tablas de respaldo si no existen
  CREATE TABLE IF NOT EXISTS recipes_backup_056 (LIKE recipes INCLUDING ALL);
  CREATE TABLE IF NOT EXISTS recipe_ingredients_backup_056 (LIKE recipe_ingredients INCLUDING ALL);
  
  -- Guardar datos actuales
  INSERT INTO recipes_backup_056 
  SELECT * FROM recipes;
  
  INSERT INTO recipe_ingredients_backup_056 
  SELECT * FROM recipe_ingredients;
  
  -- Registrar el backup
  INSERT INTO migration_history (version, description, restored)
  VALUES ('056', 'Recipe system backup', false);
END;
$$ LANGUAGE plpgsql;

-- Función para restaurar desde el punto de retorno
CREATE OR REPLACE FUNCTION restore_recipes_state() 
RETURNS void AS $$
BEGIN
  -- Verificar si existe backup
  IF NOT EXISTS (SELECT 1 FROM migration_history WHERE version = '056') THEN
    RAISE EXCEPTION 'No se encontró punto de retorno para las recetas';
  END IF;

  -- Restaurar datos
  TRUNCATE TABLE recipes;
  INSERT INTO recipes 
  SELECT * FROM recipes_backup_056;
  
  TRUNCATE TABLE recipe_ingredients;
  INSERT INTO recipe_ingredients 
  SELECT * FROM recipe_ingredients_backup_056;
  
  -- Registrar la restauración
  UPDATE migration_history 
  SET restored = true, 
      restored_at = CURRENT_TIMESTAMP 
  WHERE version = '056';
  
  RAISE NOTICE 'Sistema de recetas restaurado al punto 056';
END;
$$ LANGUAGE plpgsql;

-- Crear tabla de historial si no existe
CREATE TABLE IF NOT EXISTS migration_history (
  id SERIAL PRIMARY KEY,
  version TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  restored BOOLEAN DEFAULT false,
  restored_at TIMESTAMP WITH TIME ZONE
);

-- Generar el punto de retorno
SELECT save_recipes_state();

-- Verificar el estado del sistema
SELECT 
  'Backup completado' as status,
  (SELECT COUNT(*) FROM recipes) as total_recipes,
  (SELECT COUNT(*) FROM recipe_ingredients) as total_ingredients,
  version,
  created_at
FROM migration_history 
WHERE version = '056';

-- Instrucciones para restaurar:
/*
Para restaurar el sistema a este punto:

1. Ejecutar:
   SELECT restore_recipes_state();

2. Verificar la restauración:
   SELECT version, restored, restored_at 
   FROM migration_history 
   WHERE version = '056';

3. Si necesitas eliminar el punto de retorno:
   DROP TABLE IF EXISTS recipes_backup_056;
   DROP TABLE IF EXISTS recipe_ingredients_backup_056;
   DELETE FROM migration_history WHERE version = '056';
*/