-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can select recipes" ON recipes;
DROP POLICY IF EXISTS "Users can insert recipes" ON recipes;
DROP POLICY IF EXISTS "Users can update recipes" ON recipes;
DROP POLICY IF EXISTS "Users can delete recipes" ON recipes;
DROP POLICY IF EXISTS "Users can view recipe ingredients" ON recipe_ingredients;
DROP POLICY IF EXISTS "Users can view meal plan entries" ON meal_plan_entries;

-- Enable RLS on tables
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_entries ENABLE ROW LEVEL SECURITY;

-- Fix policy for meal_plan_entries
DROP POLICY IF EXISTS "Users can manage their own meal plan entries" ON meal_plan_entries;
CREATE POLICY "Users can manage their own meal plan entries"
ON meal_plan_entries
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to view recipes referenced in their meal plans
DROP POLICY IF EXISTS "Users can view recipes from their meal plans" ON recipes;
CREATE POLICY "Users can view recipes from their meal plans"
ON recipes
FOR SELECT
USING (
    auth.uid() IN (
        SELECT DISTINCT user_id
        FROM meal_plan_entries
        WHERE recipe_id = id
    )
    OR auth.uid() = user_id
    OR user_id IS NULL
);
ALTER TABLE meal_plan_entries ENABLE ROW LEVEL SECURITY;

-- Recipes policies
CREATE POLICY "Users can view public recipes"
ON recipes FOR SELECT
USING (
    auth.uid() = user_id
    OR user_id IS NULL
    OR EXISTS (
        SELECT 1 FROM meal_plan_entries 
        WHERE meal_plan_entries.recipe_id = recipes.id 
        AND meal_plan_entries.user_id = auth.uid()
    )
);

CREATE POLICY "Users can create recipes"
ON recipes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recipes"
ON recipes FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own recipes"
ON recipes FOR DELETE
USING (auth.uid() = user_id);

-- Recipe ingredients policies
CREATE POLICY "Users can view recipe ingredients"
ON recipe_ingredients FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM recipes
        WHERE recipes.id = recipe_ingredients.recipe_id
        AND (
            recipes.user_id = auth.uid()
            OR recipes.user_id IS NULL
            OR EXISTS (
                SELECT 1 FROM meal_plan_entries
                WHERE meal_plan_entries.recipe_id = recipes.id
                AND meal_plan_entries.user_id = auth.uid()
            )
        )
    )
);

CREATE POLICY "Users can manage own recipe ingredients"
ON recipe_ingredients 
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM recipes
        WHERE recipes.id = recipe_ingredients.recipe_id
        AND recipes.user_id = auth.uid()
    )
);

-- Meal plan entries policies
CREATE POLICY "Users can manage own meal plan entries"
ON meal_plan_entries
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Add comments
COMMENT ON POLICY "Users can view public recipes" ON recipes IS 'Allow users to view their own recipes, public recipes, and recipes in their meal plans';
COMMENT ON POLICY "Users can create recipes" ON recipes IS 'Allow users to create new recipes';
COMMENT ON POLICY "Users can update own recipes" ON recipes IS 'Allow users to update their own recipes';
COMMENT ON POLICY "Users can delete own recipes" ON recipes IS 'Allow users to delete their own recipes';
COMMENT ON POLICY "Users can view recipe ingredients" ON recipe_ingredients IS 'Allow users to view ingredients for accessible recipes';
COMMENT ON POLICY "Users can manage own recipe ingredients" ON recipe_ingredients IS 'Allow users to manage ingredients for their own recipes';
COMMENT ON POLICY "Users can manage own meal plan entries" ON meal_plan_entries IS 'Allow users to manage their own meal plan entries';