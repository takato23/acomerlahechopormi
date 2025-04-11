-- Migration: Create initial base tables (profiles, ingredients, pantry_items)

-- 1. Create profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE,
  avatar_url text,
  gemini_api_key text, -- Added early based on later migrations
  updated_at timestamptz DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow individual user access" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Allow individual user update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

COMMENT ON TABLE public.profiles IS 'Stores public profile information for each user.';
COMMENT ON COLUMN public.profiles.id IS 'References the internal Supabase auth user.';

-- Function to automatically update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for profiles updated_at
CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();

-- 2. Create ingredients table
CREATE TABLE public.ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE, -- Unique constraint based on error 409
  created_at timestamptz DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz DEFAULT timezone('utc'::text, now())
  -- image_url will be added by migration 022
  -- category_id could be added later if needed
);

ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read ingredients" ON public.ingredients
  FOR SELECT TO authenticated USING (true); -- Allow all logged-in users to read

-- Insert policy based on VERSION ANTERIOR/ingredients_insert_policy.sql
CREATE POLICY "Allow authenticated users to insert ingredients" ON public.ingredients
  FOR INSERT TO authenticated WITH CHECK (true);

COMMENT ON TABLE public.ingredients IS 'Master list of unique ingredients.';
COMMENT ON COLUMN public.ingredients.name IS 'Unique name of the ingredient.';

-- Trigger for ingredients updated_at
CREATE TRIGGER on_ingredients_updated
  BEFORE UPDATE ON public.ingredients
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();


-- 3. Create pantry_items table
CREATE TABLE public.pantry_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ingredient_id uuid NULL REFERENCES public.ingredients(id) ON DELETE SET NULL, -- Nullable based on migration 017
  name text NOT NULL, -- Original name entered by user
  quantity numeric NULL, -- Nullable based on migration 018
  unit text NULL, -- Nullable based on migration 016
  created_at timestamptz DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz DEFAULT timezone('utc'::text, now())
  -- category_id will be added by migration 003
  -- other details (location, price, etc.) will be added by migration 009
  -- is_favorite will be added by migration 021
  -- expiry_date will be added by migration 028
);

ALTER TABLE public.pantry_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies based on VERSION ANTERIOR/pantry_rls_policies.sql
CREATE POLICY "Allow authenticated users to select their own pantry items" ON public.pantry_items
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to insert their own pantry items" ON public.pantry_items
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to update their own pantry items" ON public.pantry_items
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to delete their own pantry items" ON public.pantry_items
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

COMMENT ON TABLE public.pantry_items IS 'Stores items currently in the user''s pantry.';
COMMENT ON COLUMN public.pantry_items.ingredient_id IS 'FK to the master ingredients list (optional).';
COMMENT ON COLUMN public.pantry_items.name IS 'Name of the item as entered by the user.';

-- Trigger for pantry_items updated_at
CREATE TRIGGER on_pantry_items_updated
  BEFORE UPDATE ON public.pantry_items
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();

-- Final message
SELECT 'Initial tables (profiles, ingredients, pantry_items) created successfully.';