import { Database } from '@/lib/database.types'; // Importar tipos generados por Supabase

// Tipo principal para un ítem de la lista de compras, basado en Supabase
export type ShoppingListItem = Database['public']['Tables']['shopping_list_items']['Row'] & {
  // Añadir relaciones si son necesarias y no están en el tipo base
  // Ejemplo: Si hubiera una relación con 'ingredients' o 'categories'
  // ingredients?: Database['public']['Tables']['ingredients']['Row'] | null;
  // categories?: Database['public']['Tables']['categories']['Row'] | null;
};

// Tipo para crear un nuevo ítem en la lista de compras
// Omitimos campos generados por la BD o gestionados por el servicio
export type NewShoppingListItem = Omit<ShoppingListItem,
  'id' |
  'user_id' |
  'created_at' |
  'updated_at' |
  'is_purchased' // is_purchased se establece en false por defecto en el servicio
> & {
  // Campos opcionales o requeridos específicamente para la creación
  name: string; // Requerido al crear
  quantity?: number | string | null; // Permitir string para parseo inicial
  unit?: string | null;
  category_id?: string | null; // Opcional al crear
  notes?: string | null; // Opcional al crear
};

// Tipo para actualizar un ítem existente
// Usamos Partial para permitir actualizar solo algunos campos
export type UpdateShoppingListItem = Partial<Omit<ShoppingListItem,
  'id' |        // No se actualiza el ID
  'user_id' |   // No se actualiza el user_id
  'created_at'  // No se actualiza created_at
>>;

// Ejemplo de cómo se podría usar UpdateShoppingListItem:
// const updates: UpdateShoppingListItem = {
//   is_purchased: true,
//   quantity: 5,
//   notes: "Comprar marca específica"
// };