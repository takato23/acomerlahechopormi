-- Migración completa para crear todo el esquema de la aplicación "A Comerla"
-- Esta migración reemplaza todas las migraciones anteriores

-- ===========================================
-- TABLAS BASE
-- ===========================================

-- Crear tabla de perfiles (profiles)
DROP TABLE IF EXISTS public.profiles CASCADE;
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users(id) PRIMARY KEY,
  username text UNIQUE,
  avatar_url text,
  gemini_api_key text,
  dietary_restrictions text[],
  disliked_ingredients text[],
  preferred_cuisines text[],
  cooking_skill_level text,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Crear tabla de ingredients
DROP TABLE IF EXISTS public.ingredients CASCADE;
CREATE TABLE public.ingredients (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  image_url text,
  category text,
  is_common boolean DEFAULT false,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Crear tabla de categories
DROP TABLE IF EXISTS public.categories CASCADE;
CREATE TABLE public.categories (
  id text PRIMARY KEY,
  name text NOT NULL,
  icon text NULL,
  color text NULL,
  "order" integer NOT NULL DEFAULT 0,
  user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Crear tabla de pantry_items
DROP TABLE IF EXISTS public.pantry_items CASCADE;
CREATE TABLE public.pantry_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ingredient_id uuid REFERENCES public.ingredients(id) ON DELETE SET NULL,
  ingredient_name text,
  quantity numeric NOT NULL,
  unit text NOT NULL,
  expiry_date date,
  location text,
  price numeric,
  notes text,
  min_stock numeric,
  target_stock numeric,
  tags text[],
  category_id text REFERENCES public.categories(id) ON DELETE SET NULL,
  is_favorite boolean DEFAULT false,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Crear tabla de recipes
DROP TABLE IF EXISTS public.recipes CASCADE;
CREATE TABLE public.recipes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  instructions text[],
  prep_time_minutes integer,
  cook_time_minutes integer,
  servings integer DEFAULT 2,
  image_url text,
  is_favorite boolean DEFAULT false,
  category_id text REFERENCES public.categories(id) ON DELETE SET NULL,
  main_ingredients text[],
  tags text[],
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Crear tabla de recipe_ingredients
DROP TABLE IF EXISTS public.recipe_ingredients CASCADE;
CREATE TABLE public.recipe_ingredients (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id uuid REFERENCES public.recipes(id) ON DELETE CASCADE NOT NULL,
  ingredient_id uuid REFERENCES public.ingredients(id) ON DELETE SET NULL,
  ingredient_name text,
  quantity numeric,
  unit text,
  notes text,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Crear tabla de shopping_list_items
DROP TABLE IF EXISTS public.shopping_list_items CASCADE;
CREATE TABLE public.shopping_list_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ingredient_id uuid REFERENCES public.ingredients(id) ON DELETE SET NULL,
  ingredient_name text NOT NULL,
  quantity numeric NOT NULL,
  unit text NOT NULL,
  is_purchased boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Crear tabla de meal_plan_entries
DROP TABLE IF EXISTS public.meal_plan_entries CASCADE;
CREATE TABLE public.meal_plan_entries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_date date NOT NULL,
  meal_type text NOT NULL,
  recipe_id uuid REFERENCES public.recipes(id) ON DELETE SET NULL,
  custom_title text,
  notes text,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Crear tabla de category_keywords
DROP TABLE IF EXISTS public.category_keywords CASCADE;
CREATE TABLE public.category_keywords (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword text NOT NULL UNIQUE,
  category_id text NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  priority integer DEFAULT 1,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Crear tabla de user_preferences
DROP TABLE IF EXISTS public.user_preferences CASCADE;
CREATE TABLE public.user_preferences (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  dietary_restrictions text[],
  disliked_ingredients text[],
  preferred_cuisines text[],
  cooking_skill_level text,
  notifications_enabled boolean DEFAULT true,
  language text DEFAULT 'es',
  theme text DEFAULT 'light',
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Crear tabla de recipe_history
DROP TABLE IF EXISTS public.recipe_history CASCADE;
CREATE TABLE public.recipe_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipe_id uuid REFERENCES public.recipes(id) ON DELETE CASCADE NOT NULL,
  action text NOT NULL, -- 'created', 'viewed', 'favorited', 'unfavorited'
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Crear tabla de variety_metrics
DROP TABLE IF EXISTS public.variety_metrics CASCADE;
CREATE TABLE public.variety_metrics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  metric_type text NOT NULL, -- 'ingredient_variety', 'category_variety', 'cuisine_variety'
  value numeric NOT NULL,
  calculated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ===========================================
-- ÍNDICES
-- ===========================================

CREATE INDEX idx_pantry_items_user_id ON public.pantry_items(user_id);
CREATE INDEX idx_recipes_user_id ON public.recipes(user_id);
CREATE INDEX idx_shopping_list_items_user_id ON public.shopping_list_items(user_id);
CREATE INDEX idx_meal_plan_entries_user_id ON public.meal_plan_entries(user_id);
CREATE INDEX idx_category_keywords_keyword ON public.category_keywords(keyword);
CREATE INDEX idx_category_keywords_category_id ON public.category_keywords(category_id);
CREATE INDEX idx_recipe_ingredients_recipe_id ON public.recipe_ingredients(recipe_id);

-- ===========================================
-- ROW LEVEL SECURITY (RLS)
-- ===========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pantry_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plan_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variety_metrics ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- POLÍTICAS RLS
-- ===========================================

-- Profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Ingredients (público para lectura)
CREATE POLICY "Anyone can view ingredients" ON public.ingredients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create ingredients" ON public.ingredients FOR INSERT TO authenticated WITH CHECK (true);

-- Categories
CREATE POLICY "Users can view default and own categories" ON public.categories FOR SELECT USING (is_default = true OR auth.uid() = user_id);
CREATE POLICY "Users can create own categories" ON public.categories FOR INSERT WITH CHECK (auth.uid() = user_id AND is_default = false);
CREATE POLICY "Users can update own categories" ON public.categories FOR UPDATE USING (auth.uid() = user_id AND is_default = false);
CREATE POLICY "Users can delete own categories" ON public.categories FOR DELETE USING (auth.uid() = user_id AND is_default = false);

-- Pantry Items
CREATE POLICY "Users can view own pantry items" ON public.pantry_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own pantry items" ON public.pantry_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pantry items" ON public.pantry_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own pantry items" ON public.pantry_items FOR DELETE USING (auth.uid() = user_id);

-- Recipes
CREATE POLICY "Users can view own recipes" ON public.recipes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own recipes" ON public.recipes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own recipes" ON public.recipes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own recipes" ON public.recipes FOR DELETE USING (auth.uid() = user_id);

-- Recipe Ingredients
CREATE POLICY "Users can view ingredients of own recipes" ON public.recipe_ingredients FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.recipes WHERE id = recipe_id AND user_id = auth.uid())
);
CREATE POLICY "Users can create ingredients for own recipes" ON public.recipe_ingredients FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.recipes WHERE id = recipe_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update ingredients of own recipes" ON public.recipe_ingredients FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.recipes WHERE id = recipe_id AND user_id = auth.uid())
);
CREATE POLICY "Users can delete ingredients of own recipes" ON public.recipe_ingredients FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.recipes WHERE id = recipe_id AND user_id = auth.uid())
);

