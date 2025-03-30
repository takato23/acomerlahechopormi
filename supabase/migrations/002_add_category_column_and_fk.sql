-- Script para añadir la columna category_id a pantry_items y luego la FK a categories

-- 1. Añadir la columna 'category_id' a 'pantry_items' (si no existe)
--    Hacerla NULLABLE para permitir ítems sin categoría asignada.
ALTER TABLE public.pantry_items
ADD COLUMN IF NOT EXISTS category_id UUID NULL;

-- 2. Añadir la Foreign Key constraint (ahora debería funcionar)
--    Primero, eliminarla por si quedó a medio crear en un intento anterior (opcional pero seguro)
ALTER TABLE public.pantry_items
DROP CONSTRAINT IF EXISTS pantry_items_category_id_fkey;

--    Luego, crearla de nuevo
ALTER TABLE public.pantry_items
ADD CONSTRAINT pantry_items_category_id_fkey
FOREIGN KEY (category_id) REFERENCES public.categories(id)
ON DELETE SET NULL -- Si se borra una categoría (personalizada), los items quedan sin categoría
ON UPDATE CASCADE;

-- Mensaje final
SELECT 'Columna category_id añadida (si no existía) y FK creada en pantry_items.';