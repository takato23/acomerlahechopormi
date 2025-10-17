import { useMemo } from 'react';
import { format } from 'date-fns';
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { PlannedMeal, NutritionalGoals } from '../types';
import {
  calculateWeeklyNutrition,
  calculateMacroDistribution,
  generateNutritionalRecommendations,
  calculateCalorieBalance,
} from '../utils/nutritionalCalculations';

const BAR_COLORS = ['#16a34a', '#2563eb', '#f97316', '#facc15', '#a855f7'];

interface NutritionalDashboardProps {
  meals: PlannedMeal[];
  goals: NutritionalGoals | null;
  dateRange: { start: Date; end: Date };
  onAdjustGoals?: () => void;
}

export function NutritionalDashboard({ meals, goals, dateRange, onAdjustGoals }: NutritionalDashboardProps) {
  const weeklyNutrition = useMemo(() => calculateWeeklyNutrition(meals), [meals]);
  const macroDistribution = useMemo(() => calculateMacroDistribution(weeklyNutrition.totals), [weeklyNutrition]);
  const calorieBalance = useMemo(() => calculateCalorieBalance(meals, goals?.dailyCalories ?? 2000), [meals, goals]);
  const recommendations = useMemo(() => generateNutritionalRecommendations(meals, goals ?? {
    dailyCalories: 2000,
    proteinGrams: 100,
    carbsGrams: 250,
    fatGrams: 70,
    fiberGrams: 25,
    restrictions: [],
  }), [meals, goals]);

  const barChartData = weeklyNutrition.days.map((day) => ({
    name: day.date.slice(5),
    calories: Math.round(day.calories),
  }));

  const pieData = [
    { name: 'Proteínas', value: macroDistribution.proteinPercent },
    { name: 'Carbohidratos', value: macroDistribution.carbsPercent },
    { name: 'Grasas', value: macroDistribution.fatPercent },
  ];

  return (
    <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-lg">Resumen nutricional</CardTitle>
            <Badge variant="outline">
              {barChartData.length} días · {Math.round(weeklyNutrition.totals.calories ?? 0)} kcal totales
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border p-4 text-center">
                <div className="text-2xl font-semibold">{Math.round(weeklyNutrition.averages.calories ?? 0)}</div>
                <p className="text-xs text-muted-foreground">Calorías promedio/día</p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <div className="text-2xl font-semibold">{Math.round(weeklyNutrition.averages.protein ?? 0)} g</div>
                <p className="text-xs text-muted-foreground">Proteínas promedio</p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <div className="text-2xl font-semibold">{Math.round(weeklyNutrition.averages.fat ?? 0)} g</div>
                <p className="text-xs text-muted-foreground">Grasas promedio</p>
              </div>
            </div>

            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData}>
                  <XAxis dataKey="name" fontSize={12} stroke="#94a3b8" />
                  <Tooltip formatter={(value: number) => [`${value} kcal`, 'Calorías']} />
                  <Bar dataKey="calories" radius={4} fill="#16a34a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-lg">Distribución de macronutrientes</CardTitle>
            <Badge variant="outline">{macroDistribution.evaluation}</Badge>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="h-48 w-full md:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70}>
                    {pieData.map((entry, index) => (
                      <Cell key={entry.name} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number, name: string) => [`${value}%`, name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid flex-1 gap-2 text-sm">
              {pieData.map((entry, index) => (
                <div key={entry.name} className="flex items-center justify-between rounded-md border px-3 py-2">
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: BAR_COLORS[index % BAR_COLORS.length] }}
                    />
                    {entry.name}
                  </span>
                  <span className="font-semibold">{entry.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-lg">Recomendaciones</CardTitle>
            <Button variant="outline" size="sm" onClick={onAdjustGoals}>
              Ajustar objetivos
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {recommendations.map((item) => (
              <div key={item} className="rounded-md border bg-muted/40 px-3 py-2">
                {item}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Balance calórico semanal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <span>Balance acumulado</span>
              <Badge variant={calorieBalance.status === 'balanced' ? 'secondary' : 'outline'}>
                {calorieBalance.weeklyBalance} kcal · {calorieBalance.status}
              </Badge>
            </div>
            <ul className="space-y-2">
              {calorieBalance.daily.map((entry) => (
                <li key={entry.date} className="flex items-center justify-between rounded-md border px-3 py-2">
                  <span>{entry.date.slice(5)}</span>
                  <span className={entry.balance >= 0 ? 'text-red-500' : 'text-emerald-600'}>
                    {entry.balance >= 0 ? '+' : ''}
                    {entry.balance} kcal
                  </span>
                </li>
              ))}
            </ul>
            {calorieBalance.adjustmentSuggestions.map((suggestion) => (
              <div key={suggestion} className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
                {suggestion}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Rango analizado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Desde <span className="font-semibold">{format(dateRange.start, 'dd/MM/yyyy')}</span> hasta{' '}
              <span className="font-semibold">{format(dateRange.end, 'dd/MM/yyyy')}</span>.
            </p>
            <p>
              {meals.length} comidas consideradas, incluyendo {weeklyNutrition.days.length} días con datos registrados.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default NutritionalDashboard;
