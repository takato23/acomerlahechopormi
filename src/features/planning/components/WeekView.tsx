import { useMemo } from 'react';
import { addDays, eachDayOfInterval, endOfWeek, format, isSameDay, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { DndContext, DragEndEvent, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame, PieChart, UtensilsCrossed } from 'lucide-react';
import { notifyError, notifyInfo, notifySuccess } from '@/lib/notifications';
import { useShallow } from 'zustand/react/shallow';
import type { MealStatus, MealType, PlannedMeal } from '../types';
import { DroppableMealSlot } from './DroppableMealSlot';
import { usePlanningStore } from '@/stores/planningStore';
import useBreakpoint from '@/hooks/useBreakpoint';
import { MobileWeekCarousel } from './MobileWeekCarousel';

const MEAL_TYPES: MealType[] = ['Desayuno', 'Almuerzo', 'Merienda', 'Cena'];

interface WeekViewProps {
  referenceDate: Date;
  onDateSelect?: (date: Date) => void;
  onAddMeal?: (date: Date, mealType: MealType) => void;
  onAddMissingIngredients?: (mealId: string) => void;
  onGenerateAlternative?: (mealId: string) => void;
  onEditMeal?: (meal: PlannedMeal) => void;
  onDeleteMeal?: (mealId: string) => void;
}

interface DayMetrics {
  totalMeals: number;
  feasibilityAverage: number | null;
  missingIngredients: number;
  prepTime: number;
  calories: number;
}

const computeDayMetrics = (meals: PlannedMeal[]): DayMetrics => {
  if (!meals.length) {
    return { totalMeals: 0, feasibilityAverage: null, missingIngredients: 0, prepTime: 0, calories: 0 };
  }

  const feasibilityValues = meals
    .map((meal) => meal.feasibility_score)
    .filter((score): score is number => typeof score === 'number');

  const feasibilityAverage = feasibilityValues.length
    ? Math.round(feasibilityValues.reduce((acc, value) => acc + value, 0) / feasibilityValues.length)
    : null;

  const missingIngredients = meals.reduce((acc, meal) => {
    const missing = meal.ingredient_status?.filter((status) => !status.available).length ?? 0;
    return acc + missing;
  }, 0);

  const prepTime = meals.reduce((acc, meal) => acc + (meal.prep_time_minutes ?? 0), 0);
  const calories = meals.reduce((acc, meal) => acc + (meal.nutritional_info?.calories ?? 0), 0);

  return {
    totalMeals: meals.length,
    feasibilityAverage,
    missingIngredients,
    prepTime,
    calories,
  };
};

export function WeekView({
  referenceDate,
  onDateSelect,
  onAddMeal,
  onAddMissingIngredients,
  onGenerateAlternative,
  onEditMeal,
  onDeleteMeal,
}: WeekViewProps) {
  const breakpoint = useBreakpoint();
  const { plannedMeals, markMealExecuted, markMealSkipped, moveMeal } = usePlanningStore(
    useShallow((state) => ({
      plannedMeals: state.plannedMeals,
      markMealExecuted: state.markMealExecuted,
      markMealSkipped: state.markMealSkipped,
      moveMeal: state.moveMeal,
    })),
  );

  const weekStart = startOfWeek(referenceDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(referenceDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const mealsByDate = useMemo(() => {
    return plannedMeals.reduce<Record<string, PlannedMeal[]>>((acc, meal) => {
      if (!acc[meal.plan_date]) {
        acc[meal.plan_date] = [];
      }
      acc[meal.plan_date].push(meal);
      return acc;
    }, {});
  }, [plannedMeals]);

  const dayMetrics = useMemo(() => {
    return weekDays.reduce<Record<string, DayMetrics>>((acc, day) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      acc[dateStr] = computeDayMetrics(mealsByDate[dateStr] ?? []);
      return acc;
    }, {});
  }, [mealsByDate, weekDays]);

  const mouseSensor = useSensor(MouseSensor, { activationConstraint: { distance: 8 } });
  const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } });
  const sensors = useSensors(mouseSensor, touchSensor);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const draggedMeal = active.data.current?.meal as PlannedMeal | undefined;
    const dropData = over.data.current as { type?: string; date: string; mealType: MealType } | undefined;
    if (!draggedMeal || !dropData || dropData.type !== 'meal-slot') return;

    if (draggedMeal.plan_date === dropData.date && draggedMeal.meal_type === dropData.mealType) {
      return;
    }

    try {
      const success = await moveMeal(draggedMeal.id, dropData.date, dropData.mealType);
      if (success) {
        notifySuccess('Comida movida exitosamente');
      } else {
        notifyError('No se pudo mover la comida');
      }
    } catch (error) {
      notifyError('No se pudo mover la comida');
    }
  };

  if (breakpoint !== 'desktop') {
    return (
      <MobileWeekCarousel
        weekDays={weekDays}
        plannedMeals={plannedMeals}
        onDayChange={(date) => onDateSelect?.(date)}
        onAddMeal={(date, mealType) => {
          if (onAddMeal) {
            onAddMeal(date, mealType);
          } else {
            notifyInfo('Agregar comida', {
              description: `${mealType} del ${format(date, "EEEE d 'de' MMMM", { locale: es })}`,
            });
          }
        }}
        onGenerateDay={(date) =>
          notifyInfo('Generación específica del día', {
            description: `Usa el botón Generar plan para incluir ${format(date, 'EEEE', { locale: es })}`,
          })
        }
      />
    );
  }

  const getStatusIcon = (status?: MealStatus) => {
    switch (status) {
      case 'executed':
        return <Badge variant="outline" className="bg-gradient-to-r from-emerald-100 to-green-100 border-emerald-300 text-emerald-700 shadow-sm">✅ Ejecutada</Badge>;
      case 'skipped':
        return <Badge variant="outline" className="bg-gradient-to-r from-red-100 to-pink-100 border-red-300 text-red-700 shadow-sm">⏭️ Omitida</Badge>;
      default:
        return null;
    }
  };

  const getMealsForDateAndType = (dateStr: string, mealType: MealType): PlannedMeal[] => {
    return (mealsByDate[dateStr] ?? []).filter((meal) => meal.meal_type === mealType);
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {weekDays.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const mealsForDay = mealsByDate[dateStr] ?? [];
            const metrics = dayMetrics[dateStr];
            const isToday = isSameDay(day, new Date());

            return (
              <Card
                key={dateStr}
                className={`group flex min-h-[520px] flex-col rounded-2xl border border-border/40 bg-gradient-to-br from-white/90 via-white/80 to-emerald-50/30 shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-emerald-300/60 hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1 ${isToday ? 'ring-2 ring-emerald-400/60 shadow-emerald-500/20 shadow-xl' : ''}`}
              >
                <CardHeader className="gap-4 pb-4">
                  <CardTitle className="flex items-center justify-between text-lg">
                    <button
                      type="button"
                      onClick={() => onDateSelect?.(day)}
                      className={`group/button flex items-center gap-2 rounded-lg px-3 py-1 transition-all duration-200 hover:bg-gradient-to-r hover:from-emerald-100 hover:to-blue-100 hover:shadow-md ${
                        isToday ? 'text-emerald-700 font-semibold' : 'text-foreground hover:text-emerald-600'
                      }`}
                    >
                      <div className={`h-3 w-3 rounded-full transition-colors ${
                        isToday ? 'bg-emerald-500 shadow-emerald-500/50 shadow-md' : 'bg-gray-300 group-hover/button:bg-emerald-400'
                      }`}></div>
                      {format(day, 'EEEE d', { locale: es })}
                    </button>
                    {isToday && (
                      <Badge variant="secondary" className="bg-gradient-to-r from-emerald-500 to-blue-600 text-white shadow-md animate-pulse">
                        ✨ Hoy
                      </Badge>
                    )}
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <Badge variant="outline" className="flex items-center gap-1 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-700 shadow-sm">
                      🍽️ {metrics.totalMeals} comidas
                    </Badge>
                    {metrics.feasibilityAverage !== null && (
                      <Badge
                        variant={metrics.feasibilityAverage > 79 ? 'secondary' : metrics.feasibilityAverage > 49 ? 'outline' : 'destructive'}
                        className={`shadow-sm ${
                          metrics.feasibilityAverage > 79
                            ? 'bg-gradient-to-r from-emerald-100 to-green-100 border-emerald-300 text-emerald-800'
                            : metrics.feasibilityAverage > 49
                            ? 'bg-gradient-to-r from-amber-100 to-orange-100 border-amber-300 text-amber-800'
                            : 'bg-gradient-to-r from-red-100 to-pink-100 border-red-300 text-red-800'
                        }`}
                      >
                        {metrics.feasibilityAverage > 79 ? '🎯' : metrics.feasibilityAverage > 49 ? '⚠️' : '❌'} {metrics.feasibilityAverage}%
                      </Badge>
                    )}
                    <Badge
                      variant={metrics.missingIngredients ? 'destructive' : 'outline'}
                      className={metrics.missingIngredients
                        ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-md animate-pulse'
                        : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-700'
                      }
                    >
                      {metrics.missingIngredients ? '🛒' : '✅'} {metrics.missingIngredients} faltantes
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1 bg-gradient-to-r from-orange-50 to-red-50 border-orange-200 text-orange-700 shadow-sm">
                      🔥 {metrics.calories} kcal
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 text-purple-700 shadow-sm">
                      ⏱️ {metrics.prepTime} min
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="flex flex-1 flex-col gap-4 p-4">
                  {MEAL_TYPES.map((mealType) => {
                    const mealsForSlot = getMealsForDateAndType(dateStr, mealType);
                    const mealTypeIcons = {
                      'Desayuno': '🌅',
                      'Almuerzo': '☀️',
                      'Merienda': '🕐',
                      'Cena': '🌙'
                    };

                    return (
                      <div key={mealType} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                            <span className="text-base">{mealTypeIcons[mealType as keyof typeof mealTypeIcons]}</span>
                            <span className="bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">
                              {mealType}
                            </span>
                          </div>
                          {mealsForSlot.length === 1 ? getStatusIcon(mealsForSlot[0]?.status) : null}
                        </div>
                        <DroppableMealSlot
                          mealType={mealType}
                          meals={mealsForSlot}
                          date={dateStr}
                          onExecute={markMealExecuted}
                          onSkip={markMealSkipped}
                          onAdd={(slotDate, slotMealType) => onAddMeal?.(new Date(`${slotDate}T00:00:00`), slotMealType)}
                          onAddMissingIngredients={(mealId) => onAddMissingIngredients?.(mealId)}
                          onGenerateAlternative={(mealId) => onGenerateAlternative?.(mealId)}
                          onEdit={(mealId) => {
                            const toEdit = plannedMeals.find((item) => item.id === mealId);
                            if (toEdit) {
                              onEditMeal?.(toEdit);
                            }
                          }}
                          onDelete={(mealId) => onDeleteMeal?.(mealId)}
                        />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </DndContext>
  );
}

export default WeekView;
