-- Create meal_plans table to group weekly planning boards
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'meal_plans'
  ) THEN
    CREATE TABLE public.meal_plans (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
      start_date date NOT NULL,
      end_date date NOT NULL,
      name text NOT NULL DEFAULT 'Plan semanal',
      created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
      updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
      CONSTRAINT meal_plans_date_range CHECK (end_date >= start_date)
    );

    CREATE UNIQUE INDEX meal_plans_user_dates_idx
      ON public.meal_plans (user_id, start_date, end_date);

    ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Users manage own meal plans"
      ON public.meal_plans
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);

    CREATE TRIGGER on_meal_plans_updated
      BEFORE UPDATE ON public.meal_plans
      FOR EACH ROW
      EXECUTE PROCEDURE public.handle_updated_at();
  END IF;
END
$$;

-- Link meal_plan_entries with the new meal_plans table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'meal_plan_entries'
      AND column_name = 'meal_plan_id'
  ) THEN
    ALTER TABLE public.meal_plan_entries
      ADD COLUMN meal_plan_id uuid NULL REFERENCES public.meal_plans (id) ON DELETE CASCADE;
  END IF;
END
$$;

-- Backfill existing entries by creating plans per week per user
WITH unique_ranges AS (
  SELECT
    user_id,
    date_trunc('week', plan_date)::date AS start_date,
    (date_trunc('week', plan_date) + interval '6 days')::date AS end_date
  FROM public.meal_plan_entries
  GROUP BY user_id, date_trunc('week', plan_date)
),
created_plans AS (
  INSERT INTO public.meal_plans (user_id, start_date, end_date, name)
  SELECT
    u.user_id,
    u.start_date,
    u.end_date,
    'Plan semana ' || to_char(u.start_date, 'YYYY-MM-DD')
  FROM unique_ranges u
  WHERE NOT EXISTS (
    SELECT 1 FROM public.meal_plans p
    WHERE p.user_id = u.user_id
      AND p.start_date = u.start_date
      AND p.end_date = u.end_date
  )
  RETURNING id, user_id, start_date, end_date
)
UPDATE public.meal_plan_entries e
SET meal_plan_id = p.id
FROM public.meal_plans p
WHERE e.meal_plan_id IS NULL
  AND p.user_id = e.user_id
  AND p.start_date <= e.plan_date
  AND p.end_date >= e.plan_date;

-- Ensure meal_plan_entries policies keep allowing users to manage their rows
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'meal_plan_entries'
      AND policyname = 'Users manage own meal plan entries'
  ) THEN
    CREATE POLICY "Users manage own meal plan entries"
      ON public.meal_plan_entries
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;
