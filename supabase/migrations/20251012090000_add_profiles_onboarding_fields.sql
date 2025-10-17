-- Add onboarding-related fields to public.profiles

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cuisine_preferences text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS preferred_meal_times jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS max_calories integer,
  ADD COLUMN IF NOT EXISTS household_size integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS objectives jsonb DEFAULT '{}'::jsonb;

-- Backfill cuisine_preferences from legacy preferred_cuisines if necessary
UPDATE public.profiles
SET cuisine_preferences = COALESCE(preferred_cuisines, '{}'::text[])
WHERE cuisine_preferences IS NULL
  AND (preferred_cuisines IS NOT NULL AND array_length(preferred_cuisines, 1) > 0);

-- Ensure household_size has at least a sensible default for existing rows
UPDATE public.profiles
SET household_size = COALESCE(household_size, 1);

-- Ensure objectives jsonb is never NULL
UPDATE public.profiles
SET objectives = '{}'::jsonb
WHERE objectives IS NULL;

-- Optional index to speed up searches by cuisine preferences
CREATE INDEX IF NOT EXISTS idx_profiles_cuisine_preferences
  ON public.profiles USING GIN (cuisine_preferences);

-- Optional index for json lookups on preferred_meal_times
CREATE INDEX IF NOT EXISTS idx_profiles_preferred_meal_times
  ON public.profiles USING GIN (preferred_meal_times);

-- Drop legacy column if it still exists to avoid confusion
ALTER TABLE public.profiles DROP COLUMN IF EXISTS preferred_cuisines;
