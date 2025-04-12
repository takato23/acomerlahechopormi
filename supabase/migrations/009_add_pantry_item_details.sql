-- Añadir columnas opcionales a la tabla pantry_items

ALTER TABLE public.pantry_items
ADD COLUMN IF NOT EXISTS location TEXT NULL,
ADD COLUMN IF NOT EXISTS price NUMERIC NULL,
ADD COLUMN IF NOT EXISTS notes TEXT NULL,
ADD COLUMN IF NOT EXISTS min_stock NUMERIC NULL,
ADD COLUMN IF NOT EXISTS target_stock NUMERIC NULL,
ADD COLUMN IF NOT EXISTS tags TEXT[] NULL;

COMMENT ON COLUMN public.pantry_items.location IS 'Ubicación física del item (ej: Nevera, Despensa)';
COMMENT ON COLUMN public.pantry_items.price IS 'Precio de compra del item (opcional)';
COMMENT ON COLUMN public.pantry_items.notes IS 'Notas adicionales sobre el item (opcional)';
COMMENT ON COLUMN public.pantry_items.min_stock IS 'Nivel mínimo de stock antes de sugerir reponer (opcional)';
COMMENT ON COLUMN public.pantry_items.target_stock IS 'Nivel de stock deseado (opcional)';
COMMENT ON COLUMN public.pantry_items.tags IS 'Etiquetas personalizadas para el item (opcional)';
