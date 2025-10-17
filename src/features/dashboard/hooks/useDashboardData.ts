import { useState, useEffect, useCallback } from 'react';
import { getPlannedMeals } from '@/features/planning/planningService';
import { getPantryItems } from '@/features/pantry/pantryService';
import { useShoppingListStore } from '@/stores/shoppingListStore';
import { useAuth } from '@/features/auth/AuthContext';

export interface DashboardMetrics {
  totalMealsPlanned: number;
  totalPantryItems: number;
  totalShoppingItems: number;
  completedMeals: number;
  lowStockItems: number;
  expiringItems: number;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  recentMeals: any[]; // PlannedMeal[]
  pantryAlerts: any[]; // PantryItem[]
  shoppingItems: any[]; // ShoppingListUIItem[]
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const calculateMetrics = (
  meals: any[],
  pantryItems: any[],
  shoppingItems: any[]
): DashboardMetrics => {
  const totalMealsPlanned = meals.length;
  const completedMeals = meals.filter((meal: any) => meal.status === 'executed').length;
  const totalPantryItems = pantryItems.length;
  const totalShoppingItems = shoppingItems.length;

  // Calcular items con stock bajo (menos de 20% de cantidad ideal)
  const lowStockItems = pantryItems.filter((item: any) =>
    item.current_quantity && item.ideal_quantity &&
    (item.current_quantity / item.ideal_quantity) < 0.2
  ).length;

  // Calcular items próximos a vencer (en los próximos 7 días)
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  const expiringItems = pantryItems.filter((item: any) => {
    if (!item.expiration_date) return false;
    const expirationDate = new Date(item.expiration_date);
    return expirationDate <= sevenDaysFromNow;
  }).length;

  return {
    totalMealsPlanned,
    totalPantryItems,
    totalShoppingItems,
    completedMeals,
    lowStockItems,
    expiringItems,
  };
};

export const useDashboardData = (): DashboardData => {
  const { user } = useAuth();
  const { items: shoppingItems } = useShoppingListStore();
  const [data, setData] = useState<Omit<DashboardData, 'refetch'>>({
    metrics: {
      totalMealsPlanned: 0,
      totalPantryItems: 0,
      totalShoppingItems: 0,
      completedMeals: 0,
      lowStockItems: 0,
      expiringItems: 0,
    },
    recentMeals: [],
    pantryAlerts: [],
    shoppingItems: [],
    isLoading: true,
    error: null,
  });

  const fetchDashboardData = useCallback(async () => {
    if (!user?.id) {
      setData(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      setData(prev => ({ ...prev, isLoading: true, error: null }));

      // Obtener datos de esta semana
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Lunes de esta semana
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // Domingo de esta semana

      const startDateStr = startOfWeek.toISOString().split('T')[0];
      const endDateStr = endOfWeek.toISOString().split('T')[0];

      // Ejecutar consultas en paralelo (shopping items ya están en el store)
      const [meals, pantryItems] = await Promise.all([
        getPlannedMeals(startDateStr, endDateStr),
        getPantryItems(),
      ]);

      // Filtrar meals de hoy para mostrar como recientes
      const todayStr = today.toISOString().split('T')[0];
      const recentMeals = meals
        .filter((meal: any) => meal.plan_date === todayStr)
        .slice(0, 5); // Máximo 5 meals recientes

      // Filtrar alertas de pantry (stock bajo o próximos a vencer)
      const pantryAlerts = pantryItems.filter((item: any) => {
        const isLowStock = item.current_quantity && item.ideal_quantity &&
          (item.current_quantity / item.ideal_quantity) < 0.3; // 30% threshold

        const isExpiring = item.expiration_date && (() => {
          const expirationDate = new Date(item.expiration_date);
          const threeDaysFromNow = new Date();
          threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
          return expirationDate <= threeDaysFromNow;
        })();

        return isLowStock || isExpiring;
      });

      // Calcular métricas
      const metrics = calculateMetrics(meals, pantryItems, shoppingItems);

      setData({
        metrics,
        recentMeals,
        pantryAlerts,
        shoppingItems,
        isLoading: false,
        error: null,
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error al cargar datos del dashboard',
      }));
    }
  }, [user?.id]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData, shoppingItems]);

  return {
    ...data,
    refetch: fetchDashboardData,
  };
};
