import { Database } from '@/lib/database.types'; // Corregir ruta de importación

// Usar el tipo generado por Supabase para PantryItem si está disponible y es adecuado
// o definir uno manualmente si es necesario mayor control o personalización.

// Opción 1: Usar tipo inferido de Supabase (preferido si coincide)
export type PantryItem = Database['public']['Tables']['pantry_items']['Row'] & {
  // Añadir relaciones explícitas si no están en el tipo base o son necesarias
  ingredients?: Database['public']['Tables']['ingredients']['Row'] | null;
};

// Opción 2: Definición manual (si el tipo de Supabase no es suficiente o claro)
/*
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
}
*/

// Tipo para crear un nuevo ítem (puede ser más simple)
export type NewPantryItem = Omit<PantryItem, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'ingredients'> & {
    // Campos requeridos/opcionales para la creación
    ingredient_id?: string | null; // Hacer opcional si se permite crear sin enlazar
    name: string; // Requerido al crear
    quantity: number | null;
    unit?: string | null;
};

// Tipo para actualizar un ítem
export type UpdatePantryItem = Partial<Omit<PantryItem, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'ingredients'>>;