-- Shopping List Items
CREATE POLICY "Users can view own shopping list" ON public.shopping_list_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own shopping list items" ON public.shopping_list_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own shopping list items" ON public.shopping_list_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own shopping list items" ON public.shopping_list_items FOR DELETE USING (auth.uid() = user_id);

-- Meal Plan Entries
CREATE POLICY "Users can view own meal plans" ON public.meal_plan_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own meal plan entries" ON public.meal_plan_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own meal plan entries" ON public.meal_plan_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own meal plan entries" ON public.meal_plan_entries FOR DELETE USING (auth.uid() = user_id);

-- Category Keywords (público para lectura)
CREATE POLICY "Anyone can view category keywords" ON public.category_keywords FOR SELECT TO authenticated USING (true);

-- User Preferences
CREATE POLICY "Users can view own preferences" ON public.user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own preferences" ON public.user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON public.user_preferences FOR UPDATE USING (auth.uid() = user_id);

-- Recipe History
CREATE POLICY "Users can view own recipe history" ON public.recipe_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own recipe history" ON public.recipe_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Variety Metrics
CREATE POLICY "Users can view own metrics" ON public.variety_metrics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own metrics" ON public.variety_metrics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own metrics" ON public.variety_metrics FOR UPDATE USING (auth.uid() = user_id);

