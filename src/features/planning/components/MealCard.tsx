import React, { useState, useEffect, useCallback } from 'react';
import type { PlannedMeal, MealType, UpsertPlannedMealData } from '../types';
import type { Recipe, RecipeIngredient, RecipeInstructions } from '@/types/recipeTypes';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Plus, Trash2, Pencil, Eye, BookOpen, Copy, AlertTriangle, MoreHorizontal } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import { format } from 'date-fns';
import { RecipePreviewDialog } from './RecipePreviewDialog';
import { ShoppingListItem } from '@/types/shoppingListTypes';
import { PantryItem } from '@/types/pantryTypes';

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

// Modificar la función de log para ser una función de componente que use useRef
const useMealCardLogger = () => {
  const lastLogTimeRef = React.useRef<{ [key: string]: number }>({});
  
  return (meal: PlannedMealWithRecipe) => {
    // Solo mostrar logs en desarrollo y limitar la frecuencia
    if (process.env.NODE_ENV !== 'production') {
      const now = Date.now();
      const lastLogTime = lastLogTimeRef.current[meal.id] || 0;
      if (now - lastLogTime > 2000) {
        lastLogTimeRef.current[meal.id] = now;
        console.log(`[MealCard] Rendering meal ${meal.id.substring(0, 8)}...: recipe_id=${meal.recipe_id}, title=${meal.recipes?.title || meal.custom_meal_name}`);
      }
    }
  };
};

// Función para convertir elementos de la despensa a formato de lista de compra
const convertPantryItemsToShoppingListItems = (items: PantryItem[]): ShoppingListItem[] => {
  return items.map(item => ({
    id: item.id,
    user_id: item.user_id,
    ingredient_name: item.ingredient_name,
    quantity: item.quantity,
    unit: item.unit,
    is_checked: false,
    created_at: item.created_at,
    recipe_id: null,
    category_id: null,
    notes: null
  }));
};

