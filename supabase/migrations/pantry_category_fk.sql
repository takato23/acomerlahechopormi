-- Añadir relación de Clave Foránea (Foreign Key) entre pantry_items y categories

-- Prerrequisitos:
-- 1. La tabla 'public.categories' debe existir y tener una columna 'id' (PK, UUID).
-- 2. La tabla 'public.pantry_items' debe existir y tener una columna 'category_id' (UUID, Nullable).

-- Añadir la constraint de Foreign Key
ALTER TABLE public.pantry_items
ADD CONSTRAINT pantry_items_category_id_fkey
FOREIGN KEY (category_id) REFERENCES public.categories(id)
ON DELETE SET NULL -- Opcional: Si se elimina una categoría, poner NULL en pantry_items.category_id
ON UPDATE CASCADE; -- Opcional: Si el ID de una categoría cambia (raro), actualizarlo aquí.

-- Nota: Si la columna category_id no existe en pantry_items, créala primero:
-- ALTER TABLE public.pantry_items ADD COLUMN category_id UUID;
-- (Asegúrate de que sea nullable si algunos ítems no tendrán categoría)

-- Nota 2: Si la tabla 'categories' no existe, deberás crearla primero
-- con al menos una columna 'id' (UUID, Primary Key).