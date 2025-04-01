-- Permitir NULL en la columna quantity de recipe_ingredients
ALTER TABLE public.recipe_ingredients
ALTER COLUMN quantity DROP NOT NULL;

COMMENT ON COLUMN public.recipe_ingredients.quantity IS 'Cantidad del ingrediente (puede ser NULL si la cantidad es implícita o no especificada).';