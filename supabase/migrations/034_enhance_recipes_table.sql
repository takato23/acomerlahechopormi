-- Migración para mejorar la tabla de recetas con campos adicionales
-- Referencias: recipe_generation_enhancement_plan.md

-- Añadir nuevas columnas a la tabla recipes
ALTER TABLE public.recipes
ADD COLUMN IF NOT EXISTS cooking_methods TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS difficulty_level complexity_level DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS cuisine_type TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS estimated_time INTEGER, -- Tiempo total estimado en minutos
ADD COLUMN IF NOT EXISTS nutritional_info JSONB DEFAULT '{}', -- Información nutricional básica
ADD COLUMN IF NOT EXISTS seasonal_flags TEXT[] DEFAULT '{}', -- Temporadas recomendadas
ADD COLUMN IF NOT EXISTS equipment_needed TEXT[] DEFAULT '{}'; -- Equipamiento necesario

-- Crear índices para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_recipes_cooking_methods 
ON recipes USING GIN (cooking_methods);

CREATE INDEX IF NOT EXISTS idx_recipes_cuisine_type 
ON recipes USING GIN (cuisine_type);

CREATE INDEX IF NOT EXISTS idx_recipes_difficulty 
ON recipes(difficulty_level);

CREATE INDEX IF NOT EXISTS idx_recipes_estimated_time 
ON recipes(estimated_time);

CREATE INDEX IF NOT EXISTS idx_recipes_seasonal 
ON recipes USING GIN (seasonal_flags);

-- Añadir restricciones y validaciones
ALTER TABLE public.recipes
ADD CONSTRAINT valid_estimated_time 
CHECK (estimated_time IS NULL OR estimated_time > 0);

-- Función para validar tipos de cocina válidos
CREATE OR REPLACE FUNCTION validate_cuisine_type()
RETURNS TRIGGER AS $$
DECLARE
    valid_types TEXT[] := ARRAY[
        'italiana', 'mexicana', 'china', 'japonesa', 'tailandesa',
        'india', 'mediterránea', 'francesa', 'española', 'americana',
        'argentina', 'peruana', 'brasileña', 'vegetariana', 'vegana',
        'sin_gluten', 'fusión'
    ];
    cuisine TEXT;
BEGIN
    IF NEW.cuisine_type IS NOT NULL THEN
        FOREACH cuisine IN ARRAY NEW.cuisine_type
        LOOP
            IF NOT cuisine = ANY(valid_types) THEN
                RAISE EXCEPTION 'Tipo de cocina inválido: %', cuisine;
            END IF;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_cuisine_type
    BEFORE INSERT OR UPDATE ON recipes
    FOR EACH ROW
    EXECUTE FUNCTION validate_cuisine_type();

-- Función para validar métodos de cocción válidos
CREATE OR REPLACE FUNCTION validate_cooking_methods()
RETURNS TRIGGER AS $$
DECLARE
    valid_methods TEXT[] := ARRAY[
        'hornear', 'freír', 'hervir', 'asar', 'saltear',
        'vapor', 'microondas', 'presión', 'grill', 'slow_cooker',
        'sin_cocción', 'aire_caliente'
    ];
    method TEXT;
BEGIN
    IF NEW.cooking_methods IS NOT NULL THEN
        FOREACH method IN ARRAY NEW.cooking_methods
        LOOP
            IF NOT method = ANY(valid_methods) THEN
                RAISE EXCEPTION 'Método de cocción inválido: %', method;
            END IF;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_cooking_methods
    BEFORE INSERT OR UPDATE ON recipes
    FOR EACH ROW
    EXECUTE FUNCTION validate_cooking_methods();

-- Comentarios para documentación
COMMENT ON COLUMN recipes.cooking_methods IS 'Métodos de cocción utilizados en la receta';
COMMENT ON COLUMN recipes.difficulty_level IS 'Nivel de dificultad de la receta';
COMMENT ON COLUMN recipes.cuisine_type IS 'Tipos de cocina a los que pertenece la receta';
COMMENT ON COLUMN recipes.estimated_time IS 'Tiempo total estimado en minutos (prep + cocción)';
COMMENT ON COLUMN recipes.nutritional_info IS 'Información nutricional básica en formato JSONB';
COMMENT ON COLUMN recipes.seasonal_flags IS 'Temporadas en las que la receta es más apropiada';
COMMENT ON COLUMN recipes.equipment_needed IS 'Equipamiento de cocina necesario';

-- Función de utilidad para buscar recetas por criterios
CREATE OR REPLACE FUNCTION find_recipes_by_criteria(
    p_difficulty complexity_level DEFAULT NULL,
    p_max_time INTEGER DEFAULT NULL,
    p_cuisine_types TEXT[] DEFAULT NULL,
    p_cooking_methods TEXT[] DEFAULT NULL,
    p_seasonal_flag TEXT DEFAULT NULL
)
RETURNS SETOF recipes AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM recipes
    WHERE (p_difficulty IS NULL OR difficulty_level = p_difficulty)
    AND (p_max_time IS NULL OR estimated_time <= p_max_time)
    AND (p_cuisine_types IS NULL OR cuisine_type && p_cuisine_types)
    AND (p_cooking_methods IS NULL OR cooking_methods && p_cooking_methods)
    AND (p_seasonal_flag IS NULL OR seasonal_flags @> ARRAY[p_seasonal_flag]);
END;
$$ LANGUAGE plpgsql;

-- Ejemplo de uso:
-- SELECT * FROM find_recipes_by_criteria(
--     p_difficulty := 'simple',
--     p_max_time := 30,
--     p_cuisine_types := ARRAY['italiana', 'mediterránea'],
--     p_cooking_methods := ARRAY['hornear'],
--     p_seasonal_flag := 'verano'
-- );