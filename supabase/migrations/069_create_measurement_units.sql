BEGIN;

CREATE TABLE IF NOT EXISTS public.measurement_units (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  symbol TEXT,
  unit_type TEXT NOT NULL DEFAULT 'general',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

COMMENT ON TABLE public.measurement_units IS 'Catálogo de unidades estandarizadas para recetas y despensa.';
COMMENT ON COLUMN public.measurement_units.code IS 'Identificador corto y estable (por ejemplo, kg, ml, unidad).';
COMMENT ON COLUMN public.measurement_units.unit_type IS 'Clasificación general de la unidad (masa, volumen, unidad, etc.).';

INSERT INTO public.measurement_units (code, name, symbol, unit_type, updated_at)
VALUES
  ('g', 'Gramos', 'g', 'mass', timezone('utc', now())),
  ('kg', 'Kilogramos', 'kg', 'mass', timezone('utc', now())),
  ('mg', 'Miligramo', 'mg', 'mass', timezone('utc', now())),
  ('lb', 'Libras', 'lb', 'mass', timezone('utc', now())),
  ('oz', 'Onzas', 'oz', 'mass', timezone('utc', now())),
  ('ml', 'Mililitros', 'ml', 'volume', timezone('utc', now())),
  ('l', 'Litros', 'L', 'volume', timezone('utc', now())),
  ('cup', 'Tazas', 'cup', 'volume', timezone('utc', now())),
  ('tbsp', 'Cucharadas', 'tbsp', 'volume', timezone('utc', now())),
  ('tsp', 'Cucharaditas', 'tsp', 'volume', timezone('utc', now())),
  ('unit', 'Unidades', 'u', 'count', timezone('utc', now())),
  ('pack', 'Paquetes', 'pkg', 'count', timezone('utc', now())),
  ('slice', 'Rebanadas', 'slice', 'count', timezone('utc', now())),
  ('bunch', 'Manojos', 'bunch', 'count', timezone('utc', now()))
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  symbol = EXCLUDED.symbol,
  unit_type = EXCLUDED.unit_type,
  updated_at = timezone('utc', now());

COMMIT;
