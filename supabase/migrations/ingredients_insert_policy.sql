-- Política INSERT para la tabla 'ingredients'
-- Permite a cualquier usuario autenticado insertar nuevos ingredientes.

-- Asegúrate de que RLS esté habilitado para la tabla 'ingredients'
-- ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;

-- Crear la política INSERT
CREATE POLICY "Allow authenticated users to insert ingredients"
ON public.ingredients
FOR INSERT
TO authenticated -- Aplica a usuarios autenticados
WITH CHECK (true); -- La condición es siempre verdadera, permitiendo la inserción

-- Nota: Esta política asume que cualquier usuario logueado puede añadir
-- ingredientes a la lista maestra. Si necesitas restricciones más específicas
-- (ej: solo admins), ajusta la condición 'WITH CHECK'.