import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

interface ShoppingListItem {
  ingredient_name: string;
  quantity: number | null;
  unit: string | null;
  notes: string | null;
  recipe_source: string | null;
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

    // Crear cliente Supabase (con role service_role para bypasear RLS)
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

    // Variable para el ID del usuario
    let userId: string;
    
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
          throw error;
        }
        
        userId = data.user?.id as string;
        console.log("Found user ID from token:", userId);
      } else if (isDevelopment) {
        // En desarrollo, usar un ID de prueba o recuperar el último usuario
        console.log("Development mode: Using a test user ID");
        try {
          // Intentar obtener un usuario real como fallback
          const { data: users } = await supabaseAdmin
            .from("profiles")
            .select("id")
            .limit(1)
            .maybeSingle();
            
          if (users?.id) {
            userId = users.id;
            console.log("Using test user ID from profiles:", userId);
          } else {
            // ID de prueba para desarrollo
            userId = "00000000-0000-0000-0000-000000000000";
            console.log("Using hardcoded test user ID:", userId);
          }
        } catch (e) {
          console.error("Error getting test user:", e);
          // ID de prueba para desarrollo
          userId = "00000000-0000-0000-0000-000000000000";
          console.log("Using hardcoded test user ID after error:", userId);
        }
      }
    } catch (error) {
      console.error("Error authenticating user:", error);
      if (isDevelopment) {
        console.log("Development mode: Using a default test user ID");
        userId = "00000000-0000-0000-0000-000000000000";
      } else {
        return createResponse({ error: "Authentication failed" }, 401);
      }
    }
    
    if (!userId) {
      console.error("No user ID found");
      return createResponse({ error: "User not found" }, 401);
    }

    // Preparar el objeto a insertar
    const shoppingItem: ShoppingListItem & { user_id: string } = {
      ingredient_name: item.ingredient_name,
      quantity: item.quantity ?? null,
      unit: item.unit ?? null,
      notes: item.notes ?? null,
      recipe_source: item.recipe_id ?? null, // Convertir recipe_id a recipe_source
      user_id: userId,
    };

    console.log("Inserting shopping item:", shoppingItem);

    try {
      // Usar approach directo (para pruebas)
      const result = await supabaseAdmin
        .from("shopping_list_items")
        .insert(shoppingItem);
      
      if (result.error) {
        throw result.error;
      }
      
      // Obtener el registro insertado
      const { data, error } = await supabaseAdmin
        .from("shopping_list_items")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error("Error selecting inserted item:", error);
        throw error;
      }
      
      console.log("Inserted item:", data);
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