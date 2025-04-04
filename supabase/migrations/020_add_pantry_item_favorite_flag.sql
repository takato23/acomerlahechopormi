-- Add is_favorite column to pantry_items table
ALTER TABLE public.pantry_items
ADD COLUMN is_favorite BOOLEAN NOT NULL DEFAULT FALSE;

-- Add a comment to the column
COMMENT ON COLUMN public.pantry_items.is_favorite IS 'Indicates if the pantry item is marked as a favorite by the user.';