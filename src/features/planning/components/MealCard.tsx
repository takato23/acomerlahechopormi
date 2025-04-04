import React, { useState, useEffect } from 'react';
import type { PlannedMeal, MealType, UpsertPlannedMealData } from '../types';
import type { Recipe, RecipeIngredient } from '@/types/recipeTypes';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Plus, Trash2, Pencil, Eye, BookOpen, Copy, AlertTriangle } from 'lucide-react';
import { usePlanningStore } from '@/stores/planningStore';
import { usePantryStore } from '@/stores/pantryStore';
import { calculateMissingRecipeIngredients } from '@/features/shopping-list/services/shoppingListService';
import { Suggestion } from '@/features/suggestions/types';
import { SuggestionsPopover } from './SuggestionsPopover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from 'sonner';
import { format } from 'date-fns';
import { RecipePreviewDialog } from './RecipePreviewDialog';

const mealVisuals: { [key in MealType]: { emoji: string; label: string } } = {
  'Desayuno': { emoji: '🍳', label: 'Desayuno' },
  'Almuerzo': { emoji: '🥗', label: 'Almuerzo' },
  'Merienda': { emoji: '🫖', label: 'Merienda' },
  'Cena': { emoji: '🌙', label: 'Cena' },
};

// Extender PlannedMeal con los campos requeridos de Recipe
export interface PlannedMealWithRecipe extends PlannedMeal {
  recipes?: {
    id: string;
    title: string;
    description: string | null;
    image_url: string | null;
    ingredients?: RecipeIngredient[];
  } | null;
}

interface MealIngredientStatus {
  hasMissingIngredients: boolean;
  loading: boolean;
}

interface MealCardProps {
  date: Date;
  mealType: MealType;
  plannedMeals: PlannedMealWithRecipe[];
  onAddClick: (date: Date, mealType: MealType) => void;
  onEditClick: (meal: PlannedMealWithRecipe) => void;
  onDeleteClick: (mealId: string) => void;
  onCopyClick?: (meal: PlannedMealWithRecipe) => void;
  className?: string;
}

