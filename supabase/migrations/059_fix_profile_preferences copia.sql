-- Migración 059: Asegurar políticas y permisos para preferencias de perfil

-- Asegurarse de que RLS está habilitado en profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas antiguas/posiblemente conflictivas (por idempotencia)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow individual user access" ON public.profiles; -- De 001
DROP POLICY IF EXISTS "Allow individual user update" ON public.profiles; -- De 001

-- Recrear políticas RLS definitivas para profiles
CREATE POLICY "Allow users to access their own profile"
ON public.profiles FOR ALL -- SELECT, INSERT, UPDATE, DELETE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Eliminar constraint de verificación redundante/incorrecta si existe
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS valid_complexity;

-- Conceder permisos a roles
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated; -- Permitir CRUD al usuario logueado (RLS protege)
GRANT ALL ON public.profiles TO postgres, service_role;

-- Mensaje final
SELECT 'Políticas y permisos de profiles asegurados.';