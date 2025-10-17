import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { DraggableMealCard } from './DraggableMealCard';
import type { PlannedMeal, MealType } from '../types';
import { Button } from '@/components/ui/button';

interface DroppableMealSlotProps {
  mealType: MealType;
  meals: PlannedMeal[];
  date: string;
  isOver?: boolean;
  onExecute?: (mealId: string) => void;
  onSkip?: (mealId: string) => void;
  onEdit?: (mealId: string) => void;
  onDelete?: (mealId: string) => void;
  onAdd?: (date: string, mealType: MealType) => void;
  onAddMissingIngredients?: (mealId: string) => void;
  onGenerateAlternative?: (mealId: string) => void;
}

export function DroppableMealSlot({
  mealType,
  meals,
  date,
  isOver = false,
  onExecute,
  onSkip,
  onEdit,
  onDelete,
  onAdd,
  onAddMissingIngredients,
  onGenerateAlternative,
}: DroppableMealSlotProps) {
  const { setNodeRef, isOver: isDroppableOver } = useDroppable({
    id: `${date}-${mealType}`,
    data: {
      type: 'meal-slot',
      date,
      mealType
    }
  });

  const isHighlighted = isOver || isDroppableOver;
  const hasMeals = meals.length > 0;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'rounded-xl border-2 border-dashed p-3 transition-all duration-200',
        hasMeals ? 'border-muted-foreground/20 bg-card' : 'bg-muted/40',
        isHighlighted && 'border-primary/50 bg-primary/10'
      )}
    >
      <div className="space-y-2">
        {hasMeals ? (
          meals.map((meal) => (
            <DraggableMealCard
              key={meal.id}
              meal={meal}
              compact
              showActions
              onExecute={() => onExecute?.(meal.id)}
              onSkip={() => onSkip?.(meal.id)}
              onEdit={() => onEdit?.(meal.id)}
              onDelete={() => onDelete?.(meal.id)}
              onAddMissingIngredients={() => onAddMissingIngredients?.(meal.id)}
              onGenerateAlternative={() => onGenerateAlternative?.(meal.id)}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-emerald-200/40 bg-gradient-to-br from-emerald-50/40 via-white/60 to-blue-50/40 py-8 text-xs text-muted-foreground transition-all duration-300 hover:from-emerald-100/50 hover:to-blue-100/50 hover:border-emerald-300/60">
            <div className="flex items-center gap-2">
              {isHighlighted ? (
                <>
                  <div className="h-6 w-6 rounded-full bg-gradient-to-r from-emerald-400 to-blue-500 flex items-center justify-center shadow-md">
                    <span className="text-white text-sm">🎯</span>
                  </div>
                  <span className="font-medium text-emerald-700">¡Soltá aquí!</span>
                </>
              ) : (
                <>
                  <div className="h-6 w-6 rounded-full bg-gradient-to-r from-gray-300 to-gray-400 flex items-center justify-center">
                    <span className="text-gray-600 text-sm">➕</span>
                  </div>
                  <span className="font-medium">Sin comida planificada</span>
                </>
              )}
            </div>
            <span className="text-[11px] text-muted-foreground/70 max-w-32 text-center leading-tight">
              {isHighlighted ? 'Perfecto para esta comida' : 'Añadí una comida manualmente o arrastrá desde otro día'}
            </span>
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          className="h-auto w-full justify-center px-3 py-2 text-xs rounded-lg border-emerald-200 bg-gradient-to-r from-emerald-50 to-blue-50 hover:from-emerald-100 hover:to-blue-100 transition-all duration-200 shadow-sm hover:shadow-md"
          onClick={() => onAdd?.(date, mealType)}
        >
          <span className="mr-1">✨</span>
          Añadir comida
        </Button>
      </div>
    </div>
  );
}