export function MealCard({
  date,
  mealType,
  plannedMeals,
  onAddClick,
  onEditClick,
  onDeleteClick,
  onCopyClick,
  className
}: MealCardProps) {
  const { copiedMeal, pasteCopiedMeal, addPlannedMeal } = usePlanningStore();
  const visuals = mealVisuals[mealType];
  const hasMeals = plannedMeals && plannedMeals.length > 0;
  const { items: pantryItems, fetchItems: fetchPantryItems } = usePantryStore();
  const [ingredientStatus, setIngredientStatus] = useState<{[key: string]: MealIngredientStatus}>({});
  const [selectedRecipe, setSelectedRecipe] = useState<{
    id: string;
    recipe?: {
      id: string;
      title: string;
      description: string | null;
      image_url: string | null;
    };
  } | null>(null);

  useEffect(() => {
    if (!pantryItems.length) {
      fetchPantryItems();
    }
  }, [fetchPantryItems]);

  // Memorizar el cálculo de ingredientes faltantes para evitar recálculos innecesarios
  useEffect(() => {
    async function checkIngredients(meal: PlannedMealWithRecipe) {
      if (!meal.recipe_id || !meal.recipes?.ingredients) return;

      // Solo actualizar el estado de carga si no tenemos un estado previo
      if (!ingredientStatus[meal.id]) {
        setIngredientStatus(prev => ({
          ...prev,
          [meal.id]: { ...prev[meal.id], loading: true }
        }));
      }

      try {
        // Calcular ingredientes faltantes usando la función del servicio
        const missingIngredients = await calculateMissingRecipeIngredients(
          meal.recipes.ingredients
        );

        setIngredientStatus(prev => ({
          ...prev,
          [meal.id]: {
            hasMissingIngredients: missingIngredients.length > 0,
            loading: false
          }
        }));
      } catch (error) {
        console.error('Error checking missing ingredients:', error);
        setIngredientStatus(prev => ({
          ...prev,
          [meal.id]: {
            hasMissingIngredients: false,
            loading: false
          }
        }));
      }
    }

    // Solo realizar el cálculo si tenemos los datos necesarios
    if (pantryItems.length > 0) {
      // Limpiar estados antiguos que ya no corresponden a comidas planificadas
      const currentMealIds = new Set(plannedMeals.map(meal => meal.id));
      setIngredientStatus(prev => {
        const newStatus = { ...prev };
        Object.keys(newStatus).forEach(mealId => {
          if (!currentMealIds.has(mealId)) {
            delete newStatus[mealId];
          }
        });
        return newStatus;
      });

      // Verificar ingredientes para cada comida planificada
      plannedMeals.forEach(meal => {
        if (meal.recipe_id) {
          checkIngredients(meal);
        }
      });
    }
  }, [plannedMeals, pantryItems]); // Remover ingredientStatus de las dependencias para evitar loops

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
                  <div key={meal.id} className="relative group bg-background/60 rounded border border-transparent hover:bg-background/80 hover:border-border/20 transition-colors">
                    {/* Contenido principal de la comida */}
                    <div className="px-1.5 py-1 text-left">
                      <div className="flex items-center gap-1.5 pr-10">
                         {meal.recipe_id && <BookOpen className="h-3 w-3 text-muted-foreground flex-shrink-0" aria-hidden="true" />}
                         <p className="text-xs text-foreground line-clamp-1 flex-grow">
                           {meal.recipes?.title || meal.custom_meal_name || 'Comida'}
                         </p>
                         {meal.recipe_id && (
                           <>
                             {ingredientStatus[meal.id]?.loading ? (
                               <div className="h-3 w-3 animate-pulse bg-muted-foreground/30 rounded-full" />
                             ) : ingredientStatus[meal.id]?.hasMissingIngredients ? (
                               <TooltipProvider>
                                 <Tooltip delayDuration={300}>
                                   <TooltipTrigger asChild>
                                     <div className="inline-flex">
                                       <AlertTriangle
                                         className="h-3 w-3 text-warning flex-shrink-0 cursor-help"
                                         aria-label="Faltan ingredientes"
                                       />
                                     </div>
                                   </TooltipTrigger>
                                   <TooltipContent side="top" align="center">
                                     <p className="text-xs">
                                       Faltan ingredientes en la despensa para esta receta
                                     </p>
                                   </TooltipContent>
                                 </Tooltip>
                               </TooltipProvider>
                             ) : null}
                           </>
                         )}
                         {meal.recipe_id && (
                           <Button
                             variant="ghost"
                             size="icon"
                             className="h-5 w-5 text-muted-foreground hover:text-primary z-10"
                             onClick={(e) => {
                               e.stopPropagation();
                               setSelectedRecipe({
                                 id: meal.recipe_id!,
                                 recipe: meal.recipes as {
                                   id: string;
                                   title: string;
                                   description: string | null;
                                   image_url: string | null;
                                 }
                               });
                             }}
                             aria-label="Ver receta"
                           >
                             <Eye className="h-3 w-3" />
                           </Button>
                         )}
                      </div>
                    </div>
                    {/* Botones de acción */}
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-within:opacity-100 transition-opacity">
                       <Button
                         variant="ghost"
                         size="icon"
                         className="h-5 w-5 hover:bg-background/80 text-muted-foreground hover:text-primary"
                         onClick={(e) => {
                           e.stopPropagation();
                           if (onCopyClick) {
                             onCopyClick(meal);
                           }
                         }}
                         aria-label="Copiar comida"
                       >
                         <Copy className="w-3 h-3"/>
                       </Button>
                       <Button
                         variant="ghost"
                         size="icon"
                         className="h-5 w-5 hover:bg-background/80 text-muted-foreground hover:text-primary"
                         onClick={(e) => { e.stopPropagation(); onEditClick(meal); }}
                         aria-label="Editar comida"
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
                         aria-label="Eliminar comida"
                       >
                         <Trash2 className="h-3 w-3" />
                       </Button>
                     </div>
                  </div>
                );
              })
          ) : (
            <div className="text-xs text-muted-foreground/70 text-center h-full flex items-center justify-center gap-2">
              <span className="italic">Vacío</span>
              <SuggestionsPopover
                date={format(date, 'yyyy-MM-dd')}
                mealType={mealType}
                onSuggestionSelect={async (suggestion: Suggestion) => {
                  const mealData: UpsertPlannedMealData = {
                    plan_date: format(date, 'yyyy-MM-dd'),
                    meal_type: mealType,
                    recipe_id: suggestion.type === 'recipe' ? suggestion.id : null,
                    custom_meal_name: suggestion.type === 'custom' ? suggestion.title : null,
                  };
                  const newMeal = await addPlannedMeal(mealData);
                  if (newMeal) {
                    toast.success(`"${suggestion.title}" añadido al plan.`);
                  } else {
                    toast.error(`Error al añadir "${suggestion.title}" al plan.`);
                  }
                  // El popover se cierra automáticamente al hacer clic en un botón dentro de su contenido.
                }}
              />
            </div>
          )}
        </div>

        {/* Botón Añadir o Pegar */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full h-6 text-xs rounded-md border-t border-border/10 hover:bg-muted/30 mt-auto flex-shrink-0 -mx-1.5 -mb-1.5"
          onClick={async () => {
            if (copiedMeal) {
              const targetDate = format(date, 'yyyy-MM-dd');
              await pasteCopiedMeal(targetDate, mealType);
              toast.success('Comida pegada con éxito');
            } else {
              onAddClick(date, mealType);
            }
          }}
          aria-label={copiedMeal ? `Pegar comida en ${mealType}` : `Añadir ${mealType}`}
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