// Envolver el componente en React.memo para prevenir renderizados innecesarios
export const MealCard = React.memo(function MealCard({
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
  const logger = useMealCardLogger();

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
        // Crear un objeto Recipe con la información necesaria y forzar el tipo
        const recipeObj = {
          id: meal.recipes.id,
          title: meal.recipes.title,
          recipe_ingredients: meal.recipes.ingredients,
          // Añadir propiedades mínimas requeridas por la interfaz Recipe
          user_id: '',
          instructions: [] as RecipeInstructions, // Usar el tipo correcto para instructions
          description: '',
          servings: 0,
          created_at: new Date().toISOString(),
          is_favorite: false,
          is_public: false,
          image_url: meal.recipes.image_url
        } as unknown as Recipe; // Primero convertir a unknown y luego a Recipe
        
        const missingIngredients = await calculateMissingRecipeIngredients(
          recipeObj,
          convertPantryItemsToShoppingListItems(pantryItems)
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

  // Memorizar la función onSuggestionSelect que se pasa a SuggestionsPopover
  const handleSuggestionSelect = useCallback(async (suggestion: Suggestion) => {
    console.log(`[MealCard] Suggestion selected: ${suggestion.title}`);
    const mealData: UpsertPlannedMealData = {
      plan_date: format(date, 'yyyy-MM-dd'),
      meal_type: mealType,
      recipe_id: suggestion.type === 'recipe' ? suggestion.id : null,
      custom_meal_name: suggestion.type === 'custom' ? suggestion.title : null,
      // Podríamos añadir description o reason como notes si fuera útil
      notes: suggestion.description || suggestion.reason
    };
    const newMeal = await addPlannedMeal(mealData);
    if (newMeal) {
      toast.success(`"${suggestion.title}" añadido al plan.`, {} as any);
    } else {
      toast.error(`Error al añadir "${suggestion.title}" al plan.`, {} as any);
    }
    // El popover se cierra automáticamente al hacer clic en un botón dentro de su contenido.
    // No necesitamos cerrar el popover manualmente aquí.
  }, [date, mealType, addPlannedMeal]); // Dependencias correctas

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
                // Reemplazar el log extenso por la versión optimizada
                logger(meal);
                
                return (
                  <div key={meal.id} className="relative group bg-background/60 rounded border border-transparent hover:bg-background/80 hover:border-border/20 transition-colors">
                    {/* Contenido principal de la comida */}
                    <div className="px-1.5 py-1 text-left">
                      <div className="flex items-center gap-1.5"> {/* Contenedor principal: Icono, Título, Ver, Más */}
                         {meal.recipe_id && <BookOpen className="h-3 w-3 text-muted-foreground flex-shrink-0" aria-hidden="true" />}
                         <TooltipProvider delayDuration={300}>
                           <Tooltip>
                             <TooltipTrigger asChild>
                               <span className="text-sm font-medium truncate flex-1 min-w-0"> {/* <--- Cambiado text-xs a text-sm */}
                                 {meal.recipes?.title || meal.custom_meal_name || 'Comida sin nombre'}
                               </span>
                             </TooltipTrigger>
                             <TooltipContent side="top" align="start">
                               <p>{meal.recipes?.title || meal.custom_meal_name || 'Comida'}</p> {/* Título completo */}
                             </TooltipContent>
                           </Tooltip>
                         </TooltipProvider>
                         {/* Indicador de ingredientes faltantes (si aplica) */}
                         {meal.recipe_id && ingredientStatus[meal.id]?.hasMissingIngredients && (
                           <TooltipProvider>
                             <Tooltip delayDuration={300}>
                               <TooltipTrigger asChild>
                                 <div className="inline-flex flex-shrink-0"> {/* Evita que se encoja */}
                                   <AlertTriangle
                                     className="h-3 w-3 text-warning cursor-help"
                                     aria-label="Faltan ingredientes"
                                   />
                                 </div>
                               </TooltipTrigger>
                               <TooltipContent side="top" align="center">
                                 <p className="text-xs">Faltan ingredientes</p>
                               </TooltipContent>
                             </Tooltip>
                           </TooltipProvider>
                         )}

                         {/* Botón Ver (siempre visible) */}
                         {meal.recipe_id && (
                           <TooltipProvider delayDuration={300}>
                             <Tooltip>
                               <TooltipTrigger asChild>
                                 <Button
                                   variant="ghost"
                                   size="icon"
                                   className="h-5 w-5 flex-shrink-0 text-muted-foreground hover:text-primary"
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     setSelectedRecipe({
                                       id: meal.recipe_id!,
                                       recipe: meal.recipes ? {
                                         id: meal.recipes.id,
                                         title: meal.recipes.title,
                                         description: meal.recipes.description,
                                         image_url: meal.recipes.image_url
                                       } : undefined
                                     } as any);
                                   }}
                                   aria-label="Ver receta"
                                 >
                                   <Eye className="w-3.5 h-3.5" />
                                 </Button>
                               </TooltipTrigger>
                               <TooltipContent side="top" align="center">
                                 <p>Ver Receta</p>
                               </TooltipContent>
                             </Tooltip>
                           </TooltipProvider>
                         )}

                         {/* Botón Más Opciones (...) */}
                         <DropdownMenu>
                           <DropdownMenuTrigger asChild>
                             <Button
                               variant="ghost"
                               size="icon"
                               className="h-5 w-5 flex-shrink-0 text-muted-foreground hover:text-primary"
                               aria-label="Más opciones"
                               onClick={(e) => e.stopPropagation()} // Evitar que el clic en el trigger active otros eventos
                             >
                               <MoreHorizontal className="w-3.5 h-3.5" />
                             </Button>
                           </DropdownMenuTrigger>
                           <DropdownMenuContent align="end" onClick={(e: React.MouseEvent) => e.stopPropagation()}> {/* Evitar cierre al hacer clic dentro y añadir tipo */}
                             {onCopyClick && (
                               <DropdownMenuItem onSelect={() => onCopyClick(meal)}>
                                 <Copy className="mr-2 h-3.5 w-3.5" /> Copiar
                               </DropdownMenuItem>
                             )}
                             <DropdownMenuItem onSelect={() => onEditClick(meal)}>
                               <Pencil className="mr-2 h-3.5 w-3.5" /> Editar
                             </DropdownMenuItem>
                             <DropdownMenuItem
                               className="text-destructive focus:text-destructive focus:bg-destructive/10"
                               onSelect={() => {
                                 if (window.confirm('¿Eliminar esta comida planificada?')) {
                                   onDeleteClick(meal.id);
                                 }
                               }}
                             >
                               <Trash2 className="mr-2 h-3.5 w-3.5" /> Eliminar
                             </DropdownMenuItem>
                           </DropdownMenuContent>
                         </DropdownMenu>
                      </div>
                    </div>
                    {/* Contenedor de botones antiguo eliminado */}
                  </div>
                );
              })
          ) : (
            <div className="text-xs text-muted-foreground/70 text-center h-full flex items-center justify-center gap-2">
              <span className="italic">Vacío</span>
              <SuggestionsPopover
                date={format(date, 'yyyy-MM-dd')}
                mealType={mealType}
                onSuggestionSelect={handleSuggestionSelect}
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
              toast.success('Comida pegada con éxito', {});
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
});
