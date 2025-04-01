import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"
import vercel from 'vite-plugin-vercel';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), vercel()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Definir variables globales para reemplazar import.meta.env
  define: {
    'process.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL),
    'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY),
    // Añade otras variables VITE_ que necesites exponer a process.env
  },
  css: {
    postcss: './postcss.config.js',
  },
  optimizeDeps: {
    include: ['@supabase/supabase-js'],
  },
  assetsInclude: ['**/*.lottie'],
})
