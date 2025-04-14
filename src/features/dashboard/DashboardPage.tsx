import React, { useState, useEffect, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { getPlannedMeals } from '@/features/planning/planningService';
import type { PlannedMeal } from '@/features/planning/types';
import { usePantryStore } from '@/stores/pantryStore';
import { useShoppingListStore } from '@/stores/shoppingListStore';
import { useUserStore } from '@/stores/userStore';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { RefreshCw, Lightbulb } from 'lucide-react';
// Importar los Widgets
import { TodayPlanWidget } from './components/TodayPlanWidget';
import { ShoppingListWidget } from './components/ShoppingListWidget';
import { FavoriteRecipesWidget } from './components/FavoriteRecipesWidget';
import { LowStockWidget } from './components/LowStockWidget';
import NutritionalSummaryWidget from './components/NutritionalSummaryWidget';
// Comentando widgets que pueden estar causando problemas
// import { MealPlanWidget } from './components/MealPlanWidget';
// import { RecipeSuggestionsWidget } from './components/RecipeSuggestionsWidget';
// import { PantryOverviewWidget } from './components/PantryOverviewWidget';
// import { QuickActionsWidget } from './components/QuickActionsWidget';
// import { GoalProgressWidget } from './components/GoalProgressWidget';

// Importar store que faltaba
import { useRecipeStore } from '@/stores/recipeStore'; 

// Importar tipos
import type { Recipe } from '@/types/recipeTypes';
import type { PantryItem } from '@/features/pantry/types';
import type { UserProfile } from '@/features/user/userTypes';

// Importar funciones y utilidades
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { getUserProfile } from '@/features/user/userService';

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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userName, setUserName] = useState<string>('');
  const [greeting, setGreeting] = useState<string>('¡Hola');

  // Estado para comidas de hoy
  const [todayMeals, setTodayMeals] = useState<PlannedMeal[]>([]);
  const [isLoadingMeals, setIsLoadingMeals] = useState(true);
  const [errorMeals, setErrorMeals] = useState<string | null>(null);

  // Usar selectores simples de Zustand para evitar bucles de renderizado
  const lowStockItems = usePantryStore(state => state.lowStockItems || []);
  const isPantryLoading = usePantryStore(state => state.isLoading);
  const pantryError = usePantryStore(state => state.error);
  const fetchLowStockItems = usePantryStore(state => state.fetchLowStockItems);
  const fetchPantryItems = usePantryStore(state => state.fetchItems);
  
  const shoppingListItems = useShoppingListStore(state => state.items || []);
  const isShoppingListLoading = useShoppingListStore(state => state.isLoading);
  const shoppingListError = useShoppingListStore(state => state.error);
  const fetchShoppingListItems = useShoppingListStore(state => state.fetchItems);
  
  // Estado local para Recetas Favoritas
  const [favoriteRecipesData, setFavoriteRecipesData] = useState<Recipe[]>([]);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(true);
  const [errorFavorites, setErrorFavorites] = useState<string | null>(null);
  
  // Seleccionar datos del store de recipes
  const allRecipes = useRecipeStore(state => state.recipes || []);
  const isLoadingRecipes = useRecipeStore(state => state.isLoading);
  const loadRecipes = useRecipeStore(state => state.loadRecipes);

  // Memoizar los favoritos para evitar cálculos repetidos
  const favoriteRecipes = useMemo(() => 
    allRecipes.filter(r => r.is_favorite), 
    [allRecipes]
  );

  const today = useMemo(() => new Date(), []);
  const formattedDate = useMemo(() => format(today, "EEEE, d 'de' MMMM", { locale: es }), [today]);
  const todayDateStr = useMemo(() => format(today, 'yyyy-MM-dd'), [today]);

  const shouldReduceMotion = useReducedMotion();
  const gridContainerVariants = useMemo(() => getGridContainerVariants(shouldReduceMotion), [shouldReduceMotion]);
  const widgetItemVariants = useMemo(() => getWidgetItemVariants(shouldReduceMotion), [shouldReduceMotion]);
  const greetingVariants = useMemo(() => getGreetingVariants(shouldReduceMotion), [shouldReduceMotion]);

  // --- Effects ---
  // Cargar Comidas de Hoy
  useEffect(() => {
    let isMounted = true;
    
    const fetchTodayMeals = async () => {
      if (!isMounted) return;
      
      setIsLoadingMeals(true);
      setErrorMeals(null);
      
      try {
        const meals = await getPlannedMeals(todayDateStr, todayDateStr);
        if (isMounted) {
          setTodayMeals(meals);
          if (meals.length === 0) {
            console.log("[DashboardPage] No meals planned for today.");
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error("Error loading today's meals:", err);
          setErrorMeals("Error al cargar el plan de hoy.");
          setTodayMeals([]);
        }
      } finally {
        if (isMounted) setIsLoadingMeals(false);
      }
    };
    
    fetchTodayMeals();
    
    return () => { isMounted = false; };
  }, [todayDateStr]);

  // Cargar Items Bajos de Despensa
  useEffect(() => {
    if (!isPantryLoading && !pantryError) {
      fetchLowStockItems();
    }
  }, [fetchLowStockItems, isPantryLoading, pantryError]);

  // Cargar Recetas Favoritas
  useEffect(() => {
    setIsLoadingFavorites(true);
    setErrorFavorites(null);
    
    if (!isLoadingRecipes) {
      try {
        setFavoriteRecipesData(favoriteRecipes);
      } catch (err) {
        console.error("Error filtering favorite recipes:", err);
        setErrorFavorites("Error al cargar recetas favoritas.");
        setFavoriteRecipesData([]);
      } finally {
        setIsLoadingFavorites(false);
      }
    }
  }, [favoriteRecipes, isLoadingRecipes]); 

  // Cargar datos iniciales
  useEffect(() => {
    const fetchUserData = async () => {
      setGreeting(getGreeting(today));
      
      if (!user) {
        setUserName('');
        return;
      }
      
      try {
        const profile = await getUserProfile(user.id);
        if (profile) {
          setUserName(profile.username || '');
        } else {
          setUserName('');
        }
        
        // Cargar preferencias del usuario
        useUserStore.getState().fetchUserPreferences(user.id);
      } catch (err) {
        console.error("Error fetching profile for greeting:", err);
        setUserName('');
      }
      
      // Cargar datos iniciales
      loadRecipes(user.id);
      fetchPantryItems();
      fetchShoppingListItems();
    };
    
    fetchUserData();
  }, [user, loadRecipes, fetchPantryItems, fetchShoppingListItems, today]);

  // Helper para formatear el error a string
  const formatErrorProp = (error: Error | string | null): string | null => {
    if (error instanceof Error) {
      return error.message;
    }
    return error; // Devuelve el string o null directamente
  };

  // --- Render ---
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-emerald-50 to-white dark:from-slate-900 dark:to-slate-800">
      {/* <WelcomeHeader userName={userName} date={formattedDate} /> */}
      {/* Cabecera provisional mientras se arregla el componente WelcomeHeader */}
      <header className="bg-white dark:bg-slate-800 shadow-sm py-4 px-6">
        <div className="flex flex-col space-y-1">
          <h1 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {greeting}, {userName || 'Chef'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 capitalize">
            {formattedDate}
          </p>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <motion.div 
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          variants={gridContainerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Widgets Principales - Comentados temporalmente para aislar el problema */}
          <motion.div variants={widgetItemVariants} className="lg:col-span-2 xl:col-span-3">
             <TodayPlanWidget meals={todayMeals} today={today} />
          </motion.div>

          {/* <motion.div variants={widgetItemVariants}>
            <QuickActionsWidget />
          </motion.div> */}

          <motion.div variants={widgetItemVariants} className="lg:col-span-2">
            <NutritionalSummaryWidget />
          </motion.div>
          
          {/* <motion.div variants={widgetItemVariants}>
            <PantryOverviewWidget />
          </motion.div>

          <motion.div variants={widgetItemVariants} className="lg:col-span-3 xl:col-span-4">
             <RecipeSuggestionsWidget />
          </motion.div> */}

          {/* Pasar props al widget correcto */}
          <motion.div variants={widgetItemVariants} className="md:col-span-1 xl:col-span-1">
             <ShoppingListWidget 
                itemCount={shoppingListItems.length}
                isLoading={isShoppingListLoading}
                error={formatErrorProp(shoppingListError)}
             />
          </motion.div>

          <motion.div variants={widgetItemVariants} className="md:col-span-1 xl:col-span-1">
            <LowStockWidget 
                lowStockItems={lowStockItems} 
                isLoading={isPantryLoading} 
                error={formatErrorProp(pantryError)}
            />
          </motion.div>

          {/* <motion.div variants={widgetItemVariants}>
            <GoalProgressWidget /> 
          </motion.div> */} 

        </motion.div>
      </main>
    </div>
  );
}