-- Crear la tabla para almacenar los ítems de la lista de compras persistente
CREATE TABLE public.shopping_list_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid DEFAULT auth.uid() NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ingredient_name text NOT NULL,
    quantity numeric, -- Usar numeric para flexibilidad
    unit text,
    is_checked boolean DEFAULT false NOT NULL,
    recipe_source text, -- Opcional: De qué receta vino el ingrediente
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para optimizar consultas comunes
CREATE INDEX idx_shopping_list_items_user_id ON public.shopping_list_items USING btree (user_id);
CREATE INDEX idx_shopping_list_items_user_checked ON public.shopping_list_items USING btree (user_id, is_checked);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.shopping_list_items ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver/modificar/eliminar sus propios ítems
CREATE POLICY "Allow users to manage their own shopping list items"
ON public.shopping_list_items
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Trigger para actualizar automáticamente 'updated_at'
CREATE TRIGGER handle_updated_at
BEFORE UPDATE ON public.shopping_list_items
FOR EACH ROW
EXECUTE PROCEDURE public.handle_updated_at();

-- Comentarios sobre las columnas
COMMENT ON COLUMN public.shopping_list_items.ingredient_name IS 'Nombre del ingrediente.';
COMMENT ON COLUMN public.shopping_list_items.quantity IS 'Cantidad necesaria.';
COMMENT ON COLUMN public.shopping_list_items.unit IS 'Unidad de medida (ej. gr, kg, unidad, ml, l).';
COMMENT ON COLUMN public.shopping_list_items.is_checked IS 'Indica si el ítem ha sido marcado como comprado.';
COMMENT ON COLUMN public.shopping_list_items.recipe_source IS 'Opcional: Nombre o ID de la receta que originó este ítem.';