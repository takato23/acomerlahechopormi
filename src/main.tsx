import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import AuthProvider from './features/auth/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { FeatureFlagsProvider } from './context/FeatureFlagsContext';
import { ThemeProvider } from './context/ThemeContext';
import { initPosthog } from '@/lib/posthogClient';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { initErrorTracking, isErrorTrackingEnabled, setRuntimeEnv, withProfiler } from '@/lib/errorTracking';

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

setRuntimeEnv(import.meta.env);
initErrorTracking();
initPosthog();

// Componente Root que se renderiza dentro de BrowserRouter
const useMockAuth = import.meta.env.VITE_USE_MOCK_AUTH === 'true';

const InstrumentedApp = isErrorTrackingEnabled() ? withProfiler(App) : App;

function Root() {
  return (
    <ThemeProvider defaultTheme="system">
      <QueryClientProvider client={queryClient}>
        <AuthProvider useMockData={useMockAuth}>
          <FeatureFlagsProvider>
            <SettingsProvider>
              <InstrumentedApp />
            </SettingsProvider>
          </FeatureFlagsProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Root />
    </BrowserRouter>
  </StrictMode>,
)
