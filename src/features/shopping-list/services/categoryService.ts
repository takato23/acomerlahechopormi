import { supabase } from '@/lib/supabaseClient'; // Importar supabase
// Usar any temporalmente
// import { Category, NewCategory, UpdateCategory } from '../types/categoryTypes';
type Category = any;
type NewCategory = any;
type UpdateCategory = any;
import { v4 as uuidv4 } from 'uuid'; 

const TABLE_NAME = 'categories'; // Nombre de la tabla en Supabase

/**
 * Obtiene todas las categorías (predefinidas + personalizadas del usuario).
 * Lee desde Supabase.
 */
export const getCategories = async (): Promise<Category[]> => {
  // Intentar obtener el usuario para filtrar personalizadas (opcional si RLS lo maneja)
  const { data: { user } } = await supabase.auth.getUser();

  // Consulta para obtener categorías:
  // - Las que son por defecto (is_default = true)
  // - O las que pertenecen al usuario actual (user_id = user.id)
  let query = supabase
    .from(TABLE_NAME)
    .select('*');

  if (user) {
    // Si hay usuario, aplicar filtro OR
    query = query.or(`is_default.eq.true,user_id.eq.${user.id}`);
  } else {
    // Si no hay usuario, solo traer las default
    query = query.eq('is_default', true);
  }

  // Ordenar por 'order' y luego por 'name'
  query = query.order('order', { ascending: true }).order('name', { ascending: true });

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching categories:', error);
    throw new Error('No se pudieron cargar las categorías.');
  }

  return data || [];
};

/**
 * Obtiene una categoría por su ID.
 * Lee desde Supabase.
 */
export const getCategoryById = async (id: string): Promise<Category | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    
    let query = supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('id', id);

    // Asegurar que el usuario pueda verla (sea default o suya)
    if (user) {
       query = query.or(`is_default.eq.true,user_id.eq.${user.id}`);
    } else {
       query = query.eq('is_default', true);
    }
    
    const { data, error } = await query.single(); // Espera una o ninguna

    if (error && error.code !== 'PGRST116') { // Ignorar error "not found"
       console.error('Error fetching category by ID:', error);
       throw new Error('Error al buscar la categoría.');
    }
    return data || null;
}

/**
 * Añade una nueva categoría personalizada.
 * Inserta en Supabase.
 */
export const addCategory = async (newCategoryData: NewCategory): Promise<Category> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado para crear categoría.');

  if (!newCategoryData.name?.trim()) {
    throw new Error('El nombre de la categoría no puede estar vacío.');
  }
  
  // Obtener el orden máximo actual para poner la nueva al final
  // (Podría hacerse con una función de DB también)
  const { data: maxOrderData, error: maxOrderError } = await supabase
     .from(TABLE_NAME)
     .select('order')
     .order('order', { ascending: false })
     .limit(1)
     .maybeSingle(); // Puede que no haya categorías aún

   if (maxOrderError) {
      console.error("Error getting max order:", maxOrderError);
      // Continuar con un orden por defecto alto? O lanzar error?
      // Por ahora, lanzamos error.
      throw new Error("Error al determinar el orden de la nueva categoría.");
   }
   
   const nextOrder = (maxOrderData?.order ?? 0) + 1;

  const categoryToInsert = {
    ...newCategoryData,
    id: uuidv4(), // Generar ID en cliente
    user_id: user.id, 
    is_default: false,
    order: nextOrder, 
  };

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert(categoryToInsert)
    .select()
    .single();

  if (error || !data) {
    console.error('Error adding category:', error);
    throw new Error('No se pudo añadir la categoría.');
  }
  return data;
};

/**
 * Actualiza una categoría personalizada existente.
 * Actualiza en Supabase.
 */
export const updateCategory = async (id: string, updates: UpdateCategory): Promise<Category> => {
   const { data: { user } } = await supabase.auth.getUser();
   if (!user) throw new Error('Usuario no autenticado para actualizar categoría.');

   // Prevenir actualizar campos no permitidos (id, user_id, is_default)
   const { id: _, user_id: __, is_default: ___, ...safeUpdates } = updates as any;

   if (Object.keys(safeUpdates).length === 0) {
      // Si no hay nada que actualizar (después de quitar campos protegidos), devolver la categoría actual
      const currentCategory = await getCategoryById(id);
      if (!currentCategory) throw new Error('Categoría no encontrada.');
      return currentCategory;
   }


  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update(safeUpdates)
    .eq('id', id)
    .eq('user_id', user.id) // Solo puede actualizar sus propias categorías
    .eq('is_default', false) // No puede actualizar las default
    .select()
    .single();

  if (error || !data) {
    console.error('Error updating category:', error);
    throw new Error('No se pudo actualizar la categoría (¿no encontrada o no permitida?).');
  }
  return data;
};

/**
 * Elimina una categoría personalizada.
 * Elimina de Supabase.
 * TODO: Considerar qué hacer con los ítems que usaban esta categoría.
 */
export const deleteCategory = async (id: string): Promise<void> => {
   const { data: { user } } = await supabase.auth.getUser();
   if (!user) throw new Error('Usuario no autenticado para eliminar categoría.');

  // Primero, verificar si es una categoría personalizada del usuario
  const { data: category, error: fetchError } = await supabase
     .from(TABLE_NAME)
     .select('id')
     .eq('id', id)
     .eq('user_id', user.id)
     .eq('is_default', false)
     .maybeSingle();

   if (fetchError || !category) {
      console.error('Error finding category or not allowed to delete:', fetchError);
      throw new Error('Categoría no encontrada o no se puede eliminar.');
   }

  // TODO: Reasignar ítems de despensa/lista que usaban esta categoría a 'Otros'
  // const { error: updateItemsError } = await supabase
  //    .from('pantry_items') // O shopping_list_items si aplica
  //    .update({ category_id: OTHER_CATEGORY_ID }) // Asumiendo que existe un ID para 'Otros'
  //    .eq('category_id', id)
  //    .eq('user_id', user.id);
  // Manejar updateItemsError...

  const { error: deleteError } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq('id', id); // Ya verificamos propiedad y que no es default

  if (deleteError) {
    console.error('Error deleting category:', deleteError);
    throw new Error('No se pudo eliminar la categoría.');
  }
};

/**
 * Reordena las categorías (personalizadas y/o predefinidas si se permite).
 * TODO: Implementar actualización de 'order' en Supabase.
 */
export const reorderCategories = async (orderedCategories: Category[]): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado para reordenar.');

    // Crear un array de objetos solo con id y el nuevo order
    const updates = orderedCategories.map((cat, index) => ({
       id: cat.id,
       order: index + 1 // Asignar nuevo orden basado en la posición
    }));

    // Actualizar todos los registros en una sola llamada (si es posible y seguro)
    // ¡Cuidado! Esto podría actualizar categorías default si están en la lista.
    // Sería más seguro filtrar `updates` para incluir solo las del usuario.
    const userCategoryUpdates = updates.filter(u => 
       orderedCategories.find(cat => cat.id === u.id && !cat.is_default && cat.user_id === user.id)
    );

    if (userCategoryUpdates.length === 0) {
       console.log("No user categories to reorder.");
       return;
    }

    // Usar upsert podría ser una opción si la tabla lo permite y tiene constraints
    const { error } = await supabase
       .from(TABLE_NAME)
       .upsert(userCategoryUpdates, { onConflict: 'id' }); // Actualizar si existe por ID

    if (error) {
       console.error('Error reordering categories:', error);
       throw new Error('No se pudo reordenar las categorías.');
    }
    console.log('User categories reordered in DB');
};