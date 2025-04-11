-- Migración combinada 049: Corrige category_keywords y asegura columnas/índices de recipes

-- == PARTE 1: category_keywords ==

-- Asegurarse de que RLS está habilitado para category_keywords
ALTER TABLE public.category_keywords ENABLE ROW LEVEL SECURITY;

-- Eliminar todas las políticas antiguas o conflictivas mencionadas para category_keywords
DROP POLICY IF EXISTS "Cualquiera puede leer keywords" ON public.category_keywords;
DROP POLICY IF EXISTS "Usuarios pueden manejar sus keywords" ON public.category_keywords;
DROP POLICY IF EXISTS "Usuarios autenticados pueden leer keywords" ON public.category_keywords;
DROP POLICY IF EXISTS "Service role puede manejar todos los keywords" ON public.category_keywords;
DROP POLICY IF EXISTS "Allow authenticated users to read keywords" ON public.category_keywords;
DROP POLICY IF EXISTS "Allow admin or service roles to manage keywords" ON public.category_keywords;
DROP POLICY IF EXISTS "Allow all authenticated users to read keywords" ON public.category_keywords;
DROP POLICY IF EXISTS "Allow service role to manage keywords" ON public.category_keywords;
DROP POLICY IF EXISTS "Servicio puede manejar keywords" ON public.category_keywords;
DROP POLICY IF EXISTS "Allow read access to keywords" ON public.category_keywords; -- Incluida por si acaso
DROP POLICY IF EXISTS "Allow service role full access to keywords" ON public.category_keywords; -- Incluida por si acaso

-- Crear política final para LECTURA de category_keywords (anon y authenticated)
CREATE POLICY "Allow read access to keywords" ON public.category_keywords
  FOR SELECT
  USING (true); -- Permite SELECT a cualquier rol que tenga permiso GRANT

-- Crear política final para ESCRITURA de category_keywords (solo service_role)
CREATE POLICY "Allow service role full access to keywords" ON public.category_keywords
  FOR ALL -- INSERT, UPDATE, DELETE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Ajustar permisos GRANT finales para category_keywords
-- Permitir SELECT a anon y authenticated
GRANT SELECT ON TABLE public.category_keywords TO anon, authenticated;
-- Quitar explícitamente permisos de escritura a authenticated (por si acaso)
REVOKE INSERT, UPDATE, DELETE ON TABLE public.category_keywords FROM authenticated;
-- Dar todos los permisos a service_role
GRANT ALL ON TABLE public.category_keywords TO postgres, service_role;

-- Comentario final para category_keywords (opcional)
COMMENT ON TABLE public.category_keywords IS 'Keywords for automatic category inference. Read by users, managed by service_role.';

-- == PARTE 2: recipes ==

-- Asegurarnos que tenemos los campos correctos en recipes (con IF NOT EXISTS)
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS prep_time_minutes integer;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS cook_time_minutes integer;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS servings integer;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS is_favorite boolean DEFAULT false;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false; -- Ya debería existir por 044, pero por idempotencia
-- Corrección: La FK a categories debe ser TEXT, no UUID, basado en la definición de categories.id en 002
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS category_id text REFERENCES public.categories(id) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS instructions text; -- Ya debería existir por 011, pero por idempotencia

-- Agregar constraint para asegurar que user_id y title sean not null (si no lo son ya)
-- Ejecutar individualmente por si una ya existe
DO $$ BEGIN ALTER TABLE public.recipes ALTER COLUMN user_id SET NOT NULL; EXCEPTION WHEN others THEN RAISE NOTICE 'Columna user_id ya es NOT NULL o tabla no existe.'; END $$;
DO $$ BEGIN ALTER TABLE public.recipes ALTER COLUMN title SET NOT NULL; EXCEPTION WHEN others THEN RAISE NOTICE 'Columna title ya es NOT NULL o tabla no existe.'; END $$;


-- Añadir índices para mejorar el rendimiento (con IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON public.recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_recipes_is_public ON public.recipes(is_public); -- Ya debería existir por 044
CREATE INDEX IF NOT EXISTS idx_recipes_title ON public.recipes(title);

-- Final message
SELECT 'Migración 049 combinada aplicada: category_keywords y recipes asegurados.';
