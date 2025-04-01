import { supabase } from '../../lib/supabaseClient';
import { PantryItem, CreatePantryItemData, UpdatePantryItemData, Category } from './types';
import { findOrCreateIngredient, normalizeIngredientName } from '../ingredients/ingredientService';

/**
 * Obtiene todos los items de la despensa para el usuario actual.
 * Incluye información básica del ingrediente y la categoría.
 */
export const getPantryItems = async (): Promise<PantryItem[]> => {
  try {
    // 1. Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error("Error getting auth user:", authError);
      throw new Error("Error de autenticación");
    }
    if (!user) {
      console.error("No user found in session");
      throw new Error("Usuario no autenticado");
    }

    console.log("Auth check passed. User ID:", user.id);

    // 2. Verificar que la tabla existe y los permisos
    const { error: tableCheckError } = await supabase
      .from('pantry_items')
      .select('id')
      .limit(1);

    if (tableCheckError) {
      console.error("Error checking pantry_items table:", tableCheckError);
      throw new Error("Error accediendo a la tabla pantry_items");
    }

    console.log("Table check passed. Fetching items...");

    // 3. Obtener items (solo datos básicos inicialmente)
    const { data, error: fetchError } = await supabase
      .from('pantry_items')
      .select('*, ingredients(*), categories(*)') // Incluir datos de ingredientes y categorías
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error("Error fetching pantry items:", fetchError);
      throw fetchError;
    }

    console.log(`Successfully fetched ${data?.length ?? 0} items`);
    // Mapear la respuesta de Supabase a la estructura esperada
    const mappedData = (data || []).map(item => ({
      ...item,
      ingredient: item.ingredients ? {
        name: normalizeIngredientName(item.ingredients.name, item.quantity ?? 1)
      } : null,
      category: item.categories,
      // Limpiar propiedades de Supabase que no necesitamos
      ingredients: undefined,
      categories: undefined
    }));
    console.log("Mapped pantry items:", mappedData); // DEBUG
    return mappedData;
  } catch (error) {
    console.error("getPantryItems failed:", error);
    throw error;
  }
};

/**
 * Añade un nuevo item a la despensa.
 * Busca o crea el ingrediente asociado.
 */
export const addPantryItem = async (itemData: CreatePantryItemData): Promise<PantryItem> => {
   const { data: { user } } = await supabase.auth.getUser();
   if (!user) throw new Error("Usuario no autenticado");

   console.log("Adding pantry item:", itemData);

   // Buscar o crear el ingrediente, pasando la cantidad para singular/plural
   const ingredient = await findOrCreateIngredient(
     itemData.ingredient_name,
     itemData.quantity ?? 1
   );
   if (!ingredient) {
       throw new Error(`No se pudo crear/encontrar el ingrediente "${itemData.ingredient_name}"`);
   }

   const newItemData = {
     user_id: user.id,
     ingredient_id: ingredient.id,
     quantity: itemData.quantity ?? 1, // Usar 1 como default si es null
     unit: itemData.unit,
     expiry_date: itemData.expiry_date,
     category_id: itemData.category_id,
     price: itemData.price, // Fase 2
     notes: itemData.notes, // Fase 2
     min_stock: itemData.min_stock, // Fase 2
     target_stock: itemData.target_stock, // Fase 2
     tags: itemData.tags, // Fase 2
   };

   const { data, error } = await supabase
     .from('pantry_items')
     .insert(newItemData)
     .select('*, ingredients(*), categories(*)') // Devolver datos relacionados
     .single(); // Esperamos un solo resultado

   if (error) {
     console.error("Error adding pantry item:", error);
     throw error;
   }

   console.log("Raw pantry item added:", data);
   // Mapear al formato esperado
   const mappedData = {
       ...data,
       // Usar el nombre normalizado del ingrediente basado en la cantidad actual
       ingredient: data.ingredients ? {
         name: normalizeIngredientName(data.ingredients.name, data.quantity ?? 1)
       } : null,
       category: data.categories,
       // Limpiar propiedades de Supabase
       ingredients: undefined,
       categories: undefined
   };
   console.log("Mapped pantry item:", mappedData); // DEBUG
   return mappedData as PantryItem;
};

