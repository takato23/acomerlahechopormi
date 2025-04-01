import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { getPlannedMeals } from '@/features/planning/planningService';
import type { PlannedMeal } from '@/features/planning/types';
// import { useRecipeStore } from '@/stores/recipeStore'; // Comentado - Funcionalidad de recetas eliminada temporalmente
import { usePantryStore } from '@/stores/pantryStore'; 
import { useShoppingListStore } from '@/stores/shoppingListStore'; 
import { motion, useReducedMotion } from 'framer-motion'; // Importar useReducedMotion
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
 * @param {Date} date - Fecha actual
 * @returns {string} Saludo apropiado
 */
const getGreeting = (date: Date): string => {
  const hour = date.getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 20) return "Buenas tardes";
  return "Buenas noches";
};

// --- Variantes de Animación ---

// Contenedor principal del grid
const getGridContainerVariants = (shouldReduceMotion: boolean | null) => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      // Desactivar stagger si se prefiere movimiento reducido
      staggerChildren: shouldReduceMotion ? 0 : 0.08 
    }
  }
});

// Widgets individuales
const getWidgetItemVariants = (shouldReduceMotion: boolean | null) => ({
  hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 }, // Sin movimiento Y si reducido
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

// Saludo
const getGreetingVariants = (shouldReduceMotion: boolean | null) => ({
  hidden: { opacity: 0, x: shouldReduceMotion ? 0 : -20 }, // Sin movimiento X si reducido
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
 * Página principal del Dashboard. Muestra resúmenes de diferentes secciones de la aplicación.
 * Incluye animaciones de entrada que respetan la preferencia de movimiento reducido.
 * @component
 */
export function DashboardPage() {
  const { profile } = useAuth();
  
  // Estados (sin cambios)
  const [todayMeals, setTodayMeals] = useState<PlannedMeal[]>([]);
  const [isLoadingMeals, setIsLoadingMeals] = useState(true);
  const [errorMeals, setErrorMeals] = useState<string | null>(null);
  // const { recipes: allRecipes, isLoading: isLoadingRecipes, error: errorRecipes, fetchRecipes } = useRecipeStore(); // Comentado
  // Placeholders para evitar errores:
  const allRecipes: any[] = [];
  const isLoadingRecipes = false;
  const errorRecipes = null;
  // const fetchRecipes = () => {}; // No es necesario si el useEffect se comenta
  const { lowStockItems, isLoadingLowStock, errorLowStock, fetchLowStockItems, items: allPantryItems } = usePantryStore();
  const { items: shoppingListItems, isLoading: isLoadingShoppingList, error: errorShoppingList, fetchItems: fetchShoppingListItems } = useShoppingListStore();

  const today = new Date();
  const todayDateStr = format(today, 'yyyy-MM-dd');
  const greeting = getGreeting(today);

  // Hook para detectar preferencia de movimiento reducido
  const shouldReduceMotion = useReducedMotion();

  // Generar variantes basadas en la preferencia
  const gridContainerVariants = getGridContainerVariants(shouldReduceMotion);
  const widgetItemVariants = getWidgetItemVariants(shouldReduceMotion);
  const greetingVariants = getGreetingVariants(shouldReduceMotion);

  // Efecto de carga de datos (sin cambios)
  // Separar los efectos por responsabilidad
  useEffect(() => {
    setIsLoadingMeals(true);
    setErrorMeals(null);
    
    getPlannedMeals(todayDateStr, todayDateStr)
      .then(meals => {
        setTodayMeals(meals);
      })
      .catch(err => {
        console.error("Error loading today's meals:", err);
        setErrorMeals("Error al cargar plan de hoy.");
      })
      .finally(() => setIsLoadingMeals(false));
  }, [todayDateStr]); // Solo depende de la fecha

  // // Efecto separado para recetas - Comentado
  // useEffect(() => {
  //   if (allRecipes.length === 0 && !isLoadingRecipes) {
  //     // fetchRecipes(); // LLAMADA COMENTADA
  //   }
  // }, [allRecipes.length, isLoadingRecipes]);

  // Efecto separado para pantry
  useEffect(() => {
    if (allPantryItems.length === 0 && !isLoadingLowStock) {
      fetchLowStockItems();
    } else if (allPantryItems.length > 0 && lowStockItems.length === 0 && !isLoadingLowStock) {
      fetchLowStockItems();
    }
  }, [allPantryItems.length, lowStockItems.length, isLoadingLowStock]);

  // Efecto separado para lista de compras
  useEffect(() => {
    if (shoppingListItems.length === 0 && !isLoadingShoppingList) {
      fetchShoppingListItems();
    }
  }, [shoppingListItems.length, isLoadingShoppingList]);

  // Modificado para devolver array vacío ya que allRecipes está vacío
  const favoriteRecipes = useMemo(() => {
    // return allRecipes.filter(recipe => recipe.is_favorite);
    return [];
  }, [/* allRecipes */]); // Dependencia eliminada o dejada vacía

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="container mx-auto max-w-6xl py-8 px-4 space-y-6"
    > 
      {/* Saludo Animado (respeta reduced motion) */}
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={greetingVariants} // Usa variantes dinámicas
        className="mb-6"
      >
        <h1 className="text-3xl font-bold flex items-center gap-2">
          {greeting}{profile?.username ? `, ${profile.username}` : ''}! 👋
        </h1>
        <p className="text-lg text-muted-foreground">Tu resumen de cocina.</p>
      </motion.div>

      {/* Grid animado (respeta reduced motion) */}
      <motion.div 
        variants={gridContainerVariants} // Usa variantes dinámicas
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
      >
        
        {/* Widgets (usan variantes dinámicas) */}
        <motion.div variants={widgetItemVariants} className="md:col-span-1 xl:col-span-1"> 
           {isLoadingMeals 
             ? ( <div className="flex justify-center items-center h-40 bg-card rounded-lg shadow-sm border border-border/30"><Spinner /></div> ) 
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
             favoriteRecipes={favoriteRecipes} // Ahora siempre es []
             isLoading={isLoadingRecipes} // Ahora siempre es false
             error={errorRecipes} // Ahora siempre es null
           />
         </motion.div>
      </motion.div>
    </motion.div>
  );
}