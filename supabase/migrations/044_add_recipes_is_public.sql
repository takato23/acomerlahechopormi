-- Asegurar que la columna is_public exista (aunque 043 ya lo hace, lo dejamos por idempotencia)
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE NOT NULL;

-- Actualizar recetas existentes donde is_public podría ser NULL (seguro aunque no debería pasar ahora)
UPDATE public.recipes SET is_public = false WHERE is_public IS NULL;

-- Asegurar que las políticas de RLS estén actualizadas
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen (para asegurar limpieza)
DROP POLICY IF EXISTS "Users can view their own recipes" ON public.recipes;
DROP POLICY IF EXISTS "Users can manage their own recipes" ON public.recipes;
DROP POLICY IF EXISTS "Users can view public recipes" ON public.recipes;
DROP POLICY IF EXISTS "Users can view recipes" ON public.recipes; -- Añadido por si acaso esta también

-- Crear nuevas políticas
CREATE POLICY "Users can view recipes"
ON public.recipes
FOR SELECT
USING (
  auth.uid() = user_id  -- Propias
  OR is_public = true   -- Públicas
  OR EXISTS (           -- En planes de comida
    SELECT 1
    FROM public.meal_plan_entries
    WHERE meal_plan_entries.recipe_id = recipes.id
    AND meal_plan_entries.user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage their own recipes"
ON public.recipes
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Crear índice SI NO EXISTE (Ahora fuera del DO y antes del COMMENT)
CREATE INDEX IF NOT EXISTS idx_recipes_is_public ON public.recipes (is_public);

-- Comentarios para documentación (Ahora debería encontrar el índice)
COMMENT ON COLUMN public.recipes.is_public IS 'Indica si la receta es visible públicamente';
COMMENT ON INDEX public.idx_recipes_is_public IS 'Índice para optimizar consultas por estado público/privado';

-- Trigger para mantener la consistencia de permisos
CREATE OR REPLACE FUNCTION check_recipe_permissions()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ensure_recipe_permissions ON public.recipes;
CREATE TRIGGER ensure_recipe_permissions
  BEFORE INSERT OR UPDATE ON public.recipes
  FOR EACH ROW
  EXECUTE FUNCTION check_recipe_permissions();