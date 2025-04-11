    -- Añadir la columna custom_meal_name a meal_plan_entries si no existe

    ALTER TABLE public.meal_plan_entries
    ADD COLUMN IF NOT EXISTS custom_meal_name TEXT NULL;

    COMMENT ON COLUMN public.meal_plan_entries.custom_meal_name IS 'Optional custom name for a meal plan entry if no recipe is linked.';

    SELECT 'Columna custom_meal_name añadida a meal_plan_entries.';