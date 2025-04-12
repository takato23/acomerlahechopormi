import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/Spinner';
import type { PlannedMeal, MealType, UpsertPlannedMealData, MealAlternativeRequestContext, MealAlternative } from './types';
import { AutocompleteConfigDialog, AutocompleteConfig } from './components/AutocompleteConfigDialog';
import { PlannedMealWithRecipe } from './components/MealCard';
import type { Recipe } from '@/types/recipeTypes';
import { usePlanningStore } from '@/stores/planningStore';
import { Calendar, Copy, Eraser } from 'lucide-react';
import { useRecipeStore } from '@/stores/recipeStore';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { generateRecipeForSlot } from '../recipes/generationService';
import { getMealAlternatives } from '../suggestions/suggestionService';
import { useAuth } from '@/features/auth/AuthContext';
import { getUserProfile } from '@/features/user/userService';
import type { UserProfile } from '@/features/user/userTypes';
import { ListPlus } from 'lucide-react';
import { Sparkles, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { format, startOfWeek, endOfWeek, addDays, subDays, eachDayOfInterval, isToday } from 'date-fns';
import { MealFormModal } from './components/MealFormModal';
import { WeekDaySelector } from './components/WeekDaySelector';
import { PlanningDayView } from './components/PlanningDayView';
import { MealCard } from './components/MealCard';
import { useShoppingListStore } from '@/stores/shoppingListStore';
import { generateShoppingList } from '@/features/shopping-list/shoppingListService';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import useBreakpoint from '@/hooks/useBreakpoint';
import { toast } from 'sonner';

const getWeekInterval = (date: Date): { start: Date; end: Date } => {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return { start, end };
};

const PlanningPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<MealType | null>(null);
  const [editingMeal, setEditingMeal] = useState<PlannedMealWithRecipe | null>(null);
  const [isCopyingDay, setIsCopyingDay] = useState(false);
  const [showAutocompleteConfig, setShowAutocompleteConfig] = useState(false);
  const [isGeneratingList, setIsGeneratingList] = useState(false);

  const { user } = useAuth();
  const breakpoint = useBreakpoint();
  const isDesktop = breakpoint !== 'mobile';

  const {
    plannedMeals,
    isLoading,
    error,
    loadPlannedMeals,
    addPlannedMeal,
    updatePlannedMeal,
    deletePlannedMeal,
    setCopiedMeal,
    setCopiedDayMeals,
    pasteCopiedMeal,
    pasteCopiedDayMeals,
    copiedMeal,
    copiedDayMeals,
    clearWeek,
    handleAutocompleteWeek
  } = usePlanningStore();

  const { recipes: userRecipes, isLoading: isLoadingRecipes, loadRecipes } = useRecipeStore();

  useEffect(() => {
    const loadData = async () => {
      if (user?.id && !isLoadingRecipes && userRecipes.length === 0) {
        await loadRecipes(user.id);
      }
    };
    
    const timer = setTimeout(loadData, 500);
    return () => clearTimeout(timer);
  }, [user?.id, userRecipes.length, isLoadingRecipes]);

  // --- MEMORIZACIÓN --- 

  // 1. Memorizar las fechas de la semana
  const { start: weekStart, end: weekEnd } = useMemo(() => getWeekInterval(currentDate), [currentDate]);
  const weekStartStr = useMemo(() => format(weekStart, 'yyyy-MM-dd'), [weekStart]);
  const weekEndStr = useMemo(() => format(weekEnd, 'yyyy-MM-dd'), [weekEnd]);
  const weekDays = useMemo(() => eachDayOfInterval({ start: weekStart, end: weekEnd }), [weekStart, weekEnd]);
  const mealTypes: MealType[] = useMemo(() => ['Desayuno', 'Almuerzo', 'Merienda', 'Cena'], []);

  // 2. Memorizar la función de organizar comidas
  // La función en sí ya está en useCallback, pero la hacemos más específica
  const organizeMealsByType = useCallback((meals: PlannedMeal[], dateStr: string) => {
    // console.log(`[PlanningPage] Organizing meals for date: ${dateStr}`); // Log si es necesario depurar
    const mealsForDay = meals.filter(meal => meal.plan_date === dateStr);
    const result: { [key in MealType]?: PlannedMealWithRecipe[] } = {};
    mealTypes.forEach(type => {
      result[type] = mealsForDay
        .filter(meal => meal.meal_type === type)
        .map(meal => meal as PlannedMealWithRecipe);
    });
    return result;
  }, [mealTypes]); // Dependencia estable

  // 3. Memorizar los datos de las comidas organizadas para cada día
  // Esto es crucial para que PlanningDayView no se renderice innecesariamente
  const organizedMealsByDay = useMemo(() => {
    // console.log('[PlanningPage] Recalculating organizedMealsByDay'); // Log si es necesario depurar
    const organized: { [dateStr: string]: { [key in MealType]?: PlannedMealWithRecipe[] } } = {};
    weekDays.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      organized[dateStr] = organizeMealsByType(plannedMeals, dateStr);
    });
    return organized;
    // Depender directamente de plannedMeals (referencia) y organizeMealsByType
  }, [plannedMeals, weekDays, organizeMealsByType]); 

  // --- FIN MEMORIZACIÓN ---

  // Cargar comidas planificadas cuando cambie la semana seleccionada
  useEffect(() => {
    if (user?.id) {
      console.log(`[PlanningPage] Loading planned meals for week ${weekStartStr} - ${weekEndStr}`);
      loadPlannedMeals(weekStartStr, weekEndStr);
    }
  }, [user?.id, weekStartStr, weekEndStr, loadPlannedMeals]);

  // Manejadores para abrir/cerrar modales
  const handleOpenAddModal = useCallback((date: Date, mealType: MealType) => {
    setSelectedDate(date);
    setSelectedMealType(mealType);
    setEditingMeal(null);
    setShowModal(true);
  }, []);

  const handleOpenEditModal = useCallback((meal: PlannedMealWithRecipe) => {
    setSelectedDate(new Date(meal.plan_date));
    setSelectedMealType(meal.meal_type);
    setEditingMeal(meal);
    setShowModal(true);
  }, []);

  // Manejar guardado de comidas
  const handleSaveMeal = useCallback(async (mealData: UpsertPlannedMealData) => {
    try {
      if (editingMeal) {
        await updatePlannedMeal(editingMeal.id, mealData);
        toast.success("Comida actualizada");
      } else {
        await addPlannedMeal(mealData);
        toast.success("Comida añadida");
      }
      setShowModal(false);
    } catch (error) {
      toast.error("Error al guardar la comida");
      console.error("Error saving meal:", error);
    }
  }, [editingMeal, addPlannedMeal, updatePlannedMeal]);

  // Manejar autocompletado
  const handleSubmitAutocomplete = useCallback(async (config: AutocompleteConfig) => {
    try {
      setShowAutocompleteConfig(false);
      setIsGeneratingList(true); // Mostrar indicador de carga
      toast.success("Autocompletando semana...");
      
      // Llamar a la función del store para autocompletar la semana
      await handleAutocompleteWeek(weekStartStr, weekEndStr, config);
      
      toast.success("¡Semana autocompletada con éxito!");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Error desconocido";
      toast.error(`Error al autocompletar: ${errorMsg}`);
      console.error("Error autocompleting:", error);
    } finally {
      setIsGeneratingList(false); // Ocultar indicador de carga
    }
  }, [handleAutocompleteWeek, weekStartStr, weekEndStr]);

  return (
    <div className="flex flex-col items-center w-full h-full px-2 py-3 mx-auto">
      {/* Header */}
      <div className="flex flex-col items-center mb-4 w-full max-w-[1200px]">
        <div className="flex items-center justify-between w-full px-4 py-2 bg-card rounded-lg shadow-sm">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentDate(prevDate => addDays(prevDate, -7))}
              aria-label="Semana anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="text-lg font-semibold">
              {format(weekStart, 'd MMM', { locale: es })} - {format(weekEnd, 'd MMM yyyy', { locale: es })}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentDate(prevDate => addDays(prevDate, 7))}
              aria-label="Semana siguiente"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowAutocompleteConfig(true)}
            >
              <Sparkles className="h-4 w-4 mr-1" />
              Autocompletar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (confirm('¿Estás seguro de que quieres borrar todas las comidas de esta semana?')) {
                  clearWeek(weekStartStr, weekEndStr);
                }
              }}
            >
              <Eraser className="h-4 w-4 mr-1" />
              Limpiar Semana
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          {/* Vista móvil */}
          {!isDesktop && (
            <div className="w-full max-w-[600px]">
              <WeekDaySelector
                days={weekDays}
                selectedDay={selectedDate}
                onDaySelect={setSelectedDate}
              />
              <div className="mt-4">
                <PlanningDayView
                  date={selectedDate}
                  mealsByType={organizedMealsByDay[format(selectedDate, 'yyyy-MM-dd')] || {}}
                  mealTypes={mealTypes}
                  onAddClick={handleOpenAddModal}
                  onEditClick={handleOpenEditModal}
                  onDeleteClick={(mealId) => deletePlannedMeal(mealId)}
                  onCopyClick={(meal) => setCopiedMeal(meal)}
                />
              </div>
            </div>
          )}

          {/* Vista de escritorio */}
          {isDesktop && (
            <div className="grid grid-cols-7 gap-4 w-full max-w-[1200px]">
              {weekDays.map(day => {
                const dateStr = format(day, 'yyyy-MM-dd');
                return (
                  <div key={dateStr} className="flex flex-col">
                    <PlanningDayView
                      date={day}
                      mealsByType={organizedMealsByDay[dateStr] || {}}
                      mealTypes={mealTypes}
                      onAddClick={handleOpenAddModal}
                      onEditClick={handleOpenEditModal}
                      onDeleteClick={(mealId) => deletePlannedMeal(mealId)}
                      onCopyClick={(meal) => setCopiedMeal(meal)}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Modales */}
      <MealFormModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingMeal(null);
        }}
        date={selectedDate}
        mealType={selectedMealType}
        mealToEdit={editingMeal}
        userRecipes={userRecipes}
        onSave={handleSaveMeal}
        onRequestAlternatives={() => Promise.resolve(null)}
      />

      <AutocompleteConfigDialog
        isOpen={showAutocompleteConfig}
        onClose={() => setShowAutocompleteConfig(false)}
        onConfirm={handleSubmitAutocomplete}
        isProcessing={isGeneratingList}
        initialConfig={{}}
      />

      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-800 rounded-md">
          {error}
        </div>
      )}
    </div>
  );
};

export default PlanningPage;