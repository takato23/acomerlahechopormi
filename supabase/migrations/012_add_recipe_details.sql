-- supabase/migrations/009_add_recipe_details.sql

-- Add new nullable columns to the recipes table
ALTER TABLE public.recipes
ADD COLUMN IF NOT EXISTS image_url TEXT NULL,
ADD COLUMN IF NOT EXISTS prep_time_minutes INTEGER NULL,
ADD COLUMN IF NOT EXISTS cook_time_minutes INTEGER NULL,
ADD COLUMN IF NOT EXISTS servings INTEGER NULL,
ADD COLUMN IF NOT EXISTS tags TEXT[] NULL;

-- Create the storage bucket for recipe images if it doesn't exist
-- Making it public for easier access to image URLs
INSERT INTO storage.buckets (id, name, public)
VALUES ('recipe_images', 'recipe_images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for recipe_images bucket

-- Drop existing policies (if any) to avoid conflicts during re-runs
-- Adjust policy names if they differ in your setup
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
-- DROP POLICY IF EXISTS "Allow authenticated updates on own images" ON storage.objects; -- Optional
-- DROP POLICY IF EXISTS "Allow authenticated deletes on own images" ON storage.objects; -- Optional

-- Allow authenticated users to upload to the 'recipe_images' bucket
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'recipe_images');

-- Allow public read access to files in the 'recipe_images' bucket
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'recipe_images');

-- Optional policies for future enhancement (update/delete own images)
-- These assume a file path structure like 'user_id/filename.ext'
-- Uncomment and adapt if needed in the future.
/*
CREATE POLICY "Allow authenticated updates on own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'recipe_images' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'recipe_images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Allow authenticated deletes on own images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'recipe_images' AND auth.uid()::text = (storage.foldername(name))[1]);
*/