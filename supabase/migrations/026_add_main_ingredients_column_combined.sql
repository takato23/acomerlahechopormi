-- Add main_ingredients column to recipes table
-- This column will store the primary/key ingredients of each recipe
ALTER TABLE recipes
ADD COLUMN main_ingredients TEXT[] DEFAULT '{}';

-- Add comment explaining the column purpose
COMMENT ON COLUMN recipes.main_ingredients IS 'Array of main/key ingredients in the recipe, used for diversity analysis and anti-repetition logic';

-- Grant necessary permissions (assuming RLS is handling row-level access)
GRANT SELECT, INSERT, UPDATE (main_ingredients) ON recipes TO authenticated;
GRANT SELECT, INSERT, UPDATE (main_ingredients) ON recipes TO service_role;-- Remove main_ingredients column from recipes table
ALTER TABLE recipes DROP COLUMN main_ingredients;