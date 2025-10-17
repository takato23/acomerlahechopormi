import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import type { PlanningStats, WeeklyReport, GoalComparison } from '../types';

interface PlanningStatsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  stats: PlanningStats | null;
  weeklyReport: WeeklyReport | null;
  estimatedCost: number | null;
  goalProgress: GoalComparison | null;
}

export const PlanningStatsDialog: React.FC<PlanningStatsDialogProps> = ({
  isOpen,
  onClose,
  stats,
  weeklyReport,
  estimatedCost,
  goalProgress,
}) => {
  const compliance = stats ? Math.round(stats.compliance_rate) : 0;
  const totalMeals = stats?.total_planned ?? 0;
  const executedMeals = stats?.total_executed ?? 0;
  const avgPrepTime = stats?.avg_prep_time ?? 0;
  const totalCalories = stats?.total_calories ?? 0;
  const costEstimate = estimatedCost ?? stats?.cost_savings ?? null;

  const favoriteMeals = weeklyReport?.favorite_meals ?? [];
  const frequentIngredients = weeklyReport?.most_used_ingredients ?? [];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Resumen de la semana</DialogTitle>
        </DialogHeader>

        {!stats ? (
          <p className="text-sm text-muted-foreground">
            Generá un plan o sincronizá tus comidas para visualizar estadísticas.
          </p>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border p-3">
                <p className="text-xs uppercase text-muted-foreground">Comidas planificadas</p>
                <p className="text-2xl font-semibold">{totalMeals}</p>
                <Badge variant="secondary" className="mt-2">
                  {executedMeals} completadas
                </Badge>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs uppercase text-muted-foreground">Tiempo promedio</p>
                <p className="text-2xl font-semibold">{avgPrepTime} min</p>
                <p className="text-xs text-muted-foreground mt-1">Preparación por comida</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs uppercase text-muted-foreground">Calorías totales</p>
                <p className="text-2xl font-semibold">{totalCalories}</p>
                <p className="text-xs text-muted-foreground mt-1">Sumatoria semanal</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs uppercase text-muted-foreground">Costo estimado</p>
                <p className="text-2xl font-semibold">
                  {costEstimate !== null ? `$${costEstimate.toFixed(2)}` : '—'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Según ingredientes planificados</p>
              </div>
            </div>

            <div>
              <p className="text-xs uppercase text-muted-foreground mb-2">Cumplimiento del plan</p>
              <div className="flex items-center gap-3">
                <Progress value={compliance} className="h-2 flex-1" />
                <span className="text-sm font-medium">{compliance}%</span>
              </div>
            </div>

            {goalProgress && (
              <div className="rounded-lg border p-3 bg-muted/40">
                <p className="text-xs uppercase text-muted-foreground">Objetivo calórico</p>
                <div className="mt-1 flex items-center justify-between text-sm">
                  <span>{goalProgress.status === 'on-track' ? 'En línea' : goalProgress.status === 'over' ? 'Por encima' : 'Por debajo'}</span>
                  <span>{Math.round(goalProgress.percentage)}%</span>
                </div>
                {goalProgress.recommendation && (
                  <p className="mt-2 text-xs text-muted-foreground">{goalProgress.recommendation}</p>
                )}
              </div>
            )}

            {(favoriteMeals.length > 0 || frequentIngredients.length > 0) && (
              <div className="space-y-3">
                {favoriteMeals.length > 0 && (
                  <div>
                    <p className="text-xs uppercase text-muted-foreground mb-2">Platos favoritos</p>
                    <div className="flex flex-wrap gap-2">
                      {favoriteMeals.map((meal) => (
                        <Badge key={meal} variant="outline">{meal}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {frequentIngredients.length > 0 && (
                  <div>
                    <p className="text-xs uppercase text-muted-foreground mb-2">Ingredientes más usados</p>
                    <div className="flex flex-wrap gap-2">
                      {frequentIngredients.map((ingredient) => (
                        <Badge key={ingredient} variant="secondary">{ingredient}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {weeklyReport?.suggestions?.length ? (
              <div>
                <Separator className="my-4" />
                <p className="text-xs uppercase text-muted-foreground mb-2">Sugerencias</p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {weeklyReport.suggestions.map((suggestion, index) => (
                    <li key={index}>• {suggestion}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PlanningStatsDialog;
