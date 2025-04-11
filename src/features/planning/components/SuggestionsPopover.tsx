import React, { useRef, useEffect, useCallback, useMemo } from 'react';
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

// Resolver el problema de tipado entre RecipeSuggestion y Suggestion
interface SuggestionDisplay {
  id?: string;
  title?: string;
  reason?: string;
  // Otros campos comunes que puedes necesitar
}

interface SuggestionsPopoverProps {
  date: string;
  mealType: MealType;
  onSuggestionSelect: (suggestion: Suggestion) => void;
}

// Crear un componente interno para la visualización de sugerencias
const SuggestionItem = React.memo(function SuggestionItem({ 
  suggestion, 
  icon: Icon, 
  label, 
  colorClass,
  onClick 
}: { 
  suggestion: SuggestionDisplay; 
  icon: React.ElementType; 
  label: string;
  colorClass: string;
  onClick: () => void;
}) {
  return (
    <Button
      variant="ghost"
      className={`w-full h-auto py-2 px-3 flex flex-col items-start text-left rounded-md border border-${colorClass}-500/50 bg-${colorClass}-500/20 hover:bg-${colorClass}-500/30 transition-colors group`}
      onClick={onClick}
    >
      <div className={`flex items-center gap-1.5 mb-1 text-${colorClass}-600 dark:text-${colorClass}-400`}>
        <Icon className="h-3.5 w-3.5" />
        <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <span className="text-sm font-medium text-white mb-0.5 block truncate w-full [text-shadow:1px_1px_0_rgba(0,0,0,0.3),-1px_-1px_0_rgba(0,0,0,0.3),1px_-1px_0_rgba(0,0,0,0.3),-1px_1px_0_rgba(0,0,0,0.3)]">
        {suggestion.title || 'Sin título'}
      </span>
      {suggestion.reason && (
        <span className={`text-xs text-${colorClass}-600/90 dark:text-${colorClass}-400/90`}>
          {suggestion.reason}
        </span>
      )}
    </Button>
  );
});

// Controles para logging - exportados para pruebas si es necesario
const LOG_INTERVAL_MS = 2000; // Solo log cada 2 segundos

