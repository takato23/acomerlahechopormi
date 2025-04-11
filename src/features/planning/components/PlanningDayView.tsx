import React, { useCallback } from 'react';
import { format, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { MealCard, PlannedMealWithRecipe } from './MealCard';
import type { MealType } from '../types';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';

interface PlanningDayViewProps {
  date: Date;
  mealsByType: { [key in MealType]?: PlannedMealWithRecipe[] };
  mealTypes: MealType[];
  onAddClick: (date: Date, mealType: MealType) => void;
  onEditClick: (meal: PlannedMealWithRecipe) => void;
  onDeleteClick: (mealId: string) => void;
  onCopyClick?: (meal: PlannedMealWithRecipe) => void;
  onCopyDayClick?: (date: Date) => void;
  showHeader?: boolean;
  className?: string;
}

export const PlanningDayView = React.memo(function PlanningDayView({
  date,
  mealsByType,
  mealTypes,
  onAddClick,
  onEditClick,
  onDeleteClick,
  onCopyClick,
  onCopyDayClick,
  showHeader = true,
  className
}: PlanningDayViewProps) {
  // Log de renderizado controlado
  const lastLogTimeRef = React.useRef(0);
  const shouldLog = () => {
    const now = Date.now();
    if (now - lastLogTimeRef.current > 2000) {
      lastLogTimeRef.current = now;
      return true;
    }
    return false;
  };
  
  if (shouldLog()) {
      console.log(`[PlanningDayView] Rendering day ${format(date, 'yyyy-MM-dd')}`);
  }

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
          isToday(date) ? "bg-primary/5 border-primary/20" : "hover:bg-muted/50",
          "relative"
        )}>
         <div className="flex items-center justify-center gap-2">
           {onCopyDayClick && (
             <Button
               variant="ghost"
               size="icon"
               className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 opacity-0 hover:opacity-100 focus:opacity-100 hover:bg-background/80"
               onClick={() => onCopyDayClick(date)}
               aria-label="Copiar día"
             >
               <Copy className="h-3.5 w-3.5" />
             </Button>
           )}
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

      {/* Contenedor de las MealCards */}
      {mealTypes.map(mealType => {
        const mealsForType = mealsByType[mealType] || [];
        return (
          <div key={mealType} className="bg-card border border-border/20 rounded-lg shadow-sm p-3">
            <MealCard
              date={date}
              mealType={mealType}
              plannedMeals={mealsForType}
              onAddClick={onAddClick}
              onEditClick={onEditClick}
              onDeleteClick={onDeleteClick}
              onCopyClick={onCopyClick}
            />
          </div>
        );
      })}
    </div>
  );
});