-- Sample seed for meal_plans + meal_plan_entries
-- Ejecutar manualmente desde el SQL Editor de Supabase o con `supabase db query`.

DO $$
DECLARE
  v_user uuid;
  v_plan uuid;
  v_start date := date_trunc('week', current_date)::date;
  v_end date := (date_trunc('week', current_date) + interval '6 days')::date;
BEGIN
  SELECT id INTO v_user
  FROM auth.users
  ORDER BY created_at
  LIMIT 1;

  IF v_user IS NULL THEN
    RAISE NOTICE 'Seed abortado: no hay usuarios en auth.users';
    RETURN;
  END IF;

  INSERT INTO public.meal_plans (user_id, start_date, end_date, name)
  VALUES (v_user, v_start, v_end, 'Plan semanal de ejemplo')
  ON CONFLICT (user_id, start_date, end_date)
  DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_plan;

  -- Limpia cualquier dato anterior para este plan
  DELETE FROM public.meal_plan_entries
  WHERE user_id = v_user
    AND meal_plan_id = v_plan;

  INSERT INTO public.meal_plan_entries (
    user_id,
    meal_plan_id,
    plan_date,
    meal_type,
    recipe_id,
    custom_meal_name,
    notes
  )
  VALUES
    (v_user, v_plan, v_start, 'Desayuno', NULL, 'Tostadas integrales', 'Agregar fruta fresca'),
    (v_user, v_plan, v_start, 'Almuerzo', NULL, 'Ensalada de quinoa', 'Preparar aderezo aparte'),
    (v_user, v_plan, v_start + 1, 'Cena', NULL, 'Sopa de verduras', 'Usar caldo casero');

  RAISE NOTICE 'Seed completado: plan % (% → %)', v_plan, v_start, v_end;
END;
$$;
