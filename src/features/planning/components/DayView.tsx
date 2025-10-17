import { useMemo } from 'react';
import { addDays, format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useShallow } from 'zustand/react/shallow';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Flame,
  ListChecks,
  Sparkles,
  Stethoscope,
} from 'lucide-react';
import type { MealType, PlannedMeal } from '../types';
import { usePlanningStore } from '@/stores/planningStore';
import { MealCard } from './MealCard';

const MEAL_TYPES: MealType[] = ['Desayuno', 'Almuerzo', 'Merienda', 'Cena'];
const DEFAULT_MEAL_TIMES: Record<MealType, string> = {
  Desayuno: '08:00',
  Almuerzo: '13:00',
  Merienda: '17:00',
  Cena: '20:00',
};

interface DayViewProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onAddMeal?: (date: Date, mealType: MealType) => void;
  onAddMissingIngredients?: (mealId: string) => void;
  onGenerateAlternative?: (mealId: string) => void;
  onEditMeal?: (meal: PlannedMeal) => void;
  onDeleteMeal?: (mealId: string) => void;
}

export function DayView({ selectedDate, onDateChange, onAddMeal, onAddMissingIngredients, onGenerateAlternative, onEditMeal, onDeleteMeal }: DayViewProps) {
  const {
    plannedMeals,
    markMealExecuted,
    markMealSkipped,
    generateShoppingListFromCurrentPlan,
    nutritionalGoals,
  } = usePlanningStore(
    useShallow((state) => ({
      plannedMeals: state.plannedMeals,
      markMealExecuted: state.markMealExecuted,
      markMealSkipped: state.markMealSkipped,
      generateShoppingListFromCurrentPlan: state.generateShoppingListFromCurrentPlan,
      nutritionalGoals: state.nutritionalGoals,
    })),
  );

  const currentDateStr = format(selectedDate, 'yyyy-MM-dd');
  const dayMeals = plannedMeals.filter((meal) => meal.plan_date === currentDateStr);

  const nutrition = useMemo(() => {
    return dayMeals.reduce(
      (totals, meal) => ({
        calories: totals.calories + (meal.nutritional_info?.calories ?? 0),
        protein: totals.protein + (meal.nutritional_info?.protein ?? 0),
        carbs: totals.carbs + (meal.nutritional_info?.carbs ?? 0),
        fat: totals.fat + (meal.nutritional_info?.fat ?? 0),
        fiber: totals.fiber + (meal.nutritional_info?.fiber ?? 0),
        feasibilitySum: totals.feasibilitySum + (meal.feasibility_score ?? 0),
        feasibilityCount: totals.feasibilityCount + (meal.feasibility_score ? 1 : 0),
        missingIngredients:
          totals.missingIngredients +
          (meal.ingredient_status?.filter((status) => !status.available).length ?? 0),
      }),
      {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        feasibilitySum: 0,
        feasibilityCount: 0,
        missingIngredients: 0,
      },
    );
  }, [dayMeals]);

  const completedMeals = dayMeals.filter((meal) => meal.status === 'executed').length;
  const feasibilityAverage = nutrition.feasibilityCount
    ? Math.round(nutrition.feasibilitySum / nutrition.feasibilityCount)
    : null;

  const calorieGoal = nutritionalGoals?.dailyCalories ?? 2000;
  const calorieProgress = Math.min(100, Math.round((nutrition.calories / calorieGoal) * 100));

  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = direction === 'prev' ? subDays(selectedDate, 1) : addDays(selectedDate, 1);
    onDateChange(newDate);
  };

  const handleGenerateShoppingList = async () => {
    await generateShoppingListFromCurrentPlan();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => navigateDay('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-center">
              <CardTitle className="text-xl">
                {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
              </CardTitle>
              <p className="text-xs text-muted-foreground">{currentDateStr}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigateDay('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between text-sm">
                <span>Progreso diario</span>
                <Badge variant="outline">
                  {completedMeals}/{dayMeals.length || 1}
                </Badge>
              </div>
              <Progress value={dayMeals.length ? (completedMeals / dayMeals.length) * 100 : 0} className="mt-2" />
              <p className="mt-2 text-xs text-muted-foreground">
                Marca cada comida como realizada para llevar seguimiento de tu compromiso diario.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between text-sm">
                <span>Calorías del día</span>
                <Badge variant="outline">
                  {nutrition.calories}/{calorieGoal} kcal
                </Badge>
              </div>
              <Progress value={calorieProgress} className="mt-2" />
              <p className="mt-2 text-xs text-muted-foreground">
                Ajusta porciones o añade snacks para mantenerte dentro de tus objetivos.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-4 text-xs text-muted-foreground">
            <div className="rounded-md bg-muted p-3 text-center">
              <div className="text-sm font-semibold">{Math.round(nutrition.protein)} g</div>
              <div>Proteínas</div>
            </div>
            <div className="rounded-md bg-muted p-3 text-center">
              <div className="text-sm font-semibold">{Math.round(nutrition.carbs)} g</div>
              <div>Carbohidratos</div>
            </div>
            <div className="rounded-md bg-muted p-3 text-center">
              <div className="text-sm font-semibold">{Math.round(nutrition.fat)} g</div>
              <div>Grasas</div>
            </div>
            <div className="rounded-md bg-muted p-3 text-center">
              <div className="text-sm font-semibold">{Math.round(nutrition.fiber)} g</div>
              <div>Fibra</div>
            </div>
          </div>

          <div className="rounded-lg border bg-muted/40 p-4 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Análisis del día</span>
              {feasibilityAverage !== null && (
                <Badge variant={feasibilityAverage > 79 ? 'secondary' : feasibilityAverage > 49 ? 'outline' : 'destructive'}>
                  Factibilidad {feasibilityAverage}
                </Badge>
              )}
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <p className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-amber-500" />
                {nutrition.calories > calorieGoal
                  ? 'Estás por encima del objetivo calórico. Considera reducir porciones.'
                  : 'Estás dentro del rango calórico esperado.'}
              </p>
              <p className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-emerald-500" />
                {nutrition.missingIngredients
                  ? `${nutrition.missingIngredients} ingredientes faltantes. Revisa tu despensa.`
                  : 'Todos los ingredientes están disponibles para hoy.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleGenerateShoppingList}>
              <ListChecks className="mr-2 h-4 w-4" /> Añadir faltantes a compras
            </Button>
            <Button variant="outline" size="sm">
              <Sparkles className="mr-2 h-4 w-4" /> Generar alternativas del día
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4 max-h-[60vh] overflow-y-auto">
        {MEAL_TYPES.map((mealType) => {
          const meal = dayMeals.find((item) => item.meal_type === mealType) ?? null;
          return (
            <Card key={mealType} className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between gap-3 border-b bg-muted/40 py-3">
                <div>
                  <CardTitle className="text-lg">{mealType}</CardTitle>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" /> {DEFAULT_MEAL_TIMES[mealType]}
                  </p>
                </div>
                {meal ? (
                  <Badge variant="outline">{meal.status === 'executed' ? 'Completada' : 'Pendiente'}</Badge>
                ) : (
                  <Badge variant="outline">Sin plan</Badge>
                )}
              </CardHeader>
              <CardContent className="p-4">
                {meal ? (
                  <MealCard
                    meal={meal}
                    showActions
                    onExecute={() => markMealExecuted(meal.id)}
                    onSkip={() => markMealSkipped(meal.id)}
                    onEdit={() => onEditMeal?.(meal)}
                    onDelete={() => onDeleteMeal?.(meal.id)}
                    onAddMissingIngredients={() => onAddMissingIngredients?.(meal.id)}
                    onGenerateAlternative={() => onGenerateAlternative?.(meal.id)}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-2 py-8 text-sm text-muted-foreground">
                    <p>No hay una comida planificada para este horario.</p>
                    <Button size="sm" variant="outline" onClick={() => onAddMeal?.(selectedDate, mealType)}>
                      Añadir comida
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
}

export default DayView;
