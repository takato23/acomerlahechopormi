    -- Otorgar permiso SELECT en recipe_ingredients al rol authenticated

    -- Asegurar RLS habilitado (ya debería estar por 011)
    ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.recipe_ingredients FORCE ROW LEVEL SECURITY;

    -- Eliminar políticas SELECT antiguas/conflictivas (de 011, 047, 048)
    DROP POLICY IF EXISTS "Allow users to select ingredients for their own recipes" ON public.recipe_ingredients;
    DROP POLICY IF EXISTS "recipe_ingredients_select_policy" ON public.recipe_ingredients;
    DROP POLICY IF EXISTS "Enable read access for recipe ingredients" ON public.recipe_ingredients;
    -- Añadir aquí otros nombres de políticas SELECT que puedan existir

    -- Recrear política SELECT correcta (basada en la de 048, permite leer ingredientes de recetas visibles)
    CREATE POLICY "Allow users to read ingredients of visible recipes" ON public.recipe_ingredients
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.recipes r
          WHERE r.id = recipe_ingredients.recipe_id
          AND ( -- El usuario puede ver la receta padre si:
            r.user_id = auth.uid() -- Es suya
            OR r.is_public = true -- O es pública
          )
        )
      );

    -- Otorgar permiso SELECT explícito
    GRANT SELECT ON TABLE public.recipe_ingredients TO authenticated;

    SELECT 'Permiso SELECT otorgado a recipe_ingredients para authenticated.';