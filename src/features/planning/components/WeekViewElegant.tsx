import React, { useMemo } from 'react';
import { addDays, eachDayOfInterval, endOfWeek, format, isSameDay, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Plus,
  CheckCircle2,
  Circle,
  Calendar,
  Flame,
} from 'lucide-react';
import type { MealType, PlannedMeal } from '../types';

const MEAL_TYPES: MealType[] = ['Desayuno', 'Almuerzo', 'Merienda', 'Cena'];

interface WeekViewElegantProps {
  referenceDate: Date;
  onDateSelect?: (date: Date) => void;
  onAddMeal?: (date: Date, mealType: MealType) => void;
  onEditMeal?: (meal: PlannedMeal) => void;
  onToggleMeal?: (mealId: string) => void;
  onDeleteMeal?: (mealId: string) => void;
  meals?: PlannedMeal[];
}

const WeekViewElegant: React.FC<WeekViewElegantProps> = ({
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

  const weekStats = useMemo(() => {
    const totalMeals = meals.length;
    const completedMeals = meals.filter(m => m.status === 'executed').length;
    const totalCalories = meals.reduce((acc, meal) => acc + (meal.nutritional_info?.calories ?? 0), 0);
    const avgCalories = totalMeals > 0 ? Math.round(totalCalories / totalMeals) : 0;

    return { totalMeals, completedMeals, totalCalories, avgCalories };
  }, [meals]);

  const handleDayClick = (date: Date) => {
    onDateSelect?.(date);
  };

  const handleAddMeal = (date: Date, mealType: MealType) => {
    onAddMeal?.(date, mealType);
  };

  return (
    <div className="space-y-6">
      {/* Estadísticas semanales - más prominentes */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{weekStats.totalMeals}</div>
              <div className="text-sm text-muted-foreground">Comidas planificadas</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{weekStats.completedMeals}</div>
              <div className="text-sm text-muted-foreground">Completadas</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">{weekStats.totalCalories}</div>
              <div className="text-sm text-muted-foreground">Calorías totales</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{weekStats.avgCalories}</div>
              <div className="text-sm text-muted-foreground">Calorías promedio</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid de días - diseño minimalista y funcional */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7">
        {weekDays.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayMeals = mealsByDate[dateStr] || [];
          const completedCount = dayMeals.filter(m => m.status === 'executed').length;
          const totalCount = dayMeals.length;
          const dayCalories = dayMeals.reduce((acc, meal) => acc + (meal.nutritional_info?.calories ?? 0), 0);
          const isToday = isSameDay(day, new Date());

          return (
            <Card
              key={dateStr}
              className={`
                cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/30
                ${isToday ? 'ring-2 ring-primary/20 bg-primary/5' : 'hover:bg-muted/50'}
              `}
              onClick={() => handleDayClick(day)}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isToday ? 'bg-primary' : 'bg-muted-foreground/40'}`} />
                    <div>
                      <div className={`text-sm font-medium ${isToday ? 'text-primary' : 'text-foreground'}`}>
                        {format(day, 'EEE', { locale: es })}
                      </div>
                      <div className={`text-lg font-bold ${isToday ? 'text-primary' : 'text-foreground'}`}>
                        {format(day, 'd')}
                      </div>
                    </div>
                  </div>
                  {isToday && (
                    <Badge variant="secondary" className="text-xs">Hoy</Badge>
                  )}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Métricas del día */}
                <div className="space-y-2">
                  {totalCount > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progreso</span>
                      <span className="font-medium">{completedCount}/{totalCount}</span>
                    </div>
                  )}
                  {dayCalories > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Calorías</span>
                      <span className="font-medium">{dayCalories}</span>
                    </div>
                  )}
                </div>

                {/* Lista de comidas del día */}
                <div className="space-y-2">
                  {MEAL_TYPES.map((mealType) => {
                    const meal = dayMeals.find(m => m.meal_type === mealType);

                    return (
                      <div
                        key={mealType}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (meal) {
                            onToggleMeal?.(meal.id);
                          } else {
                            handleAddMeal(day, mealType);
                          }
                        }}
                        className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-2">
                          {meal ? (
                            meal.status === 'executed' ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            ) : (
                              <Circle className="w-4 h-4 text-primary" />
                            )
                          ) : (
                            <Plus className="w-4 h-4 text-muted-foreground/60 group-hover:text-primary" />
                          )}
                          <span className={`text-sm ${meal ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {mealType}
                          </span>
                        </div>
                        {meal && (
                          <span className={`text-xs truncate max-w-[80px] ${
                            meal.status === 'executed' ? 'line-through text-muted-foreground' : 'text-foreground'
                          }`}>
                            {meal.custom_title || meal.recipes?.title}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Botón de añadir si no hay comidas */}
                {totalCount === 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddMeal(day, 'Almuerzo');
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Añadir comida
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default WeekViewElegant;
