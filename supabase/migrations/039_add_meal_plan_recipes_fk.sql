-- Agregar restricción de clave foránea entre meal_plan_entries y recipes
ALTER TABLE meal_plan_entries
ADD CONSTRAINT fk_meal_plan_recipes
FOREIGN KEY (recipe_id)
REFERENCES recipes(id)
ON DELETE SET NULL;

COMMENT ON CONSTRAINT fk_meal_plan_recipes ON meal_plan_entries IS 'Relación entre planificación de comidas y recetas';

-- Actualizar el RLS para permitir el acceso a las recetas a través de meal_plan_entries
CREATE POLICY "Users can view their meal plan recipes"
ON recipes FOR SELECT
USING (
    auth.uid() IN (
        SELECT DISTINCT user_id
        FROM meal_plan_entries
        WHERE recipe_id = id
    )
    OR auth.uid() = user_id
    OR user_id IS NULL
);