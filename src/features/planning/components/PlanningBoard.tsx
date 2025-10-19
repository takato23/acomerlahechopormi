import { useMemo, useState, type ReactNode } from 'react';
import { eachDayOfInterval, format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Pencil, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePlanningStore } from '@/stores/planningStore';
import type { MealType } from '../types';
import type { PlannedMealWithRecipe } from './MealCard';

interface PlanningBoardProps {
  weekStart: Date;
  weekEnd: Date;
  mealTypes: MealType[];
  meals: PlannedMealWithRecipe[];
  onAddMeal: (date: Date, mealType: MealType) => void;
  onEditMeal: (meal: PlannedMealWithRecipe) => void;
  onDeleteMeal: (mealId: string) => void;
}

interface SlotIdentifier {
  date: string;
  mealType: MealType;
}

const slotId = (date: string, mealType: MealType) => `${date}::${mealType}`;

function parseSlotIdentifier(id: string | null): SlotIdentifier | null {
  if (!id) return null;
  const [date, mealType] = id.split('::') as [string, MealType];
  if (!date || !mealType) return null;
  return { date, mealType };
}

const DraggableMeal = ({
  meal,
  onEdit,
  onDelete,
}: {
  meal: PlannedMealWithRecipe;
  onEdit: (meal: PlannedMealWithRecipe) => void;
  onDelete: (id: string) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: meal.id,
    data: { mealId: meal.id },
  });

  const style = {
    transform: transform ? CSS.Translate.toString(transform) : undefined,
    opacity: isDragging ? 0.6 : 1,
  } as const;

  const label = meal.recipes?.title ?? meal.custom_meal_name ?? 'Comida sin título';

  return (
    <Card
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={style}
      className={cn(
        'flex items-center justify-between gap-2 px-3 py-2 text-sm shadow-sm border border-border/40',
        'bg-background hover:bg-muted/60 transition-colors cursor-grab active:cursor-grabbing',
      )}
    >
      <button
        type="button"
        className="flex-1 text-left truncate"
        onClick={(event) => {
          event.stopPropagation();
          onEdit(meal);
        }}
      >
        {label}
      </button>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-muted-foreground"
          onClick={(event) => {
            event.stopPropagation();
            onEdit(meal);
          }}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-muted-foreground"
          onClick={(event) => {
            event.stopPropagation();
            onDelete(meal.id);
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </Card>
  );
};

const DroppableSlot = ({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactNode;
}) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'rounded-lg border border-dashed border-border/50 bg-card/60 p-3 min-h-[110px] flex flex-col gap-2',
        isOver && 'border-primary bg-primary/5 shadow-sm',
      )}
    >
      <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
        <span>{label}</span>
      </div>
      <div className="flex flex-col gap-2 flex-1">{children}</div>
    </div>
  );
};

export function PlanningBoard({
  weekStart,
  weekEnd,
  mealTypes,
  meals,
  onAddMeal,
  onEditMeal,
  onDeleteMeal,
}: PlanningBoardProps) {
  const updatePlannedMeal = usePlanningStore((state) => state.updatePlannedMeal);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const [activeMealId, setActiveMealId] = useState<string | null>(null);

  const days = useMemo(
    () => eachDayOfInterval({ start: weekStart, end: weekEnd }),
    [weekStart, weekEnd],
  );

  const mealsBySlot = useMemo(() => {
    const grouping = new Map<string, PlannedMealWithRecipe[]>();
    meals.forEach((meal) => {
      const key = slotId(meal.plan_date, meal.meal_type);
      const bucket = grouping.get(key) ?? [];
      bucket.push(meal);
      grouping.set(key, bucket);
    });
    return grouping;
  }, [meals]);

  const activeMeal = activeMealId ? (meals.find((meal) => meal.id === activeMealId) ?? null) : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveMealId(String(event.active.id));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveMealId(null);
    const { active, over } = event;
    if (!over) return;

    const mealId = String(active.id);
    const meal = meals.find((item) => item.id === mealId);
    if (!meal) return;

    const target = parseSlotIdentifier(String(over.id));
    if (!target) return;

    if (meal.plan_date === target.date && meal.meal_type === target.mealType) {
      return;
    }

    await updatePlannedMeal(meal.id, {
      plan_date: target.date,
      meal_type: target.mealType,
      recipe_id: meal.recipe_id,
      custom_meal_name: meal.custom_meal_name,
      notes: meal.notes ?? undefined,
    });
  };

  const handleDragCancel = () => {
    setActiveMealId(null);
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="grid gap-4 md:grid-cols-7">
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          return (
            <div key={dateStr} className="space-y-3">
              <div className="text-center">
                <Badge variant="outline" className="px-3 py-1 text-xs font-medium">
                  {format(day, 'EEEE d', { locale: es })}
                </Badge>
              </div>
              {mealTypes.map((mealType) => {
                const slotKey = slotId(dateStr, mealType);
                const mealsForSlot = mealsBySlot.get(slotKey) ?? [];
                return (
                  <DroppableSlot key={slotKey} id={slotKey} label={mealType}>
                    {mealsForSlot.map((meal) => (
                      <DraggableMeal
                        key={meal.id}
                        meal={meal}
                        onEdit={onEditMeal}
                        onDelete={onDeleteMeal}
                      />
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-auto"
                      onClick={() => onAddMeal(day, mealType)}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Añadir
                    </Button>
                  </DroppableSlot>
                );
              })}
            </div>
          );
        })}
      </div>
      <DragOverlay>
        {activeMeal ? (
          <Card className="px-4 py-2 text-sm shadow-lg">
            {activeMeal.recipes?.title ?? activeMeal.custom_meal_name ?? 'Comida'}
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
