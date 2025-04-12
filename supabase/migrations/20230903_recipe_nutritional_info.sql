-- Migración para añadir información nutricional y de origen a las recetas
-- Añadir campos para información nutricional en la tabla recipes
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS nutritional_info JSONB;

-- Añadir campos para seguimiento de origen de la receta
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS source_api VARCHAR(50);
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS source_id VARCHAR(100);

-- Añadir campo para marcar recetas compartidas (generadas o importadas para compartir)
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT FALSE;

-- Crear índice para buscar recetas compartidas
CREATE INDEX IF NOT EXISTS idx_recipes_is_shared ON recipes(is_shared);

-- Crear índice para búsqueda por origen
CREATE INDEX IF NOT EXISTS idx_recipes_source ON recipes(source_api, source_id); 