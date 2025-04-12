-- Permitir NULL en la columna ingredient_name de recipe_ingredients
-- Esto facilita la transición hacia el uso exclusivo de ingredient_id,
-- aunque por ahora mantendremos ambos campos.

ALTER TABLE public.recipe_ingredients
ALTER COLUMN ingredient_name DROP NOT NULL;

COMMENT ON COLUMN public.recipe_ingredients.ingredient_name IS 'Nombre del ingrediente tal como se usa en la receta. Temporalmente nullable durante la transición a ingredient_id.';