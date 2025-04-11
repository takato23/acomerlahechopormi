-- Migration: Add is_favorite column to recipes table
-- Adds a boolean column to mark recipes as favorites and an optional index.

-- Add the is_favorite column
ALTER TABLE public.recipes
ADD COLUMN is_favorite BOOLEAN DEFAULT FALSE NOT NULL;

-- Optional: Add an index for potentially filtering by favorites frequently
-- This index helps speed up queries that filter for favorite recipes of a specific user.
CREATE INDEX idx_recipes_user_favorite ON public.recipes (user_id, is_favorite) WHERE is_favorite = TRUE;