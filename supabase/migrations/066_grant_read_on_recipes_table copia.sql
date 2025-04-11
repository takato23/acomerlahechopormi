   -- Otorgar permiso SELECT en recipes al rol authenticated

   -- Asegurar RLS habilitado (ya debería estar)
   ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.recipes FORCE ROW LEVEL SECURITY;

   -- Eliminar políticas de lectura antiguas (si existen)
   DROP POLICY IF EXISTS "Enable read access for public recipes" ON public.recipes;
   DROP POLICY IF EXISTS "Allow users to read their own recipes" ON public.recipes;
   DROP POLICY IF EXISTS "recipes_select_policy" ON public.recipes;

   -- Crear política de lectura (permitir leer recetas propias o públicas)
   CREATE POLICY "Allow users to read their own or public recipes" ON public.recipes
     FOR SELECT
     USING (
       auth.uid() = user_id  -- El usuario puede ver sus propias recetas
       OR
       is_public = true      -- O recetas marcadas como públicas
     );

   -- Otorgar permiso SELECT explícito
   GRANT SELECT ON TABLE public.recipes TO authenticated;

   SELECT 'Permiso SELECT otorgado a recipes para authenticated.';