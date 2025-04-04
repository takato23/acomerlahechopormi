import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/Spinner';
import { getPlannedMeals, upsertPlannedMeal, deletePlannedMeal } from './planningService';
import type { PlannedMeal, MealType, UpsertPlannedMealData, MealAlternativeRequestContext, MealAlternative } from './types';
import { useRecipeStore } from '@/stores/recipeStore'; // Importar store de recetas
import { generateRecipesFromPantry, GenerateRecipesResult } from '../recipes/generationService';
import { getMealAlternatives } from '../suggestions/suggestionService';
import { useAuth } from '@/features/auth/AuthContext';
import { getUserProfile } from '@/features/user/userService';
import type { UserProfile } from '@/features/user/userTypes';
import type { Recipe } from '@/types/recipeTypes'; // Importar tipo Recipe
import { Sparkles, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { format, startOfWeek, endOfWeek, addDays, subDays, eachDayOfInterval, isToday } from 'date-fns';
import { MealFormModal } from './components/MealFormModal';
import { WeekDaySelector } from './components/WeekDaySelector';
import { PlanningDayView } from './components/PlanningDayView';
import { MealCard } from './components/MealCard';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import useBreakpoint from '@/hooks/useBreakpoint';
import { toast } from 'sonner'; // Asegurar importación de toast

const getWeekInterval = (date: Date): { start: Date; end: Date } => {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return { start, end };
};

const PlanningPage: React.FC = (): JSX.Element => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [plannedMeals, setPlannedMeals] = useState<PlannedMeal[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Loading general para comidas planificadas
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<MealType | null>(null);
  const [editingMeal, setEditingMeal] = useState<PlannedMeal | null>(null);
  const [isAutocompleting, setIsAutocompleting] = useState(false);
  const [autocompleteError, setAutocompleteError] = useState<string | null>(null);

  const { user } = useAuth();
  const breakpoint = useBreakpoint();
  const isDesktop = breakpoint !== 'mobile';

  // Usar el store para las recetas
  const { recipes: userRecipes, isLoading: isLoadingRecipes, error: errorRecipes, fetchRecipes } = useRecipeStore();

  const { start: weekStart, end: weekEnd } = getWeekInterval(currentDate);
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const mealsByDay = useMemo(() => {
    const grouped: { [date: string]: { [key in MealType]?: PlannedMeal[] } } = {};
    plannedMeals.forEach(meal => {
      const dateStr = meal.plan_date;
      if (!grouped[dateStr]) grouped[dateStr] = {};
      if (!grouped[dateStr][meal.meal_type]) grouped[dateStr][meal.meal_type] = [];
      grouped[dateStr][meal.meal_type]!.push(meal);
    });
    return grouped;
  }, [plannedMeals]);

  const loadWeekData = useCallback(async (start: Date, end: Date) => {
    setIsLoading(true); // Loading para comidas planificadas
    setError(null);
    try {
      const startDateStr = format(start, 'yyyy-MM-dd');
      const endDateStr = format(end, 'yyyy-MM-dd');
      const meals = await getPlannedMeals(startDateStr, endDateStr);
      setPlannedMeals(meals);
    } catch (err: any) {
      setError('Error al cargar datos de planificación.');
      console.error('[PlanningPage] Error loading planning data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const weekStartStr = useMemo(() => format(weekStart, 'yyyy-MM-dd'), [weekStart]);
  const weekEndStr = useMemo(() => format(weekEnd, 'yyyy-MM-dd'), [weekEnd]);

  useEffect(() => {
    loadWeekData(weekStart, weekEnd);
  }, [weekStartStr, weekEndStr, loadWeekData]);

  // Cargar recetas si es necesario
  useEffect(() => {
    if (user?.id && userRecipes.length === 0 && !isLoadingRecipes) {
       console.log("[PlanningPage] Fetching user recipes...");
      fetchRecipes(user.id);
    }
  }, [user?.id, userRecipes.length, isLoadingRecipes, fetchRecipes]);

  // Cargar perfil
  useEffect(() => {
    const loadProfile = async () => {
      if (user) {
        try {
          const profile = await getUserProfile(user.id);
          setUserProfile(profile);
        } catch (profileError) {
           console.error("Error loading user profile:", profileError);
           // Podríamos mostrar un error específico si es necesario
        }
      }
    };
    loadProfile();
  }, [user]);

  const goToPreviousWeek = () => {
    const newDate = subDays(currentDate, 7);
    setCurrentDate(newDate);
    const today = new Date();
    const startOfNewWeek = startOfWeek(newDate, { weekStartsOn: 1 });
    setSelectedDate(startOfNewWeek < today ? startOfNewWeek : (isToday(startOfNewWeek) ? today : startOfNewWeek));
  };

  const goToNextWeek = () => {
    const newDate = addDays(currentDate, 7);
    setCurrentDate(newDate);
    setSelectedDate(startOfWeek(newDate, { weekStartsOn: 1 }));
  };

  const handleOpenAddModal = (date: Date, mealType: MealType) => {
    setSelectedDate(date);
    setSelectedMealType(mealType);
    setEditingMeal(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (meal: PlannedMeal) => {
    const mealDate = new Date(meal.plan_date + 'T00:00:00');
    setSelectedDate(mealDate);
    setSelectedMealType(meal.meal_type);
    setEditingMeal(meal);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingMeal(null);
    setSelectedMealType(null);
  };

  const handleSaveMeal = async (data: UpsertPlannedMealData, mealId?: string) => {
    setError(null);
    try {
      const savedMeal = await upsertPlannedMeal(data, mealId);
      if (savedMeal) {
        const mealTypesOrder: MealType[] = ['Desayuno', 'Almuerzo', 'Merienda', 'Cena'];
        if (mealId) {
          setPlannedMeals(plannedMeals.map(m => m.id === mealId ? savedMeal : m));
        } else {
          setPlannedMeals([...plannedMeals, savedMeal].sort((a, b) =>
            a.plan_date.localeCompare(b.plan_date) || mealTypesOrder.indexOf(a.meal_type) - mealTypesOrder.indexOf(b.meal_type)
          ));
        }
        handleCloseModal();
      } else {
        throw new Error('La operación de guardado no devolvió una comida válida.');
      }
    } catch (err) {
      console.error("Error saving meal:", err);
      setError(`Error al guardar: ${err instanceof Error ? err.message : 'Error desconocido'}`);
      throw err;
    }
  };

  const handleDeleteMeal = async (mealId: string) => {
    setError(null);
    try {
      const success = await deletePlannedMeal(mealId);
      if (success) {
        setPlannedMeals(plannedMeals.filter(m => m.id !== mealId));
      } else {
        setError('No se pudo eliminar la comida.');
      }
    } catch (err) {
      console.error("Error deleting meal:", err);
      setError('Error al eliminar la comida.');
    }
  };

  const handleRequestAlternatives = useCallback(async (context: MealAlternativeRequestContext): Promise<MealAlternative[] | null> => {
     console.log('[PlanningPage] Requesting alternatives for:', context);
     try {
       const alternatives = await getMealAlternatives(context, userProfile);
       console.log('[PlanningPage] Alternatives received:', alternatives);
       return alternatives;
     } catch (error) {
       console.error('[PlanningPage] Error fetching alternatives:', error);
       toast.error("Error al buscar alternativas.");
       return null;
     }
  }, [userProfile]);

  const handleAutocompleteWeek = async () => {
    if (!user?.id) {
      setAutocompleteError("Debes iniciar sesión para autocompletar la semana.");
      return;
    }

    setIsAutocompleting(true);
    setAutocompleteError(null);
    setError(null);

    const recipesToGenerate = 7;

    try {
      const result: GenerateRecipesResult = await generateRecipesFromPantry(recipesToGenerate, user.id);

      if (result.errors.length > 0) {
        const firstErrorMsg = result.errors[0].message;
        setAutocompleteError(`Error generando recetas: ${firstErrorMsg}${result.errors.length > 1 ? ` (y ${result.errors.length - 1} más)` : ''}`);
      }

      if (result.successfulRecipes.length > 0) {
        const mealTypeToAssign: MealType = 'Cena';
        const mealUpsertPromises: Promise<PlannedMeal | null>[] = [];

        result.successfulRecipes.forEach((recipe, index) => {
          if (index < weekDays.length) {
            const targetDate = weekDays[index];
            const dateStr = format(targetDate, 'yyyy-MM-dd');
            const mealData: UpsertPlannedMealData = {
              plan_date: dateStr,
              meal_type: mealTypeToAssign,
              custom_meal_name: recipe.title,
              notes: recipe.description,
              recipe_id: null,
            };
            mealUpsertPromises.push(upsertPlannedMeal(mealData));
          }
        });

        const settledUpserts = await Promise.allSettled(mealUpsertPromises);
        const newlyAddedMeals: PlannedMeal[] = [];
        let saveErrors = 0;

        settledUpserts.forEach((settledResult, index) => {
          if (settledResult.status === 'fulfilled' && settledResult.value) {
            newlyAddedMeals.push(settledResult.value);
          } else {
            saveErrors++;
            console.error(`[PlanningPage] Error guardando comida ${index + 1}:`, settledResult.status === 'rejected' ? settledResult.reason : 'Resultado nulo');
          }
        });

        if (newlyAddedMeals.length > 0) {
          const mealTypesOrder: MealType[] = ['Desayuno', 'Almuerzo', 'Merienda', 'Cena'];
          const updatedMeals = [
            ...plannedMeals.filter(meal => {
              const isTargetSlot = weekDays.some((day, idx) =>
                format(day, 'yyyy-MM-dd') === meal.plan_date &&
                meal.meal_type === mealTypeToAssign &&
                idx < result.successfulRecipes.length
              );
              return !isTargetSlot;
            }),
            ...newlyAddedMeals
          ].sort((a, b) =>
            a.plan_date.localeCompare(b.plan_date) || mealTypesOrder.indexOf(a.meal_type) - mealTypesOrder.indexOf(b.meal_type)
          );
          setPlannedMeals(updatedMeals);
        }

        if (saveErrors > 0) {
          const currentError = autocompleteError ? `${autocompleteError}. ` : '';
          setAutocompleteError(`${currentError}Ocurrieron ${saveErrors} error(es) al guardar las comidas.`);
        }

      } else if (result.errors.length === recipesToGenerate) {
        console.log('[PlanningPage] No se generó ninguna receta con éxito.');
      }

    } catch (err: any) {
      console.error('[PlanningPage] Error inesperado durante el autocompletado:', err);
      setAutocompleteError(`Error inesperado: ${err.message || 'Error desconocido'}`);
    } finally {
      setIsAutocompleting(false);
    }
  };

  const mealTypes: MealType[] = ['Desayuno', 'Almuerzo', 'Merienda', 'Cena'];
  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const selectedDayMeals = mealsByDay ? (mealsByDay[selectedDateStr] || {}) : {};

  const renderMobileLayout = () => (
    <div className="flex flex-col w-full space-y-3">
      <WeekDaySelector
        days={weekDays}
        selectedDay={selectedDate}
        onDaySelect={setSelectedDate}
        className="mx-auto w-full max-w-md"
      />
      <PlanningDayView
        date={selectedDate}
        mealsByType={selectedDayMeals}
        mealTypes={mealTypes}
        onAddClick={handleOpenAddModal}
        onEditClick={handleOpenEditModal}
        onDeleteClick={handleDeleteMeal}
        className="max-w-md mx-auto w-full"
      />
    </div>
  );

  const renderDesktopLayout = () => (
    <div className="overflow-x-auto w-full max-w-[1200px]">
      <div className="grid grid-cols-7 grid-rows-[auto_repeat(4,auto)] gap-1 min-w-[900px] border border-border/20 rounded-lg overflow-hidden shadow-sm">
      {weekDays.map((day) => (
        <div key={`header-${day.toISOString()}`} className={cn(
          "p-2 text-center border-b border-r border-border/10",
          "bg-card",
          isToday(day) ? "bg-primary/5" : ""
        )}>
          <div className="text-sm font-medium text-foreground/90">
            {format(day, 'eee', { locale: es })}
            <div className={cn(
              "inline-flex items-center justify-center mt-1 rounded-full w-6 h-6 text-xs",
              isToday(day)
                ? "bg-primary/10 text-primary font-medium ring-1 ring-primary/10"
                : "text-muted-foreground"
            )}>
              {format(day, 'd')}
            </div>
          </div>
        </div>
      ))}
      {weekDays.flatMap((day) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const dayMeals = mealsByDay ? (mealsByDay[dateStr] || {}) : {};
        return mealTypes.map(mealType => {
          const mealsForSlot = dayMeals[mealType] || [];
          return (
            <div key={`${dateStr}-${mealType}`} className="border-r border-b border-border/10 bg-card min-h-0">
              <MealCard
                date={day}
                mealType={mealType}
                plannedMeals={mealsForSlot}
                onAddClick={handleOpenAddModal}
                onEditClick={handleOpenEditModal}
                onDeleteClick={handleDeleteMeal}
                className="h-full"
              />
            </div>
          );
        });
      })}
      </div>
    </div>
   );

  return (
    <div className="flex flex-col items-center w-full h-full px-2 py-3 mx-auto">
      {/* Header */}
      <div className="flex flex-col items-center mb-4 w-full max-w-[1200px]">
         <div className="flex items-center gap-2 p-1.5 bg-gradient-to-r from-card/80 via-background/60 to-card/80 rounded-lg shadow-sm border border-border/20 backdrop-blur-sm">
          <div className="flex items-center gap-2 px-4 py-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            <span className="text-xl font-bold text-foreground/90">Planificación Semanal</span>
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 mt-3">
          <Button variant="ghost" size="sm" onClick={goToPreviousWeek} className="rounded-full h-7 w-7 p-0 hover:bg-background/70 hover:text-[hsl(var(--primary))] transition-all duration-200">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm font-medium px-4 py-1 bg-background/50 rounded-full text-foreground/80">
            {format(weekStart, 'd MMM', { locale: es })} - {format(weekEnd, 'd MMM yyyy', { locale: es })}
          </div>
          <Button variant="ghost" size="sm" onClick={goToNextWeek} className="rounded-full h-7 w-7 p-0 hover:bg-background/70 hover:text-[hsl(var(--primary))] transition-all duration-200">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        {/* Botón Autocompletar */}
         <div className="mt-4">
           <Button onClick={handleAutocompleteWeek} disabled={isAutocompleting}>
             {isAutocompleting ? <Spinner size="sm" className="mr-2" /> : <Sparkles className="mr-2 h-4 w-4" />}
             Autocompletar Semana (Cenas)
           </Button>
           {autocompleteError && <p className="text-red-500 text-xs mt-1 text-center">{autocompleteError}</p>}
         </div>
      </div>

      {/* Contenido Principal (Layout Responsivo) */}
      {isLoading ? (
        <div className="flex justify-center items-center flex-grow"><Spinner size="lg" /></div>
      ) : error ? (
        <p className="text-red-500 text-center flex-grow flex items-center justify-center">{error}</p>
      ) : (
        isDesktop ? renderDesktopLayout() : renderMobileLayout()
      )}

      {/* Modal */}
      <MealFormModal
        isOpen={showModal}
        onClose={handleCloseModal}
        date={selectedDate}
        mealType={selectedMealType}
        mealToEdit={editingMeal}
        userRecipes={userRecipes} // Pasar recetas del store
        onSave={handleSaveMeal}
        onRequestAlternatives={handleRequestAlternatives}
      />
    </div>
  );
};

export default PlanningPage; // Añadir exportación por defecto