-- Crear tabla para persistir layouts del dashboard
-- Esta tabla es necesaria para el feature del dashboard pastel

CREATE TABLE IF NOT EXISTS public.dashboard_layouts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  layout jsonb NOT NULL, -- Array de widgets con sus posiciones y configuraciones
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Un usuario solo puede tener un layout
  UNIQUE(user_id)
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_dashboard_layouts_user_id ON public.dashboard_layouts(user_id);

-- Habilitar RLS
ALTER TABLE public.dashboard_layouts ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view own dashboard layout" ON public.dashboard_layouts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own dashboard layout" ON public.dashboard_layouts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own dashboard layout" ON public.dashboard_layouts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own dashboard layout" ON public.dashboard_layouts
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger para actualizar updated_at
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
