-- Fase 5: Vincular Recipe Ingredients a la tabla Ingredients

-- 1. Eliminar la columna 'ingredient_name' de 'recipe_ingredients'
--    Nota: Esto eliminará los datos existentes en esta columna.
--    La migración de datos no está contemplada en esta fase.
ALTER TABLE public.recipe_ingredients
DROP COLUMN IF EXISTS ingredient_name; -- Usar IF EXISTS por si se ejecuta múltiples veces

-- 2. Añadir la columna 'ingredient_id' a 'recipe_ingredients'
--    La hacemos NOT NULL ya que cada ingrediente de receta debe estar vinculado.
ALTER TABLE public.recipe_ingredients
ADD COLUMN IF NOT EXISTS ingredient_id uuid; -- Añadir solo si no existe

-- Actualizar la columna para que sea NOT NULL después de añadirla (si es necesario asegurar que no haya nulos)
-- Sin embargo, como no hay migración de datos, podemos añadirla como NOT NULL directamente si la tabla está vacía
-- o si estamos seguros de que no habrá problemas. Para ser más seguro en un entorno real,
-- se añadiría nullable, se poblarían los datos (si hubiera migración) y luego se haría NOT NULL.
-- Dado que no hay migración, la añadiré y luego la haré NOT NULL.

-- Asegurarse de que la columna sea NOT NULL (si se añadió como nullable antes)
-- ALTER TABLE public.recipe_ingredients ALTER COLUMN ingredient_id SET NOT NULL;
-- Por simplicidad y dado el contexto (sin migración de datos), intentaremos añadirla como NOT NULL directamente.
-- Si falla porque la tabla tiene filas, habría que ajustar la estrategia.
-- Reintentando con ADD COLUMN ... NOT NULL directamente:
-- Eliminar la columna si se añadió previamente sin NOT NULL
ALTER TABLE public.recipe_ingredients DROP COLUMN IF EXISTS ingredient_id;
-- Añadirla como NOT NULL
ALTER TABLE public.recipe_ingredients ADD COLUMN ingredient_id uuid NOT NULL;


-- 3. Añadir la clave foránea a 'ingredients.id'
--    Asume que la tabla 'ingredients' existe y tiene una columna 'id' de tipo uuid PRIMARY KEY.
--    Si esta restricción falla, la tabla 'ingredients' no existe, 'id' no es uuid, o no es PRIMARY KEY/UNIQUE.
ALTER TABLE public.recipe_ingredients
ADD CONSTRAINT fk_recipe_ingredients_ingredient_id -- Nombre explícito para la restricción
FOREIGN KEY (ingredient_id)
REFERENCES public.ingredients(id)
ON DELETE RESTRICT -- Opcional: Define qué hacer si se elimina un ingrediente referenciado. RESTRICT previene la eliminación. CASCADE podría ser otra opción.
ON UPDATE CASCADE; -- Opcional: Si el id del ingrediente cambia (poco probable para UUIDs), actualiza aquí.

-- 4. Opcional: Añadir un índice a ingredient_id para mejorar el rendimiento de los joins
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_ingredient_id ON public.recipe_ingredients(ingredient_id);