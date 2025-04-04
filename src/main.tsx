import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import AuthProvider from './features/auth/AuthContext'; // Ruta relativa
import { SettingsProvider } from './context/SettingsContext'; // Importar SettingsProvider

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; // Importar React Query

// Crear una instancia de QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Configuración global opcional para queries
      // staleTime: 1000 * 60 * 5, // 5 minutos
      // refetchOnWindowFocus: false,
    },
  },
});

// Componente Root que se renderiza dentro de BrowserRouter
function Root() {
  return (
    <QueryClientProvider client={queryClient}> {/* Envolver con React Query Provider */}
      <AuthProvider>
        <SettingsProvider>
          <App />
        </SettingsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Root />
    </BrowserRouter>
  </StrictMode>,
)
