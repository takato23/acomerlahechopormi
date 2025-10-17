import React, { useMemo } from 'react';
import { eachDayOfInterval, endOfWeek, format, isSameDay, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  Calendar,
  CheckCircle2,
  Circle,
  Edit,
  Flame,
  MoreHorizontal,
  Plus,
  ShoppingBag,
} from 'lucide-react';
import type { MealType, PlannedMeal } from '../types';

const MEAL_TYPES: MealType[] = ['Desayuno', 'Almuerzo', 'Merienda', 'Cena'];

interface WeekPlannerGridProps {
  referenceDate: Date;
  selectedDate: Date;
  meals: PlannedMeal[];
  onSelectDate?: (date: Date) => void;
  onAddMeal?: (date: Date, mealType: MealType) => void;
  onToggleMeal?: (mealId: string) => void;
  onAddMissingIngredients?: (mealId: string) => void;
  onGenerateAlternative?: (mealId: string) => void;
  onEditMeal?: (meal: PlannedMeal) => void;
  onDeleteMeal?: (mealId: string) => void;
}

export function WeekPlannerGrid({
  referenceDate,
  selectedDate,
  meals,
  onSelectDate,
  onAddMeal,
  onToggleMeal,
  onAddMissingIngredients,
  onGenerateAlternative,
  onEditMeal,
  onDeleteMeal,
}: WeekPlannerGridProps) {
  const weekStart = startOfWeek(referenceDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(referenceDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const mealsByDate = useMemo(() => {
    return meals.reduce<Record<string, PlannedMeal[]>>((acc, meal) => {
      if (!acc[meal.plan_date]) acc[meal.plan_date] = [];
      acc[meal.plan_date].push(meal);
      return acc;
    }, {});
  }, [meals]);

  const weekStats = useMemo(() => {
    const totalMeals = meals.length;
    const executedMeals = meals.filter((meal) => meal.status === 'executed').length;
    const missingIngredients = meals.reduce((acc, meal) => {
      const missing = meal.ingredient_status?.filter((item) => !item.available).length ?? 0;
      return acc + missing;
    }, 0);
    const totalCalories = meals.reduce(
      (acc, meal) => acc + (meal.nutritional_info?.calories ?? 0),
      0,
    );
    return {
      totalMeals,
      executedMeals,
      missingIngredients,
      totalCalories,
    };
  }, [meals]);

  const renderMealSlot = (day: Date, mealType: MealType, dayMeals: PlannedMeal[]) => {
    const meal = dayMeals.find((item) => item.meal_type === mealType);
    const mealLabel = meal?.custom_title || meal?.recipes?.title || mealType;
    const baseClasses =
      'flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-custom focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background';

    return (
      <button
        key={mealType}
        type="button"
        className={cn(
          baseClasses,
          meal
            ? 'border-border/70 bg-background/80 hover:bg-background'
            : 'border-dashed border-border/60 hover:border-border hover:bg-muted/40 cursor-pointer',
        )}
        aria-pressed={meal?.status === 'executed'}
        aria-label={meal ? `${mealType} – ${mealLabel}` : `Agregar ${mealType}`}
        onClick={() => {
          if (meal) {
            onToggleMeal?.(meal.id);
          } else {
            onAddMeal?.(day, mealType);
          }
        }}
      >
        <div className="flex items-center gap-3">
          {meal ? (
            meal.status === 'executed' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground" />
            )
          ) : (
            <Plus className="h-4 w-4 text-muted-foreground" />
          )}
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">{mealType}</span>
            {meal ? (
              <span className="text-xs text-muted-foreground">
                {meal.custom_title || meal.recipes?.title || 'Sin título'}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">Agregar comida</span>
            )}
          </div>
        </div>

        {meal && (
          <div className="flex items-center gap-2">
            {meal.nutritional_info?.calories ? (
              <Badge variant="outline" className="text-[11px]">
                🔥 {meal.nutritional_info.calories} kcal
              </Badge>
            ) : null}
            {meal.ingredient_status?.some((item) => !item.available) ? (
              <Badge variant="outline" className="text-[11px] text-amber-600 border-amber-200">
                🛒 {meal.ingredient_status.filter((item) => !item.available).length}
              </Badge>
            ) : null}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  aria-label={`Acciones para ${mealLabel}`}
                  onClick={(event) => event.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(event) => {
                  event.stopPropagation();
                  onEditMeal?.(meal);
                }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                {onGenerateAlternative ? (
                  <DropdownMenuItem onClick={(event) => {
                    event.stopPropagation();
                    onGenerateAlternative(meal.id);
                  }}>
                    <Flame className="h-4 w-4 mr-2" />
                    Alternativa IA
                  </DropdownMenuItem>
                ) : null}
                {onAddMissingIngredients ? (
                  <DropdownMenuItem onClick={(event) => {
                    event.stopPropagation();
                    onAddMissingIngredients(meal.id);
                  }}>
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Añadir faltantes
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDeleteMeal?.(meal.id);
                  }}
                >
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center gap-3 rounded-custom border border-border/60 bg-muted/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-semibold">
            {weekStats.executedMeals}/{weekStats.totalMeals || 0} comidas
          </Badge>
          <Progress
            value={weekStats.totalMeals ? (weekStats.executedMeals / weekStats.totalMeals) * 100 : 0}
            className="h-2 w-24"
          />
        </div>
        <Badge variant="outline" className="text-xs">
          🔥 {weekStats.totalCalories} kcal
        </Badge>
        <Badge variant={weekStats.missingIngredients ? 'outline' : 'secondary'} className="text-xs">
          🛒 {weekStats.missingIngredients} faltantes
        </Badge>
      </section>

      <section className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {weekDays.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayMeals = mealsByDate[dateStr] || [];
          const completed = dayMeals.filter((meal) => meal.status === 'executed').length;
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => onSelectDate?.(day)}
              className={cn(
                'flex min-w-[112px] flex-col rounded-custom border px-3 py-2 text-left transition-custom',
                isSelected ? 'border-primary bg-primary/10 text-primary' : 'border-border/60 hover:border-primary/60',
              )}
            >
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                {format(day, 'EEE', { locale: es })}
              </span>
              <span className="text-lg font-semibold">{format(day, 'd')}</span>
              <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                <span>{completed}/{dayMeals.length || 0}</span>
                {isToday ? <Badge variant="secondary" className="px-1 py-0 text-[10px]">Hoy</Badge> : null}
              </div>
            </button>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3 lg:max-h-[70vh] lg:overflow-y-auto">
        {weekDays.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayMeals = mealsByDate[dateStr] || [];
          const completed = dayMeals.filter((meal) => meal.status === 'executed').length;
          const total = dayMeals.length;
          const missing = dayMeals.reduce(
            (acc, meal) => acc + (meal.ingredient_status?.filter((item) => !item.available).length ?? 0),
            0,
          );
          const calories = dayMeals.reduce(
            (acc, meal) => acc + (meal.nutritional_info?.calories ?? 0),
            0,
          );
          const isSelected = isSameDay(day, selectedDate);

          return (
            <Card
              key={dateStr}
              className={cn(
                'gap-4 border-border/60',
                isSelected ? 'ring-2 ring-primary/40 border-primary/60' : '',
              )}
            >
              <CardHeader className="px-0">
                <div>
                  <CardTitle className="text-base font-semibold text-foreground">
                    {format(day, "EEEE d 'de' MMMM", { locale: es })}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {dateStr}
                  </p>
                </div>
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-[11px]">
                    {completed}/{total || 0} hechas
                  </Badge>
                  <Badge variant="outline" className="text-[11px]">
                    🔥 {calories} kcal
                  </Badge>
                  {missing ? (
                    <Badge variant="outline" className="text-[11px] text-amber-600 border-amber-200">
                      🛒 {missing}
                    </Badge>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="px-0 space-y-2">
                {MEAL_TYPES.map((meal) => renderMealSlot(day, meal, dayMeals))}
                {total === 0 && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => onAddMeal?.(day, 'Almuerzo')}
                  >
                    <Plus className="h-4 w-4" />
                    Agregar primera comida
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </section>
    </div>
  );
}

export default WeekPlannerGrid;
