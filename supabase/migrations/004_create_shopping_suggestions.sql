-- Crear la tabla para almacenar sugerencias de compras por usuario
CREATE TABLE public.shopping_suggestions (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL CHECK (char_length(name) > 0),
    category text,
    frequency integer DEFAULT 1 NOT NULL CHECK (frequency >= 0),
    last_used timestamptz DEFAULT now() NOT NULL,
    default_unit text,
    created_at timestamptz DEFAULT now() NOT NULL,
    
    -- Restricción única para evitar duplicados por usuario y nombre
    CONSTRAINT shopping_suggestions_user_name_uniq UNIQUE (user_id, name)
);

-- Comentarios sobre las columnas
COMMENT ON TABLE public.shopping_suggestions IS 'Almacena sugerencias de ítems de compra personalizadas para cada usuario.';
COMMENT ON COLUMN public.shopping_suggestions.user_id IS 'ID del usuario al que pertenece la sugerencia.';
COMMENT ON COLUMN public.shopping_suggestions.name IS 'Nombre del ítem sugerido.';
COMMENT ON COLUMN public.shopping_suggestions.category IS 'Categoría asociada al ítem (opcional).';
COMMENT ON COLUMN public.shopping_suggestions.frequency IS 'Número de veces que el usuario ha añadido/seleccionado este ítem.';
COMMENT ON COLUMN public.shopping_suggestions.last_used IS 'Fecha y hora de la última vez que se usó esta sugerencia.';
COMMENT ON COLUMN public.shopping_suggestions.default_unit IS 'Unidad por defecto asociada al ítem (ej: kg, lt, paquete).';

-- Índices para optimizar consultas comunes
CREATE INDEX idx_shopping_suggestions_user_freq_last ON public.shopping_suggestions USING btree (user_id, frequency DESC, last_used DESC);
CREATE INDEX idx_shopping_suggestions_user_name_search ON public.shopping_suggestions USING btree (user_id, name text_pattern_ops); -- Para búsquedas ilike 'name%'

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.shopping_suggestions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS

-- 1. Permitir a los usuarios leer sus propias sugerencias
CREATE POLICY "Allow authenticated users to read their own suggestions"
ON public.shopping_suggestions
FOR SELECT
USING (auth.role() = 'authenticated' AND auth.uid() = user_id);

-- 2. Permitir a los usuarios insertar nuevas sugerencias para sí mismos
CREATE POLICY "Allow authenticated users to insert their own suggestions"
ON public.shopping_suggestions
FOR INSERT
WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

-- 3. Permitir a los usuarios actualizar sus propias sugerencias (para upsert)
--    Esto incluye actualizar frecuencia, last_used, category, default_unit
CREATE POLICY "Allow authenticated users to update their own suggestions"
ON public.shopping_suggestions
FOR UPDATE
USING (auth.role() = 'authenticated' AND auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id); -- Asegurar que no cambien el user_id

-- 4. (Opcional) Permitir a los usuarios eliminar sus propias sugerencias
-- CREATE POLICY "Allow authenticated users to delete their own suggestions"
-- ON public.shopping_suggestions
-- FOR DELETE
-- USING (auth.role() = 'authenticated' AND auth.uid() = user_id);

-- Asegurar que el propietario de la tabla pueda hacer todo (necesario para Supabase)
ALTER TABLE public.shopping_suggestions OWNER TO postgres;
GRANT ALL ON TABLE public.shopping_suggestions TO postgres;
GRANT ALL ON TABLE public.shopping_suggestions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.shopping_suggestions TO authenticated;
