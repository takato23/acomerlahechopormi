-- Script para crear la tabla 'categories' con ID de tipo TEXT y poblarla

-- 1. Crear la tabla 'categories'
-- Eliminar tabla si existe para empezar limpio (¡CUIDADO EN PRODUCCIÓN!)
DROP TABLE IF EXISTS public.categories CASCADE;

CREATE TABLE public.categories (
  id text PRIMARY KEY, -- Cambiado de UUID a TEXT
  name text NOT NULL,
  icon text NULL,
  color text NULL,
  "order" integer NOT NULL DEFAULT 0,
  user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Añadir comentario a la tabla
COMMENT ON TABLE public.categories IS 'Stores item categories (e.g., Dairy, Produce, Cleaning). Can be default or user-defined. ID is TEXT.';

-- Habilitar RLS para 'categories'
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para 'categories' (Mismas que antes)
CREATE POLICY "Allow authenticated users to select default or own categories"
ON public.categories FOR SELECT TO authenticated USING (is_default = true OR auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to insert their own categories"
ON public.categories FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND is_default = false);

CREATE POLICY "Allow authenticated users to update their own categories"
ON public.categories FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id AND is_default = false);

CREATE POLICY "Allow authenticated users to delete their own categories"
ON public.categories FOR DELETE TO authenticated USING (auth.uid() = user_id AND is_default = false);


-- 2. Poblar con categorías por defecto (IDs ahora son TEXT)
INSERT INTO public.categories (id, name, icon, color, "order", is_default) VALUES
  ('vegetables', 'Verduras y Frutas', 'carrot', '#4ade80', 1, true),
  ('dairy', 'Lácteos y Huevos', 'milk', '#93c5fd', 2, true),
  ('meat', 'Carnes y Pescados', 'beef', '#fca5a5', 3, true),
  ('pantry', 'Almacén', 'package', '#fcd34d', 4, true),
  ('cleaning', 'Limpieza', 'spray', '#a5b4fc', 5, true),
  ('beverages', 'Bebidas', 'glass-water', '#f9a8d4', 6, true),
  ('frozen', 'Congelados', 'snowflake', '#93c5fd', 7, true),
  ('personal_care', 'Cuidado Personal', 'bath', '#f0abfc', 8, true),
  ('other', 'Otros', 'ellipsis', '#d4d4d4', 99, true)
ON CONFLICT (id) DO NOTHING;


-- 3. Añadir columna 'category_id' a 'pantry_items' -> MOVIDO A SCRIPT 002
-- ALTER TABLE public.pantry_items ADD COLUMN category_id TEXT NULL; -- Cambiado a TEXT


-- 4. Añadir la Foreign Key constraint -> MOVIDO A SCRIPT 002
-- ALTER TABLE public.pantry_items
-- ADD CONSTRAINT pantry_items_category_id_fkey
-- FOREIGN KEY (category_id) REFERENCES public.categories(id) -- Ahora referencia a TEXT
-- ON DELETE SET NULL
-- ON UPDATE CASCADE;

-- Mensaje final
SELECT 'Tabla categories creada (con ID TEXT), poblada con defaults y RLS habilitada.';