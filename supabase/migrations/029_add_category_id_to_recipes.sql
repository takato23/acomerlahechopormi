-- supabase/migrations/031_add_category_id_to_recipes.sql

-- 1. Añadir la columna 'category_id' a la tabla 'recipes'
--    Tipo TEXT para coincidir con categories.id. Permitir NULL.
ALTER TABLE public.recipes
ADD COLUMN IF NOT EXISTS category_id TEXT NULL; -- Cambiado de UUID a TEXT

-- 2. Añadir la restricción de clave foránea para enlazar con 'categories'
--    Eliminarla primero por seguridad si existiera de un intento previo.
ALTER TABLE public.recipes
DROP CONSTRAINT IF EXISTS recipes_category_id_fkey;

--    Crear la restricción (ahora referencia TEXT)
ALTER TABLE public.recipes
ADD CONSTRAINT recipes_category_id_fkey
FOREIGN KEY (category_id) REFERENCES public.categories(id) -- Referencia a TEXT
ON DELETE SET NULL -- Si se elimina la categoría, la receta queda sin categoría.
ON UPDATE CASCADE; -- Si el ID de la categoría cambia, se actualiza aquí.

-- Mensaje de confirmación
SELECT 'Columna category_id (TEXT) añadida y FK creada en la tabla recipes.';