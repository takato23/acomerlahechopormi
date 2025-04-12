-- 1. Crear la tabla 'recipes'
CREATE TABLE IF NOT EXISTS public.recipes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id),
    title text NOT NULL,
    description text,
    instructions text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 2. Habilitar RLS para 'recipes'
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

-- 3. Crear políticas RLS para 'recipes'
-- Los usuarios pueden seleccionar sus propias recetas
CREATE POLICY "Allow users to select their own recipes"
ON public.recipes
FOR SELECT
USING (auth.uid() = user_id);

-- Los usuarios pueden insertar sus propias recetas
CREATE POLICY "Allow users to insert their own recipes"
ON public.recipes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Los usuarios pueden actualizar sus propias recetas
CREATE POLICY "Allow users to update their own recipes"
ON public.recipes
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Los usuarios pueden eliminar sus propias recetas
CREATE POLICY "Allow users to delete their own recipes"
ON public.recipes
FOR DELETE
USING (auth.uid() = user_id);


-- 4. Crear la tabla 'recipe_ingredients'
CREATE TABLE IF NOT EXISTS public.recipe_ingredients (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id uuid NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    ingredient_name text NOT NULL,
    quantity numeric,
    unit text
);

-- 5. Habilitar RLS para 'recipe_ingredients'
ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;

-- 6. Crear políticas RLS para 'recipe_ingredients' (heredadas de 'recipes')
-- Los usuarios pueden seleccionar ingredientes de sus propias recetas
CREATE POLICY "Allow users to select ingredients for their own recipes"
ON public.recipe_ingredients
FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.recipes r
    WHERE r.id = recipe_ingredients.recipe_id AND r.user_id = auth.uid()
));

-- Los usuarios pueden insertar ingredientes en sus propias recetas
CREATE POLICY "Allow users to insert ingredients for their own recipes"
ON public.recipe_ingredients
FOR INSERT
WITH CHECK (EXISTS (
    SELECT 1 FROM public.recipes r
    WHERE r.id = recipe_ingredients.recipe_id AND r.user_id = auth.uid()
));

-- Los usuarios pueden actualizar ingredientes de sus propias recetas
CREATE POLICY "Allow users to update ingredients for their own recipes"
ON public.recipe_ingredients
FOR UPDATE
USING (EXISTS (
    SELECT 1 FROM public.recipes r
    WHERE r.id = recipe_ingredients.recipe_id AND r.user_id = auth.uid()
))
WITH CHECK (EXISTS (
    SELECT 1 FROM public.recipes r
    WHERE r.id = recipe_ingredients.recipe_id AND r.user_id = auth.uid()
));

-- Los usuarios pueden eliminar ingredientes de sus propias recetas
CREATE POLICY "Allow users to delete ingredients for their own recipes"
ON public.recipe_ingredients
FOR DELETE
USING (EXISTS (
    SELECT 1 FROM public.recipes r
    WHERE r.id = recipe_ingredients.recipe_id AND r.user_id = auth.uid()
));