-- Add columns for excluded ingredients and available equipment to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS excluded_ingredients TEXT[] NULL,
ADD COLUMN IF NOT EXISTS available_equipment TEXT[] NULL;

-- Add comments for the new columns
COMMENT ON COLUMN public.profiles.excluded_ingredients IS 'List of ingredients the user wants to exclude from recipes.';
COMMENT ON COLUMN public.profiles.available_equipment IS 'List of kitchen equipment available to the user.';