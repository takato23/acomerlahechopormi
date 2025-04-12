import { useEffect, Suspense, useCallback, useState } from 'react';
import { initializeCategories } from './features/shopping-list/lib/categoryInference';
import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useAuth } from './features/auth/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import { AppLayout } from './components/layout/AppLayout'
import { Spinner } from './components/ui/Spinner'
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
  const { Hero, HowItWorks, Benefits, AppPreview, FAQ } = LazyLandingComponents;

  return (
    <>
      <Navbar />
      <main className="pt-16">
        <section id="hero">
          <Suspense fallback={<PageLoader />}>
            <Hero />
          </Suspense>
        </section>
        <FadeInWhenVisible>
          <section id="how-it-works">
            <Suspense fallback={<PageLoader />}>
              <HowItWorks />
            </Suspense>
          </section>
        </FadeInWhenVisible>
        <FadeInWhenVisible delay={0.1}>
          <section id="benefits">
            <Suspense fallback={<PageLoader />}>
              <Benefits />
            </Suspense>
          </section>
        </FadeInWhenVisible>
        <FadeInWhenVisible delay={0.2}>
          <section id="preview">
            <Suspense fallback={<PageLoader />}>
              <AppPreview />
            </Suspense>
          </section>
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
  const [initializingCategories, setInitializingCategories] = useState(false);

  const { settings } = useSettings();

  // Inicializar sistema de categorías cuando el usuario inicia sesión
  const initializeSystem = useCallback(async () => {
    // Evitar múltiples inicializaciones simultáneas o reinicializaciones innecesarias
    if ((user && !categorySystemInitialized && !initializingCategories)) {
      try {
        setInitializingCategories(true);
        console.log('[App] User logged in, initializing category system...');
        await initializeCategories();
        console.log('[App] Category system initialized successfully');
        setCategorySystemInitialized(true);
      } catch (error) {
        console.error('[App] Failed to initialize category system:', error);
        // No establecer categorySystemInitialized como true si hay un error
      } finally {
        setInitializingCategories(false);
      }
    }
  }, [user, categorySystemInitialized, initializingCategories]);

  useEffect(() => {
    if (user && !categorySystemInitialized && !initializingCategories) {
      initializeSystem();
    }
  }, [user, categorySystemInitialized, initializingCategories, initializeSystem]);

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
    <>
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
        <Route path="/" element={<LandingPage />} />
        <Route 
          path="/login" 
          element={
            <Suspense fallback={<PageLoader />}>
              <LazyAuth.Login />
            </Suspense>
          } 
        />
        <Route 
          path="/signup" 
          element={
            <Suspense fallback={<PageLoader />}>
              <LazyAuth.Signup />
            </Suspense>
          } 
        />

        {/* Rutas Protegidas */}
        <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={
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
          <Route path="simple-shopping" element={
            <Suspense fallback={<PageLoader />}>
              <LazyFeatures.SimpleShoppingPage />
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
          <Route path="recipes/import" element={
            <Suspense fallback={<PageLoader />}>
              <LazyFeatures.ImportRecipePage />
            </Suspense>
          } />
        </Route>

        {/* Ruta 404 */}
        <Route path="*" element={<div>Página no encontrada</div>} />
      </Routes>
    </>
  )
}

export default App;
