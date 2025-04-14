import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Target, Flame, Beef, Wheat, Droplet } from 'lucide-react';
import { getPlannedMeals } from '@/features/planning/services/planningService';
import { useUserStore } from '../../../stores/userStore';
import type { PlannedMeal } from '@/features/planning/types';

// Tipo para el resumen nutricional
interface NutrientSummary {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// Valores por defecto de objetivos nutricionales diarios
const DEFAULT_NUTRIENT_GOALS = {
  calories: 2000,
  protein: 50,
  carbs: 275,
  fat: 78
};

const NutritionalSummaryWidget: React.FC = () => {
  // Extraer preferencias de usuario desde el store
  const userPreferences = useUserStore(
    (state: any) => state.userPreferences
  );

  // Estados locales
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nutritionalData, setNutritionalData] = useState<NutrientSummary[]>([]);
  
  // Objetivos nutricionales: usar preferencias del usuario o valores por defecto
  const nutrientGoals = useMemo(() => {
    if (!userPreferences?.nutritionalGoals) {
      return DEFAULT_NUTRIENT_GOALS;
    }
    
    return {
      calories: userPreferences.nutritionalGoals.calories || DEFAULT_NUTRIENT_GOALS.calories,
      protein: userPreferences.nutritionalGoals.protein || DEFAULT_NUTRIENT_GOALS.protein,
      carbs: userPreferences.nutritionalGoals.carbs || DEFAULT_NUTRIENT_GOALS.carbs,
      fat: userPreferences.nutritionalGoals.fat || DEFAULT_NUTRIENT_GOALS.fat
    };
  }, [userPreferences?.nutritionalGoals]);

  // Cargar datos nutricionales al montar el componente
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Obtener comidas planificadas para hoy
        const today = new Date();
        const meals = await getPlannedMeals(today);
        
        // Si no hay comidas, establecer valores por defecto
        if (meals.length === 0) {
          setNutritionalData([{ calories: 0, protein: 0, carbs: 0, fat: 0 }]);
          setIsLoading(false);
          return;
        }
        
        // Procesar datos nutricionales (mock - aquí iría la lógica real)
        const mockData: NutrientSummary[] = [
          { calories: 1850, protein: 45, carbs: 230, fat: 62 }
        ];
        
        setNutritionalData(mockData);
      } catch (err) {
        console.error('Error al cargar datos nutricionales:', err);
        setError('No se pudieron cargar los datos nutricionales.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInitialData();
  }, []);
  
  // Calcular promedio de consumo nutricional
  const averageConsumption = useMemo(() => {
    if (nutritionalData.length === 0) {
      return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }
    
    return {
      calories: nutritionalData.reduce((sum, day) => sum + day.calories, 0) / nutritionalData.length,
      protein: nutritionalData.reduce((sum, day) => sum + day.protein, 0) / nutritionalData.length,
      carbs: nutritionalData.reduce((sum, day) => sum + day.carbs, 0) / nutritionalData.length,
      fat: nutritionalData.reduce((sum, day) => sum + day.fat, 0) / nutritionalData.length
    };
  }, [nutritionalData]);
  
  // Calcular porcentaje de objetivo alcanzado
  const getPercentage = (actual: number, goal: number) => {
    if (goal <= 0) return 0;
    const percentage = (actual / goal) * 100;
    return Math.min(percentage, 100); // Limitar a 100%
  };
  
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold flex items-center">
          <Target className="h-5 w-5 mr-2 text-primary" />
          Resumen Nutricional
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ))}
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">
            <div className="space-y-1.5">
              <div className="flex items-center text-sm font-medium">
                <Flame className="h-4 w-4 mr-1.5 text-orange-500" />
                Calorías
              </div>
              <Progress 
                value={getPercentage(averageConsumption.calories, nutrientGoals.calories)} 
                className="h-2 bg-primary"
              />
              <div className="text-xs text-muted-foreground flex justify-between">
                <span>{Math.round(averageConsumption.calories)} kcal</span>
                <span>Objetivo: {nutrientGoals.calories} kcal</span>
              </div>
            </div>
            
            <div className="space-y-1.5">
              <div className="flex items-center text-sm font-medium">
                <Beef className="h-4 w-4 mr-1.5 text-red-500" />
                Proteínas
              </div>
              <Progress 
                value={getPercentage(averageConsumption.protein, nutrientGoals.protein)} 
                className="h-2 bg-primary"
              />
              <div className="text-xs text-muted-foreground flex justify-between">
                <span>{Math.round(averageConsumption.protein)} g</span>
                <span>Objetivo: {nutrientGoals.protein} g</span>
              </div>
            </div>
            
            <div className="space-y-1.5">
              <div className="flex items-center text-sm font-medium">
                <Wheat className="h-4 w-4 mr-1.5 text-yellow-600" />
                Carbohidratos
              </div>
              <Progress 
                value={getPercentage(averageConsumption.carbs, nutrientGoals.carbs)} 
                className="h-2 bg-primary"
              />
              <div className="text-xs text-muted-foreground flex justify-between">
                <span>{Math.round(averageConsumption.carbs)} g</span>
                <span>Objetivo: {nutrientGoals.carbs} g</span>
              </div>
            </div>
            
            <div className="space-y-1.5">
              <div className="flex items-center text-sm font-medium">
                <Droplet className="h-4 w-4 mr-1.5 text-blue-500" />
                Grasas
              </div>
              <Progress 
                value={getPercentage(averageConsumption.fat, nutrientGoals.fat)} 
                className="h-2 bg-primary"
              />
              <div className="text-xs text-muted-foreground flex justify-between">
                <span>{Math.round(averageConsumption.fat)} g</span>
                <span>Objetivo: {nutrientGoals.fat} g</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NutritionalSummaryWidget; 