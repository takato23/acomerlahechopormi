-- Agregar columna avatar_url a la tabla profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS avatar_url TEXT NULL;

-- Comentario para documentar la columna
COMMENT ON COLUMN public.profiles.avatar_url IS 'URL del avatar del usuario, almacenado en Supabase Storage.';

-- Opcional: Actualizar política RLS si es necesario para permitir la lectura/escritura de avatar_url
-- (Asumiendo que las políticas existentes para SELECT y UPDATE en profiles ya cubren esto
-- al permitir el acceso basado en auth.uid() = id)

-- Ejemplo de cómo se vería una política de UPDATE explícita si fuera necesaria:
-- DROP POLICY IF EXISTS "Allow individual user update" ON public.profiles;
-- CREATE POLICY "Allow individual user update"
-- ON public.profiles FOR UPDATE
-- USING (auth.uid() = id)
-- WITH CHECK (auth.uid() = id); -- Asegúrate de que cubra todas las columnas necesarias o usa una política más permisiva si confías en la lógica de tu aplicación.