// Optimizar el componente con React.memo para evitar renderizados innecesarios
export const SuggestionsPopover = React.memo(function SuggestionsPopover({
  date,
  mealType,
  onSuggestionSelect
}: SuggestionsPopoverProps) {
  // ===== Referencias y estado local =====
  const [isOpen, setIsOpen] = React.useState(false);
  const lastLogTimeRef = useRef(Date.now() - LOG_INTERVAL_MS); // Iniciar permitiendo el primer log
  const renderCountRef = useRef(0);
  const debugModeRef = useRef(process.env.NODE_ENV === 'development');
  
  // ===== Store selectors =====
  // Usar selectores específicos para minimizar actualizaciones
  const pantrySuggestion = usePlanningStore(state => state.pantrySuggestion);
  const discoverySuggestion = usePlanningStore(state => state.discoverySuggestion);
  const isLoadingSuggestions = usePlanningStore(state => state.isLoadingSuggestions);
  const fetchSuggestions = usePlanningStore(state => state.fetchSuggestions);
  const clearSuggestions = usePlanningStore(state => state.clearSuggestions);

  const pantryItems = usePantryStore(state => state.items);
  const recipes = useRecipeStore(state => state.recipes);
  const addItem = useShoppingListStore(state => state.addItem);
  
  // ===== Funciones de utilidad =====
  // Controlador de logs para limitar spam en la consola
  const shouldLog = useCallback(() => {
    if (!debugModeRef.current) return false;
    
    const now = Date.now();
    if (now - lastLogTimeRef.current > LOG_INTERVAL_MS) {
      lastLogTimeRef.current = now;
      return true;
    }
    return false;
  }, []);

  // Función para logging consistente
  const log = useCallback((message: string, data?: any) => {
    if (shouldLog()) {
      if (data) {
        console.log(`[SuggestionsPopover] ${message}`, data);
      } else {
        console.log(`[SuggestionsPopover] ${message}`);
      }
    }
  }, [shouldLog]);
  
  // Función para asegurar que una sugerencia tenga el formato correcto
  const ensureSuggestion = useCallback((input: any): Suggestion => {
    return {
      id: input?.id || undefined,
      title: input?.title || input?.name || 'Sin título',
      reason: input?.reason || undefined,
      // Asegurarse de incluir cualquier otra propiedad relevante
    };
  }, []);
  
  // ===== Valores memoizados =====
  const hasSuggestions = useMemo(() => 
    Boolean(pantrySuggestion || discoverySuggestion), 
    [pantrySuggestion, discoverySuggestion]
  );
  
  // ===== Event Handlers =====
  const handleTriggerClick = useCallback(() => {
    log('Trigger clicked');
    fetchSuggestions(date, mealType);
  }, [fetchSuggestions, date, mealType, log]);

  const handleRefresh = useCallback(() => {
    log('Manual refresh requested');
    fetchSuggestions(date, mealType);
  }, [fetchSuggestions, date, mealType, log]);

  const handleOpenChange = useCallback((open: boolean) => {
    log(`Open state changing to: ${open}`);
    if (!open) {
      clearSuggestions();
    }
    setIsOpen(open);
  }, [clearSuggestions, log]);

  const handlePantrySuggestionSelect = useCallback(() => {
    if (!pantrySuggestion) return;
    
    log('Pantry suggestion selected', { id: pantrySuggestion.id, title: pantrySuggestion.title });
    // Asegurar formato correcto antes de enviarlo
    onSuggestionSelect(ensureSuggestion(pantrySuggestion));
  }, [pantrySuggestion, onSuggestionSelect, log, ensureSuggestion]);

  const handleDiscoverySuggestionSelect = useCallback(async () => {
    if (!discoverySuggestion) return;
    
    log('Discovery suggestion selected', { id: discoverySuggestion.id, title: discoverySuggestion.title });
    
    if (!discoverySuggestion.id) {
      onSuggestionSelect(ensureSuggestion(discoverySuggestion));
      return;
    }

    // Buscar la receta en el estado actual
    const recipe = recipes.find(r => r.id === discoverySuggestion.id);
    if (!recipe) {
      log('Recipe not found in store, selecting anyway');
      onSuggestionSelect(ensureSuggestion(discoverySuggestion));
      return;
    }

    // Buscar ingredientes faltantes
    const missingIngredients = findMissingIngredients(recipe, pantryItems);
    log(`Found ${missingIngredients.length} missing ingredients`);
    
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
            const shoppingItems = prepareMissingIngredientsForShoppingList(missingIngredients);
            // Filtrar items sin nombre antes de añadir
            const validShoppingItems = shoppingItems.filter(item => item.name && item.name.trim() !== '');
            
            if (validShoppingItems.length === 0) {
              log('No valid missing ingredients found');
              return "No se añadieron ingredientes válidos a la lista";
            }
            
            let added = 0;
            for (const item of validShoppingItems) {
              try {
                // Convertir tipos según las expectativas de la interfaz DB
                const shoppingItem = {
                  ingredient_name: item.name || '',
                  quantity: typeof item.quantity === 'number' ? item.quantity : null,
                  unit: item.unit || null,
                  category_id: item.categoryId ? String(item.categoryId) : null,
                  notes: item.notes || null,
                  is_purchased: false
                };
                
                if (addItem && await addItem(shoppingItem)) {
                  added++;
                }
              } catch (error) {
                log('Error adding item to shopping list', error);
              }
            }
            
            if (added > 0) {
              log(`Added ${added} ingredients to shopping list`);
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

    onSuggestionSelect(ensureSuggestion(discoverySuggestion));
  }, [discoverySuggestion, recipes, pantryItems, addItem, onSuggestionSelect, log, ensureSuggestion]);

  // ===== Effects =====
  // Combinar efectos para minimizar actualización y subscripciones
  useEffect(() => {
    // Solo ejecutar si el popover está abierto
    if (!isOpen) return;
    
    log(`Fetching suggestions for ${mealType} on ${date}`);
    fetchSuggestions(date, mealType);
    
    // Debounce para actualizaciones de despensa
    let debounceTimer: NodeJS.Timeout | null = null;
    
    // Subscribirse a cambios en pantryStore
    const unsubscribe = usePantryStore.subscribe((state, prevState) => {
      if (state.items !== prevState.items) {
        log('Pantry items changed while popover is open');
        
        // Cancelar timer anterior si existe
        if (debounceTimer) clearTimeout(debounceTimer);
        
        // Configurar nuevo timer para actualizar sugerencias
        debounceTimer = setTimeout(() => {
          log('Debounce timer triggered, refreshing suggestions');
          fetchSuggestions(date, mealType);
        }, 500);
      }
    });
    
    // Cleanup
    return () => {
      log('Cleaning up effect and subscriptions');
      unsubscribe();
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [isOpen, date, mealType, fetchSuggestions, log]);

  // Log para debug en cada renderizado
  useEffect(() => {
    renderCountRef.current += 1;
    log('Component rendered', {
      renderCount: renderCountRef.current,
      isOpen,
      isLoadingSuggestions,
      hasPantrySuggestion: !!pantrySuggestion,
      hasDiscoverySuggestion: !!discoverySuggestion
    });
  }, [log, isOpen, isLoadingSuggestions, pantrySuggestion, discoverySuggestion]);

  // ===== Componentes memoizados =====
  const dialogTrigger = useMemo(() => (
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
  ), [isLoadingSuggestions, handleTriggerClick]);

  const dialogContent = useMemo(() => (
    <DialogContent
      className="sm:max-w-[425px] p-4 bg-white/10 dark:bg-black/10 backdrop-blur-lg border border-white/20 rounded-lg shadow-xl"
      onInteractOutside={(e) => e.preventDefault()}
      aria-describedby="suggestions-description"
    >
      <div className="flex items-center justify-between mb-4">
        <DialogTitle className="flex items-center gap-2">
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
      ) : hasSuggestions ? (
        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
          {pantrySuggestion && (
            <SuggestionItem
              suggestion={pantrySuggestion}
              icon={Home}
              label="Cocina con lo que tenés"
              colorClass="emerald"
              onClick={handlePantrySuggestionSelect}
            />
          )}

          {discoverySuggestion && (
            <SuggestionItem
              suggestion={discoverySuggestion}
              icon={Lightbulb}
              label="Prueba Algo Nuevo"
              colorClass="purple"
              onClick={handleDiscoverySuggestionSelect}
            />
          )}
        </div>
      ) : (
        <div className="py-8 text-center text-muted-foreground">
          No hay sugerencias disponibles en este momento.
          <div className="mt-2">
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              Buscar ideas
            </Button>
          </div>
        </div>
      )}
    </DialogContent>
  ), [
    mealType,
    isLoadingSuggestions,
    hasSuggestions,
    pantrySuggestion,
    discoverySuggestion,
    handleRefresh,
    handlePantrySuggestionSelect,
    handleDiscoverySuggestionSelect
  ]);

  // ===== Render =====
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {dialogTrigger}
      {dialogContent}
    </Dialog>
  );
});
