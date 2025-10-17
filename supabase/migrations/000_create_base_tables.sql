-- Migración base para crear todas las tablas fundamentales
-- Esta migración debe ejecutarse ANTES que todas las demás

-- Crear tabla de perfiles (profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
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
CREATE TABLE IF NOT EXISTS public.ingredients (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  image_url text,
  category text,
  is_common boolean DEFAULT false,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Crear tabla de pantry_items
CREATE TABLE IF NOT EXISTS public.pantry_items (
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
  category_id text, -- Cambiado a TEXT para coincidir con categories.id
  is_favorite boolean DEFAULT false,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Crear tabla de recipes
CREATE TABLE IF NOT EXISTS public.recipes (
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
  category_id text,
  main_ingredients text[],
  tags text[],
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Crear tabla de recipe_ingredients
CREATE TABLE IF NOT EXISTS public.recipe_ingredients (
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
CREATE TABLE IF NOT EXISTS public.shopping_list_items (
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
CREATE TABLE IF NOT EXISTS public.meal_plan_entries (
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
CREATE TABLE IF NOT EXISTS public.category_keywords (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword text NOT NULL UNIQUE,
  category_id text NOT NULL,
  priority integer DEFAULT 1,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Crear tabla de user_preferences
CREATE TABLE IF NOT EXISTS public.user_preferences (
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
CREATE TABLE IF NOT EXISTS public.recipe_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipe_id uuid REFERENCES public.recipes(id) ON DELETE CASCADE NOT NULL,
  action text NOT NULL, -- 'created', 'viewed', 'favorited', 'unfavorited'
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Crear tabla de variety_metrics
CREATE TABLE IF NOT EXISTS public.variety_metrics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  metric_type text NOT NULL, -- 'ingredient_variety', 'category_variety', 'cuisine_variety'
  value numeric NOT NULL,
  calculated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Crear índices básicos
CREATE INDEX IF NOT EXISTS idx_pantry_items_user_id ON public.pantry_items(user_id);
CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON public.recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_shopping_list_items_user_id ON public.shopping_list_items(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_plan_entries_user_id ON public.meal_plan_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_category_keywords_keyword ON public.category_keywords(keyword);

-- Habilitar RLS en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pantry_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plan_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variety_metrics ENABLE ROW LEVEL SECURITY;

SELECT 'Todas las tablas base creadas exitosamente';