/**
 * Actualiza un item existente en la despensa.
 */
export const updatePantryItem = async (itemId: string, updateData: UpdatePantryItemData): Promise<PantryItem> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuario no autenticado");

  console.log(`Updating pantry item ${itemId} for user ${user.id}:`, updateData);

  // Asegurarse de que solo el dueño pueda actualizar (aunque RLS debería manejar esto)
  const { data, error } = await supabase
    .from('pantry_items')
    .update({
        quantity: updateData.quantity,
        unit: updateData.unit,
        expiry_date: updateData.expiry_date,
        category_id: updateData.category_id,
        location: updateData.location, // Fase 2
        price: updateData.price, // Fase 2
        notes: updateData.notes, // Fase 2
        min_stock: updateData.min_stock, // Fase 2
        target_stock: updateData.target_stock, // Fase 2
        updated_at: new Date().toISOString(),
        tags: updateData.tags, // Fase 2
    })
    .eq('id', itemId)
    .eq('user_id', user.id) // Doble chequeo por seguridad
    .select('*, ingredients(*), categories(*)') // Devolver datos relacionados
    .single();

  if (error) {
    console.error("Error updating pantry item:", error);
    throw error;
  }
  if (!data) {
      throw new Error("Item no encontrado o permiso denegado para actualizar.");
  }

  console.log("Raw pantry item updated:", data);
  // Mapear al formato esperado
  const mappedData = {
      ...data,
      ingredient: data.ingredients ? {
        name: normalizeIngredientName(data.ingredients.name, data.quantity ?? 1)
      } : null,
      category: data.categories,
      // Limpiar propiedades de Supabase
      ingredients: undefined,
      categories: undefined
  };
  console.log("Mapped updated item:", mappedData); // DEBUG
  return mappedData as PantryItem;
};

/**
 * Elimina un item de la despensa.
 */
export const deletePantryItem = async (itemId: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuario no autenticado");

  console.log(`Deleting pantry item ${itemId} for user ${user.id}`);

  const { error } = await supabase
    .from('pantry_items')
    .delete()
    .eq('id', itemId)
    .eq('user_id', user.id); // Asegurar que solo el dueño borre

  if (error) {
    console.error("Error deleting pantry item:", error);
    throw error;
  }
  console.log("Pantry item deleted successfully:", itemId);
};

/**
 * Obtiene todas las categorías disponibles (por defecto y del usuario).
 */
export const getCategories = async (): Promise<Category[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    // No requerimos usuario para categorías por defecto, pero sí para las personalizadas

    console.log("Fetching categories...");

    // Construir el filtro OR dinámicamente para evitar errores si user es null
    const orFilter = user ? `is_default.eq.true,user_id.eq.${user.id}` : 'is_default.eq.true';

    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .or(orFilter) // Obtener default O las del usuario (si está logueado)
        .order('is_default', { ascending: false }) // Default primero
        .order('order', { ascending: true }); // Luego por orden

    if (error) {
        console.error("Error fetching categories:", error);
        throw error;
    }
    console.log(`Categories fetched: ${data?.length ?? 0}`);
    return (data || []) as Category[];
};


/**
 * Elimina múltiples items de la despensa basados en sus IDs.
 */
export const deleteMultiplePantryItems = async (itemIds: string[]): Promise<void> => {
  if (!itemIds || itemIds.length === 0) {
    console.log("No item IDs provided for deletion.");
    return; // No hacer nada si no hay IDs
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuario no autenticado");

  console.log(`Deleting ${itemIds.length} pantry items for user ${user.id}:`, itemIds);

  const { error } = await supabase
    .from('pantry_items')
    .delete()
    .in('id', itemIds) // Usar 'in' para borrar múltiples IDs
    .eq('user_id', user.id); // Asegurar que solo el dueño borre

  if (error) {
    console.error("Error deleting multiple pantry items:", error);
    throw error;
  }
  console.log("Multiple pantry items deleted successfully:", itemIds);
};

// TODO: Implementar ingredientService para buscar/crear ingredientes
// export const ingredientService = { ... }
