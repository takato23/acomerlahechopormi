-- Migración para añadir el campo is_public a la tabla recipes
-- Ejecutar en consola SQL de Supabase o via psql

-- Verifica si la columna ya existe, y si no, la añade
DO $$ 
BEGIN
    -- Comprobar si la columna existe
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'recipes' 
        AND column_name = 'is_public'
    ) THEN
        -- Añadir la columna con valor predeterminado false
        EXECUTE 'ALTER TABLE recipes ADD COLUMN is_public BOOLEAN DEFAULT FALSE;';
        
        -- Opcional: Actualizar las recetas existentes (puedes personalizar según necesidades)
        -- EXECUTE 'UPDATE recipes SET is_public = FALSE;';
    END IF;
END $$; 