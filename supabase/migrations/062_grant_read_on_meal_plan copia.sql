    -- Otorgar permiso SELECT en meal_plan_entries al rol authenticated

    -- Asegurar RLS habilitado (ya debería estar por 038)
    ALTER TABLE public.meal_plan_entries ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.meal_plan_entries FORCE ROW LEVEL SECURITY;

    -- Reafirmar la política SELECT (basada en la que creamos en 038, pero solo para SELECT)
    DROP POLICY IF EXISTS "Allow users to access their own meal plan entries" ON public.meal_plan_entries;
    DROP POLICY IF EXISTS "Allow users to manage their own meal plan entries" ON public.meal_plan_entries; -- Nombre de 038
    CREATE POLICY "Allow users to read their own meal plan entries" ON public.meal_plan_entries
      FOR SELECT
      USING (auth.uid() = user_id);

    -- Otorgar permiso SELECT explícito
    GRANT SELECT ON TABLE public.meal_plan_entries TO authenticated;

    SELECT 'Permiso SELECT otorgado a meal_plan_entries para authenticated.';