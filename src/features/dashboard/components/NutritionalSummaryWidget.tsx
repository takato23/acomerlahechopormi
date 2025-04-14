import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { getPlannedMeals } from '@/features/planning/services/planningService';
import { useUserStore } from '../../../stores/userStore';
import { shallow } from 'zustand/shallow';
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
  
  // Determinar color según el porcentaje
  const getColorForPercentage = (percentage: number) => {
    if (percentage < 50) return { backgroundColor: 'rgb(239, 68, 68)' }; // red-500 en RGB
    if (percentage < 80) return { backgroundColor: 'rgb(234, 179, 8)' };  // yellow-500 en RGB
    return { backgroundColor: 'rgb(34, 197, 94)' };                        // green-500 en RGB
  };
  
  return (
    <Card className="col-span-12 sm:col-span-8 h-[420px]">
      <CardHeader className="pb-2">
        <CardTitle>Resumen Nutricional</CardTitle>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <Tabs defaultValue="summary">
            <TabsList className="mb-4">
              <TabsTrigger value="summary">Resumen</TabsTrigger>
              <TabsTrigger value="chart">Tendencias</TabsTrigger>
            </TabsList>
            
            <TabsContent value="summary" className="pt-2">
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-6">
                  {/* Calorías */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Calorías</span>
                      <span className="text-sm font-medium">{Math.round(averageConsumption.calories)} / {nutrientGoals.calories} kcal</span>
                    </div>
                    <Progress 
                      value={getPercentage(averageConsumption.calories, nutrientGoals.calories)} 
                      style={getColorForPercentage(getPercentage(averageConsumption.calories, nutrientGoals.calories))}
                    />
                  </div>
                  
                  {/* Proteínas */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Proteínas</span>
                      <span className="text-sm font-medium">{Math.round(averageConsumption.protein)} / {nutrientGoals.protein} g</span>
                    </div>
                    <Progress 
                      value={getPercentage(averageConsumption.protein, nutrientGoals.protein)} 
                      style={getColorForPercentage(getPercentage(averageConsumption.protein, nutrientGoals.protein))}
                    />
                  </div>
                  
                  {/* Carbohidratos */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Carbohidratos</span>
                      <span className="text-sm font-medium">{Math.round(averageConsumption.carbs)} / {nutrientGoals.carbs} g</span>
                    </div>
                    <Progress 
                      value={getPercentage(averageConsumption.carbs, nutrientGoals.carbs)} 
                      style={getColorForPercentage(getPercentage(averageConsumption.carbs, nutrientGoals.carbs))}
                    />
                  </div>
                  
                  {/* Grasas */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Grasas</span>
                      <span className="text-sm font-medium">{Math.round(averageConsumption.fat)} / {nutrientGoals.fat} g</span>
                    </div>
                    <Progress 
                      value={getPercentage(averageConsumption.fat, nutrientGoals.fat)} 
                      style={getColorForPercentage(getPercentage(averageConsumption.fat, nutrientGoals.fat))}
                    />
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="chart">
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-muted-foreground">Datos de tendencias no disponibles</p>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};

export default NutritionalSummaryWidget; 