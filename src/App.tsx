import { useEffect, Suspense, useCallback, useState } from 'react';
import { initializeCategories } from './features/shopping-list/lib/categoryInference';
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useAuth } from './features/auth/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import { ErrorBoundary } from './components/ErrorBoundary'
import { AppLayout } from './components/layout/AppLayout'
import { Spinner } from './components/ui/Spinner'
import { RoutePlaceholder } from './components/common/RoutePlaceholder'
import { useSettings } from './context/SettingsContext'
import { LazyLandingComponents, LazyAuth, LazyFeatures } from './routes/lazyComponents'

// Componentes no lazy (usados en múltiples rutas o pequeños)
import Navbar from './components/sections/Navbar'
import Footer from './components/sections/Footer'
import FadeInWhenVisible from './components/FadeInWhenVisible'

// Loading Fallbacks
const PageLoader = () => (
  <div className="flex h-screen items-center justify-center">
    <Spinner size="lg" />
  </div>
);

// Componente para la Landing Page con Suspense boundaries
const LandingPage = () => {
  const { Hero, VisualCatalogue, Testimonials, DemoCTA, FAQ } = LazyLandingComponents;

  return (
    <>
      <Navbar />
      <main className="pt-16">
        <Suspense fallback={<PageLoader />}>
          <Hero />
        </Suspense>
        <FadeInWhenVisible>
          <Suspense fallback={<PageLoader />}>
            <VisualCatalogue />
          </Suspense>
        </FadeInWhenVisible>
        <FadeInWhenVisible delay={0.1}>
          <Suspense fallback={<PageLoader />}>
            <Testimonials />
          </Suspense>
        </FadeInWhenVisible>
        <FadeInWhenVisible delay={0.2}>
          <Suspense fallback={<PageLoader />}>
            <DemoCTA />
          </Suspense>
        </FadeInWhenVisible>
        <FadeInWhenVisible delay={0.3}>
          <section id="faq">
            <Suspense fallback={<PageLoader />}>
              <FAQ />
            </Suspense>
          </section>
        </FadeInWhenVisible>
      </main>
      <Footer />
    </>
  )
}

