-- Mejorar la tabla de perfiles con campos adicionales y constraints
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS theme text DEFAULT 'system',
ADD COLUMN IF NOT EXISTS font_size text DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS notification_preferences jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS last_login timestamp with time zone;

-- Asegurar que los campos requeridos no sean null
ALTER TABLE profiles 
ALTER COLUMN id SET NOT NULL,
ALTER COLUMN updated_at SET DEFAULT timezone('utc'::text, now());

-- Agregar constraints de validación
ALTER TABLE profiles
ADD CONSTRAINT valid_theme CHECK (theme IN ('light', 'dark', 'system')),
ADD CONSTRAINT valid_font_size CHECK (font_size IN ('small', 'medium', 'large'));

-- Actualizar la política RLS para acceso a perfiles
CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Función para actualizar last_login
CREATE OR REPLACE FUNCTION public.handle_auth_user_login()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET last_login = now()
  WHERE id = auth.uid();
  RETURN NEW;
END;
$$;

-- Trigger para actualizar last_login en cada inicio de sesión
DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;
CREATE TRIGGER on_auth_user_login
  AFTER INSERT OR UPDATE OF last_sign_in_at
  ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auth_user_login();

COMMENT ON TABLE public.profiles IS 'Tabla que almacena información de perfil de usuario y preferencias';