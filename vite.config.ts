import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"
import { fileURLToPath, URL } from 'node:url'
import vercel from 'vite-plugin-vercel';
import { visualizer } from 'rollup-plugin-visualizer'; // Importar visualizer
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    vercel(),
    // Añadir visualizer (ejecutar solo cuando sea necesario, ej. con una variable de entorno)
    process.env.ANALYZE_BUNDLE ? visualizer({
      open: true, // Abrir el reporte en el navegador automáticamente
      filename: 'bundle-stats.html', // Nombre del archivo de reporte
      gzipSize: true, // Mostrar tamaño gzip
      brotliSize: true, // Mostrar tamaño brotli
    }) : undefined,
  ].filter(Boolean), // Filtrar undefined si ANALYZE_BUNDLE no está activo
  resolve: {
    alias: {
      "@": fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // Vite automatically loads .env files and exposes VITE_ variables
  // No need to manually define them
  css: {
    postcss: './postcss.config.js',
  },
  optimizeDeps: {
    include: ['@supabase/supabase-js'],
  },
  assetsInclude: ['**/*.lottie'],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@zxing/library')) {
            return 'zxing';
          }
          if (id.includes('framer-motion')) {
            return 'framer-motion'; // Crear un chunk para framer-motion
          }
          // Eliminar llave extra
        }
      }
    }
  }
})
