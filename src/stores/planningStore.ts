import { create } from 'zustand';
import { addDays, format, startOfWeek, endOfWeek, getDay, eachDayOfInterval } from 'date-fns';
import {
  PlannedMeal,
  UpsertPlannedMealData,
  MealType,
  PlanningTemplate
} from '@/features/planning/types';
import { RecipeSuggestion, SuggestionResponse, SuggestionRequest } from '@/features/suggestions/types';
import { getSuggestions } from '@/features/suggestions/suggestionService';
import * as planningService from '@/features/planning/planningService';
import * as planningTemplateService from '@/features/planning/planningTemplateService';
import { usePantryStore } from './pantryStore';
import { useRecipeStore } from './recipeStore';
import * as recipeService from '@/features/recipes/services/recipeService';
import type { RecipeInputData } from '@/features/recipes/services/recipeService';
import { supabase } from '@/lib/supabaseClient';
import {
  generateRecipeForSlot,
  type BaseStrategy,
  type PreviousRecipeContext
} from '@/features/recipes/generationService';
import { getUserProfile } from '@/features/user/userService';
import { toast } from 'sonner';
import type { PantryItem } from '@/features/pantry/types';
import type { RecipeIngredient, Recipe } from '@/types/recipeTypes'; // Asegurar que Recipe esté importado

// Helper function para obtener el intervalo de la semana
const getWeekInterval = (date: Date) => {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return { start, end };
};

// Unify AutocompleteMode type based on Dialog component
export type AutocompleteMode = 'optimize-pantry' | 'flexible-suggestions';

// Importar AutocompleteConfig desde el diálogo para usarla en la firma
import type { AutocompleteConfig } from '@/features/planning/components/AutocompleteConfigDialog';

// --- Tipo para Lista de Compras ---
export interface ShoppingListItem {
  name: string;
  neededQuantity: number | null; // Cantidad total necesaria para el plan
  neededUnit: string | null;     // Unidad necesaria
  pantryQuantity: number | null; // Cantidad disponible en despensa (misma unidad si es posible)
  pantryUnit: string | null;     // Unidad en despensa
  missingQuantity: number | null;// Cantidad a comprar
  missingUnit: string | null;    // Unidad a comprar (puede ser la neededUnit)
  sourceRecipes: string[];       // Títulos de recetas que usan este ingrediente
}
// --- Fin Tipo Lista de Compras ---

// Tipo extendido para PlannedMeal que incluye la receta completa (si existe)
type PlannedMealWithRecipe = PlannedMeal & {
    recipes?: Recipe | null; // Asume que 'recipes' es la relación cargada
};


interface PlanningState {
  // Estado para sugerencias
  suggestions: RecipeSuggestion[];
  isLoadingSuggestions: boolean;
  pantrySuggestion?: RecipeSuggestion;
  discoverySuggestion?: RecipeSuggestion;
  // --- Estado para Lista de Compras ---
  shoppingList: ShoppingListItem[];
  isCalculatingShoppingList: boolean;
  // --- Fin Estado Lista de Compras ---
  // Estado general
  plannedMeals: PlannedMealWithRecipe[]; // Usar el tipo extendido
  isLoading: boolean;
  error: string | null;
  copiedMeal: PlannedMeal | null;
  copiedDayMeals: PlannedMeal[] | null;
  isAutocompleting: boolean;
  // Control de rango de fechas activo
  currentStartDate: string | null;
  currentEndDate: string | null;
  // Estado para plantillas
  templates: PlanningTemplate[];
  isLoadingTemplates: boolean;
  templateError: string | null;

