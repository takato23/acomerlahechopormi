   -- Otorgar permisos de escritura en meal_plan_entries al rol authenticated

   -- Para meal_plan_entries: Completar los permisos de escritura
   -- Usamos FOR ALL para simplificar, ya que ya creamos la política para SELECT en 062
   DROP POLICY IF EXISTS "Allow users to read their own meal plan entries" ON public.meal_plan_entries;
   CREATE POLICY "Allow users to manage their own meal plan entries" ON public.meal_plan_entries
     FOR ALL -- Esto incluye SELECT, INSERT, UPDATE, DELETE
     USING (auth.uid() = user_id)
     WITH CHECK (auth.uid() = user_id);

   -- Otorgar permisos completos
   GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.meal_plan_entries TO authenticated;

   SELECT 'Permisos de escritura otorgados a meal_plan_entries para authenticated.';