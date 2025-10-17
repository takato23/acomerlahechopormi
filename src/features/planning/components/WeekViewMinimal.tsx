import React, { useMemo } from 'react';
import { addDays, eachDayOfInterval, endOfWeek, format, isSameDay, startOfWeek } from 'date-fns';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import {
  Plus,
  CheckCircle2,
  Circle,
  Calendar,
  Flame,
  Edit,
  Trash2,
  MoreHorizontal,
} from 'lucide-react';
import type { MealType, PlannedMeal } from '../types';

const MEAL_TYPES: MealType[] = ['Desayuno', 'Almuerzo', 'Merienda', 'Cena'];

interface WeekViewMinimalProps {
  referenceDate: Date;
  onDateSelect?: (date: Date) => void;
  onAddMeal?: (date: Date, mealType: MealType) => void;
  onAddMissingIngredients?: (mealId: string) => void;
  onGenerateAlternative?: (mealId: string) => void;
  onEditMeal?: (meal: PlannedMeal) => void;
  onToggleMeal?: (mealId: string) => void;
  onDeleteMeal?: (mealId: string) => void;
  meals?: PlannedMeal[];
}

const WeekViewMinimal: React.FC<WeekViewMinimalProps> = ({
  referenceDate,
  onDateSelect,
  onAddMeal,
  onAddMissingIngredients,
  onGenerateAlternative,
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

    // Calcular ingredientes faltantes
    const missingIngredients = meals.reduce((acc, meal) => {
      const missing = meal.ingredient_status?.filter(status => !status.available).length ?? 0;
      return acc + missing;
    }, 0);

    // Calcular factibilidad promedio
    const feasibilityValues = meals
      .map(meal => meal.feasibility_score)
      .filter(score => typeof score === 'number' && score !== null) as number[];
    const avgFeasibility = feasibilityValues.length > 0
      ? Math.round(feasibilityValues.reduce((acc, val) => acc + val, 0) / feasibilityValues.length)
      : null;

    return {
      totalMeals,
      completedMeals,
      totalCalories,
      avgCalories,
      missingIngredients,
      avgFeasibility
    };
  }, [meals]);

  const handleDayClick = (date: Date) => {
    onDateSelect?.(date);
  };

  const handleAddMeal = (date: Date, mealType: MealType) => {
    onAddMeal?.(date, mealType);
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
      {/* Estadísticas semanales - con gradientes bonitos */}
      <Card className="bg-gradient-to-br from-white via-slate-50/50 to-blue-50/30 border border-border/50 shadow-lg">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-help">
                  <div className="text-2xl font-bold text-primary">{weekStats.totalMeals}</div>
                  <div className="text-sm text-muted-foreground">Comidas planificadas</div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Total de comidas programadas para esta semana</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-help">
                  <div className="text-2xl font-bold text-green-600">{weekStats.completedMeals}</div>
                  <div className="text-sm text-muted-foreground">Completadas</div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Comidas que ya has marcado como realizadas</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-help">
                  <div className="text-2xl font-bold text-orange-600">{weekStats.totalCalories}</div>
                  <div className="text-sm text-muted-foreground">Calorías totales</div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Suma total de calorías de todas las comidas planificadas</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-help">
                  <div className="text-2xl font-bold text-blue-600">{weekStats.avgCalories}</div>
                  <div className="text-sm text-muted-foreground">Calorías promedio</div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Calorías promedio por comida (total ÷ comidas)</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-help">
                  <div className="text-2xl font-bold text-amber-600">{weekStats.missingIngredients}</div>
                  <div className="text-sm text-muted-foreground">Ingredientes faltantes</div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Ingredientes que no tienes disponibles en tu despensa</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-help">
                  {weekStats.avgFeasibility !== null ? (
                    <>
                      <div className={`text-2xl font-bold ${
                        weekStats.avgFeasibility > 79 ? 'text-green-600' :
                        weekStats.avgFeasibility > 49 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {weekStats.avgFeasibility}
                      </div>
                      <div className="text-sm text-muted-foreground">Factibilidad</div>
                    </>
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-muted-foreground">-</div>
                      <div className="text-sm text-muted-foreground">Factibilidad</div>
                    </>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Promedio de factibilidad de las comidas (0-100). Indica qué tan fácil es preparar cada comida con los ingredientes disponibles.</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardContent>
      </Card>

      {/* Barra de progreso semanal - más bonita */}
      {weekStats.totalMeals > 0 && (
        <Card className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 border border-green-200/50 shadow-lg">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-green-800">🏆 Progreso semanal</h3>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-700">
                    {Math.round((weekStats.completedMeals / weekStats.totalMeals) * 100)}%
                  </div>
                  <div className="text-sm text-green-600">
                    {weekStats.completedMeals}/{weekStats.totalMeals} completadas
                  </div>
                </div>
              </div>
              <Progress
                value={(weekStats.completedMeals / weekStats.totalMeals) * 100}
                className="h-4 bg-green-100"
              />
              <div className="flex justify-center">
                <span className="text-sm text-green-700 font-medium bg-green-100 px-3 py-1 rounded-full">
                  ¡Vas muy bien! 🎉
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grid de días - diseño minimalista y funcional */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7">
        {weekDays.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayMeals = mealsByDate[dateStr] || [];
          const completedCount = dayMeals.filter(m => m.status === 'executed').length;
          const totalCount = dayMeals.length;
          const dayCalories = dayMeals.reduce((acc, meal) => acc + (meal.nutritional_info?.calories ?? 0), 0);
          const isToday = isSameDay(day, new Date());

          // Calcular indicadores de atención
          const hasMissingIngredients = dayMeals.some(meal =>
            meal.ingredient_status?.some(status => !status.available)
          );
          const hasIncompleteMeals = totalCount > 0 && completedCount < totalCount;
          const needsAttention = hasMissingIngredients || hasIncompleteMeals;

          return (
            <Card
              key={dateStr}
              className={`
                cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1
                rounded-2xl border border-border/40
                bg-gradient-to-br from-white via-white to-slate-50/50
                ${isToday ? 'ring-2 ring-primary/40 shadow-primary/20 shadow-xl' : ''}
                ${needsAttention ? 'border-l-4 border-l-amber-500 ring-1 ring-amber-200/50' : ''}
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
                  <div className="flex items-center gap-1">
                    {isToday && (
                      <Badge variant="secondary" className="text-xs">Hoy</Badge>
                    )}
                    {needsAttention && (
                      <div className="flex items-center gap-1">
                        {hasMissingIngredients && (
                          <Badge className="text-xs px-2 py-0 h-5 bg-red-100 text-red-700 border-red-200">
                            🛒
                          </Badge>
                        )}
                        {hasIncompleteMeals && !hasMissingIngredients && (
                          <Badge className="text-xs px-2 py-0 h-5 bg-amber-100 text-amber-700 border-amber-200">
                            ⏳
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
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
                <div className="space-y-1">
                  {MEAL_TYPES.map((mealType) => {
                    const meal = dayMeals.find(m => m.meal_type === mealType);

                    return (
                      <div
                        key={mealType}
                        className={`
                          flex items-center justify-between p-3 rounded-xl transition-all duration-200 group
                          ${meal ? `
                            ${mealType === 'Desayuno' ? 'bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-200 hover:shadow-md' :
                              mealType === 'Almuerzo' ? 'bg-gradient-to-r from-emerald-100 to-green-100 border border-emerald-200 hover:shadow-md' :
                              mealType === 'Merienda' ? 'bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200 hover:shadow-md' :
                              'bg-gradient-to-r from-indigo-100 to-blue-100 border border-indigo-200 hover:shadow-md'
                            }
                            ${meal.status === 'executed' ? 'opacity-80' : 'hover:scale-[1.02]'}
                          ` : 'bg-muted/20 border border-muted-foreground/20 hover:bg-muted/30'}
                        `}
                      >
                        <div
                          className="flex items-center gap-2 flex-1 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (meal) {
                              onToggleMeal?.(meal.id);
                            } else {
                              handleAddMeal(day, mealType);
                            }
                          }}
                        >
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
                          <div className="flex items-center gap-1">
                            {/* Nombre de la comida */}
                            <span className={`text-xs truncate max-w-[60px] ${
                              meal.status === 'executed' ? 'line-through text-muted-foreground' : 'text-foreground'
                            }`}>
                              {meal.custom_title || meal.recipes?.title}
                            </span>

                            {/* Calorías si están disponibles */}
                            {meal.nutritional_info?.calories && (
                              <Badge className="text-xs px-2 py-0 h-5 bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200">
                                🔥 {meal.nutritional_info.calories}kcal
                              </Badge>
                            )}

                            {/* Indicador de ingredientes faltantes */}
                            {meal.ingredient_status && meal.ingredient_status.some(status => !status.available) && (
                              <Badge className="text-xs px-2 py-0 h-5 bg-red-100 text-red-800 border-red-200 hover:bg-red-200">
                                🛒 {meal.ingredient_status.filter(status => !status.available).length} faltan
                              </Badge>
                            )}

                            {/* Menú de acciones */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreHorizontal className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  onEditMeal?.(meal);
                                }}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar comida
                                </DropdownMenuItem>
                                {onGenerateAlternative && (
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    onGenerateAlternative(meal.id);
                                  }}>
                                    <Flame className="h-4 w-4 mr-2" />
                                    Generar alternativa
                                  </DropdownMenuItem>
                                )}
                                {onAddMissingIngredients && (
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    onAddMissingIngredients(meal.id);
                                  }}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Añadir faltantes
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteMeal?.(meal.id);
                                  }}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Eliminar comida
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
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

      {/* Acciones rápidas semanales - más bonitas */}
      {weekStats.totalMeals > 0 && (
        <Card className="bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 border border-purple-200/50 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg text-purple-800 flex items-center gap-2">
              <span>⚡</span>
              Acciones rápidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-md hover:shadow-lg transition-all duration-200">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Marcar todas
              </Button>
              <Button className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-md hover:shadow-lg transition-all duration-200">
                <Plus className="w-4 h-4 mr-2" />
                Añadir compras
              </Button>
              <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-md hover:shadow-lg transition-all duration-200">
                <Flame className="w-4 h-4 mr-2" />
                IA alternativas
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </TooltipProvider>
  );
};

export default WeekViewMinimal;
