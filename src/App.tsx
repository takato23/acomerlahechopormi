import { useEffect } from 'react';

import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import Navbar from './components/sections/Navbar' // Ruta relativa
import Hero from './components/sections/Hero' // Ruta relativa
import HowItWorks from './components/sections/HowItWorks' // Ruta relativa
import Benefits from './components/sections/Benefits' // Ruta relativa
import AppPreview from './components/sections/AppPreview' // Ruta relativa
import FAQ from './components/sections/FAQ' // Ruta relativa
import Footer from './components/sections/Footer' // Ruta relativa
import FadeInWhenVisible from './components/FadeInWhenVisible' // Ruta relativa
import Login from './features/auth/Login' // Ruta relativa
import Signup from './features/auth/Signup' // Ruta relativa
import { useAuth } from './features/auth/AuthContext' // Ruta relativa
import ProtectedRoute from './components/ProtectedRoute' // Ruta relativa
import { UserProfilePage } from './features/user/UserProfilePage' // Ruta relativa
import { PantryPage } from './features/pantry/PantryPage' // Ruta relativa
import { PlanningPage } from './features/planning/PlanningPage' // Ruta relativa
import { AppLayout } from './components/layout/AppLayout' // Ruta relativa
import { ShoppingListPage } from './features/shopping-list/ShoppingListPage'; // Ruta relativa
import { Spinner } from './components/ui/Spinner'; // Ruta relativa
import { DashboardPage } from './features/dashboard/DashboardPage'; // Ruta relativa
import { useSettings } from './context/SettingsContext'; // Ruta relativa
import { RecipeListPage } from './features/recipes/pages/RecipeListPage';
import AddEditRecipePage from './features/recipes/pages/AddEditRecipePage';
import RecipeDetailPage from './features/recipes/pages/RecipeDetailPage';


// Componente para la Landing Page
const LandingPage = () => (
  <>
    <Navbar />
    <main className="pt-16">
      <section id="hero">
        <Hero />
      </section>
      <FadeInWhenVisible>
        <section id="how-it-works">
          <HowItWorks />
        </section>
      </FadeInWhenVisible>
      <FadeInWhenVisible delay={0.1}>
        <section id="benefits">
          <Benefits />
        </section>
      </FadeInWhenVisible>
      <FadeInWhenVisible delay={0.2}>
        <section id="preview">
          <AppPreview />
        </section>
      </FadeInWhenVisible>
      <FadeInWhenVisible delay={0.3}>
        <section id="faq">
          <FAQ />
        </section>
      </FadeInWhenVisible>
    </main>
    <Footer />
  </>
)

// Eliminar DashboardPlaceholder ya que usaremos DashboardPage

function App() {
  const { loading } = useAuth()
  const { settings } = useSettings();
  const { fontSize } = settings; // Acceder a fontSize desde settings

  useEffect(() => {
    const rootElement = document.documentElement;
    const fontSizeClasses = ['text-base', 'text-lg', 'text-xl']; // Clases posibles

    // Limpiar clases previas
    rootElement.classList.remove(...fontSizeClasses);

    // Añadir clase actual
    let newClass = '';
    switch (fontSize) {
      case 'large':
        newClass = 'text-lg';
        break;
      case 'extra-large':
        newClass = 'text-xl';
        break;
      case 'normal':
      default:
        // Asumimos que 'text-base' es el default o no se necesita clase explícita.
        // Si 'text-base' es necesario, descomentar la siguiente línea:
        // newClass = 'text-base'; 
        break; 
    }

    if (newClass) {
      rootElement.classList.add(newClass);
    }

  }, [settings.fontSize]); // Ejecutar cuando settings.fontSize cambie


  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
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
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Rutas Protegidas */}
        <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<DashboardPage />} /> {/* Usar DashboardPage */}
          <Route path="profile" element={<UserProfilePage />} />
          <Route path="planning" element={<PlanningPage />} />
          <Route path="pantry" element={<PantryPage />} />
          <Route path="shopping-list" element={<ShoppingListPage />} />
          <Route path="recipes" element={<RecipeListPage />} />
          <Route path="recipes/new" element={<AddEditRecipePage />} />
          <Route path="recipes/:recipeId/edit" element={<AddEditRecipePage />} />
          <Route path="recipes/:recipeId" element={<RecipeDetailPage />} />
        </Route>

        {/* Ruta 404 */}
        <Route path="*" element={<div>Página no encontrada</div>} />
      </Routes>
    </>
  )
}

export default App
