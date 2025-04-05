-- Añadir columna para marcar recetas base generadas por IA
ALTER TABLE public.recipes
ADD COLUMN is_generated_base BOOLEAN DEFAULT FALSE;

-- Hacer user_id opcional para permitir recetas base sin usuario asociado
-- Asegúrate de que no haya constraints o FKs que impidan esto,
-- o ajústalos según sea necesario.
ALTER TABLE public.recipes
ALTER COLUMN user_id DROP NOT NULL; 

-- Opcional: Crear índice para búsquedas eficientes en recetas base
-- Este índice ayuda a encontrar rápidamente las recetas marcadas como base.
CREATE INDEX idx_recipes_generated_base ON public.recipes (is_generated_base) WHERE is_generated_base = TRUE;

-- Comentario: Considerar si se necesita un índice similar para user_id si se hacen muchas búsquedas combinadas
-- CREATE INDEX idx_recipes_user_id ON public.recipes (user_id) WHERE user_id IS NOT NULL;