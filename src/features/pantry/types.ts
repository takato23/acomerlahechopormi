export interface Category {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  icon_name?: string | null; // Nombre del icono lucide-react
  is_default?: boolean;
  is_common?: boolean;
  order?: number;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PantryItem {
  id: string;
  user_id: string;
  ingredient_id: string;
  quantity?: number;
  unit?: string;
  category_id?: string;
  expiry_date?: string;
  notes?: string;
  is_favorite?: boolean;
  created_at?: string;
  updated_at?: string;
  ingredient?: {
    id?: string;
    name: string;
    image_url?: string | null; // Añadir image_url aquí también
  };
  // La interfaz Category ya fue actualizada para incluir icon_name? Sí, en un paso anterior.
  category?: Category;
  _consolidatedCount?: number;
  _originalItems?: PantryItem[];
}

export interface CreatePantryItemData {
  ingredient_name: string;
  quantity?: number;
  unit?: string;
  category_id?: string;
  expiry_date?: string;
  notes?: string;
  price?: number;
  min_stock?: number;
  target_stock?: number;
  tags?: string[];
}

export interface UpdatePantryItemData {
  quantity?: number;
  unit?: string;
  category_id?: string;
  expiry_date?: string;
  notes?: string;
  price?: number;
  location?: string;
  min_stock?: number;
  target_stock?: number;
  tags?: string[];
}