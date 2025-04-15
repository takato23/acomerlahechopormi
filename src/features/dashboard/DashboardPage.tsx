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
import { RefreshCw, Lightbulb, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
// Importar los Widgets
import { TodayPlanWidget } from './components/TodayPlanWidget';
import { ShoppingListWidget } from './components/ShoppingListWidget';
import { FavoriteRecipesWidget } from './components/FavoriteRecipesWidget';
import { LowStockWidget } from './components/LowStockWidget';
import NutritionalSummaryWidget from './components/NutritionalSummaryWidget';
// Importar el nuevo widget
import { EstimatedSpendWidget } from './components/EstimatedSpendWidget';
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
  const [greeting, setGreeting] = useState<string>('¡Aquí tu resumen');

  // Estado para comidas de hoy
  const [todayMeals, setTodayMeals] = useState<PlannedMeal[]>([]);
  const [isLoadingMeals, setIsLoadingMeals] = useState(true);
  const [errorMeals, setErrorMeals] = useState<string | null>(null);

  // Usar selectores simples de Zustand
  const lowStockItems = usePantryStore(state => state.lowStockItems || []);
  const isPantryLoading = usePantryStore(state => state.isLoading);
  const pantryError = usePantryStore(state => state.error);
  const fetchLowStockItems = usePantryStore(state => state.fetchLowStockItems);
  // const fetchPantryItems = usePantryStore(state => state.fetchItems); // No parece usarse directamente aquí
  
  const shoppingListItems = useShoppingListStore(state => state.items || []);
  const isShoppingListLoading = useShoppingListStore(state => state.isLoading);
  const shoppingListError = useShoppingListStore(state => state.error);
  // const fetchShoppingListItems = useShoppingListStore(state => state.fetchItems); // No parece usarse directamente aquí

  // Estado local para Recetas Favoritas (reintroducido)
  const [favoriteRecipesData, setFavoriteRecipesData] = useState<Recipe[]>([]);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(true);
  const [errorFavorites, setErrorFavorites] = useState<string | null>(null);

  // Recetas favoritas
  const allRecipes = useRecipeStore(state => state.recipes || []);
  const isLoadingRecipes = useRecipeStore(state => state.isLoading);
  const loadRecipes = useRecipeStore(state => state.loadRecipes);
  const favoriteRecipes = useMemo(() => allRecipes.filter(r => r.is_favorite), [allRecipes]);

  // Fechas y formatos
  const today = useMemo(() => new Date(), []);
  const formattedDate = useMemo(() => format(today, "EEEE, d 'de' MMMM", { locale: es }), [today]);
  const todayDateStr = useMemo(() => format(today, 'yyyy-MM-dd'), [today]);

  // Animaciones
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
      // fetchPantryItems();
      // fetchShoppingListItems();
    };
    
    fetchUserData();
  }, [user, loadRecipes]);

  // Helper para formatear el error a string
  const formatErrorProp = (error: Error | string | null): string | null => {
    if (error instanceof Error) {
      return error.message;
    }
    return error; // Devuelve el string o null directamente
  };

  // Determinar estado de carga general (simplificado)
  const isLoading = isLoadingMeals || isPantryLoading || isShoppingListLoading || isLoadingRecipes; // Añadir más según sea necesario
  const hasError = errorMeals || pantryError || shoppingListError; // Combinar errores

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto w-full px-4 md:px-6 lg:px-8">
      {/* Encabezado con Saludo y Fecha */} 
      <motion.div 
        className="mb-6 pt-6 md:pt-8"
        variants={greetingVariants} 
        initial="hidden" 
        animate="visible"
      >
        <h1 className="text-2xl font-semibold flex items-center">
          <Sparkles className="h-6 w-6 mr-2 inline-block text-primary" /> 
          {greeting}, {userName}!
        </h1>
        <p className="text-muted-foreground">{formattedDate}</p>
      </motion.div>

      {/* Contenedor Principal de Widgets con Grid Layout */}
      <motion.div 
        className="grid grid-cols-12 gap-6 flex-grow pb-6 md:pb-8"
        variants={gridContainerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* --- Fila 1 de Widgets --- */} 
        <motion.div className="col-span-12 lg:col-span-5" variants={widgetItemVariants}> {/* Simplificado a col-span-12 por defecto */} 
          <NutritionalSummaryWidget /> 
        </motion.div>
        <motion.div className="col-span-12 md:col-span-6 lg:col-span-3" variants={widgetItemVariants}> {/* md:col-span-6 añadido */} 
          <EstimatedSpendWidget /> 
        </motion.div>
        <motion.div className="col-span-12 md:col-span-6 lg:col-span-4" variants={widgetItemVariants}> {/* md:col-span-6 añadido */} 
          <FavoriteRecipesWidget /> 
        </motion.div>
        
        {/* Today Plan Widget */} 
        {isLoadingMeals ? (
          <Skeleton className="h-[250px] col-span-12 md:col-span-7" />
        ) : errorMeals ? (
          <div className="col-span-12 md:col-span-7 text-red-500 p-4 bg-red-100 rounded-lg">{errorMeals}</div>
        ) : (
          <motion.div className="col-span-12 md:col-span-7" variants={widgetItemVariants}>
             <TodayPlanWidget meals={todayMeals} today={today} />
          </motion.div>
        )}

        {/* Low Stock Widget (Paso 8) - Renderizado Condicional */} 
        {isPantryLoading ? (
          <Skeleton className="h-[250px] col-span-12 md:col-span-5" />
        ) : pantryError ? (
          <div className="col-span-12 md:col-span-5 text-red-500 p-4 bg-red-100 rounded-lg">Error despensa: {formatErrorProp(pantryError)}</div>
        ) : lowStockItems.length > 0 ? (
          <motion.div className="col-span-12 md:col-span-5" variants={widgetItemVariants}>
            <LowStockWidget 
              lowStockItems={lowStockItems} 
              isLoading={isPantryLoading} 
              error={formatErrorProp(pantryError)}
            />
          </motion.div>
        ) : null}

      </motion.div>
    </div>
  );
}

export default DashboardPage;