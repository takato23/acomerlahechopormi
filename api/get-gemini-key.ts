// Types are now handled by api/tsconfig.json

// Importa los tipos necesarios de Supabase y Deno (si es necesario, aunque createClient ya los maneja)
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
// Response y Request son globales en Deno/Edge Functions

// No es necesario cargar dotenv en Deno/Supabase Edge Functions
// Inicializar Supabase Client
// Asegúrate de que estas variables de entorno estén disponibles
const supabaseUrl = Deno.env.get("VITE_SUPABASE_URL");
const supabaseAnonKey = Deno.env.get("VITE_SUPABASE_ANON_KEY");

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[API Server] Supabase URL or Anon Key not configured.');
  // En un escenario real, podrías querer lanzar un error o manejar esto de forma más robusta
}

// Crear una instancia del cliente Supabase (manejar posible caso donde las claves no estén definidas)
let supabase: SupabaseClient | null = null;
if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
    console.error("[API Server] Cannot initialize Supabase client due to missing configuration.");
}


// No se necesita una interfaz personalizada para la request

// Las Edge Functions suelen exportar un handler que recibe Request y devuelve Response
export default async (req: Request): Promise<Response> => {
  // 1. Validar usuario usando el token JWT del header Authorization
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn('[Edge Function] Missing or invalid Authorization header.');
    return new Response(JSON.stringify({ error: 'Unauthorized: Missing token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const token = authHeader.split(' ')[1];

  if (!supabase) {
      console.error('[Edge Function] Supabase client is not initialized.');
      return new Response(JSON.stringify({ error: 'Internal Server Error: Service configuration issue.' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
      });
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser(token);

  if (userError || !user) {
    console.warn('[Edge Function] Invalid token or user not found:', userError?.message);
    return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // El chequeo de !supabase ya se hizo arriba al obtener el usuario

  const userId = user.id;
  console.log(`[Edge Function] User ${userId} requesting Gemini key.`);

  try {
    // 2. Intentar obtener la clave API de Gemini guardada por el usuario
    console.log(`[Edge Function] Fetching profile for user ${userId}...`);
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('gemini_api_key')
      .eq('id', userId)
      .single(); // Esperamos un solo perfil por usuario

    // Manejar errores de la consulta, ignorando el caso donde el perfil no existe (PGRST116)
    if (profileError && profileError.code !== 'PGRST116') {
      console.error(`[Edge Function] Error fetching user profile for ${userId}:`, profileError);
      // Considerar devolver error 500 si la consulta falla por algo distinto a "no encontrado"
      // return new Response(JSON.stringify({ error: 'Internal Server Error while fetching profile' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    // 3. Si el usuario tiene una clave guardada y no está vacía, devolver esa.
    const userApiKey = profileData?.gemini_api_key;
    if (userApiKey) {
      console.log(`[Edge Function] User ${userId} has custom API Key. Returning user key.`);
      return new Response(JSON.stringify({ apiKey: userApiKey }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 4. Si el usuario NO tiene clave guardada, devolver la clave API por defecto del administrador.
    console.log(`[Edge Function] User ${userId} does not have custom API Key. Checking default key...`);
    const defaultApiKey = Deno.env.get("GEMINI_API_KEY"); // Clave del servidor desde Deno env

    if (!defaultApiKey) {
      console.error('[Edge Function] Server configuration error: Default GEMINI_API_KEY is not set.');
      // 5. Si ninguna clave está disponible, devolver error.
      return new Response(JSON.stringify({ error: 'Internal Server Error: API Key not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`[Edge Function] Returning default API Key for user ${userId}.`);
    return new Response(JSON.stringify({ apiKey: defaultApiKey }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[Edge Function] Unexpected error in /api/get-gemini-key:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}