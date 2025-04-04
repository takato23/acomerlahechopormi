-- Add image_url column to ingredients table
ALTER TABLE public.ingredients
ADD COLUMN image_url TEXT NULL;

COMMENT ON COLUMN public.ingredients.image_url IS 'Optional URL for an image representing the ingredient.';