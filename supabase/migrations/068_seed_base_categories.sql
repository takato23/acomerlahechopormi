BEGIN;

INSERT INTO public.categories (id, name, icon_name, color, "order", is_default, updated_at)
VALUES
  ('produce', 'Frutas y Verduras', 'carrot', '#4ade80', 1, true, timezone('utc', now())),
  ('dairy', 'Lácteos y Huevos', 'milk', '#93c5fd', 2, true, timezone('utc', now())),
  ('meat_fish', 'Carnes y Pescados', 'beef', '#fca5a5', 3, true, timezone('utc', now())),
  ('pantry', 'Despensa Seca', 'package', '#fcd34d', 4, true, timezone('utc', now())),
  ('frozen', 'Congelados', 'snowflake', '#bae6fd', 5, true, timezone('utc', now())),
  ('beverages', 'Bebidas', 'glass-water', '#f9a8d4', 6, true, timezone('utc', now())),
  ('cleaning', 'Limpieza y Hogar', 'spray', '#c4b5fd', 7, true, timezone('utc', now())),
  ('personal_care', 'Cuidado Personal', 'bath', '#f0abfc', 8, true, timezone('utc', now())),
  ('others', 'Otros', 'ellipsis', '#d4d4d8', 99, true, timezone('utc', now()))
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  icon_name = EXCLUDED.icon_name,
  color = EXCLUDED.color,
  "order" = EXCLUDED."order",
  is_default = true,
  updated_at = timezone('utc', now());

COMMIT;
