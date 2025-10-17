export interface Category {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  icon_name?: string | null; // Nombre del icono lucide-react
  is_default?: boolean;
  is_common?: boolean;
  order?: number;
  user_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PantryItem {
  id: string;
  user_id: string;
  ingredient_id: string | null;
  ingredient_name?: string;
  quantity?: number | null;
  unit?: string | null;
  category_id?: string | null;
  expiry_date?: string | null;
  notes?: string | null;
  is_favorite?: boolean;
  created_at?: string;
  updated_at?: string;
  location?: string | null;
  price?: number | null;
  min_stock?: number | null;
  target_stock?: number | null;
  tags?: string[];
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
  quantity?: number | null;
  unit?: string | null;
  category_id?: string | null;
  expiry_date?: string | null;
  notes?: string | null;
  price?: number | null;
  location?: string | null;
  min_stock?: number | null;
  target_stock?: number | null;
  tags?: string[];
}

export interface UpdatePantryItemData {
  quantity?: number | null;
  unit?: string | null;
  category_id?: string | null;
  expiry_date?: string | null;
  notes?: string | null;
  price?: number | null;
  location?: string | null;
  min_stock?: number | null;
  target_stock?: number | null;
  tags?: string[];
}

export const COMMON_PANTRY_UNITS = [
  'unidad',
  'kg',
  'g',
  'l',
  'ml',
  'cucharada',
  'cucharadita',
  'taza',
  'vaso',
  'paquete',
  'lata',
  'botella',
  'pieza',
  'ramo'
];
