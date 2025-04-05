import React from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Suggestion } from "@/features/suggestions/types";
import { usePlanningStore } from "@/stores/planningStore";
import { usePantryStore } from "@/stores/pantryStore";
import { useRecipeStore } from "@/stores/recipeStore";
import { useShoppingListStore } from "@/stores/shoppingListStore";
import { findMissingIngredients, prepareMissingIngredientsForShoppingList, ShoppingListItem } from '@/features/suggestions/ingredientComparisonService';
import { RefreshCw, Sparkles, Home, Lightbulb } from "lucide-react"; // Añadir Home y Lightbulb
import { MealType } from "../types";
import { toast } from "sonner";

interface SuggestionsPopoverProps {
  date: string;
  mealType: MealType;
  onSuggestionSelect: (suggestion: Suggestion) => void;
}

export function SuggestionsPopover({
  date,
  mealType,
  onSuggestionSelect
}: SuggestionsPopoverProps) {
  const {
    pantrySuggestion,
    discoverySuggestion,
    isLoadingSuggestions,
    fetchSuggestions,
    clearSuggestions
  } = usePlanningStore();

  const pantryItems = usePantryStore(state => state.items);
  const addShoppingListItems = useShoppingListStore(state => state.addGeneratedItems);
  const recipes = useRecipeStore(state => state.recipes);

  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) return;
    const unsubscribe = usePantryStore.subscribe(() => {
      fetchSuggestions(date, mealType);
    });
    return () => unsubscribe();
  }, [date, mealType, isOpen, fetchSuggestions]);

  React.useEffect(() => {
    if (isOpen) {
      fetchSuggestions(date, mealType);
    }
  }, [date, mealType, isOpen, fetchSuggestions]);

  const handleTriggerClick = () => {
    fetchSuggestions(date, mealType);
  };

  const handleRefresh = () => {
    fetchSuggestions(date, mealType);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      clearSuggestions();
    }
    setIsOpen(open);
  };

  const handleDiscoverySuggestionSelect = async (suggestion: Suggestion) => {
    if (!suggestion.id) {
      onSuggestionSelect(suggestion);
      return;
    }

    // Buscar la receta en el estado actual
    const recipe = recipes.find(r => r.id === suggestion.id);
    if (!recipe) {
      onSuggestionSelect(suggestion);
      return;
    }

    // Buscar ingredientes faltantes
    const missingIngredients = findMissingIngredients(recipe, pantryItems);
    
    if (missingIngredients.length > 0) {
      // Mostrar toast de confirmación
      toast.promise(
        new Promise((resolve) => {
          toast(
            `¿Añadir ${missingIngredients.length} ingredientes a la lista de compras?`,
            {
              action: {
                label: "Sí, añadir",
                onClick: () => resolve(true)
              },
              cancel: {
                label: "No",
                onClick: () => resolve(false)
              }
            }
          );
        }).then(async (confirmed) => {
          if (confirmed) {
            const shoppingItems: ShoppingListItem[] = prepareMissingIngredientsForShoppingList(missingIngredients);
            // Filtrar items sin nombre antes de añadir
            const validShoppingItems = shoppingItems.filter(item => item.name && item.name.trim() !== '');
            if (validShoppingItems.length === 0) {
              console.warn("No valid missing ingredients found to add to shopping list.");
              return "No se añadieron ingredientes válidos a la lista";
            }
            const added = await addShoppingListItems(validShoppingItems);
            if (added > 0) {
              return `Se añadieron ${added} ingredientes a la lista de compras`;
            }
            throw new Error("No se pudieron añadir los ingredientes");
          }
          return "No se añadieron ingredientes a la lista";
        }),
        {
          loading: "Añadiendo ingredientes a la lista...",
          success: (message) => message,
          error: "Error al añadir ingredientes a la lista"
        }
      );
    }

    onSuggestionSelect(suggestion);
  };

  // Log para depurar estado en cada render
  console.log('[SuggestionsPopover Render]', { isLoadingSuggestions, pantrySuggestion, discoverySuggestion });

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleTriggerClick}
          aria-label="Ver sugerencias"
          className="hover:bg-secondary"
        >
          {isLoadingSuggestions ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
        </Button>
      </DialogTrigger>

      <DialogContent
        className="sm:max-w-[425px] p-4 bg-white/10 dark:bg-black/10 backdrop-blur-lg border border-white/20 rounded-lg shadow-xl"
        onInteractOutside={(e) => e.preventDefault()}
        aria-describedby="suggestions-description"
      >
        <div className="flex items-center justify-between mb-4">
          <DialogTitle className="flex items-center gap-2">
            {/* Título blanco con contorno */}
            <h2 className="font-medium text-lg text-white [text-shadow:1px_1px_0_rgba(0,0,0,0.3),-1px_-1px_0_rgba(0,0,0,0.3),1px_-1px_0_rgba(0,0,0,0.3),-1px_1px_0_rgba(0,0,0,0.3)]">Sugerencias</h2>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 text-muted-foreground"
              onClick={handleRefresh}
              disabled={isLoadingSuggestions}
              aria-label="Refrescar sugerencias"
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoadingSuggestions ? 'animate-spin' : ''}`}
              />
            </Button>
          </DialogTitle>
        </div>

        <div id="suggestions-description" className="sr-only">
          Lista de sugerencias de comidas para {mealType.toLowerCase()}
        </div>

        {isLoadingSuggestions ? (
          <div className="py-8 text-center text-muted-foreground">
            Buscando sugerencias...
          </div>
        ) : (pantrySuggestion || discoverySuggestion) ? (
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
            {pantrySuggestion && (
              <Button
                variant="ghost"
                // Fondo sólido translúcido (Opción B)
                className="w-full h-auto py-2 px-3 flex flex-col items-start text-left rounded-md border border-emerald-500/50 bg-emerald-500/20 hover:bg-emerald-500/30 transition-colors group" // Quitar text-foreground global del botón
                onClick={() => onSuggestionSelect(pantrySuggestion)}
              >
                <div className="flex items-center gap-1.5 mb-1 text-emerald-600 dark:text-emerald-400">
                  <Home className="h-3.5 w-3.5" />
                  <span className="text-xs font-semibold uppercase tracking-wide">Cocina con lo que tenés</span>
                </div>
                {/* Texto blanco con contorno simulado */}
                <span className="text-sm font-medium text-white mb-0.5 block truncate w-full [text-shadow:1px_1px_0_rgba(0,0,0,0.3),-1px_-1px_0_rgba(0,0,0,0.3),1px_-1px_0_rgba(0,0,0,0.3),-1px_1px_0_rgba(0,0,0,0.3)]"> {/* Aumentar opacidad de sombra */}
                  {pantrySuggestion.title}
                </span>
                {pantrySuggestion.reason && (
                  <span className="text-xs text-emerald-600/90 dark:text-emerald-400/90"> {/* Ajustar color de la razón para contraste */}
                    {pantrySuggestion.reason}
                  </span>
                )}
              </Button>
            )}

            {discoverySuggestion && (
              <Button
                variant="ghost"
                className="w-full h-auto py-2 px-3 flex flex-col items-start text-left rounded-md border border-purple-500/50 bg-purple-500/20 hover:bg-purple-500/30 transition-colors group" // Fondo sólido translúcido (Opción B)
                onClick={() => handleDiscoverySuggestionSelect(discoverySuggestion)}
              >
                 <div className="flex items-center gap-1.5 mb-1 text-purple-600 dark:text-purple-400">
                  <Lightbulb className="h-3.5 w-3.5" />
                  <span className="text-xs font-semibold uppercase tracking-wide">Prueba Algo Nuevo</span>
                </div>
                {/* Texto blanco con contorno simulado */}
                <span className="text-sm font-medium text-white mb-0.5 block truncate w-full [text-shadow:1px_1px_0_rgba(0,0,0,0.3),-1px_-1px_0_rgba(0,0,0,0.3),1px_-1px_0_rgba(0,0,0,0.3),-1px_1px_0_rgba(0,0,0,0.3)]"> {/* Aumentar opacidad de sombra */}
                  {discoverySuggestion.title}
                </span>
                 {discoverySuggestion.reason && (
                  <span className="text-xs text-purple-600/90 dark:text-purple-400/90"> {/* Ajustar color de la razón para contraste */}
                    {discoverySuggestion.reason}
                  </span>
                )}
              </Button>
            )}
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            No hay sugerencias disponibles para {mealType.toLowerCase()}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
