-- Add icon_name column to categories table
ALTER TABLE public.categories
ADD COLUMN icon_name TEXT NULL;

COMMENT ON COLUMN public.categories.icon_name IS 'Optional name of a lucide-react icon for the category.';