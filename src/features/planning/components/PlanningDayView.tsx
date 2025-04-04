import React from 'react';
import { format, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { MealCard } from './MealCard';
import type { PlannedMeal, MealType } from '../types';

interface PlanningDayViewProps {
  date: Date;
  mealsByType: { [key in MealType]?: PlannedMeal[] };
  mealTypes: MealType[];
  onAddClick: (date: Date, mealType: MealType) => void;
  onEditClick: (meal: PlannedMeal) => void;
  onDeleteClick: (mealId: string) => void;
  showHeader?: boolean;
  className?: string;
}

export function PlanningDayView({
  date,
  mealsByType,
  mealTypes,
  onAddClick,
  onEditClick,
  onDeleteClick,
  showHeader = true,
  className
}: PlanningDayViewProps) {
  return (
    // Contenedor principal: flex-col para móvil, space-y para desktop (ya que es hijo directo del grid)
    <div className={cn(
      "flex flex-col space-y-2", // Espacio entre header (si existe) y grid de comidas
      className
    )}>
      {/* Header del día (opcional, usado en móvil y potencialmente en desktop si showHeader=true) */}
      {showHeader && (
        <div className={cn(
          "p-2 text-center rounded-lg",
          "bg-card border border-border/30",
          "transition-colors duration-300",
          isToday(date) ? "bg-primary/5 border-primary/20" : "hover:bg-muted/50"
        )}>
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm font-medium text-foreground/80 capitalize">
              {format(date, 'EEEE', { locale: es })}
            </span>
            <div className={cn(
              "flex items-center justify-center rounded-full w-6 h-6 text-xs",
              isToday(date)
                ? "bg-primary/10 text-primary font-medium ring-1 ring-primary/10"
                : "text-muted-foreground"
            )}>
              {format(date, 'd')}
            </div>
          </div>
        </div>
      )}

      {/* Contenedor de las MealCards: Usa flex-col en móvil, pero en desktop cada MealCard es una celda del grid padre */}
      {/* No necesitamos un grid interno aquí si PlanningPage ya lo maneja */}
      {mealTypes.map(mealType => {
        const mealsForType = mealsByType[mealType] || [];
        return (
          // Envolver cada MealCard en un div estilizado como tarjeta para la vista móvil
          <div key={mealType} className="bg-card border border-border/20 rounded-lg shadow-sm p-3">
            <MealCard
              date={date}
              mealType={mealType}
              plannedMeals={mealsForType}
              onAddClick={onAddClick}
              onEditClick={onEditClick}
              onDeleteClick={onDeleteClick}
              // Quitar estilos de borde/fondo de MealCard si los tuviera internamente
              // para evitar duplicidad con el div contenedor.
            />
          </div>
        );
      })}
    </div>
  );
}