ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE NOT NULL;

-- First, ensure role level security is enabled
ALTER TABLE meal_plan_entries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can manage their own meal plans" ON meal_plan_entries;
DROP POLICY IF EXISTS "Users can view their meal plans" ON meal_plan_entries;

-- Create basic policy for all operations
CREATE POLICY "Users can manage their own meal plans"
ON meal_plan_entries
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create policy for recipes referenced in meal plans
DROP POLICY IF EXISTS "Users can view recipe references" ON recipes;
CREATE POLICY "Users can view recipe references"
ON recipes
FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1
    FROM meal_plan_entries
    WHERE meal_plan_entries.recipe_id = recipes.id
    AND meal_plan_entries.user_id = auth.uid()
  )
  OR is_public = true
);

-- Create policy for recipe ingredients in meal plans
DROP POLICY IF EXISTS "Users can view recipe ingredients" ON recipe_ingredients;
CREATE POLICY "Users can view recipe ingredients"
ON recipe_ingredients
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM recipes
    WHERE recipes.id = recipe_ingredients.recipe_id
    AND (
      recipes.user_id = auth.uid()
      OR EXISTS (
        SELECT 1
        FROM meal_plan_entries
        WHERE meal_plan_entries.recipe_id = recipes.id
        AND meal_plan_entries.user_id = auth.uid()
      )
      OR recipes.is_public = true
    )
  )
);

-- Add is_public column to recipes if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'recipes' 
    AND column_name = 'is_public'
  ) THEN
    ALTER TABLE recipes ADD COLUMN is_public BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Make sure recipe_ingredients have appropriate permissions
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;

-- Add helpful comments
COMMENT ON POLICY "Users can manage their own meal plans" ON meal_plan_entries IS 
'Users can only manage their own meal plan entries';

COMMENT ON POLICY "Users can view recipe references" ON recipes IS 
'Users can view recipes that are either their own, referenced in their meal plans, or marked as public';

COMMENT ON POLICY "Users can view recipe ingredients" ON recipe_ingredients IS 
'Users can view ingredients for recipes they have access to';