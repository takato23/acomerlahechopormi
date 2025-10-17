import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  CheckCircle2,
  Circle,
  Clock,
} from 'lucide-react';
import type { MealType, PlannedMeal } from '../types';

const MEAL_TYPES: MealType[] = ['Desayuno', 'Almuerzo', 'Merienda', 'Cena'];

interface MobileDayViewProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onAddMeal?: (date: Date, mealType: MealType) => void;
  onEditMeal?: (meal: PlannedMeal) => void;
  onDeleteMeal?: (mealId: string) => void;
  onToggleMeal?: (mealId: string) => void;
  meals?: PlannedMeal[];
}

const MobileDayView: React.FC<MobileDayViewProps> = ({
  selectedDate,
  onDateChange,
  onAddMeal,
  onEditMeal,
  onDeleteMeal,
  onToggleMeal,
  meals = [],
}) => {
  // Filtrar comidas del día seleccionado
  const dayMeals = meals.filter(meal =>
    format(new Date(meal.plan_date), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
  );

  // Calcular progreso del día
  const completedMeals = dayMeals.filter(meal => meal.status === 'executed').length;
  const totalMeals = dayMeals.length;
  const progressPercentage = totalMeals > 0 ? (completedMeals / totalMeals) * 100 : 0;

  // Calcular calorías del día
  const totalCalories = dayMeals.reduce((acc, meal) => acc + (meal.nutritional_info?.calories ?? 0), 0);

  const handlePreviousDay = () => {
    const prevDay = new Date(selectedDate);
    prevDay.setDate(prevDay.getDate() - 1);
    onDateChange(prevDay);
  };

  const handleNextDay = () => {
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    onDateChange(nextDay);
  };

  return (
    <div className="space-y-4">
      {/* Header con navegación */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousDay}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="text-center">
              <CardTitle className="text-lg">
                {format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {format(selectedDate, 'yyyy-MM-dd')}
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleNextDay}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Progreso y métricas */}
      <Card>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Progreso del día</span>
              <Badge variant="outline">
                {completedMeals}/{totalMeals || 1}
              </Badge>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="rounded-md bg-muted p-3 text-center">
              <div className="text-sm font-semibold">{totalCalories}</div>
              <div>Calorías</div>
            </div>
            <div className="rounded-md bg-muted p-3 text-center">
              <div className="text-sm font-semibold">{totalMeals}</div>
              <div>Comidas</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de comidas por tipo */}
      <div className="space-y-3 max-h-[50vh] overflow-y-auto">
        {MEAL_TYPES.map((mealType) => {
          const meal = dayMeals.find(m => m.meal_type === mealType);

          return (
            <Card key={mealType} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">
                    {mealType}
                  </CardTitle>
                  {meal && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditMeal?.(meal)}
                    >
                      Editar
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {meal ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{meal.custom_title || meal.recipes?.title}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onToggleMeal?.(meal.id)}
                      >
                        {meal.status === 'executed' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Circle className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {meal.recipes && (
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {meal.prep_time_minutes || 0}min
                        </div>
                        <div className="flex items-center gap-1">
                          <Flame className="h-3 w-3" />
                          {meal.cook_time_minutes || 0}min
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-2">
                      Sin comida planificada
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onAddMeal?.(selectedDate, mealType)}
                    >
                      Añadir {mealType.toLowerCase()}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default MobileDayView;
