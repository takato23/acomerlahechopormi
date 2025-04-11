    -- Asegurarse de que RLS está habilitado en la tabla recipes
    ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

    -- Eliminar política de UPDATE existente si por alguna razón existe (para idempotencia)
    DROP POLICY IF EXISTS "Allow authenticated users to update their own recipes" ON public.recipes;

    -- Crear la política para permitir UPDATE a los usuarios autenticados sobre sus propias recetas
    CREATE POLICY "Allow authenticated users to update their own recipes"
    ON public.recipes
    FOR UPDATE
    USING (auth.uid() = user_id) -- El usuario solo puede actualizar si su UID coincide con el user_id de la receta
    WITH CHECK (auth.uid() = user_id); -- La misma condición se aplica al intentar insertar/actualizar

    GRANT UPDATE ON public.recipes TO authenticated;

    -- Nota: Asegúrate de que ya existan políticas para SELECT, INSERT, DELETE si son necesarias.
    -- Esta migración solo añade la política de UPDATE.
    -- Si no existen otras políticas, los usuarios autenticados podrían no poder ver/crear/borrar recetas.
    -- Considera añadir/verificar esas políticas también si encuentras más problemas de permisos.