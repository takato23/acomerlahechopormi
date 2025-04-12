-- Migración combinada para corregir políticas y permisos de category_keywords

-- Asegurarse de que RLS está habilitado
ALTER TABLE public.category_keywords ENABLE ROW LEVEL SECURITY;

-- Eliminar todas las políticas antiguas o conflictivas mencionadas
DROP POLICY IF EXISTS "Cualquiera puede leer keywords" ON public.category_keywords;
DROP POLICY IF EXISTS "Usuarios pueden manejar sus keywords" ON public.category_keywords;
DROP POLICY IF EXISTS "Usuarios autenticados pueden leer keywords" ON public.category_keywords;
DROP POLICY IF EXISTS "Service role puede manejar todos los keywords" ON public.category_keywords;
DROP POLICY IF EXISTS "Allow authenticated users to read keywords" ON public.category_keywords;
DROP POLICY IF EXISTS "Allow admin or service roles to manage keywords" ON public.category_keywords;
DROP POLICY IF EXISTS "Allow all authenticated users to read keywords" ON public.category_keywords;
DROP POLICY IF EXISTS "Allow service role to manage keywords" ON public.category_keywords;
DROP POLICY IF EXISTS "Servicio puede manejar keywords" ON public.category_keywords;

-- Crear política final para LECTURA (anon y authenticated)
CREATE POLICY "Allow read access to keywords" ON public.category_keywords
  FOR SELECT
  USING (true); -- Permite SELECT a cualquier rol que tenga permiso GRANT

-- Crear política final para ESCRITURA (solo service_role)
CREATE POLICY "Allow service role full access to keywords" ON public.category_keywords
  FOR ALL -- INSERT, UPDATE, DELETE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Ajustar permisos GRANT finales
-- Permitir SELECT a anon y authenticated
GRANT SELECT ON TABLE public.category_keywords TO anon, authenticated;
-- Quitar explícitamente permisos de escritura a authenticated (por si acaso)
REVOKE INSERT, UPDATE, DELETE ON TABLE public.category_keywords FROM authenticated;
-- Dar todos los permisos a service_role
GRANT ALL ON TABLE public.category_keywords TO postgres, service_role;

-- Comentario final (opcional)
COMMENT ON TABLE public.category_keywords IS 'Keywords for automatic category inference. Read by users, managed by service_role.';
