import { supabase } from '@/lib/supabaseClient';

export interface ShoppingItemPayload {
  ingredient_name: string;
  quantity?: number | null;
  unit?: string | null;
  notes?: string | null;
  recipe_id?: string | null; // Se convertirá en recipe_source en el Edge Function
  category_id?: string | null;
}

export async function addShoppingItemViaEdgeFunction(item: ShoppingItemPayload) {
  try {
    console.log('[shoppingListEdgeFunctions] Enviando item al Edge Function:', item);
    
    // Asegurarnos que los valores no sean undefined
    const cleanItem = {
      ingredient_name: item.ingredient_name,
      quantity: item.quantity === undefined ? null : item.quantity,
      unit: item.unit === undefined ? null : item.unit,
      notes: item.notes === undefined ? null : item.notes,
      recipe_id: item.recipe_id === undefined ? null : item.recipe_id,
      category_id: item.category_id === undefined ? null : item.category_id
    };
    
    // Asegurarnos que el body tiene el formato exacto que espera la función
    const bodyPayload = {
      item: cleanItem,
    };
    
    console.log('[shoppingListEdgeFunctions] Body payload:', JSON.stringify(bodyPayload));

    // Llamar al Edge Function con todos los headers necesarios
    const { data, error } = await supabase.functions.invoke('add-shopping-item', {
      body: bodyPayload,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (error) {
      console.error('[shoppingListEdgeFunctions] Error al llamar al Edge Function:', error);
      throw error;
    }

    console.log('[shoppingListEdgeFunctions] Respuesta del Edge Function:', data);
    return data.item;
  } catch (error) {
    console.error('[shoppingListEdgeFunctions] Error inesperado:', error);
    
    // Mostrar más detalles del error si es posible
    if (error instanceof Error) {
      console.error('[shoppingListEdgeFunctions] Detalles del error:', error.message);
      console.error('[shoppingListEdgeFunctions] Stack:', error.stack);
    }
    
    throw error;
  }
} 