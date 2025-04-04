import { create } from 'zustand';
import { addDays, format, startOfWeek, endOfWeek } from 'date-fns';
import {
  PlannedMeal,
  UpsertPlannedMealData,
  MealType,
  PlanningTemplate
} from '@/features/planning/types';
import { Suggestion } from '@/features/suggestions/types';
import { getSuggestions } from '@/features/suggestions/suggestionService';
import * as planningService from '@/features/planning/planningService';
import * as planningTemplateService from '@/features/planning/planningTemplateService';
import * as recipeService from '@/features/recipes/services/recipeService';
import type { RecipeInputData } from '@/features/recipes/services/recipeService';
import { supabase } from '@/lib/supabaseClient';
import { generateRecipesFromPantry, generateRecipeForSlot } from '@/features/recipes/generationService';
import { getUserProfile } from '@/features/user/userService';
import { toast } from 'sonner';
import { getDay } from 'date-fns';

// Helper function para obtener el intervalo de la semana
const getWeekInterval = (date: Date) => {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return { start, end };
};

interface AutocompleteConfig {
  selectedDays: string[];
  selectedMealTypes: MealType[];
  usePreferences: boolean;
}

interface PlanningState {
  // Estado para sugerencias
  currentSuggestions: Suggestion[] | null;
  isLoadingSuggestions: boolean;
  plannedMeals: PlannedMeal[];
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
  handleAutocompleteWeek: (config: AutocompleteConfig) => Promise<void>;
  // Acciones de plantillas
  fetchTemplates: () => Promise<void>;
  saveCurrentWeekAsTemplate: (name: string) => Promise<void>;
  applyTemplateToCurrentWeek: (templateId: string, startDate: string) => Promise<void>;
  deleteTemplate: (templateId: string) => Promise<void>;
  clearWeek: (startDate: string, endDate: string) => Promise<void>; // Nueva acción
}

