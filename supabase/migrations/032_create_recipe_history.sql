-- Migración para crear la tabla de historial de recetas
-- Referencias: recipe_generation_enhancement_plan.md

-- Crear tabla de historial de recetas
CREATE TABLE IF NOT EXISTS public.recipe_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    planned_date TIMESTAMP WITH TIME ZONE NOT NULL,
    meal_type meal_type NOT NULL,
    was_cooked BOOLEAN DEFAULT false,
    rating INTEGER CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

    -- Asegurar que no haya duplicados para la misma fecha/comida/usuario
    CONSTRAINT unique_user_meal_plan UNIQUE (user_id, planned_date, meal_type)
);

-- Crear índices para búsquedas comunes
CREATE INDEX IF NOT EXISTS idx_recipe_history_user_date 
ON recipe_history(user_id, planned_date);

CREATE INDEX IF NOT EXISTS idx_recipe_history_recipe 
ON recipe_history(recipe_id);

CREATE INDEX IF NOT EXISTS idx_recipe_history_meal_type 
ON recipe_history(meal_type);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_recipe_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_recipe_history_updated_at
    BEFORE UPDATE ON recipe_history
    FOR EACH ROW
    EXECUTE FUNCTION update_recipe_history_updated_at();

-- Políticas RLS
ALTER TABLE public.recipe_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own recipe history"
    ON public.recipe_history FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recipe history"
    ON public.recipe_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recipe history"
    ON public.recipe_history FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recipe history"
    ON public.recipe_history FOR DELETE
    USING (auth.uid() = user_id);

-- Comentarios para documentación
COMMENT ON TABLE public.recipe_history IS 'Registro histórico de recetas planificadas y cocinadas por los usuarios';
COMMENT ON COLUMN recipe_history.planned_date IS 'Fecha y hora planificada para la receta';
COMMENT ON COLUMN recipe_history.meal_type IS 'Tipo de comida (desayuno, almuerzo, cena, merienda)';
COMMENT ON COLUMN recipe_history.was_cooked IS 'Indica si la receta fue efectivamente cocinada';
COMMENT ON COLUMN recipe_history.rating IS 'Calificación opcional del usuario (1-5)';
COMMENT ON COLUMN recipe_history.notes IS 'Notas o comentarios opcionales del usuario';