-- Limpiar todas las políticas existentes
DROP POLICY IF EXISTS "Users can view recipes" ON public.recipes;
DROP POLICY IF EXISTS "Users can manage their own recipes" ON public.recipes;
DROP POLICY IF EXISTS "Enable read for own recipes" ON public.recipes;
DROP POLICY IF EXISTS "Enable read for public recipes" ON public.recipes;
DROP POLICY IF EXISTS "Basic read policy" ON public.recipes;
DROP POLICY IF EXISTS "Basic write policy" ON public.recipes;

-- Asegurar que RLS está habilitado
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

-- Crear política de lectura simple usando CASE
CREATE POLICY "recipes_read_policy"
ON public.recipes
FOR SELECT
USING (
  CASE 
    WHEN auth.uid() = user_id THEN true
    WHEN is_public = true THEN true
    ELSE false
  END
);

-- Política de escritura simple
CREATE POLICY "recipes_write_policy"
ON public.recipes
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Actualizar recetas existentes para asegurar valores consistentes
UPDATE public.recipes 
SET is_public = COALESCE(is_public, false);

-- Añadir comentarios explicativos
COMMENT ON POLICY "recipes_read_policy" ON public.recipes IS 
'Permite leer recetas propias o públicas';

COMMENT ON POLICY "recipes_write_policy" ON public.recipes IS 
'Permite modificar solo las recetas propias';