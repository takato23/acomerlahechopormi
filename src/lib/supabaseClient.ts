import { createClient } from '@supabase/supabase-js'

// Leer desde process.env (Vite lo reemplazará gracias a 'define')
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Ajustar mensaje de error si es necesario, aunque Vite fallará antes si no están definidas
  console.error("Supabase URL or Anon Key is missing. Check Vite config and .env file.");
  throw new Error("Supabase URL and Anon Key must be available");
}

// Asegurarse de que fetch esté disponible globalmente o usar un polyfill si es necesario
const options = {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  global: {
    // Eliminar headers explícitos que causan conflictos (Supabase SDK ya los maneja internamente)
    fetch: typeof fetch !== 'undefined' ? fetch : undefined, // Pasar fetch explícitamente si existe
  }
};

console.log('Inicializando Supabase client con:', { 
  url: supabaseUrl, 
  hasKey: !!supabaseAnonKey
});

export const supabase = createClient(supabaseUrl, supabaseAnonKey, options);