import React from 'react';
import { Button } from '@/components/ui/button';
// Usar any temporalmente
// import { PlannedMeal, MealType } from '../types';
type PlannedMeal = any;
type MealType = any;
import { cn } from '@/lib/utils';
import { Plus, Trash2, Pencil, Link as LinkIcon } from 'lucide-react'; // Añadir Pencil y LinkIcon
import { Link } from 'react-router-dom'; // Importar Link

const mealVisuals: { [key in MealType]: { emoji: string; label: string } } = {
  'Desayuno': { emoji: '🍳', label: 'Desayuno' },
  'Almuerzo': { emoji: '🥗', label: 'Almuerzo' },
  'Merienda': { emoji: '🫖', label: 'Merienda' },
  'Cena': { emoji: '🌙', label: 'Cena' },
};

interface MealCardProps {
  date: Date;
  mealType: MealType;
  plannedMeals: PlannedMeal[];
  onAddClick: (date: Date, mealType: MealType) => void;
  onEditClick: (meal: PlannedMeal) => void;
  onDeleteClick: (mealId: string) => void;
  className?: string; 
}

export function MealCard({
  date,
  mealType,
  plannedMeals,
  onAddClick,
  onEditClick,
  onDeleteClick,
  className 
}: MealCardProps) {
  const visuals = mealVisuals[mealType];
  const hasMeals = plannedMeals && plannedMeals.length > 0;

  return (
    // Contenedor principal: flex-col, altura completa de la celda, sin bordes/sombras propios
    <div className={cn(
      "flex flex-col h-full p-1.5", // Padding interno
      className 
    )}>
      {/* Header simplificado */}
      <div className="flex items-center gap-1 mb-1.5 flex-shrink-0"> 
        <span className="text-sm select-none">{visuals.emoji}</span>
        <span className="text-xs font-medium text-muted-foreground">{visuals.label}</span>
      </div>
      
      {/* Contenido principal (ocupa espacio restante y permite scroll) */}
      <div className="flex-grow overflow-y-auto min-h-0 pr-1 space-y-1 mb-1"> 
        {hasMeals ? (
            plannedMeals.map((meal) => (
              <div
                key={meal.id}
                className={cn(
                  "bg-background/60 rounded px-1.5 py-1 text-left relative group border border-transparent", // Más compacto
                  "hover:bg-background/80 hover:border-border/20 transition-colors",
                  "cursor-pointer" // Hacer toda la tarjeta clickeable para editar
                )}
                onClick={() => onEditClick(meal)} // Editar al hacer clic en cualquier parte
              >
                {/* Nombre y Link (si es receta) */}
                <div className="flex items-center justify-between">
                   <p className="text-xs text-foreground line-clamp-1 flex-grow pr-1"> 
                     {meal.recipes ? meal.recipes.name : meal.custom_meal_name || 'Comida'}
                   </p>
                   {/* Icono de Link si es receta */}
                   {meal.recipe_id && meal.recipes && (
                      <Link 
                         to={`/app/recipes/${meal.recipe_id}`}
                         onClick={(e) => e.stopPropagation()} // Evitar que el Link active el onEditClick del div padre
                         className="text-muted-foreground opacity-0 group-hover:opacity-100 flex-shrink-0 ml-1 hover:text-[hsl(var(--primary))] transition-all duration-200"
                         aria-label="Ver receta"
                      >
                         <LinkIcon className="h-3 w-3" />
                      </Link>
                   )}
                </div>

                {/* Botones Editar/Borrar (Absolutos, aparecen en hover) */}
                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0 opacity-0 group-hover:opacity-100 transition-opacity">
                   {/* Botón Editar (siempre presente, llama a onEditClick) */}
                   <Button
                     variant="ghost"
                     size="icon"
                     className="h-5 w-5 hover:bg-background/80 text-muted-foreground hover:text-[hsl(var(--primary))] transition-all duration-200"
                     onClick={(e) => { e.stopPropagation(); onEditClick(meal); }}
                     title="Editar comida"
                   >
                     <Pencil className="w-3 h-3"/>
                   </Button>
                   {/* Botón Borrar */}
                   <Button
                     variant="ghost"
                     size="icon"
                     className="h-5 w-5 hover:bg-background/80 text-muted-foreground hover:text-[hsl(var(--destructive))] transition-all duration-200"
                     onClick={(e: React.MouseEvent) => {
                       e.stopPropagation();
                       if (window.confirm('¿Eliminar esta comida planificada?')) {
                         onDeleteClick(meal.id);
                       }
                     }}
                     aria-label="Eliminar comida"
                   >
                     <Trash2 className="h-3 w-3" />
                   </Button>
                 </div>
              </div>
            ))
        ) : (
          <div className="text-xs text-muted-foreground/70 text-center h-full flex items-center justify-center italic"> 
            Vacío
          </div>
        )}
      </div>
        
      {/* Botón Añadir siempre visible abajo */}
      <Button
        variant="ghost"
        size="sm"
        className="w-full h-6 text-xs rounded-md border-t border-border/10 hover:bg-muted/30 mt-auto flex-shrink-0 -mx-1.5 -mb-1.5" // Ajustes para pegarlo bien abajo
        onClick={() => onAddClick(date, mealType)}
      >
        <Plus className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
