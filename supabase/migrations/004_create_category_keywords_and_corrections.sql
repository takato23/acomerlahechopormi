-- Migración para crear tablas relacionadas con la categorización inteligente

-- 1. Tabla category_keywords
CREATE TABLE public.category_keywords (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    category_id text NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE, -- Cambiado a TEXT
    keyword text NOT NULL CHECK (char_length(keyword) > 0),
    priority integer DEFAULT 0 NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    
    -- Restricción única para evitar duplicados por categoría y keyword
    CONSTRAINT category_keywords_category_keyword_uniq UNIQUE (category_id, keyword)
);

-- Comentarios
COMMENT ON TABLE public.category_keywords IS 'Almacena palabras clave asociadas a categorías para la inferencia automática.';
COMMENT ON COLUMN public.category_keywords.category_id IS 'ID de la categoría a la que pertenece la keyword.';
COMMENT ON COLUMN public.category_keywords.keyword IS 'Palabra clave (en minúsculas, normalizada si es necesario).';
COMMENT ON COLUMN public.category_keywords.priority IS 'Prioridad de la keyword (mayor número = más peso). Útil para desempates.';

-- Índices
CREATE INDEX idx_category_keywords_category_id ON public.category_keywords USING btree (category_id);
CREATE INDEX idx_category_keywords_keyword ON public.category_keywords USING btree (keyword text_pattern_ops); -- Para búsquedas LIKE 'keyword%'
CREATE INDEX idx_category_keywords_keyword_priority ON public.category_keywords USING btree (keyword, priority DESC);

-- Habilitar RLS (si se requiere acceso restringido en el futuro, por ahora puede ser público para lectura)
ALTER TABLE public.category_keywords ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (Ejemplo: permitir lectura a todos los autenticados)
CREATE POLICY "Allow authenticated users to read keywords"
ON public.category_keywords
FOR SELECT
USING (auth.role() = 'authenticated');

-- Permitir inserción/actualización/eliminación solo a roles específicos (ej: admin, service_role)
-- (Ajustar según sea necesario)
CREATE POLICY "Allow admin or service roles to manage keywords"
ON public.category_keywords
FOR ALL -- INSERT, UPDATE, DELETE
USING (auth.role() = 'service_role') -- O verificar un rol personalizado de admin
WITH CHECK (auth.role() = 'service_role');


-- 2. Tabla user_category_corrections
CREATE TABLE public.user_category_corrections (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    item_name text NOT NULL,
    original_category_id text REFERENCES public.categories(id) ON DELETE SET NULL, -- Cambiado a TEXT
    corrected_category_id text NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE, -- Cambiado a TEXT
    timestamp timestamptz DEFAULT now() NOT NULL
);

-- Comentarios
COMMENT ON TABLE public.user_category_corrections IS 'Registra las correcciones manuales de categoría hechas por los usuarios.';
COMMENT ON COLUMN public.user_category_corrections.user_id IS 'Usuario que realizó la corrección.';
COMMENT ON COLUMN public.user_category_corrections.item_name IS 'Nombre original del ítem cuya categoría se corrigió.';
COMMENT ON COLUMN public.user_category_corrections.original_category_id IS 'Categoría inferida por el sistema (o null si no hubo inferencia).';
COMMENT ON COLUMN public.user_category_corrections.corrected_category_id IS 'Categoría correcta seleccionada por el usuario.';
COMMENT ON COLUMN public.user_category_corrections.timestamp IS 'Momento en que se realizó la corrección.';

-- Índices
CREATE INDEX idx_user_category_corrections_user_id ON public.user_category_corrections USING btree (user_id);
CREATE INDEX idx_user_category_corrections_item_name ON public.user_category_corrections USING btree (item_name text_pattern_ops);
CREATE INDEX idx_user_category_corrections_corrected_category_id ON public.user_category_corrections USING btree (corrected_category_id);

-- Habilitar RLS
ALTER TABLE public.user_category_corrections ENABLE ROW LEVEL SECURITY;

-- Políticas RLS

-- Permitir a los usuarios insertar sus propias correcciones
CREATE POLICY "Allow authenticated users to insert their own corrections"
ON public.user_category_corrections
FOR INSERT
WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

-- Permitir a los usuarios leer sus propias correcciones (opcional, podría no ser necesario)
-- CREATE POLICY "Allow authenticated users to read their own corrections"
-- ON public.user_category_corrections
-- FOR SELECT
-- USING (auth.role() = 'authenticated' AND auth.uid() = user_id);

-- Permitir a roles de servicio/admin leer todas las correcciones para análisis/aprendizaje
CREATE POLICY "Allow service/admin roles to read all corrections"
ON public.user_category_corrections
FOR SELECT
USING (auth.role() = 'service_role'); -- O verificar rol de admin

-- Asignar propietario y permisos
ALTER TABLE public.category_keywords OWNER TO postgres;
GRANT ALL ON TABLE public.category_keywords TO postgres;
GRANT ALL ON TABLE public.category_keywords TO service_role;
GRANT SELECT ON TABLE public.category_keywords TO authenticated; -- Permitir lectura a usuarios
-- GRANT INSERT, UPDATE, DELETE ON TABLE public.category_keywords TO authenticated; -- NO permitir escritura a usuarios normales

ALTER TABLE public.user_category_corrections OWNER TO postgres;
GRANT ALL ON TABLE public.user_category_corrections TO postgres;
GRANT ALL ON TABLE public.user_category_corrections TO service_role;
GRANT INSERT ON TABLE public.user_category_corrections TO authenticated; -- Permitir insertar sus correcciones
-- GRANT SELECT ON TABLE public.user_category_corrections TO authenticated; -- Opcional: permitir leer sus correcciones