function App() {
  const { loading, user } = useAuth()
  const [categorySystemInitialized, setCategorySystemInitialized] = useState(false);

  const { settings } = useSettings();

  // Inicializar sistema de categorías cuando el usuario inicia sesión
  const initializeSystem = useCallback(async () => {
    if (user && !categorySystemInitialized) {
      console.log('[App] User logged in, initializing category system...');
      try {
        await initializeCategories();
        console.log('[App] Category system initialized successfully');
        setCategorySystemInitialized(true);
      } catch (error) {
        console.error('[App] Failed to initialize category system:', error);
      }
    }
  }, [user, categorySystemInitialized]);

  useEffect(() => {
    initializeSystem();
  }, [initializeSystem]);

  useEffect(() => {
    const rootElement = document.documentElement;
    const fontSizeClasses = ['text-base', 'text-lg', 'text-xl'];
    rootElement.classList.remove(...fontSizeClasses);
    
    let newClass = '';
    switch (settings.fontSize) {
      case 'large':
        newClass = 'text-lg';
        break;
      case 'extra-large':
        newClass = 'text-xl';
        break;
    }
    if (newClass) {
      rootElement.classList.add(newClass);
    }
  }, [settings.fontSize]);

  if (loading) {
    return <PageLoader />;
  }

  return (
    <ErrorBoundary name="app-root">
      <Toaster
        position="top-right"
        theme="system"
        toastOptions={{
          style: {
            background: 'hsl(var(--background))',
            color: 'hsl(var(--foreground))',
            border: '1px solid hsl(var(--border))',
          },
          className: 'text-sm font-medium'
        }}
      />
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/" element={
          user ? <Navigate to="/app" replace /> : <LandingPage />
        } />
        <Route path="/logo-demo" element={
          <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 p-8">
            <div className="max-w-6xl mx-auto">
              <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
                🍽️ Logos para "A Comerla"
              </h1>
              <p className="text-center text-gray-600 mb-12">
                Logos simples y atractivos para tu app de planeación de comidas
              </p>

              <div className="flex justify-center">
                <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                  <h2 className="text-3xl font-bold mb-6 text-gray-800">Logo de "A Comerla"</h2>
                  <div className="w-48 h-48 mx-auto mb-6 flex items-center justify-center">
                    <div className="text-9xl">🍽️</div>
                  </div>
                  <p className="text-lg text-gray-600">Solo el emoji del plato, simple y limpio</p>
                </div>
              </div>

              <div className="mt-12 text-center">
                <p className="text-lg text-gray-700 mb-4">
                  ¿Cuál te gusta más para representar "A Comerla"?
                </p>
                <p className="text-sm text-gray-500">
                  Todos los logos son simples, atractivos y transmiten la esencia de disfrutar la comida
                </p>
              </div>
            </div>
          </div>
        } />
        <Route
          path="/login"
          element={
            user ? <Navigate to="/app" replace /> : (
              <Suspense fallback={<PageLoader />}>
                <LazyAuth.Login />
              </Suspense>
            )
          }
        />
        <Route
          path="/signup"
          element={
            user ? <Navigate to="/app" replace /> : (
              <Suspense fallback={<PageLoader />}>
                <LazyAuth.Signup />
              </Suspense>
            )
          }
        />

        {/* Rutas Protegidas */}
        <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={
            <Suspense fallback={<PageLoader />}>
              <LazyFeatures.DashboardPage />
            </Suspense>
          } />
          <Route path="dashboard" element={
            <Suspense fallback={<PageLoader />}>
              <LazyFeatures.DashboardPage />
            </Suspense>
          } />
          <Route path="profile" element={
            <Suspense fallback={<PageLoader />}>
              <LazyFeatures.UserProfilePage />
            </Suspense>
          } />
          <Route path="planning" element={
            <Suspense fallback={<PageLoader />}>
              <LazyFeatures.PlanningPage />
            </Suspense>
          } />
          <Route path="onboarding" element={
            <Suspense fallback={<PageLoader />}>
              <LazyFeatures.OnboardingPage />
            </Suspense>
          } />
          <Route path="pantry" element={
            <Suspense fallback={<PageLoader />}>
              <LazyFeatures.PantryPage />
            </Suspense>
          } />
          <Route path="shopping-list" element={
            <Suspense fallback={<PageLoader />}>
              <LazyFeatures.ShoppingListPage />
            </Suspense>
          } />
          <Route path="recipes" element={
            <Suspense fallback={<PageLoader />}>
              <LazyFeatures.RecipeListPage />
            </Suspense>
          } />
          <Route path="recipes/new" element={
            <Suspense fallback={<PageLoader />}>
              <LazyFeatures.AddEditRecipePage />
            </Suspense>
          } />
          <Route path="recipes/:recipeId/edit" element={
            <Suspense fallback={<PageLoader />}>
              <LazyFeatures.AddEditRecipePage />
            </Suspense>
          } />
          <Route path="recipes/:recipeId" element={
            <Suspense fallback={<PageLoader />}>
              <LazyFeatures.RecipeDetailPage />
            </Suspense>
          } />
          <Route path="planner" element={<Navigate to="/app/planning" replace />} />
          <Route path="planificador" element={<Navigate to="/app/planning" replace />} />
          <Route path="*" element={
            <RoutePlaceholder
              title="Estamos preparando esta sección"
              description="Todavía no tenemos esta vista lista, pero seguimos trabajando. Mientras tanto, podés volver al panel principal."
              status="under-construction"
              actionLabel="Volver al panel"
              actionTo="/app"
            />
          } />
        </Route>

        {/* Ruta 404 */}
        <Route
          path="*"
          element={
            <RoutePlaceholder
              status="not-found"
              title="No encontramos lo que buscabas"
              description="Verificá la dirección o elegí otra sección del menú para continuar explorando A Comerla."
              actionLabel="Ir al inicio"
              actionTo="/"
            />
          }
        />
      </Routes>
    </ErrorBoundary>
  )
}

export default App;
