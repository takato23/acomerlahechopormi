-- Ensure meal_plans, shopping_list_items and user_preferences core tables exist
-- with required relationships and indexes for the planning and shopping modules.

-- 1. meal_plans table -------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'meal_plans'
  ) THEN
    CREATE TABLE public.meal_plans (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      name text NOT NULL DEFAULT 'Plan semanal',
      start_date date NOT NULL,
      end_date date NOT NULL,
      created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
      updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
    );

    COMMENT ON TABLE public.meal_plans IS 'Weekly meal plan metadata owned by each user.';
    COMMENT ON COLUMN public.meal_plans.user_id IS 'Owner of the meal plan (maps to auth.users/id).';
    COMMENT ON COLUMN public.meal_plans.start_date IS 'Inclusive start date for the plan.';
    COMMENT ON COLUMN public.meal_plans.end_date IS 'Inclusive end date for the plan.';
  END IF;
END
$$;

ALTER TABLE public.meal_plans
  ADD COLUMN IF NOT EXISTS name text;

ALTER TABLE public.meal_plans
  ALTER COLUMN name SET DEFAULT 'Plan semanal';

ALTER TABLE public.meal_plans
  ALTER COLUMN name SET NOT NULL;

ALTER TABLE public.meal_plans
  ADD COLUMN IF NOT EXISTS start_date date;

ALTER TABLE public.meal_plans
  ALTER COLUMN start_date SET NOT NULL;

ALTER TABLE public.meal_plans
  ADD COLUMN IF NOT EXISTS end_date date;

ALTER TABLE public.meal_plans
  ALTER COLUMN end_date SET NOT NULL;

ALTER TABLE public.meal_plans
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now());

ALTER TABLE public.meal_plans
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now());

CREATE INDEX IF NOT EXISTS idx_meal_plans_user_dates
  ON public.meal_plans (user_id, start_date, end_date);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'on_meal_plans_updated'
      AND tgrelid = 'public.meal_plans'::regclass
  ) THEN
    CREATE TRIGGER on_meal_plans_updated
      BEFORE UPDATE ON public.meal_plans
      FOR EACH ROW
      EXECUTE PROCEDURE public.handle_updated_at();
  END IF;
END
$$;

ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plans FORCE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'meal_plans'
      AND policyname = 'Users manage their meal plans'
  ) THEN
    CREATE POLICY "Users manage their meal plans"
      ON public.meal_plans
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;

-- 2. Link meal_plan_entries with meal_plans when available ------------------
ALTER TABLE public.meal_plan_entries
  ADD COLUMN IF NOT EXISTS meal_plan_id uuid REFERENCES public.meal_plans(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_meal_plan_entries_plan
  ON public.meal_plan_entries (meal_plan_id, plan_date);

-- 3. shopping_list_items enhancements ---------------------------------------
ALTER TABLE public.shopping_list_items
  ADD COLUMN IF NOT EXISTS category_id text REFERENCES public.categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS ingredient_id uuid REFERENCES public.ingredients(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS recipe_id uuid REFERENCES public.recipes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS brand text;

CREATE INDEX IF NOT EXISTS idx_shopping_list_items_user
  ON public.shopping_list_items (user_id);

CREATE INDEX IF NOT EXISTS idx_shopping_list_items_user_checked
  ON public.shopping_list_items (user_id, is_checked);

CREATE INDEX IF NOT EXISTS idx_shopping_list_items_user_category
  ON public.shopping_list_items (user_id, category_id);


-- 3b. measurement_units reference table (shared catalogue) -------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'measurement_units'
  ) THEN
    CREATE TABLE public.measurement_units (
      id text PRIMARY KEY,
      name text NOT NULL,
      abbreviation text NOT NULL,
      unit_group text NOT NULL,
      description text,
      created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
      updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
    );

    COMMENT ON TABLE public.measurement_units IS 'Canonical list of measurement units for recipes and shopping lists.';
    COMMENT ON COLUMN public.measurement_units.unit_group IS 'Category such as volume, weight or quantity.';
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_measurement_units_group
  ON public.measurement_units (unit_group, abbreviation);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'on_measurement_units_updated'
      AND tgrelid = 'public.measurement_units'::regclass
  ) THEN
    CREATE TRIGGER on_measurement_units_updated
      BEFORE UPDATE ON public.measurement_units
      FOR EACH ROW
      EXECUTE PROCEDURE public.handle_updated_at();
  END IF;
END
$$;
-- 4. user_preferences table --------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_preferences'
  ) THEN
    CREATE TABLE public.user_preferences (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
      dietary_preferences text[] NOT NULL DEFAULT ARRAY[]::text[],
      disliked_ingredients text[] NOT NULL DEFAULT ARRAY[]::text[],
      preferred_cuisines text[] NOT NULL DEFAULT ARRAY[]::text[],
      cooking_time_limit integer,
      created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
      updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
      metadata jsonb NOT NULL DEFAULT '{}'::jsonb
    );

    COMMENT ON TABLE public.user_preferences IS 'Stores advanced preference settings that extend the profile.';
    COMMENT ON COLUMN public.user_preferences.metadata IS 'Additional JSON settings such as allergies or equipment.';
  END IF;
END
$$;

ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS dietary_preferences text[] NOT NULL DEFAULT ARRAY[]::text[];

ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS disliked_ingredients text[] NOT NULL DEFAULT ARRAY[]::text[];

ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS preferred_cuisines text[] NOT NULL DEFAULT ARRAY[]::text[];

ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS cooking_time_limit integer;

ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now());

ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now());

CREATE INDEX IF NOT EXISTS idx_user_preferences_user
  ON public.user_preferences (user_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'on_user_preferences_updated'
      AND tgrelid = 'public.user_preferences'::regclass
  ) THEN
    CREATE TRIGGER on_user_preferences_updated
      BEFORE UPDATE ON public.user_preferences
      FOR EACH ROW
      EXECUTE PROCEDURE public.handle_updated_at();
  END IF;
END
$$;

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences FORCE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_preferences'
      AND policyname = 'Users manage their preferences'
  ) THEN
    CREATE POLICY "Users manage their preferences"
      ON public.user_preferences
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;

-- Final message -------------------------------------------------------------
SELECT 'Core meal planning and shopping tables verified.';
