-- supabase/migrations/007_add_gemini_key_to_profiles.sql

-- Añadir la columna para almacenar la API key de Gemini del usuario
-- La hacemos nullable porque el usuario puede no proporcionarla.
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS gemini_api_key TEXT NULL;

-- Asegurarse de que RLS esté habilitada (debería estarlo si sigue patrones anteriores)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Crear/Actualizar Políticas RLS para la nueva columna
-- Asumiendo que ya existen políticas para SELECT/UPDATE propias del usuario.
-- Si no existen, habría que crearlas primero.

-- Política SELECT: Permitir al usuario leer SU PROPIA clave (y otros datos del perfil)
-- (Ajusta el nombre 'Allow individual user access' si tu política se llama diferente)
DROP POLICY IF EXISTS "Allow individual user access" ON public.profiles;
CREATE POLICY "Allow individual user access"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- Política UPDATE: Permitir al usuario actualizar SU PROPIA clave (y otros datos)
-- (Ajusta el nombre 'Allow individual user update' si tu política se llama diferente)
DROP POLICY IF EXISTS "Allow individual user update" ON public.profiles;
CREATE POLICY "Allow individual user update"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Nota: No se necesita política INSERT específica para esta columna si la de INSERT general ya existe.
-- Nota: No se necesita política DELETE específica para esta columna.