-- Asegurarse de que la categoría 'Carnes' exista y obtener su ID.
-- Reemplazar 'ID_CATEGORIA_CARNES' con el UUID real de la categoría 'Carnes'.
-- Si la categoría no existe, descomentar y ajustar la siguiente línea:
-- INSERT INTO categories (name) VALUES ('Carnes') ON CONFLICT (name) DO NOTHING;

-- Insertar las keywords para carnes
-- Usamos un subquery para obtener el ID de la categoría 'Carnes' dinámicamente.
-- Asegúrate de que la categoría 'Carnes' exista en tu tabla 'categories'.
INSERT INTO category_keywords (keyword, category_id, priority)
VALUES
  ('milanesa', 'meat', 10), -- Usar ID 'meat' directamente
  ('pollo', 'meat', 10),    -- Usar ID 'meat' directamente
  ('carne', 'meat', 10),    -- Usar ID 'meat' directamente
  ('mila', 'meat', 5) -- Para 'milas', usar ID 'meat' directamente
ON CONFLICT (keyword, category_id) DO NOTHING; -- Evitar duplicados si ya existen por alguna razón

-- Forzar la recarga de keywords en la aplicación después de aplicar la migración
-- (Esto es conceptual, la recarga real sucede en categoryInference.ts si keywordsLoaded es false)
-- Considera llamar a reloadKeywords() manualmente o reiniciar la app si es necesario.