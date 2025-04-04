import React, { useState, useEffect, useMemo, useCallback } from 'react'; // Asegurar useCallback
import { useAuth } from '@/features/auth/AuthContext';
import { getPlannedMeals } from '@/features/planning/planningService';
import type { PlannedMeal } from '@/features/planning/types';
// import { useRecipeStore } from '@/stores/recipeStore'; // Comentado
import { usePantryStore } from '@/stores/pantryStore';
import { useShoppingListStore } from '@/stores/shoppingListStore';
import { motion, useReducedMotion } from 'framer-motion'; // Una sola importación
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { RefreshCw, Lightbulb } from 'lucide-react';
import { generateSingleRecipe } from '@/features/recipes/generationService';
import type { GeneratedRecipeData } from '@/types/recipeTypes';
// Usar any temporalmente
type Recipe = any;
type PantryItem = any;
// Importar los Widgets
import { TodayPlanWidget } from './components/TodayPlanWidget';
import { ShoppingListWidget } from './components/ShoppingListWidget';
import { FavoriteRecipesWidget } from './components/FavoriteRecipesWidget';
import { LowStockWidget } from './components/LowStockWidget';
import { Spinner } from '@/components/ui/Spinner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

/**
 * Helper para determinar el saludo según la hora del día
 */
const getGreeting = (date: Date): string => {
  const hour = date.getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 20) return "Buenas tardes";
  return "Buenas noches";
};

// --- Variantes de Animación ---
const getGridContainerVariants = (shouldReduceMotion: boolean | null) => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: shouldReduceMotion ? 0 : 0.08
    }
  }
});

const getWidgetItemVariants = (shouldReduceMotion: boolean | null) => ({
  hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20
    }
  }
});

const getGreetingVariants = (shouldReduceMotion: boolean | null) => ({
  hidden: { opacity: 0, x: shouldReduceMotion ? 0 : -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      delay: 0.1,
      type: "spring",
      stiffness: 300,
      damping: 25
    }
  }
});

/**
 * Página principal del Dashboard.
 */
