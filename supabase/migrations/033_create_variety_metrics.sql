-- Migración para crear la tabla de métricas de variedad
-- Referencias: recipe_generation_enhancement_plan.md

-- Crear tipo ENUM para los tipos de métricas
DO $$ BEGIN
    CREATE TYPE metric_type AS ENUM (
        'protein_rotation',    -- Rotación de proteínas principales
        'cuisine_variety',     -- Variedad de tipos de cocina
        'cooking_method',      -- Métodos de cocción
        'ingredient_usage',    -- Uso de ingredientes principales
        'meal_type_balance'    -- Balance de tipos de comida
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Crear tabla de métricas de variedad
CREATE TABLE IF NOT EXISTS public.variety_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    metric_type metric_type NOT NULL,
    last_used JSONB NOT NULL DEFAULT '{}',     -- Último uso de cada elemento: {"item": "timestamp"}
    frequency_count JSONB NOT NULL DEFAULT '{}', -- Conteo de frecuencia: {"item": count}
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Asegurar una métrica por tipo por usuario
    CONSTRAINT unique_user_metric_type UNIQUE (user_id, metric_type)
);

-- Crear índices para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_variety_metrics_user 
ON variety_metrics(user_id);

CREATE INDEX IF NOT EXISTS idx_variety_metrics_type 
ON variety_metrics(metric_type);

-- Crear índices GIN para búsquedas en JSONB
CREATE INDEX IF NOT EXISTS idx_variety_metrics_last_used 
ON variety_metrics USING GIN (last_used);

CREATE INDEX IF NOT EXISTS idx_variety_metrics_frequency 
ON variety_metrics USING GIN (frequency_count);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_variety_metrics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_variety_metrics_updated_at
    BEFORE UPDATE ON variety_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_variety_metrics_updated_at();

-- Políticas RLS
ALTER TABLE public.variety_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own variety metrics"
    ON public.variety_metrics FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own variety metrics"
    ON public.variety_metrics FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own variety metrics"
    ON public.variety_metrics FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own variety metrics"
    ON public.variety_metrics FOR DELETE
    USING (auth.uid() = user_id);

-- Funciones de utilidad
-- Función para actualizar métricas de variedad
CREATE OR REPLACE FUNCTION update_variety_metric(
    p_user_id UUID,
    p_metric_type metric_type,
    p_item TEXT
)
RETURNS void AS $$
DECLARE
    current_count INT;
BEGIN
    -- Insertar o actualizar el registro de métrica
    INSERT INTO variety_metrics (user_id, metric_type, last_used, frequency_count)
    VALUES (
        p_user_id,
        p_metric_type,
        jsonb_build_object(p_item, now()::text),
        jsonb_build_object(p_item, 1)
    )
    ON CONFLICT (user_id, metric_type)
    DO UPDATE SET
        last_used = variety_metrics.last_used || 
                    jsonb_build_object(p_item, now()::text),
        frequency_count = 
            CASE 
                WHEN variety_metrics.frequency_count ? p_item 
                THEN jsonb_set(
                    variety_metrics.frequency_count,
                    ARRAY[p_item],
                    (COALESCE((variety_metrics.frequency_count->>p_item)::int, 0) + 1)::text::jsonb
                )
                ELSE variety_metrics.frequency_count || jsonb_build_object(p_item, 1)
            END;
END;
$$ LANGUAGE plpgsql;

-- Comentarios para documentación
COMMENT ON TABLE public.variety_metrics IS 'Registro de métricas de variedad para recomendaciones de recetas';
COMMENT ON COLUMN variety_metrics.metric_type IS 'Tipo de métrica de variedad (proteínas, cocina, método)';
COMMENT ON COLUMN variety_metrics.last_used IS 'Registro JSONB de últimos usos de elementos';
COMMENT ON COLUMN variety_metrics.frequency_count IS 'Conteo JSONB de frecuencia de uso de elementos';

-- Ejemplo de uso:
-- SELECT update_variety_metric('user-uuid', 'protein_rotation', 'chicken');