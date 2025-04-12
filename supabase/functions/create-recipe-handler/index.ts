import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts' // Necesitaremos crear este archivo

// Definición de tipos para los datos que esperamos recibir
interface IngredientInput {
  name: string;
  quantity: number | null;
  unit: string | null;
}

interface RecipePayload {
  title: string;
  description: string | null;
  instructions: string;
  prep_time: number | null;
  cook_time: number | null;
  servings: number | null;
  image_url: string | null; // O el tipo que uses para la imagen
  ingredients: IngredientInput[];
  // Agrega aquí cualquier otro campo que tu receta necesite
}

serve(async (req) => {
  // Manejo de solicitud preflight CORS (necesario para llamadas desde el navegador)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Validar que la solicitud sea POST
    if (req.method !== 'POST') {
      throw new Error('Method Not Allowed: Only POST requests are accepted.');
    }

    // 2. Extraer y validar el payload JSON de la solicitud
    const payload: RecipePayload = await req.json();

    if (!payload.title || !payload.instructions || !payload.ingredients || !Array.isArray(payload.ingredients)) {
      throw new Error('Invalid payload: Missing required fields (title, instructions, ingredients array).');
    }

    // 3. Crear el cliente de Supabase CON autenticación
    //    Usamos el token del usuario que hace la llamada para obtener su ID
    const supabaseClient = createClient(
      // Asegúrate de que estas variables de entorno estén configuradas en Supabase
      // Settings -> Functions -> Set secrets
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      // Obtenemos el encabezado de autorización de la solicitud original del cliente
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // 4. Obtener el ID del usuario autenticado
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
        console.error('Error obteniendo usuario o usuario no autenticado:', userError);
        throw new Error('User not authenticated or error fetching user.');
    }
    const userId = user.id;

    // --- Lógica Principal de Creación ---
    // Usaremos una transacción para asegurar que todo se cree o nada
    const { data: recipeResult, error: transactionError } = await supabaseClient.rpc('create_recipe_with_ingredients', {
        recipe_title: payload.title,
        recipe_description: payload.description,
        recipe_instructions: Array.isArray(payload.instructions) ? payload.instructions.join('\n') : payload.instructions,
        recipe_prep_time: payload.prep_time,
        recipe_cook_time: payload.cook_time,
        recipe_servings: payload.servings,
        recipe_image_url: payload.image_url,
        user_id: userId,
        ingredients_input: payload.ingredients.map(ing => ({
            name: ing.name,
            quantity: ing.quantity,
            unit: ing.unit
        }))
    });

    if (transactionError) {
        console.error('Error en la transacción RPC:', transactionError);
        throw new Error(`Error creating recipe: ${transactionError.message}`);
    }

    // 5. Devolver respuesta exitosa
    return new Response(JSON.stringify({ message: 'Recipe created successfully!', recipe_id: recipeResult }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201, // 201 Created
    })

  } catch (error) {
    console.error('Error en la función Edge:', error);
    // Devolver respuesta de error genérica pero informativa
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: error instanceof Error && (error.message.includes('Method Not Allowed') || error.message.includes('Invalid payload')) ? 400 : 500, // Bad Request o Internal Server Error
    })
  }
})
