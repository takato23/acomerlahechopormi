import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/Spinner';
import type { PlannedMeal, MealType, UpsertPlannedMealData, MealAlternativeRequestContext, MealAlternative } from './types';
import { AutocompleteConfigDialog } from './components/AutocompleteConfigDialog';
import { PlannedMealWithRecipe } from './components/MealCard';
import type { Recipe } from '@/types/recipeTypes';
// Importar stores
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
import { generateRecipesFromPantry, GenerateRecipesResult } from '../recipes/generationService';
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

const PlanningPage: React.FC = (): JSX.Element => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<MealType | null>(null);
  const [editingMeal, setEditingMeal] = useState<PlannedMealWithRecipe | null>(null);
  const [isCopyingDay, setIsCopyingDay] = useState(false);
  const [showAutocompleteConfig, setShowAutocompleteConfig] = useState(false);
  const [isGeneratingList, setIsGeneratingList] = useState(false);

  // Hooks de autenticación y responsive
  const { user } = useAuth();
  const breakpoint = useBreakpoint();
  const isDesktop = breakpoint !== 'mobile';

  // Obtener estado y acciones del store de planificación
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
    clearWeek
  } = usePlanningStore();

  // Usar el store para las recetas
  const { recipes: userRecipes, isLoading: isLoadingRecipes, fetchRecipes } = useRecipeStore();

  const { start: weekStart, end: weekEnd } = getWeekInterval(currentDate);
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const mealTypes: MealType[] = ['Desayuno', 'Almuerzo', 'Merienda', 'Cena'];

  // Agrupar comidas por día y asegurar que los campos requeridos estén presentes
  const mealsByDay = useMemo(() => {
    const grouped: { [date: string]: { [key in MealType]?: PlannedMealWithRecipe[] } } = {};
    plannedMeals.forEach(meal => {
      const dateStr = meal.plan_date;
      if (!grouped[dateStr]) grouped[dateStr] = {};
      if (!grouped[dateStr][meal.meal_type]) grouped[dateStr][meal.meal_type] = [];
      
      // Convertir meal a PlannedMealWithRecipe asegurando que todos los campos necesarios estén presentes
      const mealWithRecipe: PlannedMealWithRecipe = {
        ...meal,
        recipes: meal.recipes ? {
          id: meal.recipes.id,
          title: meal.recipes.title,
          description: meal.recipes.description || null,
          image_url: meal.recipes.image_url || null
        } : null
      };
      
      grouped[dateStr][meal.meal_type]!.push(mealWithRecipe);
    });
    return grouped;
  }, [plannedMeals]);

  // Resto del código sin cambios...
  const weekStartStr = format(weekStart, 'yyyy-MM-dd');
  const weekEndStr = format(weekEnd, 'yyyy-MM-dd');

  const loadAndSetPlannedMeals = useMemo(() => {
    return () => {
      console.log(`[PlanningPage] Loading meals for week: ${weekStartStr} - ${weekEndStr}`);
      loadPlannedMeals(weekStartStr, weekEndStr);
    };
  }, [weekStartStr, weekEndStr]); // Solo se recrea cuando cambia la semana

  useEffect(() => {
    loadAndSetPlannedMeals();
  }, [loadAndSetPlannedMeals]);

  useEffect(() => {
    if (user?.id && userRecipes.length === 0 && !isLoadingRecipes) {
      console.log("[PlanningPage] Fetching user recipes...");
      fetchRecipes({ userId: user.id });
    }
  }, [user?.id, userRecipes.length, isLoadingRecipes, fetchRecipes]);

  useEffect(() => {
    const loadProfile = async () => {
      if (user) {
        try {
          const profile = await getUserProfile(user.id);
          setUserProfile(profile);
        } catch (profileError) {
          console.error("Error loading user profile:", profileError);
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
    setIsCopyingDay(false); // Limpiar estado de copiado al cambiar de semana
    setCopiedDayMeals(null);
  };

  const goToNextWeek = () => {
    const newDate = addDays(currentDate, 7);
    setCurrentDate(newDate);
    setSelectedDate(startOfWeek(newDate, { weekStartsOn: 1 }));
    setIsCopyingDay(false); // Limpiar estado de copiado al cambiar de semana
    setCopiedDayMeals(null);
  };

  const handleOpenAddModal = (date: Date, mealType: MealType) => {
    setSelectedDate(date);
    setSelectedMealType(mealType);
    setEditingMeal(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (meal: PlannedMealWithRecipe) => {
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
    try {
      let savedMeal: PlannedMeal | null;
      
      if (mealId) {
        savedMeal = await updatePlannedMeal(mealId, data);
      } else {
        savedMeal = await addPlannedMeal(data);
      }

      if (savedMeal) {
        handleCloseModal();
        toast.success(`Comida ${mealId ? 'actualizada' : 'añadida'} con éxito`);
      } else {
        toast.error(`No se pudo ${mealId ? 'actualizar' : 'añadir'} la comida.`);
      }
    } catch (err) {
      console.error("Error saving meal:", err);
      toast.error(`Error al guardar: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    }
  };

  const handleDeleteMeal = async (mealId: string) => {
    try {
      await deletePlannedMeal(mealId);
      toast.success("Comida eliminada con éxito");
    } catch (err) {
      console.error("Error deleting meal:", err);
      toast.error(`Error al eliminar: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    }
  };

  const handleCopyMeal = (meal: PlannedMealWithRecipe) => {
    setCopiedMeal(meal);
    toast.success("Comida copiada. Haz clic en el botón '+' donde desees pegarla.");
  };

  const handleCopyDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayMeals = Object.values(mealsByDay[dateStr] || {}).flat();
    
    if (dayMeals.length === 0) {
      toast.error("No hay comidas para copiar en este día");
      return;
    }

    setCopiedDayMeals(dayMeals);
    setIsCopyingDay(true);
    toast.success("Día copiado. Selecciona otro día para pegar las comidas.");
  };

  const handlePasteDay = async (targetDate: Date) => {
    if (!copiedDayMeals || copiedDayMeals.length === 0) {
      toast.error("No hay comidas copiadas para pegar");
      return;
    }

    try {
      const targetDateStr = format(targetDate, 'yyyy-MM-dd');
      const addedMeals = await pasteCopiedDayMeals(targetDateStr);
      
      if (addedMeals.length > 0) {
        toast.success(`${addedMeals.length} comidas copiadas al ${format(targetDate, 'd MMM', { locale: es })}`);
      } else {
        toast.error("No se pudieron copiar las comidas");
      }
    } catch (err) {
      console.error("Error pasting day:", err);
      toast.error("Error al pegar las comidas");
    } finally {
      setIsCopyingDay(false);
    }
  };

  const handleRequestAlternatives = async (
    context: MealAlternativeRequestContext
  ): Promise<MealAlternative[] | null> => {
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
  };

  const handleOpenAutocomplete = () => {
    if (!user?.id) {
      toast.error("Debes iniciar sesión para autocompletar la semana.");
      return;
    }
    setShowAutocompleteConfig(true);
  };

  const handleCloseAutocomplete = () => {
    setShowAutocompleteConfig(false);
  };

  const { addGeneratedItems } = useShoppingListStore();

  const handleGenerateListFromPlan = async () => {
    if (!user?.id) {
      toast.error("Debes iniciar sesión para generar la lista de compras.");
      return;
    }

    setIsGeneratingList(true);

    try {
      const startDateStr = format(weekStart, 'yyyy-MM-dd');
      const endDateStr = format(weekEnd, 'yyyy-MM-dd');

      console.log(`[PlanningPage] Generando lista para ${startDateStr} - ${endDateStr}`);
      const generatedItems = await generateShoppingList(startDateStr, endDateStr, user.id);

      if (generatedItems.length === 0) {
        toast.info("No se encontraron nuevos ingredientes necesarios para añadir a la lista.");
      } else {
        console.log(`[PlanningPage] ${generatedItems.length} ítems generados. Añadiendo al store...`);
        const countAdded = await addGeneratedItems(generatedItems);

        if (countAdded > 0) {
          toast.success(`${countAdded} ítem(s) añadido(s) a tu lista de compras.`);
        } else {
          toast.info("Los ingredientes necesarios ya estaban en tu lista de compras.");
        }
      }
    } catch (err: any) {
      console.error('[PlanningPage] Error generando o añadiendo lista de compras:', err);
      const message = err.message || 'Ocurrió un error al generar la lista de compras.';
      toast.error(message);
    } finally {
      setIsGeneratingList(false);
    }
  };

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const selectedDayMeals = mealsByDay[selectedDateStr] || {};

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
        onCopyClick={handleCopyMeal}
        onCopyDayClick={isCopyingDay ? handlePasteDay : handleCopyDay}
        className="max-w-md mx-auto w-full"
      />
    </div>
  );

  const renderDesktopLayout = () => (
    <div className="overflow-x-auto w-full max-w-[1200px]">
      <div className="grid grid-cols-7 grid-rows-[auto_repeat(4,auto)] gap-1 min-w-[900px] border border-border/20 rounded-lg overflow-hidden shadow-sm">
        {weekDays.map((day) => (
          <div
            key={`header-${day.toISOString()}`}
            className={cn(
              "p-2 text-center border-b border-r border-border/10",
              "bg-card",
              isToday(day) ? "bg-primary/5" : "",
              "relative"
            )}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1 h-6 w-6 opacity-0 hover:opacity-100 focus:opacity-100 group-hover:opacity-100"
              onClick={() => isCopyingDay ? handlePasteDay(day) : handleCopyDay(day)}
              aria-label={isCopyingDay ? "Pegar comidas aquí" : "Copiar día"}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <div className="text-sm font-medium text-foreground/90">
              {format(day, 'eee', { locale: es })}
              <div
                className={cn(
                  "inline-flex items-center justify-center mt-1 rounded-full w-6 h-6 text-xs",
                  isToday(day)
                    ? "bg-primary/10 text-primary font-medium ring-1 ring-primary/10"
                    : "text-muted-foreground"
                )}
              >
                {format(day, 'd')}
              </div>
            </div>
          </div>
        ))}
        {/* Iterar por tipo de comida (filas) y luego por día (columnas) */}
        {mealTypes.map((mealType, mealIndex) => (
          <React.Fragment key={mealType}>
            {weekDays.map((day, dayIndex) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const dayMeals = mealsByDay[dateStr] || {};
              const mealsForSlot = dayMeals[mealType] || [];
              return (
                <div
                  // Usar una key combinada y estable
                  key={`${dateStr}-${mealType}`}
                  className="border-r border-b border-border/10 bg-card min-h-0"
                >
                  <MealCard
                    date={day}
                    mealType={mealType}
                    plannedMeals={mealsForSlot} // Pasar el array filtrado
                    onAddClick={handleOpenAddModal}
                    onEditClick={handleOpenEditModal}
                    onDeleteClick={handleDeleteMeal}
                    onCopyClick={handleCopyMeal}
                    className="h-full"
                  />
                </div>
              );
            })}
          </React.Fragment>
        ))}
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
            <span className="text-xl font-bold text-foreground/90">
              Planificación Semanal
            </span>
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 mt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPreviousWeek}
            className="rounded-full h-7 w-7 p-0 hover:bg-background/70 hover:text-[hsl(var(--primary))] transition-all duration-200"
            aria-label="Semana anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm font-medium px-4 py-1 bg-background/50 rounded-full text-foreground/80">
            {format(weekStart, 'd MMM', { locale: es })} -{' '}
            {format(weekEnd, 'd MMM yyyy', { locale: es })}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={goToNextWeek}
            className="rounded-full h-7 w-7 p-0 hover:bg-background/70 hover:text-[hsl(var(--primary))] transition-all duration-200"
            aria-label="Semana siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        {/* Botones de Acción */}
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Button
            onClick={handleOpenAutocomplete}
            disabled={isLoading}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Autocompletar Semana
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="border-destructive/50 text-destructive hover:bg-destructive/5"
              >
                <Eraser className="mr-2 h-4 w-4" />
                Limpiar Semana
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Limpiar Planificación Semanal?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción eliminará todas las comidas planificadas para la semana del{' '}
                  {format(weekStart, 'd MMM', { locale: es })} al{' '}
                  {format(weekEnd, 'd MMM yyyy', { locale: es })}.
                  Esta acción no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive hover:bg-destructive/90"
                  onClick={() => {
                    clearWeek(weekStartStr, weekEndStr);
                  }}
                >
                  Limpiar Semana
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button
            variant="outline"
            onClick={handleGenerateListFromPlan}
            disabled={isGeneratingList || isLoading}
            className="border-primary/50 text-primary hover:bg-primary/5 hover:text-primary"
          >
            {isGeneratingList ? (
              <Spinner size="sm" className="mr-2" />
            ) : (
              <ListPlus className="mr-2 h-4 w-4" />
            )}
            Generar Lista Semanal
          </Button>
        </div>
        {error && (
          <p className="text-red-500 text-xs mt-1 text-center">{error}</p>
        )}
      </div>

      {/* Contenido Principal (Layout Responsivo) */}
      {isLoading ? (
        <div className="flex justify-center items-center flex-grow">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <p className="text-red-500 text-center flex-grow flex items-center justify-center">
          {error}
        </p>
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
        userRecipes={userRecipes}
        onSave={handleSaveMeal}
        onRequestAlternatives={handleRequestAlternatives}
      />

      {/* Dialog de Autocompletado */}
      <AutocompleteConfigDialog
        isOpen={showAutocompleteConfig}
        onClose={handleCloseAutocomplete}
        onConfirm={usePlanningStore.getState().handleAutocompleteWeek}
        isLoading={usePlanningStore.getState().isAutocompleting}
      />
    </div>
  );
};

export default PlanningPage;