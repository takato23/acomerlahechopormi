import { supabase } from '@/lib/supabaseClient';

export interface Ingredient {
  id: string;
  name: string;
  image_url?: string | null;
  category_id?: string | null;
}

/**
 * Normaliza el nombre de un ingrediente según la cantidad
 */
export const normalizeIngredientName = (name: string, quantity: number = 1): string => {
  const trimmedName = name.trim().toLowerCase();
  
  // Si es singular y la cantidad es mayor a 1, convertir a plural
  if (quantity > 1) {
    if (trimmedName.endsWith('a')) {
      return trimmedName.slice(0, -1) + 'as';
    } else if (trimmedName.endsWith('ón')) {
      return trimmedName.slice(0, -2) + 'ones';
    } else if (!trimmedName.endsWith('s')) {
      return trimmedName + 's';
    }
  }
  // Si es plural y la cantidad es 1, convertir a singular
  else if (quantity === 1) {
    if (trimmedName.endsWith('as')) {
      return trimmedName.slice(0, -2) + 'a';
    } else if (trimmedName.endsWith('ones')) {
      return trimmedName.slice(0, -4) + 'ón';
    } else if (trimmedName.endsWith('s') && !trimmedName.endsWith('es')) {
      return trimmedName.slice(0, -1);
    }
  }
  
  return trimmedName;
};

/**
 * Busca un ingrediente por nombre o lo crea si no existe
 */
export const findOrCreateIngredient = async (name: string, quantity: number = 1): Promise<Ingredient> => {
  console.log(`[ingredientService] Entrando a findOrCreateIngredient para: "${name}"`); // Log al entrar
  // Log de sesión al inicio de la función
  let sessionData: any = null; // Inicializar fuera del try
  try {
    console.log('[ingredientService] Verificando sesión...');
    const { data, error } = await supabase.auth.getSession(); 
    sessionData = data; // Guardar para el log final
    console.log('[ingredientService] Estado de la sesión AL ENTRAR:', { 
      session: data.session ? 'Activa' : 'Inactiva', 
      userId: data.session?.user?.id,
      authError: error
    });
    if (error) {
      console.error('[ingredientService] Error al obtener sesión:', error);
      // Decidir si lanzar error o continuar dependiendo de la política
      // throw new Error("Error al verificar la sesión del usuario.");
    }
  } catch (sessionError) {
     console.error('[ingredientService] Excepción al obtener sesión:', sessionError);
     throw new Error("Excepción al verificar la sesión del usuario.");
  }

  const normalizedName = normalizeIngredientName(name, 1); // Siempre buscar en singular
  
  // Primero intentar encontrar el ingrediente
  console.log(`[ingredientService] Buscando ingrediente: ${normalizedName}`); // Log antes del SELECT
  let existingIngredient: Ingredient | null = null;
  let searchError: any = null;
  try {
    const { data, error } = await supabase
      .from('ingredients')
      .select('*')
      .ilike('name', normalizedName)
      .single();
    existingIngredient = data;
    searchError = error;
    console.log('[ingredientService] Resultado SELECT:', { data, error });
  } catch (selectException) {
      console.error('[ingredientService] Excepción en SELECT inicial:', selectException);
      throw new Error("Excepción al buscar ingrediente.");
  }
    
  // --- MANEJAR EL ERROR DEL SELECT --- 
  if (searchError && searchError.code !== 'PGRST116') { // PGRST116: 'Exact one row not found' no es un error real aquí
    console.error('[ingredientService] Error en SELECT inicial:', searchError);
    throw new Error(`Error al buscar ingrediente: ${searchError.message}`); // Lanzar error si SELECT falla
  }
  // --- FIN MANEJO ERROR SELECT ---

  if (existingIngredient) {
    return existingIngredient;
  }
  
  // Si no existe, crear uno nuevo
  console.log(`[ingredientService] Intentando crear ingrediente: ${normalizedName}`); // Log antes de crear

  const { data: newIngredient, error: createError } = await supabase
    .from('ingredients')
    .insert([{ name: normalizedName }])
    .select()
    .single();
    
  if (createError) throw createError;
  if (!newIngredient) throw new Error('No se pudo crear el ingrediente');
  
  return newIngredient;
};

/**
 * Busca ingredientes por nombre parcial
 */
export const searchIngredients = async (searchTerm: string): Promise<Ingredient[]> => {
  if (!searchTerm.trim()) return [];
  
  const { data, error } = await supabase
    .from('ingredients')
    .select('*')
    .ilike('name', `%${searchTerm}%`)
    .limit(10);
    
  if (error) throw error;
  return data || [];
};

/**
 * Actualiza un ingrediente existente
 */
export const updateIngredient = async (id: string, updates: Partial<Omit<Ingredient, 'id'>>): Promise<Ingredient> => {
  const { data, error } = await supabase
    .from('ingredients')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
    
  if (error) throw error;
  if (!data) throw new Error('Ingrediente no encontrado');
  
  return data;
};