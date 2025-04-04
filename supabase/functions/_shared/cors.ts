/// <reference types="https://deno.land/x/deno/types/stable.d.ts" />

// supabase/functions/_shared/cors.ts

// Lista de orígenes permitidos. Sé lo más específico posible en producción.
// Puedes usar Deno.env.get("ALLOWED_ORIGIN") para configurarlo desde variables de entorno.
// Por ahora, usamos '*' para desarrollo, pero ¡RECUERDA CAMBIARLO EN PRODUCCIÓN!
const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") ?? "*"; // Permitir todos temporalmente o usar variable de entorno

// Expande las cabeceras CORS para ser más permisivas durante desarrollo
export const corsHeaders = {
  'Access-Control-Allow-Origin': allowedOrigin, // Mantenemos la variable para flexibilidad
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-auth',
  'Access-Control-Max-Age': '86400', // 24 horas
};