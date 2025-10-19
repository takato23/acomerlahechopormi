-- Ensure preference columns exist with appropriate constraints
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS dietary_preference TEXT,
ADD COLUMN IF NOT EXISTS allergies_restrictions TEXT,
ADD COLUMN IF NOT EXISTS difficulty_preference TEXT,
ADD COLUMN IF NOT EXISTS max_prep_time INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_dietary_preference_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_dietary_preference_check
      CHECK (dietary_preference IS NULL OR dietary_preference IN ('omnivore', 'vegetarian', 'vegan'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_difficulty_preference_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_difficulty_preference_check
      CHECK (difficulty_preference IS NULL OR difficulty_preference IN ('easy', 'medium', 'hard'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_allergies_length_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_allergies_length_check
      CHECK (allergies_restrictions IS NULL OR char_length(allergies_restrictions) <= 500);
  END IF;
END $$;

COMMENT ON COLUMN public.profiles.dietary_preference IS 'Preferencia dietética del usuario (omnivore, vegetarian o vegan).';
COMMENT ON COLUMN public.profiles.difficulty_preference IS 'Preferencia de dificultad para sugerencias (easy, medium o hard).';
COMMENT ON COLUMN public.profiles.allergies_restrictions IS 'Alergias y restricciones alimentarias sensibles proporcionadas por el usuario.';
COMMENT ON COLUMN public.profiles.max_prep_time IS 'Tiempo máximo de preparación en minutos preferido por el usuario.';
