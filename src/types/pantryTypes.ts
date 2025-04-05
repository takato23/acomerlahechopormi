// import { Database } from '@/lib/database.types'; // Comentado temporalmente

// Usar el tipo generado por Supabase para PantryItem si está disponible y es adecuado
// o definir uno manualmente si es necesario mayor control o personalización.

// Opción 1: Usar tipo inferido de Supabase (Comentado temporalmente hasta regenerar tipos)
/*
export type PantryItem = Database['public']['Tables']['pantry_items']['Row'] & {
  // Añadir relaciones explícitas si no están en el tipo base o son necesarias
  ingredients?: Database['public']['Tables']['ingredients']['Row'] | null;
  // expiry_date?: string | null; // Añadir manualmente si no se regenera
};
*/

// Opción 2: Definición manual (Usaremos esta temporalmente)
export interface PantryItem {
  id: string;
  user_id: string;
  ingredient_id: string | null; // Puede ser null si es un ítem personalizado
  name: string; // Nombre del ítem (puede ser redundante si ingredient_id existe)
  quantity: number | null;
  unit: string | null;
  category_id?: string | null; // Opcional
  purchase_date?: string | null; // Opcional
  expiry_date?: string | null; // Opcional
  notes?: string | null; // Opcional
  is_favorite?: boolean; // Opcional
  created_at: string;
  updated_at?: string | null;

  // Relación (si se carga explícitamente)
  ingredients?: {
      id: string;
      name: string;
      // otros campos de ingredients...
  } | null;
  // expiry_date ya está definido arriba (línea 25)
}

// Tipo para crear un nuevo ítem (puede ser más simple)
// Ajustar NewPantryItem para incluir expiry_date y basarse en la interfaz manual
export type NewPantryItem = Omit<PantryItem, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'ingredients' | 'category'> & {
    name: string; // Requerido al crear
    // expiry_date es opcional y ya está en PantryItem
};

// Tipo para actualizar un ítem
// Ajustar UpdatePantryItem para basarse en la interfaz manual
export type UpdatePantryItem = Partial<Omit<PantryItem, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'ingredients' | 'category'>>;