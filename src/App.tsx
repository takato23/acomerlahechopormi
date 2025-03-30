import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import Navbar from '@/components/sections/Navbar'
import Hero from '@/components/sections/Hero'
import HowItWorks from '@/components/sections/HowItWorks'
import Benefits from '@/components/sections/Benefits'
import AppPreview from '@/components/sections/AppPreview'
import FAQ from '@/components/sections/FAQ'
import Footer from '@/components/sections/Footer'
import FadeInWhenVisible from '@/components/FadeInWhenVisible'
import Login from '@/features/auth/Login'
import Signup from '@/features/auth/Signup'
import { useAuth } from '@/features/auth/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import { UserProfilePage } from '@/features/user/UserProfilePage'
import { RecipeListPage } from '@/features/recipes/RecipeListPage'
import { RecipeDetailPage } from '@/features/recipes/RecipeDetailPage'
import { AddEditRecipePage } from '@/features/recipes/AddEditRecipePage'
import { PantryPage } from '@/features/pantry/PantryPage'
import { PlanningPage } from '@/features/planning/PlanningPage'
import { AppLayout } from '@/components/layout/AppLayout'
import { ShoppingListPage } from '@/features/shopping-list/ShoppingListPage';
import { Spinner } from '@/components/ui/Spinner';
import { DashboardPage } from '@/features/dashboard/DashboardPage'; // Importar DashboardPage

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
          {/* Rutas de Recetas */}
          <Route path="recipes" element={<RecipeListPage />} />
          <Route path="recipes/new" element={<AddEditRecipePage />} />
          <Route path="recipes/:recipeId" element={<RecipeDetailPage />} />
          <Route path="recipes/:recipeId/edit" element={<AddEditRecipePage />} />
        </Route>

        {/* Ruta 404 */}
        <Route path="*" element={<div>Página no encontrada</div>} />
      </Routes>
    </>
  )
}

export default App
