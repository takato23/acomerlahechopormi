    -- Otorgar permiso SELECT en variety_metrics y recipe_history al rol authenticated

    -- Para variety_metrics
    ALTER TABLE public.variety_metrics ENABLE ROW LEVEL SECURITY; -- Asegurar RLS (ya debería estar por 045)
    ALTER TABLE public.variety_metrics FORCE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Allow users to access their own variety metrics" ON public.variety_metrics; -- De 045
    CREATE POLICY "Allow users to read their own variety metrics" ON public.variety_metrics
      FOR SELECT
      USING (auth.uid() = user_id);
    GRANT SELECT ON TABLE public.variety_metrics TO authenticated;

    -- Para recipe_history
    ALTER TABLE public.recipe_history ENABLE ROW LEVEL SECURITY; -- Asegurar RLS (ya debería estar por 046)
    ALTER TABLE public.recipe_history FORCE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Allow users to access their own recipe history" ON public.recipe_history; -- De 046
    CREATE POLICY "Allow users to read their own recipe history" ON public.recipe_history
      FOR SELECT
      USING (auth.uid() = user_id);
    GRANT SELECT ON TABLE public.recipe_history TO authenticated;


    SELECT 'Permiso SELECT otorgado a variety_metrics y recipe_history para authenticated.';