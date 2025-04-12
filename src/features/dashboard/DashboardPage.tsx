import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { getPlannedMeals } from '@/features/planning/planningService';
import type { PlannedMeal } from '@/features/planning/types';
import { usePantryStore } from '@/stores/pantryStore';
import { useShoppingListStore } from '@/stores/shoppingListStore';
import { motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { RefreshCw, Lightbulb } from 'lucide-react';
// Usar any temporalmente
// type Recipe = any;
// type PantryItem = any;
// Importar los Widgets
import { TodayPlanWidget } from './components/TodayPlanWidget';
import { ShoppingListWidget } from './components/ShoppingListWidget';
import { FavoriteRecipesWidget } from './components/FavoriteRecipesWidget';
import { LowStockWidget } from './components/LowStockWidget';
import { SimpleShoppingListWidget } from './components/SimpleShoppingListWidget';
import { Spinner } from '@/components/ui/Spinner';
import { SuggestionsSection } from '@/features/suggestions/components/SuggestionsSection';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// --- Importar Tipos Reales ---
import type { Recipe } from '@/types/recipeTypes';
import type { PantryItem } from '@/features/pantry/types';
// Eliminar declaraciones 'any' conflictivas
// type Recipe = any;
// type PantryItem = any;

// Importar store que faltaba
import { useRecipeStore } from '@/stores/recipeStore'; 

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
  const { user, profile } = useAuth();

  // Estado para comidas de hoy
  const [todayMeals, setTodayMeals] = useState<PlannedMeal[]>([]);
  const [isLoadingMeals, setIsLoadingMeals] = useState(true);
  const [errorMeals, setErrorMeals] = useState<string | null>(null);

  // Stores para Despensa y Lista de Compras (Selección Individual)
  const lowStockItems = usePantryStore((state) => state.lowStockItems);
  const isLoadingLowStock = usePantryStore((state) => state.isLoading);
  const errorLowStock = usePantryStore((state) => state.error);
  const fetchLowStockItems = usePantryStore((state) => state.fetchLowStockItems);
  // No necesitamos allPantryItems directamente aquí si solo se usa en el effect
  // const allPantryItems = usePantryStore((state) => state.items); 

  const shoppingListItems = useShoppingListStore((state) => state.items);
  const isLoadingShoppingList = useShoppingListStore((state) => state.isLoading);
  const errorShoppingList = useShoppingListStore((state) => state.error);
  const fetchShoppingListItems = useShoppingListStore((state) => state.fetchItems);
  
  // Estado local para Recetas Favoritas
  const [favoriteRecipesData, setFavoriteRecipesData] = useState<Recipe[]>([]);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(true);
  const [errorFavorites, setErrorFavorites] = useState<string | null>(null);
  const allGlobalRecipes = useRecipeStore((state) => state.recipes);
  const isLoadingGlobalRecipes = useRecipeStore((state) => state.isLoading);

  const today = new Date();
  const todayDateStr = format(today, 'yyyy-MM-dd');
  const greeting = getGreeting(today);

  const shouldReduceMotion = useReducedMotion();
  const gridContainerVariants = getGridContainerVariants(shouldReduceMotion);
  const widgetItemVariants = getWidgetItemVariants(shouldReduceMotion);
  const greetingVariants = getGreetingVariants(shouldReduceMotion);

  // --- Effects ---
  // Cargar Comidas de Hoy
  useEffect(() => {
    let isMounted = true;
    setIsLoadingMeals(true);
    setErrorMeals(null);

    getPlannedMeals(todayDateStr, todayDateStr)
      .then(meals => {
        if (isMounted) {
            // Asignar directamente las comidas obtenidas
            setTodayMeals(meals);
             if (meals.length === 0) {
                 console.log("[DashboardPage] No meals planned for today.");
                 // No es necesario un error, simplemente no hay comidas
             }
        }
      })
      .catch(err => {
        if (isMounted) {
            console.error("Error loading today's meals:", err);
            setErrorMeals("Error al cargar el plan de hoy.");
            setTodayMeals([]); // Mantener vacío en caso de error
        }
      })
      .finally(() => {
          if (isMounted) setIsLoadingMeals(false);
      });
      
      return () => { isMounted = false; }; // Cleanup
  }, [todayDateStr]);

  // Cargar Items Bajos de Despensa (dependencias estables)
  useEffect(() => {
    if (!isLoadingLowStock && !errorLowStock) {
        fetchLowStockItems();
    }
  }, [fetchLowStockItems, isLoadingLowStock, errorLowStock]);

  // Cargar Lista de Compras (dependencias estables)
  useEffect(() => {
    if (!isLoadingShoppingList && !errorShoppingList) {
        fetchShoppingListItems();
    }
  }, [fetchShoppingListItems, isLoadingShoppingList, errorShoppingList]);

  // Cargar Recetas Favoritas (dependencias estables)
  useEffect(() => {
      setIsLoadingFavorites(true);
      setErrorFavorites(null);
      if (!isLoadingGlobalRecipes) {
          try {
              const favs = allGlobalRecipes.filter((recipe: Recipe) => recipe.is_favorite);
              setFavoriteRecipesData(favs);
          } catch (err) {
              console.error("Error filtering favorite recipes:", err);
              setErrorFavorites("Error al cargar recetas favoritas.");
              setFavoriteRecipesData([]);
          } finally {
              setIsLoadingFavorites(false);
          }
      }
  }, [allGlobalRecipes, isLoadingGlobalRecipes]); 

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

      {/* Sección de Sugerencias Inteligentes (Nueva) */}
      <motion.div
        variants={widgetItemVariants} // Reutilizar animación
        className="mb-6"
        initial="hidden"
        animate="visible"
      >
        <SuggestionsSection />
      </motion.div>

      {/* Grid animado */}
      <motion.div
        variants={gridContainerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
      >
        {/* Widget Plan de Hoy - Corregido: no pasar isLoading/error */}
        <motion.div variants={widgetItemVariants} className="md:col-span-1 xl:col-span-1">
           <TodayPlanWidget 
              meals={todayMeals} 
              today={today}
           />
        </motion.div>

        {/* Widget Lista de Compras - Corregido: pasar itemCount en lugar de items */}
        <motion.div variants={widgetItemVariants} className="md:col-span-1 xl:col-span-1">
          <SimpleShoppingListWidget />
        </motion.div>

        {/* Widget Despensa Baja - Asumiendo que espera lowStockItems, isLoading, error */}
         <motion.div variants={widgetItemVariants} className="md:col-span-1 xl:col-span-1">
           <LowStockWidget
             lowStockItems={lowStockItems}
             isLoading={isLoadingLowStock}
             error={errorLowStock}
           />
         </motion.div>

         {/* Widget Recetas Favoritas - Asumiendo que espera favoriteRecipes, isLoading, error */}
         <motion.div variants={widgetItemVariants} className="md:col-span-2 xl:col-span-3">
           <FavoriteRecipesWidget
             favoriteRecipes={favoriteRecipesData}
             isLoading={isLoadingFavorites}
             error={errorFavorites}
           />
         </motion.div>
      </motion.div>
    </motion.div>
  );
}