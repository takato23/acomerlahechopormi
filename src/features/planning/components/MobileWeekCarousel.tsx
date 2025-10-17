import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, ChefHat, Flame, Zap } from 'lucide-react';
import type { MealType, PlannedMeal } from '../types';
import { MealCard } from './MealCard';

const MEAL_TYPES: MealType[] = ['Desayuno', 'Almuerzo', 'Merienda', 'Cena'];

interface MobileWeekCarouselProps {
  weekDays: Date[];
  plannedMeals: PlannedMeal[];
  onDayChange?: (date: Date) => void;
  onAddMeal?: (date: Date, mealType: MealType) => void;
  onGenerateDay?: (date: Date) => void;
}

const computeFeasibility = (meals: PlannedMeal[]) => {
  const scores = meals
    .map((meal) => meal.feasibility_score)
    .filter((score): score is number => typeof score === 'number');
  if (!scores.length) return null;
  return Math.round(scores.reduce((acc, value) => acc + value, 0) / scores.length);
};

export function MobileWeekCarousel({
  weekDays,
  plannedMeals,
  onDayChange,
  onAddMeal,
  onGenerateDay,
}: MobileWeekCarouselProps) {
  const [index, setIndex] = useState(0);

  const clampIndex = (value: number) => Math.min(Math.max(value, 0), weekDays.length - 1);

  const goTo = (nextIndex: number) => {
    const clamped = clampIndex(nextIndex);
    setIndex(clamped);
    onDayChange?.(weekDays[clamped]);
  };

  const currentDate = weekDays[index];
  const currentDateStr = currentDate.toISOString().split('T')[0];

  const mealsForDay = useMemo(() => {
    return plannedMeals
      .filter((meal) => meal.plan_date === currentDateStr)
      .sort((a, b) => MEAL_TYPES.indexOf(a.meal_type) - MEAL_TYPES.indexOf(b.meal_type));
  }, [plannedMeals, currentDateStr]);

  const feasibility = computeFeasibility(mealsForDay);
  const missingIngredients = mealsForDay.reduce(
    (acc, meal) => acc + (meal.ingredient_status?.filter((status) => !status.available).length ?? 0),
    0,
  );
  const calories = mealsForDay.reduce((acc, meal) => acc + (meal.nutritional_info?.calories ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="icon" onClick={() => goTo(index - 1)} disabled={index === 0}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">{format(currentDate, "EEEE", { locale: es })}</p>
          <h2 className="text-xl font-semibold">{format(currentDate, "d 'de' MMMM", { locale: es })}</h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => goTo(index + 1)}
          disabled={index === weekDays.length - 1}
        >
          <ArrowRight className="h-5 w-5" />
        </Button>
      </div>

      <Card>
        <CardHeader className="space-y-2">
          <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-base">
            <span>Instantánea del día</span>
            <Button
              variant="outline"
              size="sm"
              className="flex-shrink-0"
              onClick={() => onGenerateDay?.(currentDate)}
            >
              <ChefHat className="mr-2 h-4 w-4" /> Generar día
            </Button>
          </CardTitle>
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="outline">{mealsForDay.length} comidas</Badge>
            {feasibility !== null && (
              <Badge variant={feasibility > 79 ? 'secondary' : feasibility > 49 ? 'outline' : 'destructive'}>
                {feasibility} factibilidad
              </Badge>
            )}
            <Badge variant={missingIngredients ? 'destructive' : 'outline'}>
              {missingIngredients} faltantes
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Flame className="h-3 w-3" /> {calories} kcal
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {MEAL_TYPES.map((mealType) => {
            const meal = mealsForDay.find((item) => item.meal_type === mealType);
            return meal ? (
              <MealCard key={meal.id} meal={meal} compact showActions={false} />
            ) : (
              <div key={mealType} className="flex items-center justify-between rounded-md border p-3">
                <span className="text-sm text-muted-foreground">{mealType}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onAddMeal?.(currentDate, mealType)}
                  className="text-xs"
                >
                  <Zap className="mr-1 h-4 w-4" /> Agregar
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

export default MobileWeekCarousel;
