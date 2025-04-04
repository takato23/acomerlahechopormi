-- Update common categories with lucide-react icon names
-- Asegúrate de que los nombres de categoría ('Verduras y Frutas', etc.) coincidan EXACTAMENTE con los de tu tabla.

UPDATE public.categories
SET icon_name = 'Carrot'
WHERE name = 'Verduras y Frutas' AND is_default = true; -- Actualizar solo las por defecto si aplica

UPDATE public.categories
SET icon_name = 'Beef'
WHERE name = 'Carnes y Pescados' AND is_default = true;

UPDATE public.categories
SET icon_name = 'Milk'
WHERE name = 'Lácteos y Huevos' AND is_default = true; -- Asumiendo este nombre

UPDATE public.categories
SET icon_name = 'Archive' -- O 'Package'
WHERE name = 'Almacén' AND is_default = true;

UPDATE public.categories
SET icon_name = 'GlassWater'
WHERE name = 'Bebidas' AND is_default = true;

-- Puedes añadir más updates aquí para otras categorías comunes
-- UPDATE public.categories SET icon_name = 'Snowflake' WHERE name = 'Congelados' AND is_default = true;
-- UPDATE public.categories SET icon_name = 'Sandwich' WHERE name = 'Panadería' AND is_default = true;