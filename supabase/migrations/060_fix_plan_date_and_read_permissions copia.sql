    -- Renombrar columna en meal_plan_entries
    ALTER TABLE public.meal_plan_entries
    RENAME COLUMN entry_date TO plan_date;

    COMMENT ON COLUMN public.meal_plan_entries.plan_date IS 'Date for which the meal is planned (renamed from entry_date).';

    -- Otorgar permisos SELECT en tablas relacionadas al rol authenticated

    -- Para ingredients
    ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY; -- Asegurar RLS (ya debería estar)
    ALTER TABLE public.ingredients FORCE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Allow authenticated read access" ON public.ingredients; -- Eliminar si existe una política con este nombre
    CREATE POLICY "Allow authenticated read access" ON public.ingredients
      FOR SELECT
      USING (true); -- Permite SELECT si tiene GRANT
    GRANT SELECT ON TABLE public.ingredients TO authenticated;

    -- Para categories
    ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY; -- Asegurar RLS (ya debería estar)
    ALTER TABLE public.categories FORCE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Allow authenticated read access" ON public.categories; -- Eliminar si existe una política con este nombre
    CREATE POLICY "Allow authenticated read access" ON public.categories
      FOR SELECT
      USING (true); -- Permite SELECT si tiene GRANT
    GRANT SELECT ON TABLE public.categories TO authenticated;


    SELECT 'Columna plan_date renombrada y permisos SELECT otorgados a ingredients y categories.';