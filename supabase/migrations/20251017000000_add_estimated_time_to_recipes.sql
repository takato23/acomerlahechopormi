-- Agregar campo estimated_time a la tabla recipes
-- Este campo faltaba y causaba errores 400 en las consultas

ALTER TABLE public.recipes
ADD COLUMN IF NOT EXISTS estimated_time integer;

-- Agregar comentario al campo
COMMENT ON COLUMN public.recipes.estimated_time IS 'Tiempo total estimado en minutos para preparar y cocinar la receta';

-- Actualizar el campo para registros existentes calculando el tiempo total
UPDATE public.recipes
SET estimated_time = COALESCE(prep_time_minutes, 0) + COALESCE(cook_time_minutes, 0)
WHERE estimated_time IS NULL;
