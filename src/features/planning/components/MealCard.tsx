import React, { useState } from 'react';
import type { PlannedMeal, MealType } from '../types';
import type { Recipe } from '@/types/recipeTypes';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Plus, Trash2, Pencil, Eye, BookOpen } from 'lucide-react'; // Añadir BookOpen
import { RecipePreviewDialog } from './RecipePreviewDialog';

const mealVisuals: { [key in MealType]: { emoji: string; label: string } } = {
  'Desayuno': { emoji: '🍳', label: 'Desayuno' },
  'Almuerzo': { emoji: '🥗', label: 'Almuerzo' },
  'Merienda': { emoji: '🫖', label: 'Merienda' },
  'Cena': { emoji: '🌙', label: 'Cena' },
};

// Extender PlannedMeal para incluir la receta anidada opcionalmente
interface PlannedMealWithRecipe extends PlannedMeal {
  recipes?: Pick<Recipe, 'id' | 'title' | 'description' | 'image_url'> | null;
}

interface MealCardProps {
  date: Date;
  mealType: MealType;
  plannedMeals: PlannedMealWithRecipe[];
  onAddClick: (date: Date, mealType: MealType) => void;
  onEditClick: (meal: PlannedMealWithRecipe) => void;
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
  const [selectedRecipe, setSelectedRecipe] = useState<{
    id: string;
    recipe?: Pick<Recipe, 'id' | 'title' | 'description' | 'image_url'>;
  } | null>(null);

  return (
    <>
      <div className={cn("flex flex-col h-full p-1.5", className)}>
        {/* Header */}
        <div className="flex items-center gap-1 mb-1.5 flex-shrink-0">
          <span className="text-sm select-none">{visuals.emoji}</span>
          <span className="text-xs font-medium text-muted-foreground">{visuals.label}</span>
        </div>

        {/* Contenido (Lista de comidas) */}
        <div className="flex-grow overflow-y-auto min-h-0 pr-1 space-y-1 mb-1">
          {hasMeals ? (
              plannedMeals.map((meal) => {
                console.log(`[MealCard] Rendering meal ${meal.id}: recipe_id=${meal.recipe_id}, title=${meal.recipes?.title}, custom_name=${meal.custom_meal_name}`);

                return (
                  <div key={meal.id} className="relative group">
                    <div
                      className={cn(
                        "bg-background/60 rounded px-1.5 py-1 text-left border border-transparent",
                        "hover:bg-background/80 hover:border-border/20 transition-colors",
                        "cursor-pointer"
                      )}
                      onClick={() => onEditClick(meal)}
                    >
                      <div className="flex items-center gap-1.5 pr-10"> {/* Ajustar gap si es necesario */}
                         {meal.recipe_id && <BookOpen className="h-3 w-3 text-muted-foreground flex-shrink-0" />} {/* Icono Receta */}
                         <p className="text-xs text-foreground line-clamp-1 flex-grow">
                           {meal.recipes?.title || meal.custom_meal_name || 'Comida'}
                         </p>
                         {meal.recipe_id && (
                           <Button
                             variant="ghost"
                             size="icon"
                             className="h-5 w-5 text-muted-foreground hover:text-primary z-10"
                             onClick={(e) => {
                               e.stopPropagation();
                               setSelectedRecipe({
                                 id: meal.recipe_id!,
                                 recipe: meal.recipes as Pick<Recipe, 'id' | 'title' | 'description' | 'image_url'>
                               });
                             }}
                             title="Ver receta"
                           >
                             <Eye className="h-3 w-3" />
                           </Button>
                         )}
                      </div>
                    </div>
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                       <Button
                         variant="ghost"
                         size="icon"
                         className="h-5 w-5 hover:bg-background/80 text-muted-foreground hover:text-primary"
                         onClick={(e) => { e.stopPropagation(); onEditClick(meal); }}
                         title="Editar comida"
                       >
                         <Pencil className="w-3 h-3"/>
                       </Button>
                       <Button
                         variant="ghost"
                         size="icon"
                         className="h-5 w-5 hover:bg-background/80 text-muted-foreground hover:text-destructive"
                         onClick={(e: React.MouseEvent) => {
                           e.stopPropagation();
                           if (window.confirm('¿Eliminar esta comida planificada?')) {
                             onDeleteClick(meal.id);
                           }
                         }}
                         title="Eliminar comida"
                       >
                         <Trash2 className="h-3 w-3" />
                       </Button>
                     </div>
                  </div>
                );
              })
          ) : (
            <div className="text-xs text-muted-foreground/70 text-center h-full flex items-center justify-center italic">
              Vacío
            </div>
          )}
        </div>

        {/* Botón Añadir */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full h-6 text-xs rounded-md border-t border-border/10 hover:bg-muted/30 mt-auto flex-shrink-0 -mx-1.5 -mb-1.5"
          onClick={() => onAddClick(date, mealType)}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Modal de vista previa de receta */}
      {selectedRecipe && (
        <RecipePreviewDialog
          isOpen={!!selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
          recipeId={selectedRecipe.id}
          recipe={selectedRecipe.recipe}
        />
      )}
    </>
  );
}
