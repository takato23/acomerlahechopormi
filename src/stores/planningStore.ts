import { create } from 'zustand';
import { addDays, format, startOfWeek, endOfWeek, getDay, eachDayOfInterval } from 'date-fns'; // Added getDay, eachDayOfInterval
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
import { usePantryStore } from './pantryStore'; // Importar pantryStore
import { useRecipeStore } from './recipeStore'; // Importar recipeStore (asumiendo que existe y tiene favoritos)
import * as recipeService from '@/features/recipes/services/recipeService';
import type { RecipeInputData } from '@/features/recipes/services/recipeService';
import { supabase } from '@/lib/supabaseClient';
import { generateRecipeForSlot } from '@/features/recipes/generationService'; // Removed generateRecipesFromPantry for now
import { getUserProfile } from '@/features/user/userService';
import { toast } from 'sonner';
// Removed unused import: getDay from 'date-fns';

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

interface PlanningState {
  // Estado para sugerencias
  pantrySuggestion: Suggestion | null;
  discoverySuggestion: Suggestion | null;
  isLoadingSuggestions: boolean;
  // Estado general
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
  // Autocompletado - Updated signature to accept full config
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
  pantrySuggestion: null,
  discoverySuggestion: null,
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

      set({
        plannedMeals: meals,
        isLoading: false
      });

