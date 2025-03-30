import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlannedMeal, MealType } from '../types';
import { cn } from '@/lib/utils';
import { Egg, Utensils, Moon, Plus, Trash2 } from 'lucide-react'; // Importar iconos necesarios

// Definir los detalles visuales por tipo de comida
const mealVisuals: {
  [key in MealType]: {
    bgColor: string;
    icon: React.ElementType; // Usar React.ElementType para componentes de icono
    emoji: string; // Añadir emoji como string
    label: string;
  };
} = {
  breakfast: { bgColor: 'bg-yellow-50', icon: Egg, emoji: '🍳', label: 'Desayuno' },
  lunch: { bgColor: 'bg-green-50', icon: Utensils, emoji: '🥗', label: 'Almuerzo' },
  dinner: { bgColor: 'bg-indigo-50', icon: Moon, emoji: '🌙', label: 'Cena' },
};

interface MealSlotCardProps {
  date: Date;
  mealType: MealType;
  plannedMeals: PlannedMeal[];
  onAddClick: (date: Date, mealType: MealType) => void;
  onEditClick: (meal: PlannedMeal) => void;
  onDeleteClick: (mealId: string) => void;
}

export function MealSlotCard({
  date,
  mealType,
  plannedMeals,
  onAddClick,
  onEditClick,
  onDeleteClick,
}: MealSlotCardProps) {
  const visuals = mealVisuals[mealType];
  const hasMeals = plannedMeals.length > 0;

  return (
    <Card className="rounded-xl overflow-hidden shadow-sm flex flex-col h-full">
      {/* Header con color e icono */}
      <div className={cn("px-4 py-6 flex flex-col items-center", visuals.bgColor)}>
        <div className="bg-white shadow-md p-3 rounded-full mb-2 text-3xl"> {/* Ajustar padding y tamaño emoji */}
          {visuals.emoji}
        </div>
        <h3 className="text-lg font-bold text-slate-800">{visuals.label}</h3>
      </div>

      {/* Contenido: Placeholder o Comidas */}
      <CardContent className="p-4 text-center flex flex-col flex-grow">
        {hasMeals ? (
          // Mostrar solo la primera comida planificada (texto)
          <div className="flex-grow mb-4 flex flex-col justify-center items-center">
            {plannedMeals.length > 0 && (
              <div
                className="text-sm cursor-pointer w-full flex justify-between items-center"
                onClick={() => onEditClick(plannedMeals[0])}
              >
                <span className="line-clamp-2 flex-grow mr-2 text-center"> {/* Centrar texto */}
                  {plannedMeals[0].recipes ? plannedMeals[0].recipes.title : plannedMeals[0].custom_meal_text}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 flex-shrink-0 text-muted-foreground hover:text-destructive" // Hacer visible, ajustar color
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    if (window.confirm('¿Eliminar esta comida planificada?')) {
                      onDeleteClick(plannedMeals[0].id);
                    }
                  }}
                  aria-label="Eliminar comida"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        ) : (
          // Placeholder si no hay comidas
          <div className="border border-dashed rounded-md p-6 text-muted-foreground text-sm mb-4 flex-grow flex items-center justify-center"> {/* Revertir padding a p-6 */}
            Aún no planificado
          </div>
        )}

        {/* Botón Añadir */}
        <Button
          variant="outline"
          className="w-full text-sm mt-auto" // mt-auto para empujar abajo si hay espacio
          onClick={() => onAddClick(date, mealType)}
        >
          <Plus className="h-4 w-4 mr-1" /> Añadir
        </Button>
      </CardContent>
    </Card>
  );
}