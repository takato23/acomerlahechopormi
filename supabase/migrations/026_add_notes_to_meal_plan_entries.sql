-- Add a 'notes' column to the meal_plan_entries table
-- This column can store additional information, like generated recipe descriptions

ALTER TABLE public.meal_plan_entries
ADD COLUMN notes TEXT NULL;

-- Optional: Add a comment to the column for clarity in database tools
COMMENT ON COLUMN public.meal_plan_entries.notes IS 'Stores additional notes or details about the planned meal, such as generated recipe descriptions or user comments.';