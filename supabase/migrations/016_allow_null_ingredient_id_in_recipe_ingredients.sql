-- Permitir NULL en la columna ingredient_id temporalmente
-- Esto es una solución temporal hasta que implementemos la búsqueda/creación
-- automática de ingredientes en la tabla ingredients
ALTER TABLE public.recipe_ingredients
ALTER COLUMN ingredient_id DROP NOT NULL;

COMMENT ON COLUMN public.recipe_ingredients.ingredient_id IS 'ID del ingrediente en la tabla ingredients. Puede ser NULL temporalmente hasta que se implemente la relación completa.';

-- Asegurarse que la FK a ingredients exista y sea nullable
DO $$
BEGIN
    -- Primero eliminar la constraint si existe (para poder recrearla como nullable)
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'recipe_ingredients_ingredient_id_fkey'
    ) THEN
        ALTER TABLE public.recipe_ingredients
        DROP CONSTRAINT recipe_ingredients_ingredient_id_fkey;
    END IF;

    -- Recrear la FK permitiendo NULL
    ALTER TABLE public.recipe_ingredients
    ADD CONSTRAINT recipe_ingredients_ingredient_id_fkey
    FOREIGN KEY (ingredient_id)
    REFERENCES public.ingredients(id)
    ON DELETE SET NULL;
END $$;