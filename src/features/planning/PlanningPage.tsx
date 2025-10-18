import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/Spinner';
import type { MealType, UpsertPlannedMealData } from './types';
import { AutocompleteConfigDialog, AutocompleteConfig } from './components/AutocompleteConfigDialog';
import { PlannedMealWithRecipe } from './components/MealCard';
import { PlanningBoard } from './components/PlanningBoard';
import { PlanningHistory } from './components/PlanningHistory';
import { usePlanningStore } from '@/stores/planningStore';
import { useRecipeStore } from '@/stores/recipeStore';
import { useAuth } from '@/features/auth/AuthContext';
import { MealFormModal } from './components/MealFormModal';
import { es } from 'date-fns/locale';
import { format, startOfWeek, endOfWeek, addDays } from 'date-fns';
import { toast } from 'sonner';
import { Sparkles, ChevronLeft, ChevronRight, Eraser } from 'lucide-react';

const getWeekInterval = (date: Date): { start: Date; end: Date } => {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return { start, end };
};

const PlanningPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<MealType | null>(null);
  const [editingMeal, setEditingMeal] = useState<PlannedMealWithRecipe | null>(null);
  const [showAutocompleteConfig, setShowAutocompleteConfig] = useState(false);
  const [isGeneratingList, setIsGeneratingList] = useState(false);

  const { user } = useAuth();

  const {
    plannedMeals,
    isLoading,
    error,
    loadPlannedMeals,
    addPlannedMeal,
    updatePlannedMeal,
    deletePlannedMeal,
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
  const mealTypes: MealType[] = useMemo(() => ['Desayuno', 'Almuerzo', 'Merienda', 'Cena'], []);

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
        <div className="w-full max-w-[1200px] space-y-6">
          <PlanningBoard
            weekStart={weekStart}
            weekEnd={weekEnd}
            mealTypes={mealTypes}
            meals={plannedMeals as PlannedMealWithRecipe[]}
            onAddMeal={handleOpenAddModal}
            onEditMeal={handleOpenEditModal}
            onDeleteMeal={(mealId) => deletePlannedMeal(mealId)}
          />
          <PlanningHistory />
        </div>
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