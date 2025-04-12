-- Permitir NULL en la columna unit de recipe_ingredients
ALTER TABLE public.recipe_ingredients
ALTER COLUMN unit DROP NOT NULL;

COMMENT ON COLUMN public.recipe_ingredients.unit IS 'Unidad de medida del ingrediente (puede ser NULL si no aplica, ej. "1 huevo")';