  // Acciones para sugerencias
  fetchSuggestions: (date: string, mealType: MealType) => Promise<void>;
  clearSuggestions: () => void;
  // --- Acciones Lista de Compras ---
  calculateShoppingListForWeek: (startDate: string, endDate: string) => Promise<void>;
  clearShoppingList: () => void;
  // --- Fin Acciones Lista de Compras ---
  // Acciones
  loadPlannedMeals: (startDate: string, endDate: string) => Promise<void>;
  addPlannedMeal: (mealData: UpsertPlannedMealData) => Promise<PlannedMeal | null>;
  updatePlannedMeal: (mealId: string, mealData: UpsertPlannedMealData) => Promise<PlannedMeal | null>;
  deletePlannedMeal: (mealId: string) => Promise<void>;
  // Acciones para copiar/pegar
  setCopiedMeal: (meal: PlannedMeal | null) => void;
  setCopiedDayMeals: (meals: PlannedMeal[] | null) => void;
  pasteCopiedMeal: (date: string, mealType: MealType) => Promise<PlannedMeal | null>;
  pasteCopiedDayMeals: (targetDate: string) => Promise<PlannedMeal[]>;
  // Autocompletado
  handleAutocompleteWeek: (startDate: string, endDate: string, config: AutocompleteConfig) => Promise<void>;
  // Acciones de plantillas
  fetchTemplates: () => Promise<void>;
  saveCurrentWeekAsTemplate: (name: string) => Promise<void>;
  applyTemplateToCurrentWeek: (templateId: string, startDate: string) => Promise<void>;
  deleteTemplate: (templateId: string) => Promise<void>;
  clearWeek: (startDate: string, endDate: string) => Promise<void>;
}