      console.log(`[PlanningStore] Store updated with ${meals.length} meals`);
    } catch (error) {
      console.error('Error loading planned meals:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load planned meals';
      set({ error: errorMessage, isLoading: false });
    }
  },

  addPlannedMeal: async (mealData: UpsertPlannedMealData) => {
    // No establecer isLoading aquí para evitar parpadeos al añadir/pegar
    // set({ isLoading: true, error: null });
    try {
      const newMeal = await planningService.upsertPlannedMeal(mealData);
      if (newMeal) {
        // Actualizar el estado localmente para respuesta más rápida
        set((state) => ({
          plannedMeals: [...state.plannedMeals, newMeal].sort((a, b) =>
             a.plan_date.localeCompare(b.plan_date) || a.meal_type.localeCompare(b.meal_type)
           ),
          // isLoading: false // No necesario si no se estableció antes
        }));
      } else {
        // set({ isLoading: false }); // No necesario
      }
      return newMeal;
    } catch (error) {
      console.error('Error adding planned meal:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add planned meal';
      set({ error: errorMessage /*, isLoading: false */ });
      return null;
    }
  },

  updatePlannedMeal: async (mealId: string, mealData: UpsertPlannedMealData) => {
    // set({ isLoading: true, error: null }); // Evitar parpadeo
    try {
      const updatedMeal = await planningService.upsertPlannedMeal(mealData, mealId);
      if (updatedMeal) {
        set((state) => ({
          plannedMeals: state.plannedMeals.map((meal) =>
            meal.id === updatedMeal.id ? updatedMeal : meal
          ).sort((a, b) =>
            a.plan_date.localeCompare(b.plan_date) || a.meal_type.localeCompare(b.meal_type)
          ),
          // isLoading: false,
        }));
      } else {
        // set({ isLoading: false });
      }
      return updatedMeal;
    } catch (error) {
      console.error('Error updating planned meal:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update planned meal';
      set({ error: errorMessage /*, isLoading: false */ });
      return null;
    }
  },

  deletePlannedMeal: async (mealId: string) => {
    const originalMeals = get().plannedMeals;
    // Optimistic update
    set((state) => ({
      plannedMeals: state.plannedMeals.filter((meal) => meal.id !== mealId),
      // isLoading: true, // No necesario para borrado optimista
      error: null
    }));

    try {
      const success = await planningService.deletePlannedMeal(mealId);
      if (!success) {
        throw new Error("Deletion failed according to service");
      }
      // set({ isLoading: false }); // No necesario
    } catch (error) {
      console.error('Error deleting planned meal:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete planned meal';
      // Revert optimistic update on error
      set({ plannedMeals: originalMeals, error: errorMessage /*, isLoading: false */ });
    }
  },

  setCopiedMeal: (meal: PlannedMeal | null) => {
    set({ copiedMeal: meal });
  },

  setCopiedDayMeals: (meals: PlannedMeal[] | null) => {
    set({ copiedDayMeals: meals });
  },

  pasteCopiedMeal: async (date: string, mealType: MealType) => {
    const { copiedMeal } = get();
    if (!copiedMeal) return null;

    const mealData: UpsertPlannedMealData = {
      plan_date: date,
      meal_type: mealType,
      recipe_id: copiedMeal.recipe_id,
      custom_meal_name: copiedMeal.custom_meal_name,
      notes: copiedMeal.notes // Copiar también las notas
    };

    return await get().addPlannedMeal(mealData);
  },

  pasteCopiedDayMeals: async (targetDate: string) => {
    const { copiedDayMeals } = get();
    if (!copiedDayMeals || copiedDayMeals.length === 0) return [];

    const addedMeals: PlannedMeal[] = [];
    const addPromises: Promise<PlannedMeal | null>[] = [];

    for (const meal of copiedDayMeals) {
      const mealData: UpsertPlannedMealData = {
        plan_date: targetDate,
        meal_type: meal.meal_type,
        recipe_id: meal.recipe_id,
        custom_meal_name: meal.custom_meal_name,
        notes: meal.notes // Copiar también las notas
      };
      // Lanzar todas las adiciones en paralelo
      addPromises.push(get().addPlannedMeal(mealData));
    }

    const results = await Promise.all(addPromises);
    results.forEach(newMeal => {
      if (newMeal) addedMeals.push(newMeal);
    });

    // No es necesario recargar aquí, addPlannedMeal actualiza el estado localmente
    return addedMeals;
  },

  // --- Autocomplete Logic ---
  handleAutocompleteWeek: async (startDate: string, endDate: string, config: AutocompleteConfig) => {
    set({ isAutocompleting: true, error: null });
    console.log(`[PlanningStore] Starting autocomplete for ${startDate} - ${endDate} with config:`, config);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No se encontró usuario autenticado');
      }

      // 1. Determinar los slots a llenar según la configuración
      const dayMap = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']; // Nombres completos para comparar con config.days
      const start = new Date(startDate + 'T00:00:00');
      const end = new Date(endDate + 'T00:00:00');
      const weekDays = eachDayOfInterval({ start, end });
      const existingMeals = get().plannedMeals; // Obtener comidas existentes para no sobrescribir

      let slotsToFill: { date: string; mealType: MealType; dayName: string }[] = [];
      weekDays.forEach(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const dayIndex = getDay(day); // 0 = Domingo, 1 = Lunes...
        const dayName = dayMap[dayIndex];

        // Filtrar por día seleccionado en la configuración
        if (!config.days.includes(dayName)) {
          return; // Saltar este día si no está seleccionado
        }

        config.meals.forEach(mealType => {
          // Verificar si ya existe una comida para este slot
           const mealExists = existingMeals.some(
             meal => meal.plan_date === dateStr && meal.meal_type === mealType
           );

           if (!mealExists) {
              slotsToFill.push({ date: dateStr, mealType, dayName });
           } else {
              console.log(`[PlanningStore] Skipping existing meal slot: ${dateStr} ${mealType}`);
           }
        });
      });

      if (slotsToFill.length === 0) {
        toast.info("No hay slots para autocompletar en el rango seleccionado.");
        set({ isAutocompleting: false });
        return;
      }
      console.log(`[PlanningStore] Found ${slotsToFill.length} slots to fill.`);

      // 2. Obtener preferencias (opcional, basado en el modo quizás?)
      let userPreferences;
      // Podríamos decidir obtener preferencias solo para ciertos modos si fuera necesario
      try {
        userPreferences = await getUserProfile(user.id);
        console.log("[PlanningStore] User preferences loaded for autocomplete.");
      } catch (error) {
        console.warn('[PlanningStore] Could not load user preferences:', error);
        toast.warning('No se pudieron cargar las preferencias del usuario para el autocompletado.');
        // Continuar sin preferencias si falla
      }

      // 3. Generar recetas para cada slot
      const generationPromises = slotsToFill.map(async (slot) => {
        const context = `Receta para ${slot.dayName} - ${slot.mealType}`;
        console.log(`[PlanningStore] Generating recipe for slot: ${context} (Mode: ${config.mode})`);

        // Pasar el modo al servicio de generación
        // Mapear el modo del store/dialog al modo esperado por el servicio
        const serviceMode = config.mode === 'optimize-pantry' ? 'optimize' : 'flexible';
        const recipeOrError = await generateRecipeForSlot(user.id, slot.mealType, context, serviceMode);

        if ('error' in recipeOrError) {
          console.error(`Error generating recipe for ${slot.date} ${slot.mealType} (Mode ${config.mode}): ${recipeOrError.error}`);
          toast.error(`Error generando para ${slot.dayName} ${slot.mealType}: ${recipeOrError.error.substring(0, 50)}...`);
          return { slot, recipeData: null }; // Marcar como fallido
        } else {
          console.log(`[PlanningStore] Recipe generated successfully for ${slot.date} ${slot.mealType}`);
          return { slot, recipeData: recipeOrError }; // Devolver la receta generada
        }
      });

      const generationResults = await Promise.all(generationPromises);

      // 4. Guardar recetas y comidas planificadas
      const addedMeals: PlannedMeal[] = [];
      let successfulGenerations = 0;
      const savePromises: Promise<void>[] = [];

      for (const result of generationResults) {
        if (result.recipeData) {
          const { slot, recipeData } = result;

          // Lanzar el guardado en paralelo
          savePromises.push((async () => {
            try {
              // 4a. Preparar datos de la receta
              // Marcar como receta base generada por IA
              const recipeInputData: RecipeInputData = {
                user_id: null, // Sin usuario asociado
                title: recipeData.title,
                description: recipeData.description || null,
                prep_time_minutes: recipeData.prepTimeMinutes,
                cook_time_minutes: recipeData.cookTimeMinutes,
                servings: recipeData.servings,
                image_url: null,
                is_favorite: false,
                isBaseRecipe: true, // Marcar como base
                ingredients: recipeData.ingredients.map(ing => ({
                  name: ing.name,
                  quantity: ing.quantity,
                  unit: ing.unit
                })),
                instructions: recipeData.instructions
              };

              console.log(`[PlanningStore] Saving generated recipe: ${recipeInputData.title}`);
              const savedRecipe = await recipeService.addRecipe(recipeInputData);
              console.log(`[PlanningStore] Recipe saved with ID ${savedRecipe.id}`);

              // 4b. Crear la comida planificada
              const mealData: UpsertPlannedMealData = {
                plan_date: slot.date,
                meal_type: slot.mealType,
                recipe_id: savedRecipe.id,
                notes: recipeData.description || undefined // Usar descripción como nota inicial
              };

              console.log(`[PlanningStore] Saving planned meal for recipe ${savedRecipe.id}`);
              const newMeal = await get().addPlannedMeal(mealData); // addPlannedMeal actualiza el estado
              if (newMeal) {
                // No necesitamos añadir a addedMeals aquí si addPlannedMeal actualiza el estado global
                successfulGenerations++;
              } else {
                 console.warn(`[PlanningStore] Failed to save planned meal for recipe ${savedRecipe.id}`);
              }
            } catch (error) {
              console.error(`[PlanningStore] Error saving recipe/meal for ${slot.date} ${slot.mealType} (Mode ${config.mode}):`, error);
              toast.error(`Error al guardar receta para ${slot.dayName} ${slot.mealType}: ${(error as Error).message.substring(0, 50)}...`);
            }
          })());
        }
      }

      // Esperar a que todas las operaciones de guardado terminen
      await Promise.all(savePromises);

      // 5. Mostrar resultados
      if (successfulGenerations > 0) {
        toast.success(`Se añadieron ${successfulGenerations} comidas al plan (Modo: ${config.mode})`);
        if (successfulGenerations < slotsToFill.length) {
          toast.warning(`No se pudieron generar/guardar todas las recetas solicitadas (${successfulGenerations}/${slotsToFill.length})`);
        }
      } else if (slotsToFill.length > 0) { // Solo mostrar error si se intentó llenar slots
        toast.error(`No se pudo añadir ninguna comida nueva al plan (Modo: ${config.mode})`);
      } else {
         toast.info("No había slots vacíos que coincidieran con tu selección para autocompletar.");
      }

      // Recargar las comidas al final para asegurar consistencia,
      // aunque addPlannedMeal ya actualiza el estado. Podría ser redundante.
      // await get().loadPlannedMeals(startDate, endDate);

    } catch (error) {
      console.error('[PlanningStore] General autocomplete error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      set({ error: errorMessage });
      toast.error(`Error al autocompletar (Modo: ${config.mode}): ${errorMessage}`);
    } finally {
      set({ isAutocompleting: false });
      console.log("[PlanningStore] Autocomplete finished.");
    }
  },
  // --- Fin Autocomplete Logic ---

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

  saveCurrentWeekAsTemplate: async (name: string) => {
    set({ isLoadingTemplates: true, templateError: null });
    try {
      const { currentStartDate, currentEndDate, plannedMeals } = get();
      if (!currentStartDate || !currentEndDate) {
         throw new Error('Rango de fechas actual no definido');
      }
      // Filtrar comidas de la semana actual para la plantilla
      const mealsForTemplate = plannedMeals.filter(meal =>
        meal.plan_date >= currentStartDate && meal.plan_date <= currentEndDate
      );

      if (mealsForTemplate.length === 0) {
        throw new Error('No hay comidas planificadas en la semana actual para guardar como plantilla');
      }

      const template = await planningTemplateService.savePlanningTemplate({
        name,
        meals: mealsForTemplate
        // startDate no es parte de SaveTemplateData
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

  applyTemplateToCurrentWeek: async (templateId: string, startDate: string) => {
    set({ isLoading: true, error: null }); // Usar isLoading general
    try {
      const template = await planningTemplateService.loadPlanningTemplate(templateId);
      const addPromises: Promise<PlannedMeal | null>[] = [];

      template.template_data.meals.forEach(templateMeal => {
        const dayOffset = templateMeal.day_index; // Asumiendo que day_index existe
        const mealDate = new Date(startDate + 'T00:00:00'); // Usar fecha de inicio proporcionada
        mealDate.setDate(mealDate.getDate() + dayOffset);

        const mealData: UpsertPlannedMealData = {
          plan_date: format(mealDate, 'yyyy-MM-dd'), // Formatear fecha
          meal_type: templateMeal.meal_type,
          recipe_id: templateMeal.recipe_id || null,
          custom_meal_name: templateMeal.custom_meal_name || null,
          notes: templateMeal.notes || null
        };
        addPromises.push(get().addPlannedMeal(mealData));
      });

      await Promise.all(addPromises);
      // No es necesario recargar, addPlannedMeal actualiza el estado

      toast.success('Plantilla aplicada con éxito');
    } catch (error) {
      console.error('Error al aplicar plantilla:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al aplicar plantilla';
      set({ error: errorMessage });
      toast.error(errorMessage);
    } finally {
      set({ isLoading: false }); // Quitar isLoading general
    }
  },

  deleteTemplate: async (templateId: string) => {
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
    set({ isLoadingSuggestions: true, pantrySuggestion: null, discoverySuggestion: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Obtener datos necesarios para el contexto
      const pantryItems = usePantryStore.getState().items;
      const favoriteRecipeIds = useRecipeStore.getState().recipes
                                  .filter(r => r.is_favorite)
                                  .map(r => r.id);
      // TODO: Obtener historial de planificación real. Usar datos dummy por ahora.
      const planningHistory: Array<{ recipe_id: string; count: number }> = []; // Placeholder
  
      console.log('[fetchSuggestions] Context data:', {
         pantryItemsCount: pantryItems.length,
         favoritesCount: favoriteRecipeIds.length,
         historyCount: planningHistory.length
      });
  
      // Construir el contexto completo
      const context = {
        date,
        mealType,
        userId: user.id,
        currentPantryItems: pantryItems.map(item => ({ // Mapear al formato esperado
            ingredient_id: item.ingredient_id,
            name: item.ingredient?.name || 'Desconocido' // CORREGIDO: usar item.ingredient?.name
        })),
        favoriteRecipeIds,
        planningHistory, // Usar placeholder por ahora
      };
  
      // Llamar al servicio con el contexto completo
      const response = await getSuggestions(context);

      set({
        pantrySuggestion: response.pantrySuggestion || null,
        discoverySuggestion: response.discoverySuggestion || null,
        isLoadingSuggestions: false
      });
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch suggestions';
      set({ isLoadingSuggestions: false, pantrySuggestion: null, discoverySuggestion: null, error: errorMessage }); // Guardar error
      toast.error(errorMessage);
    }
  },

  clearSuggestions: () => {
    set({
      pantrySuggestion: null,
      discoverySuggestion: null
    });
  },

  clearWeek: async (startDate: string, endDate: string) => {
    const originalMeals = get().plannedMeals;
    set({ isLoading: true, error: null });

    // Optimistic update: Remove meals from local state immediately
    set((state) => ({
      plannedMeals: state.plannedMeals.filter(meal =>
        meal.plan_date < startDate || meal.plan_date > endDate
      ),
    }));

    try {
      console.log(`[PlanningStore] Clearing week from ${startDate} to ${endDate}`);
      // Call the service to delete meals in the backend
      await planningService.deletePlannedMealsInRange(startDate, endDate);
      toast.success('Planificación semanal limpiada con éxito.');
      // No need to reload, state is already updated optimistically
   } catch (error) {
     console.error('Error clearing week:', error);
     const errorMessage = error instanceof Error ? error.message : 'Error al limpiar la semana';
     // Revert optimistic update on error
     set({ plannedMeals: originalMeals, error: errorMessage });
     toast.error(errorMessage);
   } finally {
     set({ isLoading: false }); // Asegurar que isLoading se ponga en false
   }
  },

}));