-- ===========================================
-- DATOS INICIALES
-- ===========================================

-- Categorías por defecto
INSERT INTO public.categories (id, name, icon, color, "order", is_default) VALUES
  ('vegetables', 'Verduras y Frutas', 'carrot', '#4ade80', 1, true),
  ('dairy', 'Lácteos y Huevos', 'milk', '#93c5fd', 2, true),
  ('meat', 'Carnes y Pescados', 'beef', '#fca5a5', 3, true),
  ('pantry', 'Almacén', 'package', '#fcd34d', 4, true),
  ('cleaning', 'Limpieza', 'spray', '#a5b4fc', 5, true),
  ('beverages', 'Bebidas', 'glass-water', '#f9a8d4', 6, true),
  ('frozen', 'Congelados', 'snowflake', '#93c5fd', 7, true),
  ('personal_care', 'Cuidado Personal', 'bath', '#f0abfc', 8, true),
  ('other', 'Otros', 'ellipsis', '#d4d4d4', 99, true)
ON CONFLICT (id) DO NOTHING;

-- Ingredientes comunes
INSERT INTO public.ingredients (name, category, is_common) VALUES
  ('Arroz', 'pantry', true),
  ('Frijoles', 'pantry', true),
  ('Pasta', 'pantry', true),
  ('Aceite de oliva', 'pantry', true),
  ('Sal', 'pantry', true),
  ('Azúcar', 'pantry', true),
  ('Harina', 'pantry', true),
  ('Leche', 'dairy', true),
  ('Huevos', 'dairy', true),
  ('Queso', 'dairy', true),
  ('Mantequilla', 'dairy', true),
  ('Pollo', 'meat', true),
  ('Carne molida', 'meat', true),
  ('Pescado', 'meat', true),
  ('Cebolla', 'vegetables', true),
  ('Ajo', 'vegetables', true),
  ('Tomate', 'vegetables', true),
  ('Papa', 'vegetables', true),
  ('Zanahoria', 'vegetables', true),
  ('Lechuga', 'vegetables', true)
ON CONFLICT DO NOTHING;

-- ===========================================
-- FUNCIONES Y RPC
-- ===========================================

-- Función para obtener las recetas más comunes
CREATE OR REPLACE FUNCTION public.get_most_common_recipes(user_uuid uuid, limit_count integer DEFAULT 10)
RETURNS TABLE (
  recipe_id uuid,
  title text,
  view_count bigint,
  favorite_count bigint,
  total_score bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.title,
    COUNT(CASE WHEN rh.action = 'viewed' THEN 1 END) as view_count,
    COUNT(CASE WHEN rh.action = 'favorited' THEN 1 END) as favorite_count,
    (COUNT(CASE WHEN rh.action = 'viewed' THEN 1 END) +
     COUNT(CASE WHEN rh.action = 'favorited' THEN 1 END) * 2) as total_score
  FROM public.recipes r
  LEFT JOIN public.recipe_history rh ON r.id = rh.recipe_id
  WHERE r.user_id = user_uuid
  GROUP BY r.id, r.title
  ORDER BY total_score DESC, r.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- MENSAJE FINAL
-- ===========================================

SELECT 'Esquema completo de "A Comerla" creado exitosamente con todas las tablas, índices, RLS y datos iniciales';
