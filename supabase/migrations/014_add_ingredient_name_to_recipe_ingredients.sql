-- Añadir explícitamente la columna ingredient_name a recipe_ingredients
-- ya que parece que no se creó correctamente con la migración 010.

ALTER TABLE public.recipe_ingredients
ADD COLUMN IF NOT EXISTS ingredient_name TEXT NOT NULL;

COMMENT ON COLUMN public.recipe_ingredients.ingredient_name IS 'Nombre del ingrediente tal como se usa en la receta (puede diferir del nombre maestro).';

-- También añadiremos una columna id como PRIMARY KEY si falta, como indicaba la advertencia
ALTER TABLE public.recipe_ingredients
ADD COLUMN IF NOT EXISTS id uuid PRIMARY KEY DEFAULT gen_random_uuid();

-- Asegurarse que la FK a recipes exista (debería, pero por si acaso)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'recipe_ingredients_recipe_id_fkey' AND conrelid = 'public.recipe_ingredients'::regclass
    ) THEN
        ALTER TABLE public.recipe_ingredients
        ADD CONSTRAINT recipe_ingredients_recipe_id_fkey
        FOREIGN KEY (recipe_id) REFERENCES public.recipes(id) ON DELETE CASCADE;
    END IF;
END $$;