export function DashboardPage() {
  const { user, profile } = useAuth(); // Obtener user y profile

  // Estados existentes
  const [todayMeals, setTodayMeals] = useState<PlannedMeal[]>([]);
  const [isLoadingMeals, setIsLoadingMeals] = useState(true);
  const [errorMeals, setErrorMeals] = useState<string | null>(null);
  const { lowStockItems, isLoadingLowStock, errorLowStock, fetchLowStockItems, items: allPantryItems } = usePantryStore();
  const { items: shoppingListItems, isLoading: isLoadingShoppingList, error: errorShoppingList, fetchItems: fetchShoppingListItems } = useShoppingListStore();
  // Placeholders recetas
  const allRecipes: any[] = [];
  const isLoadingRecipes = false;
  const errorRecipes = null;

  // Estados para "Qué cocino hoy"
  const [suggestedRecipe, setSuggestedRecipe] = useState<GeneratedRecipeData | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);

  const today = new Date();
  const todayDateStr = format(today, 'yyyy-MM-dd');
  const greeting = getGreeting(today);

  // Animaciones
  const shouldReduceMotion = useReducedMotion();
  const gridContainerVariants = getGridContainerVariants(shouldReduceMotion);
  const widgetItemVariants = getWidgetItemVariants(shouldReduceMotion);
  const greetingVariants = getGreetingVariants(shouldReduceMotion);

  // --- Effects ---
  useEffect(() => {
    setIsLoadingMeals(true);
    setErrorMeals(null);
    getPlannedMeals(todayDateStr, todayDateStr)
      .then(meals => setTodayMeals(meals))
      .catch(err => {
        console.error("Error loading today's meals:", err);
        setErrorMeals("Error al cargar plan de hoy.");
      })
      .finally(() => setIsLoadingMeals(false));
  }, [todayDateStr]);

  useEffect(() => {
    if (allPantryItems.length === 0 && !isLoadingLowStock) {
      fetchLowStockItems();
    } else if (allPantryItems.length > 0 && lowStockItems.length === 0 && !isLoadingLowStock) {
      fetchLowStockItems(); // Recargar si hay items pero no low stock (puede haber cambiado el threshold)
    }
  }, [allPantryItems.length, lowStockItems.length, isLoadingLowStock, fetchLowStockItems]);

  useEffect(() => {
    if (shoppingListItems.length === 0 && !isLoadingShoppingList) {
      fetchShoppingListItems();
    }
  }, [shoppingListItems.length, isLoadingShoppingList, fetchShoppingListItems]);

  // --- Memos ---
  const favoriteRecipes = useMemo(() => [], []); // Siempre vacío por ahora

  // --- Handlers ---
  /**
   * Maneja la solicitud de una sugerencia de receta ("Qué cocino hoy").
   */
  const handleSuggestRecipe = useCallback(async () => {
    const currentUser = user; // Capturar user en el scope
    if (!currentUser?.id) {
      setSuggestionError("Debes iniciar sesión para obtener sugerencias.");
      return;
    }

    setIsSuggesting(true);
    setSuggestionError(null);
    setSuggestedRecipe(null);

    try {
      console.log("[Dashboard] Solicitando sugerencia de receta...");
      // Pasar currentUser.id
      const result = await generateSingleRecipe(currentUser.id, "una sugerencia de receta para hoy");
      console.log("[Dashboard] Resultado de sugerencia:", result);

      if ('error' in result) {
        setSuggestionError(result.error);
        setSuggestedRecipe(null);
      } else {
        setSuggestedRecipe(result);
      }
    } catch (err: any) {
      console.error("[Dashboard] Error inesperado al obtener sugerencia:", err);
      setSuggestionError(err.message || "Error inesperado al obtener la sugerencia.");
      setSuggestedRecipe(null);
    } finally {
      setIsSuggesting(false);
    }
     // Incluir dependencias de estado que modifica
  }, [user, setSuggestionError, setIsSuggesting, setSuggestedRecipe]);

  // --- Render ---
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="container mx-auto max-w-6xl py-8 px-4 space-y-6"
    >
      {/* Saludo Animado */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={greetingVariants}
        className="mb-6"
      >
        <h1 className="text-3xl font-bold flex items-center gap-2">
          {greeting}{profile?.username ? `, ${profile.username}` : ''}! 👋
        </h1>
        <p className="text-lg text-muted-foreground">Tu resumen de cocina.</p>
      </motion.div>

      {/* Sección "Qué cocino hoy" */}
      <motion.div
        variants={widgetItemVariants}
        className="mb-6" // Aplicar animación de widget
        initial="hidden" // Necesario si no está dentro del grid animado
        animate="visible" // Necesario si no está dentro del grid animado
      >
        <Card className="bg-white border border-slate-200 shadow-md rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold text-slate-900">Sugerencia del Día</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSuggestRecipe}
              disabled={isSuggesting}
            >
              {isSuggesting ? <Spinner size="sm" className="mr-2" /> : <Lightbulb className="mr-2 h-4 w-4" />}
              ¿Qué cocino hoy?
            </Button>
          </CardHeader>
          <CardContent>
            {isSuggesting && (
              <div className="flex justify-center items-center h-24"><Spinner /></div>
            )}
            {suggestionError && (
              <p className="text-red-500 text-sm text-center py-4">{suggestionError}</p>
            )}
            {!isSuggesting && !suggestionError && suggestedRecipe && (
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <div className="flex-grow">
                  <h4 className="font-semibold text-md mb-1 text-emerald-700">{suggestedRecipe.title}</h4>
                  <p className="text-sm text-slate-600 line-clamp-3">{suggestedRecipe.description}</p>
                  <div className="text-xs text-slate-500 mt-2 flex items-center gap-3">
                    <span>Prep: {suggestedRecipe.prepTimeMinutes} min</span>
                    <span>Cocción: {suggestedRecipe.cookTimeMinutes} min</span>
                    <span>Porciones: {suggestedRecipe.servings}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSuggestRecipe}
                  disabled={isSuggesting}
                  className="text-slate-500 hover:text-emerald-600 flex-shrink-0 mt-2 sm:mt-0"
                  aria-label="Obtener otra sugerencia"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            )}
            {!isSuggesting && !suggestionError && !suggestedRecipe && (
              <p className="text-sm text-slate-500 text-center py-4">Haz clic en "¿Qué cocino hoy?" para obtener una sugerencia basada en tu perfil y despensa.</p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Grid animado */}
      <motion.div
        variants={gridContainerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
      >
        {/* Widgets */}
        <motion.div variants={widgetItemVariants} className="md:col-span-1 xl:col-span-1">
           {isLoadingMeals
             ? ( <div className="flex justify-center items-center h-40 bg-white rounded-lg shadow-md border border-slate-200"><Spinner /></div> )
             : ( <TodayPlanWidget meals={todayMeals} today={today} /> )
           }
        </motion.div>

        <motion.div variants={widgetItemVariants} className="md:col-span-1 xl:col-span-1">
          <ShoppingListWidget
            itemCount={shoppingListItems.length}
            isLoading={isLoadingShoppingList}
            error={errorShoppingList}
          />
        </motion.div>

         <motion.div variants={widgetItemVariants} className="md:col-span-1 xl:col-span-1">
           <LowStockWidget
             lowStockItems={lowStockItems}
             isLoading={isLoadingLowStock}
             error={errorLowStock}
           />
         </motion.div>

         <motion.div variants={widgetItemVariants} className="md:col-span-2 xl:col-span-3">
           <FavoriteRecipesWidget
             favoriteRecipes={favoriteRecipes}
             isLoading={isLoadingRecipes}
             error={errorRecipes}
           />
         </motion.div>
      </motion.div>
    </motion.div>
  );
}