-- Migración para añadir campos mejorados de preferencias de usuario
-- Referencias: recipe_generation_enhancement_plan.md

-- Crear tipos ENUM
DO $$ BEGIN
    CREATE TYPE complexity_level AS ENUM ('simple', 'medium', 'complex');
    CREATE TYPE meal_type AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Añadir nuevas columnas a profiles con arrays y ENUMs
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS cuisine_preferences TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS disliked_ingredients TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS complexity_preference complexity_level DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS preferred_meal_times JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS dietary_restrictions TEXT[] DEFAULT '{}';

-- Comentarios para documentación
COMMENT ON COLUMN profiles.cuisine_preferences IS 'Array de tipos de cocina preferidos por el usuario';
COMMENT ON COLUMN profiles.disliked_ingredients IS 'Array de ingredientes que el usuario prefiere evitar';
COMMENT ON COLUMN profiles.complexity_preference IS 'Nivel de complejidad preferido para las recetas';
COMMENT ON COLUMN profiles.preferred_meal_times IS 'Horarios preferidos para cada tipo de comida en formato JSONB';
COMMENT ON COLUMN profiles.dietary_restrictions IS 'Array de restricciones dietéticas';

-- Convertir columnas existentes a nuevos tipos si es necesario
DO $$ BEGIN
    -- Convertir dietary_preference existente a array si tiene datos
    UPDATE public.profiles 
    SET dietary_restrictions = ARRAY[dietary_preference]
    WHERE dietary_preference IS NOT NULL;
    
    -- Convertir allergies_restrictions existente a array si tiene datos
    UPDATE public.profiles 
    SET dietary_restrictions = 
        CASE 
            WHEN dietary_restrictions IS NULL THEN ARRAY[allergies_restrictions]
            ELSE array_append(dietary_restrictions, allergies_restrictions)
        END
    WHERE allergies_restrictions IS NOT NULL;
END $$;

-- Eliminar columnas antiguas que ya no necesitamos
ALTER TABLE public.profiles
DROP COLUMN IF EXISTS dietary_preference,
DROP COLUMN IF EXISTS allergies_restrictions;

-- Crear índices para búsqueda eficiente
CREATE INDEX IF NOT EXISTS idx_profiles_cuisine_prefs ON public.profiles USING GIN (cuisine_preferences);
CREATE INDEX IF NOT EXISTS idx_profiles_disliked_ingredients ON public.profiles USING GIN (disliked_ingredients);
CREATE INDEX IF NOT EXISTS idx_profiles_dietary_restrictions ON public.profiles USING GIN (dietary_restrictions);
CREATE INDEX IF NOT EXISTS idx_profiles_complexity ON public.profiles (complexity_preference);