import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MealCard } from './MealCard';
import type { PlannedMeal } from '../types';

interface DraggableMealCardProps {
  meal: PlannedMeal;
  compact?: boolean;
  showActions?: boolean;
  onExecute?: () => void;
  onSkip?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onAddMissingIngredients?: () => void;
  onGenerateAlternative?: () => void;
  isDragging?: boolean;
}

export function DraggableMealCard({
  meal,
  compact = false,
  showActions = true,
  onExecute,
  onSkip,
  onEdit,
  onDelete,
  onAddMissingIngredients,
  onGenerateAlternative,
  isDragging = false
}: DraggableMealCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: meal.id,
    data: {
      type: 'meal',
      meal
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`cursor-grab active:cursor-grabbing ${isDragging ? 'z-50' : ''}`}
      {...attributes}
      {...listeners}
    >
      <MealCard
        meal={meal}
        compact={compact}
        showActions={showActions && !isSortableDragging}
        onExecute={onExecute}
        onSkip={onSkip}
        onEdit={onEdit}
        onDelete={onDelete}
        onAddMissingIngredients={onAddMissingIngredients}
        onGenerateAlternative={onGenerateAlternative}
      />
    </div>
  );
}
