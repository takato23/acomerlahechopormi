// src/utils/getSupabaseEnv.ts
export function getSupabaseUrl() {
  return import.meta.env.VITE_SUPABASE_URL;
}
export function getSupabaseAnonKey() {
  return import.meta.env.VITE_SUPABASE_ANON_KEY;
}
