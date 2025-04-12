-- Asegúrate de que RLS esté habilitado para la tabla pantry_items
-- Puedes hacerlo desde el Dashboard de Supabase (Authentication -> Policies -> pantry_items -> Enable RLS)
-- o con el siguiente comando SQL:
-- ALTER TABLE public.pantry_items ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si es necesario (opcional, usar con precaución)
-- DROP POLICY IF EXISTS "Allow authenticated users to select their own pantry items" ON public.pantry_items;
-- DROP POLICY IF EXISTS "Allow authenticated users to insert their own pantry items" ON public.pantry_items;
-- DROP POLICY IF EXISTS "Allow authenticated users to update their own pantry items" ON public.pantry_items;
-- DROP POLICY IF EXISTS "Allow authenticated users to delete their own pantry items" ON public.pantry_items;

-- Crear la tabla meal_plan_entries ANTES de las políticas de pantry
    CREATE TABLE public.meal_plan_entries (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        entry_date date NOT NULL,
        meal_type text NOT NULL, -- Ejemplo: 'Desayuno', 'Almuerzo', 'Cena'
        recipe_id uuid NULL, -- FK se añadirá en migración 039
        title text NULL, -- Para comidas sin receta específica
        notes text NULL,
        created_at timestamptz DEFAULT timezone('utc'::text, now()),
        updated_at timestamptz DEFAULT timezone('utc'::text, now())
    );

    ALTER TABLE public.meal_plan_entries ENABLE ROW LEVEL SECURITY;

    -- Políticas RLS básicas para meal_plan_entries (permitir al usuario manejar las suyas)
    CREATE POLICY "Allow users to manage their own meal plan entries" ON public.meal_plan_entries
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

    COMMENT ON TABLE public.meal_plan_entries IS 'Stores entries for the user''s meal plan.';
    COMMENT ON COLUMN public.meal_plan_entries.recipe_id IS 'Optional reference to a recipe.';
    COMMENT ON COLUMN public.meal_plan_entries.title IS 'Title if no specific recipe is linked.';

    -- Trigger para updated_at (usando la función de 001)
    CREATE TRIGGER on_meal_plan_entries_updated
      BEFORE UPDATE ON public.meal_plan_entries
      FOR EACH ROW
      EXECUTE PROCEDURE public.handle_updated_at();

    -- FIN de la creación de meal_plan_entries --
    -- El resto del archivo (políticas de pantry) sigue debajo...

-- 1. Política SELECT: Permitir leer propios ítems
DROP POLICY IF EXISTS "Allow authenticated users to select their own pantry items" ON public.pantry_items; -- Añadida
CREATE POLICY "Allow authenticated users to select their own pantry items"
ON public.pantry_items
FOR SELECT
TO authenticated -- Aplica a usuarios autenticados
USING (auth.uid() = user_id); -- Condición: el user_id de la fila debe coincidir con el uid del usuario actual

-- 2. Política INSERT: Permitir insertar ítems propios
DROP POLICY IF EXISTS "Allow authenticated users to insert their own pantry items" ON public.pantry_items; -- Añadida
CREATE POLICY "Allow authenticated users to insert their own pantry items"
ON public.pantry_items
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id); -- Condición: el user_id que se intenta insertar debe coincidir con el uid del usuario actual

-- 3. Política UPDATE: Permitir actualizar ítems propios
DROP POLICY IF EXISTS "Allow authenticated users to update their own pantry items" ON public.pantry_items;
CREATE POLICY "Allow authenticated users to update their own pantry items"
ON public.pantry_items
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id) -- Condición para qué filas se pueden actualizar
WITH CHECK (auth.uid() = user_id); -- Condición adicional sobre los datos actualizados (opcional pero bueno para user_id)

-- 4. Política DELETE: Permitir eliminar ítems propios
DROP POLICY IF EXISTS "Allow authenticated users to delete their own pantry items" ON public.pantry_items;
CREATE POLICY "Allow authenticated users to delete their own pantry items"
ON public.pantry_items
FOR DELETE
TO authenticated
USING (auth.uid() = user_id); -- Condición: solo se pueden eliminar filas cuyo user_id coincida con el uid del usuario actual

-- Nota: Asegúrate de que la columna 'user_id' en 'pantry_items' tenga una referencia (Foreign Key)
-- a la tabla 'auth.users' para que auth.uid() funcione correctamente y para mantener la integridad referencial.
-- Si no existe, puedes añadirla con:
-- ALTER TABLE public.pantry_items
-- ADD CONSTRAINT pantry_items_user_id_fkey
-- FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
-- (Considera si ON DELETE CASCADE es apropiado para tu caso de uso)