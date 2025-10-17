-- Script para aplicar las migraciones del dashboard pastel localmente
-- Ejecutar en el SQL Editor de Supabase Dashboard

-- ===========================================
-- 1. Agregar campo estimated_time a recipes
-- ===========================================

-- Agregar columna estimated_time si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'recipes'
        AND column_name = 'estimated_time'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.recipes ADD COLUMN estimated_time integer;
    END IF;
END $$;

-- Agregar comentario
COMMENT ON COLUMN public.recipes.estimated_time IS 'Tiempo total estimado en minutos para preparar y cocinar la receta';

-- Actualizar registros existentes
UPDATE public.recipes
SET estimated_time = COALESCE(prep_time_minutes, 0) + COALESCE(cook_time_minutes, 0)
WHERE estimated_time IS NULL;

-- ===========================================
-- 2. Crear tabla dashboard_layouts
-- ===========================================

-- Crear tabla si no existe
CREATE TABLE IF NOT EXISTS public.dashboard_layouts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  layout jsonb NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id)
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_dashboard_layouts_user_id ON public.dashboard_layouts(user_id);

-- Habilitar RLS
ALTER TABLE public.dashboard_layouts ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
DROP POLICY IF EXISTS "Users can view own dashboard layout" ON public.dashboard_layouts;
CREATE POLICY "Users can view own dashboard layout" ON public.dashboard_layouts
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own dashboard layout" ON public.dashboard_layouts;
CREATE POLICY "Users can create own dashboard layout" ON public.dashboard_layouts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own dashboard layout" ON public.dashboard_layouts;
CREATE POLICY "Users can update own dashboard layout" ON public.dashboard_layouts
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own dashboard layout" ON public.dashboard_layouts;
CREATE POLICY "Users can delete own dashboard layout" ON public.dashboard_layouts
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_dashboard_layouts_updated_at_trigger ON public.dashboard_layouts;
CREATE OR REPLACE FUNCTION update_dashboard_layouts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_dashboard_layouts_updated_at_trigger
  BEFORE UPDATE ON public.dashboard_layouts
  FOR EACH ROW EXECUTE FUNCTION update_dashboard_layouts_updated_at();

-- ===========================================
-- 3. Actualizar consulta getPlannedMeals
-- ===========================================

-- Esta parte se hace en el código, no en SQL
-- Ya actualizamos src/features/planning/planningService.ts

SELECT '✅ Migraciones del dashboard pastel aplicadas exitosamente' as resultado;
