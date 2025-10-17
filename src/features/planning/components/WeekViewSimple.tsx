import React, { useMemo } from 'react';
import { addDays, eachDayOfInterval, endOfWeek, format, isSameDay, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Calendar,
  Clock,
  Flame,
  Plus,
  CheckCircle2,
  Circle,
  AlertCircle,
} from 'lucide-react';
import type { MealType, PlannedMeal } from '../types';

const MEAL_TYPES: MealType[] = ['Desayuno', 'Almuerzo', 'Merienda', 'Cena'];

interface WeekViewSimpleProps {
  referenceDate: Date;
  onDateSelect?: (date: Date) => void;
  onAddMeal?: (date: Date, mealType: MealType) => void;
  onEditMeal?: (meal: PlannedMeal) => void;
  onToggleMeal?: (mealId: string) => void;
  onDeleteMeal?: (mealId: string) => void;
  meals?: PlannedMeal[];
}

const WeekViewSimple: React.FC<WeekViewSimpleProps> = ({
  referenceDate,
  onDateSelect,
  onAddMeal,
  onEditMeal,
  onToggleMeal,
  onDeleteMeal,
  meals = [],
}) => {
  const weekStart = startOfWeek(referenceDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(referenceDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Organizar comidas por día
  const mealsByDate = useMemo(() => {
    return meals.reduce<Record<string, PlannedMeal[]>>((acc, meal) => {
      if (!acc[meal.plan_date]) {
        acc[meal.plan_date] = [];
      }
      acc[meal.plan_date].push(meal);
      return acc;
    }, {});
  }, [meals]);

  // Calcular métricas por día
  const dayMetrics = useMemo(() => {
    return weekDays.reduce<Record<string, {
      totalMeals: number;
      completedMeals: number;
      totalCalories: number;
      missingIngredients: number;
    }>>((acc, day) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayMeals = mealsByDate[dateStr] || [];

      const completedMeals = dayMeals.filter(meal => meal.status === 'executed').length;
      const totalCalories = dayMeals.reduce((acc, meal) => acc + (meal.nutritional_info?.calories ?? 0), 0);
      const missingIngredients = dayMeals.reduce((acc, meal) => {
        const missing = meal.ingredient_status?.filter(status => !status.available).length ?? 0;
        return acc + missing;
      }, 0);

      acc[dateStr] = {
        totalMeals: dayMeals.length,
        completedMeals,
        totalCalories,
        missingIngredients,
      };

      return acc;
    }, {});
  }, [weekDays, mealsByDate]);

  const handleDayClick = (date: Date) => {
    onDateSelect?.(date);
  };

  const handleAddMeal = (date: Date, mealType: MealType) => {
    onAddMeal?.(date, mealType);
  };

  return (
    <div className="space-y-4">
      {/* Header de la semana */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Vista semanal</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {format(weekStart, "d MMM", { locale: es })} - {format(weekEnd, "d MMM yyyy", { locale: es })}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Grid de días de la semana */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {weekDays.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayMeals = mealsByDate[dateStr] || [];
          const metrics = dayMetrics[dateStr];
          const isToday = isSameDay(day, new Date());
          const isSelected = isSameDay(day, referenceDate);

          return (
            <Card
              key={dateStr}
              className={`cursor-pointer transition-all hover:shadow-md ${
                isToday ? 'ring-2 ring-primary' : ''
              } ${isSelected ? 'bg-primary/5' : ''}`}
              onClick={() => handleDayClick(day)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <div className={`text-sm font-medium ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                      {format(day, 'EEE', { locale: es })}
                    </div>
                    <div className={`text-lg font-bold ${isToday ? 'text-primary' : 'text-foreground'}`}>
                      {format(day, 'd')}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="outline" className="text-xs">
                      {metrics.totalMeals} comidas
                    </Badge>
                    {metrics.completedMeals > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {metrics.completedMeals} ✓
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {/* Métricas del día */}
                {metrics.totalMeals > 0 && (
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Progreso</span>
                      <span className="font-medium">
                        {metrics.completedMeals}/{metrics.totalMeals}
                      </span>
                    </div>
                    <Progress
                      value={metrics.totalMeals > 0 ? (metrics.completedMeals / metrics.totalMeals) * 100 : 0}
                      className="h-1"
                    />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>🔥 {metrics.totalCalories} cal</span>
                      {metrics.missingIngredients > 0 && (
                        <span className="text-amber-600">⚠️ {metrics.missingIngredients}</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Lista de comidas del día */}
                <div className="space-y-1">
                  {MEAL_TYPES.map((mealType) => {
                    const meal = dayMeals.find(m => m.meal_type === mealType);

                    return (
                      <div key={mealType} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            meal ? (meal.status === 'executed' ? 'bg-green-500' : 'bg-muted') : 'bg-muted'
                          }`} />
                          <span className="text-xs text-muted-foreground">
                            {mealType}
                          </span>
                        </div>
                        {meal && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleMeal?.(meal.id);
                            }}
                            className="h-6 w-6 p-0"
                          >
                            {meal.status === 'executed' ? (
                              <CheckCircle2 className="h-3 w-3 text-green-600" />
                            ) : (
                              <Circle className="h-3 w-3" />
                            )}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Botón para añadir comida */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddMeal(day, 'Almuerzo');
                  }}
                  className="w-full mt-2 h-8 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Añadir
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Resumen semanal */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Resumen de la semana</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {meals.length}
              </div>
              <div className="text-sm text-muted-foreground">Comidas totales</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {meals.filter(m => m.status === 'executed').length}
              </div>
              <div className="text-sm text-muted-foreground">Completadas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">
                {meals.reduce((acc, meal) => {
                  const missing = meal.ingredient_status?.filter(status => !status.available).length ?? 0;
                  return acc + missing;
                }, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Ingredientes faltantes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(meals.reduce((acc, meal) => acc + (meal.nutritional_info?.calories ?? 0), 0) / Math.max(weekDays.length, 1))}
              </div>
              <div className="text-sm text-muted-foreground">Calorías promedio</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WeekViewSimple;
