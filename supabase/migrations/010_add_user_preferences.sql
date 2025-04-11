-- Agregar columnas de preferencias de usuario a la tabla profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS dietary_preference TEXT NULL,
ADD COLUMN IF NOT EXISTS difficulty_preference TEXT NULL,
ADD COLUMN IF NOT EXISTS max_prep_time INTEGER NULL,
ADD COLUMN IF NOT EXISTS allergies_restrictions TEXT NULL;

-- Comentarios para documentar las columnas
COMMENT ON COLUMN public.profiles.dietary_preference IS 'Preferencia dietética del usuario (e.g., vegetariano, vegano, etc.)';
COMMENT ON COLUMN public.profiles.difficulty_preference IS 'Preferencia de dificultad para recetas';
COMMENT ON COLUMN public.profiles.max_prep_time IS 'Tiempo máximo de preparación preferido (en minutos)';
COMMENT ON COLUMN public.profiles.allergies_restrictions IS 'Alergias y restricciones alimentarias del usuario';