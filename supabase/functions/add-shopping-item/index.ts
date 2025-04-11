// Añadir comentarios sobre Deno para el linter local
// @deno-types="https://deno.land/std@0.177.0/http/server.ts"
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
// @deno-types="https://esm.sh/@supabase/supabase-js@2.21.0/dist/module/index.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

interface ShoppingListItem {
  ingredient_name: string;
  quantity: number | null;
  unit: string | null;
  notes: string | null;
  recipe_source: string | null;
  category_id?: string | null;
  is_checked?: boolean;
}

// Headers CORS que usaremos en todas las respuestas
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Max-Age": "86400",
};

// Función para crear respuestas con headers CORS consistentes
function createResponse(body: any, status: number = 200): Response {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });
}

// Ambiente de desarrollo
const isDevelopment = true;

serve(async (req) => {
  // Configuración de CORS para OPTIONS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    // Validar que es POST
    if (req.method !== "POST") {
      console.log("Error: Method not allowed", req.method);
      return createResponse({ error: "Method not allowed" }, 405);
    }

    console.log("Request headers:", Object.fromEntries(req.headers.entries()));
    
    // Obtener datos del request
    let requestData;
    try {
      const text = await req.text();
      console.log("Request body raw:", text);
      
      try {
        requestData = JSON.parse(text);
        console.log("Request data parsed:", requestData);
      } catch (e) {
        console.error("Error parsing JSON:", e);
        return createResponse({ error: "Invalid JSON format", details: String(e) }, 400);
      }
    } catch (e) {
      console.error("Error reading request body:", e);
      return createResponse({ error: "Error reading request body", details: String(e) }, 400);
    }
    
    const { item } = requestData || {};
    
    // Validar los datos
    if (!item) {
      console.error("Missing 'item' in request data:", requestData);
      return createResponse({ error: "Missing item data in request" }, 400);
    }

    if (!item.ingredient_name) {
      console.error("Missing ingredient_name in item:", item);
      return createResponse({ error: "Ingredient name is required" }, 400);
    }
    
    console.log("Item data received (including category_id?):", item);

    // Crear cliente Supabase
    // Linter local puede marcar error en Deno.env, es normal.
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    console.log("Supabase URL defined:", !!supabaseUrl);
    console.log("Supabase Key defined:", !!supabaseKey);
    
    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase URL or service role key");
      return createResponse({ error: "Server configuration error" }, 500);
    }
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
    console.log("Supabase client created");

    // Variable para el ID del usuario - INICIALIZAR A NULL
    let userId: string | null = null;
    
    // Obtener el usuario desde el token
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    console.log("Auth token present:", !!token);
    
    try {
      if (token) {
        console.log("Getting user from token");
        const { data, error } = await supabaseAdmin.auth.getUser(token);
        if (error) {
          console.error("Error getting user from token:", error);
          // No lanzar error necesariamente, podría ser un token inválido
        } else if (data.user?.id) {
           userId = data.user.id; // Asignar solo si existe
           console.log("Found user ID from token:", userId);
        } else {
          console.warn("Token provided but user not found or ID missing.");
        }
      } 
      // Si no hay token O falló la obtención con token, y estamos en desarrollo
      if (!userId && isDevelopment) { 
        console.log("Development mode: Attempting to get a test user ID");
        try {
          const { data: users } = await supabaseAdmin
            .from("profiles") // Asegúrate que "profiles" existe o usa otra tabla
            .select("id")
            .limit(1)
            .maybeSingle();
            
          if (users?.id) {
            userId = users.id;
            console.log("Using test user ID from profiles:", userId);
          } else {
            console.warn("Could not get test user from profiles, using hardcoded ID.");
            userId = "00000000-0000-0000-0000-000000000000";
          }
        } catch (e) {
          console.error("Error getting test user from profiles:", e);
          userId = "00000000-0000-0000-0000-000000000000";
          console.log("Using hardcoded test user ID after error:", userId);
        }
      }
    } catch (error) {
      // Captura errores durante la obtención del usuario
      console.error("Error during user identification process:", error);
      // No asignamos userId aquí, se quedará null si falla
    }
    
    // Comprobar SIEMPRE si tenemos userId antes de continuar
    if (!userId) {
      console.error("Could not determine User ID (authentication or dev fallback failed).");
      // En producción, esto debería ser un 401. En dev, podría ser un error o el hardcoded.
      // Por seguridad, devolvemos 401 si no hay ID.
      return createResponse({ error: "Authentication failed or User ID could not be determined" }, 401);
    }

    // Preparar el objeto a insertar (userId ahora está garantizado o ya salió)
    const shoppingItemToInsert = {
      ingredient_name: item.ingredient_name,
      quantity: item.quantity ?? null,
      unit: item.unit ?? null,
      notes: item.notes ?? null,
      recipe_source: item.recipe_id ?? null, // Convertir recipe_id a recipe_source
      category_id: item.category_id ?? null,
      user_id: userId, // userId ahora tiene un valor string
      is_checked: false
    };

    console.log("Inserting shopping item:", shoppingItemToInsert);

    try {
      // Usar approach directo (para pruebas)
      const { data, error } = await supabaseAdmin
        .from("shopping_list_items")
        // Usar el objeto preparado con category_id
        .insert(shoppingItemToInsert)
        .select() // <-- Seleccionar para obtener el resultado
        .single(); // <-- Esperamos un solo resultado
      
      if (error) {
        // Log más específico del error de inserción
        console.error(`Error inserting item for user ${userId}:`, error);
        throw error;
      }
      
      // Ya no es necesario el segundo select si el insert devuelve el item
      // const { data, error } = await supabaseAdmin
      //   .from("shopping_list_items")
      //   .select("*")
      //   .eq("user_id", userId)
      //   .order("created_at", { ascending: false })
      //   .limit(1)
      //   .single();
      
      console.log("Inserted item:", data);
      // Devolver el item insertado directamente desde la respuesta del insert
      return createResponse({ success: true, item: data });
      
    } catch (error) {
      console.error("Error inserting shopping item:", error);
      return createResponse({ 
        error: error.message,
        details: error.details || error.hint || "No additional details" 
      }, 500);
    }
    
  } catch (error) {
    console.error("Unexpected error:", error);
    return createResponse({ 
      error: "Internal server error",
      message: String(error),
      stack: error.stack || "No stack trace" 
    }, 500);
  }
}); 