export const usePlanningStore = create<PlanningState>((set, get) => ({
  // Estado inicial
  plannedMeals: [],
  isLoading: false,
  suggestions: [],
  isLoadingSuggestions: false,
  shoppingList: [],
  isCalculatingShoppingList: false,
  error: null,
  copiedMeal: null,
  copiedDayMeals: null,
  isAutocompleting: false,
  currentStartDate: null,
  currentEndDate: null,
  templates: [],
  isLoadingTemplates: false,
  templateError: null,

  loadPlannedMeals: async (startDate: string, endDate: string) => {
    const { currentStartDate, currentEndDate } = get();
    // if (startDate === currentStartDate && endDate === currentEndDate) {
    //   return;
    // }
    set({ isLoading: true, error: null, currentStartDate: startDate, currentEndDate: endDate });
    try {
      const meals = await planningService.getPlannedMeals(startDate, endDate);
      set({
        plannedMeals: meals as PlannedMealWithRecipe[],
        isLoading: false
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load planned meals';
      set({ error: errorMessage, isLoading: false });
    }
  },

  addPlannedMeal: async (mealData: UpsertPlannedMealData) => {
    try {
      const newMeal = await planningService.upsertPlannedMeal(mealData);
      if (newMeal) {
        set((state) => ({
          plannedMeals: [...state.plannedMeals, newMeal as PlannedMealWithRecipe].sort((a, b) =>
             a.plan_date.localeCompare(b.plan_date) || a.meal_type.localeCompare(b.meal_type)
           ),
        }));
      }
      return newMeal;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add planned meal';
      set({ error: errorMessage });
      return null;
    }
  },

  updatePlannedMeal: async (mealId: string, mealData: UpsertPlannedMealData) => {
    try {
      const updatedMeal = await planningService.upsertPlannedMeal(mealData, mealId);
      if (updatedMeal) {
        set((state) => ({
          plannedMeals: state.plannedMeals.map((meal) =>
            meal.id === updatedMeal.id ? (updatedMeal as PlannedMealWithRecipe) : meal
          ).sort((a, b) =>
            a.plan_date.localeCompare(b.plan_date) || a.meal_type.localeCompare(b.meal_type)
          ),
        }));
      }
      return updatedMeal;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update planned meal';
      set({ error: errorMessage });
      return null;
    }
  },

  deletePlannedMeal: async (mealId: string) => {
    const originalMeals = get().plannedMeals;
    set((state) => ({
      plannedMeals: state.plannedMeals.filter((meal) => meal.id !== mealId),
      error: null
    }));
    try {
      const success = await planningService.deletePlannedMeal(mealId);
      if (!success) throw new Error("Deletion failed according to service");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete planned meal';
      set({ plannedMeals: originalMeals, error: errorMessage });
    }
  },

  setCopiedMeal: (meal: PlannedMeal | null) => set({ copiedMeal: meal }),
  setCopiedDayMeals: (meals: PlannedMeal[] | null) => set({ copiedDayMeals: meals }),

  pasteCopiedMeal: async (date: string, mealType: MealType) => {
    const { copiedMeal } = get();
    if (!copiedMeal) return null;
    const mealData: UpsertPlannedMealData = {
      plan_date: date, meal_type: mealType, recipe_id: copiedMeal.recipe_id,
      custom_meal_name: copiedMeal.custom_meal_name, notes: copiedMeal.notes
    };
    return await get().addPlannedMeal(mealData);
  },

  pasteCopiedDayMeals: async (targetDate: string) => {
    const { copiedDayMeals } = get();
    if (!copiedDayMeals || copiedDayMeals.length === 0) return [];
    const addPromises = copiedDayMeals.map(meal => {
      const mealData: UpsertPlannedMealData = {
        plan_date: targetDate, meal_type: meal.meal_type, recipe_id: meal.recipe_id,
        custom_meal_name: meal.custom_meal_name, notes: meal.notes
      };
      return get().addPlannedMeal(mealData);
    });
    const results = await Promise.all(addPromises);
    return results.filter((meal): meal is PlannedMeal => meal !== null);
  },

  handleAutocompleteWeek: async (startDate: string, endDate: string, config: AutocompleteConfig) => {
    set({ isAutocompleting: true, error: null });
    console.log(`[PlanningStore] Starting autocomplete for ${startDate} - ${endDate} with config:`, config);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No se encontró usuario autenticado');

      const dayMap = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const start = new Date(startDate + 'T00:00:00');
      const end = new Date(endDate + 'T00:00:00');
      const weekDays = eachDayOfInterval({ start, end });
      const existingMeals = get().plannedMeals;

      let slotsToFill: { date: string; mealType: MealType; dayName: string }[] = [];
      weekDays.forEach(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const dayIndex = getDay(day);
        const dayName = dayMap[dayIndex];
        if (!config.days.includes(dayName)) return;
        config.meals.forEach(mealType => {
           const mealExists = existingMeals.some(m => m.plan_date === dateStr && m.meal_type === mealType);
           if (!mealExists) slotsToFill.push({ date: dateStr, mealType, dayName });
        });
      });

      if (slotsToFill.length === 0) {
        toast.info("No hay slots para autocompletar.");
        set({ isAutocompleting: false }); return;
      }

      let userPreferences;
      try { userPreferences = await getUserProfile(user.id); } catch (e) { console.warn('Could not load user preferences'); }

      // Extraer contexto previo de recetas existentes
      // Extraer y validar el contexto previo
      const previousContext: PreviousRecipeContext[] = existingMeals
        .filter(meal => {
          const recipeInfo = meal.recipes;
          const validMealTypes: MealType[] = ['Desayuno', 'Almuerzo', 'Cena', 'Merienda'];
          // Verificar que tenga receta y tipo de comida válido
          return meal.meal_type &&
                 validMealTypes.includes(meal.meal_type as MealType) &&
                 recipeInfo?.title &&
                 Array.isArray(recipeInfo?.main_ingredients) && // Usar snake_case para DB
                 recipeInfo.main_ingredients.length > 0;
        })
        .map(meal => {
          const recipeInfo = meal.recipes!;
          const context: PreviousRecipeContext = {
            title: recipeInfo.title,
            mealType: meal.meal_type as MealType,
            mainIngredients: recipeInfo.main_ingredients ?? undefined, // Convertir null a undefined
            recipeId: recipeInfo.id // Añadir recipeId para evitar duplicados exactos
          };
          return context;
        });

      // Logging mejorado para depuración
      const recipeNames = previousContext.map(ctx => ctx.title).join(', ');
      const allIngredients = previousContext.flatMap(ctx => ctx.mainIngredients || []);
      
      console.log("[PlanningStore] Recetas previas:", recipeNames);
      console.log("[PlanningStore] Ingredientes principales encontrados:", allIngredients);

      const ingredientsToAvoid = previousContext
        .flatMap(recipe => recipe.mainIngredients || [])
        .filter(Boolean);

      console.log("[PlanningStore] Previous context:", previousContext);
      console.log("[PlanningStore] Ingredients to avoid:", ingredientsToAvoid);

      const generationPromises = slotsToFill.map(async (slot) => {
        const context = `Receta para ${slot.dayName} - ${slot.mealType}`;
        const baseStrategy: BaseStrategy = config.mode === 'optimize-pantry' ? 'foco-despensa' : 'creacion-equilibrada';
        const recipeOrError = await generateRecipeForSlot(
          user.id, slot.mealType, context, baseStrategy,
          config.styleModifier ?? null, config.cocinaEspecificaValue ?? undefined, previousContext
        );
        if ('error' in recipeOrError) {
          console.error(`Error generating for ${slot.date} ${slot.mealType}: ${recipeOrError.error}`);
          toast.error(`Error generando para ${slot.dayName} ${slot.mealType}`);
          return { slot, recipeData: null };
        }
        return { slot, recipeData: recipeOrError };
      });

      const generationResults = await Promise.all(generationPromises);
      let successfulGenerations = 0;
      const savePromises = generationResults.map(result => {
        if (result.recipeData) {
          const { slot, recipeData } = result;
          return (async () => {
            try {
              const recipeInput: RecipeInputData = {
                user_id: user.id, title: recipeData.title, description: recipeData.description,
                prep_time_minutes: recipeData.prepTimeMinutes, cook_time_minutes: recipeData.cookTimeMinutes,
                servings: recipeData.servings, image_url: null, is_favorite: false, isBaseRecipe: true,
                ingredients: recipeData.ingredients, instructions: recipeData.instructions,
                mainIngredients: recipeData.mainIngredients
              };
              const savedRecipe = await recipeService.addRecipe(recipeInput);
              const mealData: UpsertPlannedMealData = {
                plan_date: slot.date, meal_type: slot.mealType, recipe_id: savedRecipe.id,
                notes: recipeData.description || undefined
              };
              const newMeal = await get().addPlannedMeal(mealData);
              if (newMeal) successfulGenerations++;
            } catch (e) {
              console.error(`Error saving recipe/meal for ${slot.date} ${slot.mealType}:`, e);
              toast.error(`Error al guardar receta para ${slot.dayName} ${slot.mealType}`);
            }
          })();
        }
        return Promise.resolve();
      });

      await Promise.all(savePromises);

      if (successfulGenerations > 0) toast.success(`Se añadieron ${successfulGenerations} comidas.`);
      if (successfulGenerations < slotsToFill.length) toast.warning(`No se pudieron generar/guardar todas las recetas.`);
      if (successfulGenerations === 0 && slotsToFill.length > 0) toast.error(`No se pudo añadir ninguna comida.`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      set({ error: errorMessage });
      toast.error(`Error al autocompletar: ${errorMessage}`);
    } finally {
      set({ isAutocompleting: false });
    }
  },

  fetchTemplates: async () => {
    set({ isLoadingTemplates: true, templateError: null });
    try {
      const templates = await planningTemplateService.getPlanningTemplates();
      set({ templates, isLoadingTemplates: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar plantillas';
      set({ templateError: errorMessage, isLoadingTemplates: false });
      toast.error(errorMessage);
    }
  },

  saveCurrentWeekAsTemplate: async (name: string) => {
    set({ isLoadingTemplates: true, templateError: null });
    try {
      const { currentStartDate, currentEndDate, plannedMeals } = get();
      if (!currentStartDate || !currentEndDate) throw new Error('Rango de fechas no definido');
      const mealsForTemplate = plannedMeals.filter(m => m.plan_date >= currentStartDate && m.plan_date <= currentEndDate);
      if (mealsForTemplate.length === 0) throw new Error('No hay comidas para guardar');
      const template = await planningTemplateService.savePlanningTemplate({ name, meals: mealsForTemplate });
      set(state => ({ templates: [...state.templates, template], isLoadingTemplates: false }));
      toast.success('Plantilla guardada');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al guardar plantilla';
      set({ templateError: errorMessage, isLoadingTemplates: false });
      toast.error(errorMessage);
    }
  },

  applyTemplateToCurrentWeek: async (templateId: string, startDate: string) => {
    set({ isLoading: true, error: null });
    try {
      const template = await planningTemplateService.loadPlanningTemplate(templateId);
      const addPromises = template.template_data.meals.map(templateMeal => {
        const dayOffset = templateMeal.day_index;
        const mealDate = new Date(startDate + 'T00:00:00');
        mealDate.setDate(mealDate.getDate() + dayOffset);
        const mealData: UpsertPlannedMealData = {
          plan_date: format(mealDate, 'yyyy-MM-dd'), meal_type: templateMeal.meal_type,
          recipe_id: templateMeal.recipe_id || null, custom_meal_name: templateMeal.custom_meal_name || null,
          notes: templateMeal.notes || null
        };
        return get().addPlannedMeal(mealData);
      });
      await Promise.all(addPromises);
      toast.success('Plantilla aplicada');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al aplicar plantilla';
      set({ error: errorMessage });
      toast.error(errorMessage);
    } finally {
      set({ isLoading: false });
    }
  },

  deleteTemplate: async (templateId: string) => {
    set({ isLoadingTemplates: true, templateError: null });
    const originalTemplates = get().templates;
    set(state => ({ templates: state.templates.filter(t => t.id !== templateId) }));
    try {
      await planningTemplateService.deletePlanningTemplate(templateId);
      toast.success('Plantilla eliminada');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al eliminar plantilla';
      set({ templates: originalTemplates, templateError: errorMessage });
      toast.error(errorMessage);
    } finally {
      set({ isLoadingTemplates: false });
    }
  },

  fetchSuggestions: async (date: string, mealType: MealType) => {
    set({ isLoadingSuggestions: true, pantrySuggestion: null, discoverySuggestion: null, error: null });
    console.log(`[PlanningStore] Fetching suggestions for ${mealType} on ${date}`);
    
    try {
      const pantryItems = usePantryStore.getState().items;
      console.log(`[PlanningStore] Found ${pantryItems.length} pantry items`);
      
      // Crear el contexto para el servicio de sugerencias
      const context: SuggestionRequest = {
        pantryItems: pantryItems
          .filter(item => item.ingredient?.name) // Filtrar elementos sin nombre
          .map(item => ({
            name: item.ingredient?.name || '',
            quantity: item.quantity ?? 0,
            unit: item.unit ?? undefined
          })),
        mealType: mealType
      };
      
      // Llamar al servicio de sugerencias
      console.log(`[PlanningStore] Calling suggestions service with context:`, JSON.stringify(context, null, 2));
      const response = await getSuggestions(context);
      console.log(`[PlanningStore] Received ${response.suggestions.length} suggestions:`, response.suggestions);
      
      // Preprocesar las sugerencias para garantizar que tengan todas las propiedades necesarias
      const processedSuggestions = response.suggestions.map(suggestion => {
        return {
          ...suggestion,
          id: suggestion.id || String(Date.now()),
          title: suggestion.title || suggestion.name || 'Sugerencia sin título',
          name: suggestion.name || suggestion.title || 'Sugerencia sin título',
          reason: suggestion.reason || 'Sugerencia basada en tus preferencias'
        };
      });
      
      // Buscar sugerencias específicas o usar las primeras disponibles
      let pantrySuggestion = processedSuggestions.find(s => 
        s.reason?.includes('despensa') || s.reason?.includes('recomendada'));
        
      let discoverySuggestion = processedSuggestions.find(s => 
        s.reason?.includes('diferente') || s.reason?.includes('respaldo') || s.reason?.includes('nueva'));
      
      // Garantizar que siempre haya sugerencias disponibles
      if (!pantrySuggestion && processedSuggestions.length > 0) {
        pantrySuggestion = processedSuggestions[0];
        pantrySuggestion.reason = 'Recomendada para usar ingredientes disponibles';
      }
      
      if (!discoverySuggestion && processedSuggestions.length > 1) {
        discoverySuggestion = processedSuggestions[1];
        discoverySuggestion.reason = 'Sugerencia alternativa para probar algo diferente';
      } else if (!discoverySuggestion && processedSuggestions.length === 1) {
        // Clonar la sugerencia para evitar efectos secundarios
        discoverySuggestion = { ...processedSuggestions[0], id: `${processedSuggestions[0].id}-alt` };
        discoverySuggestion.reason = 'Única sugerencia disponible';
      }
      
      // Si no hay sugerencias, crear sugerencias de fallback
      if (!pantrySuggestion || !discoverySuggestion) {
        console.warn('[PlanningStore] No se encontraron sugerencias válidas, creando fallbacks');
        
        // Crear sugerencias de fallback
        const fallbackSuggestion1 = {
          id: 'fallback-1',
          title: 'Sugerencia por defecto',
          name: 'Sugerencia por defecto',
          description: 'Prueba una receta simple basada en tus preferencias',
          reason: 'Recomendación por defecto'
        };
        
        const fallbackSuggestion2 = {
          id: 'fallback-2',
          title: 'Otra sugerencia',
          name: 'Otra sugerencia',
          description: 'Prueba algo diferente para variar tu menú',
          reason: 'Alternativa por defecto'
        };
        
        // Asignar fallbacks si es necesario
        if (!pantrySuggestion) pantrySuggestion = fallbackSuggestion1;
        if (!discoverySuggestion) discoverySuggestion = fallbackSuggestion2;
        
        // Añadir a las sugerencias procesadas si estaban vacías
        if (processedSuggestions.length === 0) {
          processedSuggestions.push(fallbackSuggestion1, fallbackSuggestion2);
        }
      }
      
      console.log(`[PlanningStore] Final suggestions:`, {
        pantry: pantrySuggestion?.title,
        discovery: discoverySuggestion?.title
      });
      
      // Actualizar el estado con las sugerencias encontradas
      set({
        suggestions: processedSuggestions, 
        pantrySuggestion,
        discoverySuggestion,
        isLoadingSuggestions: false
      });
      
    } catch (error) {
      console.error('[PlanningStore] Error fetching suggestions:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al obtener sugerencias';
      
      // Crear sugerencias de respaldo en caso de error
      const fallbackSuggestion1 = {
        id: 'error-1',
        name: 'Sugerencia de respaldo',
        title: 'Sugerencia de respaldo',
        description: 'Generada cuando ocurrió un error',
        reason: 'Error al obtener sugerencias'
      };
      
      const fallbackSuggestion2 = {
        id: 'error-2',
        name: 'Otra sugerencia',
        title: 'Otra sugerencia',
        description: 'Generada cuando ocurrió un error',
        reason: 'Error al obtener sugerencias'
      };
      
      set({ 
        isLoadingSuggestions: false, 
        error: errorMessage,
        suggestions: [fallbackSuggestion1, fallbackSuggestion2],
        pantrySuggestion: fallbackSuggestion1,
        discoverySuggestion: fallbackSuggestion2
      });
      
      toast.error(`Error al obtener sugerencias: ${errorMessage}`);
    }
  },

  clearSuggestions: () => set({ suggestions: [] }),

  clearWeek: async (startDate: string, endDate: string) => {
    const originalMeals = get().plannedMeals;
    set({ isLoading: true, error: null });
    set((state) => ({
      plannedMeals: state.plannedMeals.filter(meal =>
        meal.plan_date < startDate || meal.plan_date > endDate
      ),
    }));
    try {
      console.log(`[PlanningStore] Clearing week from ${startDate} to ${endDate}`);
      await planningService.deletePlannedMealsInRange(startDate, endDate);
      toast.success("Planificación de la semana eliminada.");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to clear week';
      set({ plannedMeals: originalMeals, error: errorMessage });
      toast.error("Error al limpiar la semana.");
    } finally {
     set({ isLoading: false });
    }
  },

  // --- Implementación Acciones Lista de Compras ---
  calculateShoppingListForWeek: async (startDate: string, endDate: string) => {
    set({ isCalculatingShoppingList: true, shoppingList: [], error: null });
    console.log(`[PlanningStore] Calculating shopping list for ${startDate} - ${endDate}`);

    try {
      // 1. Obtener comidas planificadas para la semana (asegurarse que incluye recetas->ingredientes)
      const plannedMealsForWeek = get().plannedMeals.filter(
        meal => meal.plan_date >= startDate && meal.plan_date <= endDate
      );

      // 2. Agregar todos los ingredientes necesarios de las recetas
      const requiredIngredientsMap: Map<string, { neededQuantity: number | null; neededUnit: string | null; sourceRecipes: Set<string> }> = new Map();

      for (const meal of plannedMealsForWeek) {
        const recipe = meal.recipes; // Usar el tipo PlannedMealWithRecipe
        if (recipe && Array.isArray(recipe.ingredients)) {
          recipe.ingredients.forEach((ing: RecipeIngredient) => {
            const name = ing.ingredient_name?.toLowerCase().trim();
            if (!name) return;

            // Normalizar cantidad (number | null)
            const quantity = typeof ing.quantity === 'number' ? ing.quantity : null;

            // Normalizar unidad (string | null)
            const unit = typeof ing.unit === 'string' ? ing.unit.toLowerCase().trim() || null : null;

            const existing = requiredIngredientsMap.get(name);
            if (existing) {
              // Sumar cantidades si ambas son números y las unidades coinciden (o ambas son null)
              if (typeof existing.neededQuantity === 'number' && typeof quantity === 'number' && existing.neededUnit === unit) {
                 existing.neededQuantity += quantity;
              } else if (quantity !== null) { // Si la nueva cantidad es válida pero no se pudo sumar
                 console.warn(`[ShoppingList] No se sumó cantidad para '${name}' (unidad/null): Existente ${existing.neededQuantity} ${existing.neededUnit}, Nuevo ${quantity} ${unit}`);
              }
              existing.sourceRecipes.add(recipe.title || 'Receta sin título');
            } else {
              requiredIngredientsMap.set(name, {
                neededQuantity: quantity, // Puede ser null
                neededUnit: unit,
                sourceRecipes: new Set([recipe.title || 'Receta sin título'])
              });
            }
          });
        }
      }

      // 3. Obtener estado actual de la despensa
      const pantryItems = usePantryStore.getState().items;
      const pantryStockMap: Map<string, { quantity: number | null; unit: string | null }> = new Map();
      pantryItems.forEach((item: PantryItem) => {
        const name = item.ingredient?.name?.toLowerCase().trim();
        if (name) {
          pantryStockMap.set(name, {
            quantity: item.quantity ?? null,
            unit: item.unit?.toLowerCase().trim() ?? null
          });
        }
      });

      // 4. Comparar necesarios vs. disponibles y generar lista
      const shoppingList: ShoppingListItem[] = [];
      requiredIngredientsMap.forEach((needed, name) => {
        const pantryItem = pantryStockMap.get(name);
        let missingQuantity: number | null = needed.neededQuantity;
        const missingUnit: string | null = needed.neededUnit;

        if (pantryItem && pantryItem.quantity !== null && needed.neededQuantity !== null) {
          if (pantryItem.unit === needed.neededUnit) {
            missingQuantity = Math.max(0, needed.neededQuantity - pantryItem.quantity);
          } else {
            console.warn(`[ShoppingList] Unidades diferentes para '${name}': Necesario ${needed.neededUnit}, Despensa ${pantryItem.unit}. Se añadirá la cantidad total necesaria.`);
            missingQuantity = needed.neededQuantity;
          }
        } else {
           missingQuantity = needed.neededQuantity;
        }

        if (missingQuantity === null || missingQuantity > 0) {
          shoppingList.push({
            name: name,
            neededQuantity: needed.neededQuantity,
            neededUnit: needed.neededUnit,
            pantryQuantity: pantryItem?.quantity ?? null,
            pantryUnit: pantryItem?.unit ?? null,
            missingQuantity: missingQuantity,
            missingUnit: missingUnit,
            sourceRecipes: Array.from(needed.sourceRecipes)
          });
        }
      });

      shoppingList.sort((a, b) => a.name.localeCompare(b.name));

      console.log("[PlanningStore] Shopping list calculated:", shoppingList);
      set({ shoppingList, isCalculatingShoppingList: false });

    } catch (error) {
      console.error('Error calculating shopping list:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to calculate shopping list';
      set({ error: errorMessage, isCalculatingShoppingList: false });
      toast.error("Error al calcular la lista de compras.");
    }
  },

  clearShoppingList: () => {
    set({ shoppingList: [] });
  }
  // --- Fin Implementación Acciones Lista de Compras ---

}));