-- Add expiry_date column to pantry_items table
ALTER TABLE public.pantry_items
ADD COLUMN expiry_date DATE NULL;

-- Optional: Add an index for potentially faster filtering/sorting
CREATE INDEX idx_pantry_items_expiry_date ON public.pantry_items (expiry_date) WHERE expiry_date IS NOT NULL;