export const usePlanningStore = create<PlanningState>((set, get) => ({
  // Estado inicial
  plannedMeals: [],
  isLoading: false,
  currentSuggestions: null,
  isLoadingSuggestions: false,
  error: null,
  copiedMeal: null,
  copiedDayMeals: null,
  isAutocompleting: false,
  // Control de rango de fechas activo
  currentStartDate: null,
  currentEndDate: null,
  // Estado inicial para plantillas
  templates: [],
  isLoadingTemplates: false,
  templateError: null,

  loadPlannedMeals: async (startDate: string, endDate: string) => {
    // Solo cargar si las fechas son diferentes a las actuales
    const { currentStartDate, currentEndDate } = get();
    if (startDate === currentStartDate && endDate === currentEndDate) {
      console.log('[PlanningStore] Skipping reload - same date range');
      return;
    }

    set({ isLoading: true, error: null, currentStartDate: startDate, currentEndDate: endDate });
    try {
      console.log(`[PlanningStore] Loading meals for range: ${startDate} to ${endDate}`);
      const meals = await planningService.getPlannedMeals(startDate, endDate);
      console.log(`[PlanningStore] Loaded meals:`, meals);

      set((state) => ({
        plannedMeals: meals,
        isLoading: false
      }));

      console.log(`[PlanningStore] Store updated with ${meals.length} meals`);
    } catch (error) {
      console.error('Error loading planned meals:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load planned meals';
      set({ error: errorMessage, isLoading: false });
    }
  },

  addPlannedMeal: async (mealData) => {
    set({ isLoading: true, error: null });
    try {
      const newMeal = await planningService.upsertPlannedMeal(mealData);
      if (newMeal) {
        // Recargar las comidas para el rango actual en lugar de concatenar
        const { start: weekStart, end: weekEnd } = getWeekInterval(new Date());
        const weekStartStr = format(weekStart, 'yyyy-MM-dd');
        const weekEndStr = format(weekEnd, 'yyyy-MM-dd');
        
        // Cargar las comidas actualizadas del rango
        const meals = await planningService.getPlannedMeals(weekStartStr, weekEndStr);
        console.log(`[PlanningStore] Recargando comidas después de añadir nueva para la semana: ${weekStartStr} - ${weekEndStr}`);
        
        set({
          plannedMeals: meals,
          isLoading: false
        });
      } else {
        set({ isLoading: false });
      }
      return newMeal;
    } catch (error) {
      console.error('Error adding planned meal:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add planned meal';
      set({ error: errorMessage, isLoading: false });
      return null;
    }
  },

  updatePlannedMeal: async (mealId, mealData) => {
    set({ isLoading: true, error: null });
    try {
      const updatedMeal = await planningService.upsertPlannedMeal(mealData, mealId);
      if (updatedMeal) {
        set((state) => ({
          plannedMeals: state.plannedMeals.map((meal) =>
            meal.id === updatedMeal.id ? updatedMeal : meal
          ).sort((a, b) =>
            a.plan_date.localeCompare(b.plan_date) || a.meal_type.localeCompare(b.meal_type)
          ),
          isLoading: false,
        }));
      } else {
        set({ isLoading: false });
      }
      return updatedMeal;
    } catch (error) {
      console.error('Error updating planned meal:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update planned meal';
      set({ error: errorMessage, isLoading: false });
      return null;
    }
  },

  deletePlannedMeal: async (mealId) => {
    const originalMeals = get().plannedMeals;
    set((state) => ({
      plannedMeals: state.plannedMeals.filter((meal) => meal.id !== mealId),
      isLoading: true,
      error: null
    }));

    try {
      const success = await planningService.deletePlannedMeal(mealId);
      if (!success) {
        throw new Error("Deletion failed according to service");
      }
      set({ isLoading: false });
    } catch (error) {
      console.error('Error deleting planned meal:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete planned meal';
      set({ plannedMeals: originalMeals, error: errorMessage, isLoading: false });
    }
  },

  setCopiedMeal: (meal) => {
    set({ copiedMeal: meal });
  },

  setCopiedDayMeals: (meals) => {
    set({ copiedDayMeals: meals });
  },

  pasteCopiedMeal: async (date, mealType) => {
    const { copiedMeal } = get();
    if (!copiedMeal) return null;

    const mealData: UpsertPlannedMealData = {
      plan_date: date,
      meal_type: mealType,
      recipe_id: copiedMeal.recipe_id,
      custom_meal_name: copiedMeal.custom_meal_name
    };

    return await get().addPlannedMeal(mealData);
  },

  pasteCopiedDayMeals: async (targetDate) => {
    const { copiedDayMeals } = get();
    if (!copiedDayMeals || copiedDayMeals.length === 0) return [];

    const addedMeals: PlannedMeal[] = [];

    for (const meal of copiedDayMeals) {
      const mealData: UpsertPlannedMealData = {
        plan_date: targetDate,
        meal_type: meal.meal_type,
        recipe_id: meal.recipe_id,
        custom_meal_name: meal.custom_meal_name
      };

      const newMeal = await get().addPlannedMeal(mealData);
      if (newMeal) addedMeals.push(newMeal);
    }

    return addedMeals;
  },

  handleAutocompleteWeek: async (config) => {
    const { selectedDays, selectedMealTypes, usePreferences } = config;

    if (selectedDays.length === 0 || selectedMealTypes.length === 0) {
      toast.error('Selecciona al menos un día y un tipo de comida');
      return;
    }

    if (selectedDays.length > 1) {
      toast.warning('Por ahora solo se autocompletará el primer día seleccionado');
    }

    set({ isAutocompleting: true, error: null });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No se encontró usuario autenticado');
      }

      // Configuración de fechas
      const today = new Date();
      const weekStart = startOfWeek(today);
      const dayMap = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

      // Para cada día seleccionado, generar recetas para todos sus tipos de comida
      let slotsToFill: { date: string; mealType: MealType; dayName: string }[] = [];
      
      // Generar slots solo para el primer día seleccionado
      const dayName = selectedDays[0]; // Tomamos solo el primer día seleccionado
      const dayIndex = dayMap.indexOf(dayName);
      
      if (dayIndex !== -1) {
        const date = format(addDays(weekStart, dayIndex), 'yyyy-MM-dd');
        // Generar slots para todos los tipos de comida de este día
        selectedMealTypes.forEach(mealType => {
          slotsToFill.push({ date, mealType, dayName });
        });
      }

      if (slotsToFill.length === 0) {
        toast.warning("No se encontraron slots válidos para autocompletar.");
        set({ isAutocompleting: false });
        return;
      }

      console.log(`[PlanningStore] Slots a llenar calculados (${slotsToFill.length}):`, JSON.stringify(slotsToFill, null, 2));

      let userPreferences;
      if (usePreferences) {
        try {
          userPreferences = await getUserProfile(user.id);
        } catch (error) {
          console.warn('No se pudieron obtener las preferencias del usuario:', error);
          toast.warning('No se pudieron cargar las preferencias del usuario');
        }
      }

      // Generar una receta para cada slot individualmente, considerando el tipo de comida
      const generationPromises = slotsToFill.map(async (slot) => {
        const context = `Receta para ${slot.dayName} - ${slot.mealType}`;
        console.log(`[PlanningStore] Generando receta para slot: ${context}`);
        
        // Usar la nueva función específica para el slot
        const recipeOrError = await generateRecipeForSlot(user.id, slot.mealType, context);

        if ('error' in recipeOrError) {
          console.error(`Error generando receta para ${slot.date} ${slot.mealType}: ${recipeOrError.error}`);
          toast.error(`Error generando receta para ${slot.dayName} ${slot.mealType}: ${recipeOrError.error}`);
          return { slot, recipeData: null }; // Marcar como fallido
        } else {
          return { slot, recipeData: recipeOrError }; // Devolver la receta generada
        }
      });

      const generationResults = await Promise.all(generationPromises);

      const addedMeals: PlannedMeal[] = [];
      let successfulGenerations = 0;

      for (const result of generationResults) {
        if (result.recipeData) {
          const { slot, recipeData } = result;
          try {
            // 1. Preparar datos de la receta
            const recipeInputData: RecipeInputData = {
              user_id: user.id,
              title: recipeData.title,
              description: recipeData.description || null,
              prep_time_minutes: recipeData.prepTimeMinutes,
              cook_time_minutes: recipeData.cookTimeMinutes,
              servings: recipeData.servings,
              image_url: null,
              is_favorite: false,
              ingredients: recipeData.ingredients.map(ing => ({
                name: ing.name,
                quantity: ing.quantity,
                unit: ing.unit
              })),
              instructions: recipeData.instructions
            };

            console.log(`[PlanningStore] Guardando receta generada para ${slot.date} ${slot.mealType}:`, recipeInputData.title);
            const savedRecipe = await recipeService.addRecipe(recipeInputData);
            console.log(`[PlanningStore] Receta guardada con ID ${savedRecipe.id} para ${slot.date} ${slot.mealType}`);

            // 2. Crear la comida planificada
            console.log(`[PlanningStore] Guardando comida para slot:`, {
              slot_date: slot.date,
              slot_mealType: slot.mealType,
              recipe_id: savedRecipe.id
            });

            const mealData: UpsertPlannedMealData = {
              plan_date: slot.date,
              meal_type: slot.mealType,
              recipe_id: savedRecipe.id,
              notes: recipeData.description || undefined
            };

            console.log(`[PlanningStore] Datos de comida a guardar:`, mealData);
            const newMeal = await get().addPlannedMeal(mealData);
            if (newMeal) {
              addedMeals.push(newMeal);
              successfulGenerations++;
            }
          } catch (error) {
            console.error(`[PlanningStore] Error al guardar receta/comida para ${slot.date} ${slot.mealType}:`, error);
            toast.error(`Error al guardar receta para ${slot.dayName} ${slot.mealType}: ${(error as Error).message}`);
          }
        }
      }

      if (successfulGenerations > 0) {
        toast.success(`Se añadieron ${successfulGenerations} comidas al plan`);
        if (successfulGenerations < slotsToFill.length) {
          toast.warning(`No se pudieron generar/guardar todas las recetas solicitadas (${successfulGenerations}/${slotsToFill.length})`);
        }
      } else {
        toast.error('No se pudo añadir ninguna comida al plan');
      }

    } catch (error) {
      console.error('Error general en autocompletado:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      set({ error: errorMessage });
      toast.error(`Error al autocompletar: ${errorMessage}`);
    } finally {
      set({ isAutocompleting: false });
    }
  },

  // Acciones para plantillas
  fetchTemplates: async () => {
    set({ isLoadingTemplates: true, templateError: null });
    try {
      const templates = await planningTemplateService.getPlanningTemplates();
      set({ templates, isLoadingTemplates: false });
    } catch (error) {
      console.error('Error al cargar plantillas:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar plantillas';
      set({ templateError: errorMessage, isLoadingTemplates: false });
      toast.error(errorMessage);
    }
  },

  saveCurrentWeekAsTemplate: async (name) => {
    set({ isLoadingTemplates: true, templateError: null });
    try {
      const currentMeals = get().plannedMeals;
      if (currentMeals.length === 0) {
        throw new Error('No hay comidas planificadas para guardar como plantilla');
      }

      const template = await planningTemplateService.savePlanningTemplate({
        name,
        meals: currentMeals
      });

      set(state => ({
        templates: [...state.templates, template],
        isLoadingTemplates: false
      }));

      toast.success('Plantilla guardada con éxito');
    } catch (error) {
      console.error('Error al guardar plantilla:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al guardar plantilla';
      set({ templateError: errorMessage, isLoadingTemplates: false });
      toast.error(errorMessage);
    }
  },

  applyTemplateToCurrentWeek: async (templateId, startDate) => {
    set({ isLoading: true, error: null });
    try {
      const template = await planningTemplateService.loadPlanningTemplate(templateId);
      const adjustedMeals = template.template_data.meals.map(templateMeal => {
        const dayOffset = templateMeal.day_index;
        const mealDate = new Date(startDate);
        mealDate.setDate(mealDate.getDate() + dayOffset);

        const mealData: UpsertPlannedMealData = {
          plan_date: mealDate.toISOString().split('T')[0],
          meal_type: templateMeal.meal_type,
          recipe_id: templateMeal.recipe_id || null,
          custom_meal_name: templateMeal.custom_meal_name || null
        };

        return mealData;
      });

      for (const mealData of adjustedMeals) {
        await get().addPlannedMeal(mealData);
      }

      toast.success('Plantilla aplicada con éxito');
    } catch (error) {
      console.error('Error al aplicar plantilla:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al aplicar plantilla';
      set({ error: errorMessage, isLoading: false });
      toast.error(errorMessage);
    } finally {
      set({ isLoading: false });
    }
  },

  deleteTemplate: async (templateId) => {
    set({ isLoadingTemplates: true, templateError: null });
    try {
      await planningTemplateService.deletePlanningTemplate(templateId);
      set(state => ({
        templates: state.templates.filter(t => t.id !== templateId),
        isLoadingTemplates: false
      }));
      toast.success('Plantilla eliminada con éxito');
    } catch (error) {
      console.error('Error al eliminar plantilla:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al eliminar plantilla';
      set({ templateError: errorMessage, isLoadingTemplates: false });
      toast.error(errorMessage);
    }
  },

  // Acciones para sugerencias
  fetchSuggestions: async (date: string, mealType: MealType) => {
    set({ isLoadingSuggestions: true, currentSuggestions: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // 1. Obtener items de despensa
      const { data: pantryItems } = await supabase
        .from('pantry_items')
        .select(`
          ingredient_id,
          ingredients:ingredients (
            name
          )
        `)
        .eq('user_id', user.id) as {
          data: Array<{
            ingredient_id: string;
            ingredients: { name: string } | null;
          }> | null;
        };

      // 2. Obtener recetas favoritas
      const { data: favoriteRecipes } = await supabase
        .from('recipes')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_favorite', true);

      // 3. Obtener historial simplificado (TODO: implementar tabla de historial)
      const historyMock: Array<{ recipe_id: string; count: number }> = []; // Por ahora vacío hasta implementar historial

      const suggestions = await getSuggestions({
        date,
        mealType,
        userId: user.id,
        currentPantryItems: pantryItems?.map(item => ({
          ingredient_id: item.ingredient_id,
          name: item.ingredients?.name ?? 'Ingrediente sin nombre'
        })) || [],
        favoriteRecipeIds: favoriteRecipes?.map(r => r.id) || [],
        planningHistory: historyMock
      });

      set({ currentSuggestions: suggestions, isLoadingSuggestions: false });
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al obtener sugerencias';
      toast.error(errorMessage);
      set({ isLoadingSuggestions: false, currentSuggestions: null });
    }
  },

  clearSuggestions: () => {
    set({ currentSuggestions: null });
  },

  clearWeek: async (startDate: string, endDate: string) => {
   set({ isLoading: true, error: null });
   try {
     await planningService.deletePlannedMealsInRange(startDate, endDate);
     // Recargar las comidas de la semana actual para reflejar los cambios
     await get().loadPlannedMeals(startDate, endDate);
     toast.success("Semana limpiada con éxito");
   } catch (error) {
     console.error('Error clearing week:', error);
     const errorMessage = error instanceof Error ? error.message : 'Error al limpiar la semana';
     set({ error: errorMessage, isLoading: false });
     toast.error(errorMessage);
   } finally {
     set({ isLoading: false }); // Asegurar que isLoading se ponga en false
   }
 }

}));