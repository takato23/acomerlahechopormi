import React, { useState, useEffect, useMemo, useCallback } from 'react'; // Importar useCallback
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/Spinner';
import { getPlannedMeals, upsertPlannedMeal, deletePlannedMeal } from './planningService';
import type { PlannedMeal, MealType, UpsertPlannedMealData, MealAlternativeRequestContext, MealAlternative } from './types';
// import { getRecipes } from '../recipes/recipeService'; // Comentado - Funcionalidad de recetas eliminada temporalmente
// import type { Recipe } from '../recipes/recipeTypes'; // Comentado - Funcionalidad de recetas eliminada temporalmente
import { generateRecipesFromPantry, GenerateRecipesResult } from '../recipes/generationService'; // Importar servicio de generación
import { getMealAlternatives } from '../suggestions/suggestionService';
import { useAuth } from '@/features/auth/AuthContext';
import { getUserProfile } from '@/features/user/userService';
import type { UserProfile } from '@/features/user/userTypes';
import { Sparkles } from 'lucide-react'; // Importar icono Sparkles
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'; 
import { format, startOfWeek, endOfWeek, addDays, subDays, eachDayOfInterval, isToday } from 'date-fns';
import { MealFormModal } from './components/MealFormModal';
import { WeekDaySelector } from './components/WeekDaySelector';
import { PlanningDayView } from './components/PlanningDayView';
import { MealCard } from './components/MealCard'; 
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import useBreakpoint from '@/hooks/useBreakpoint'; 

/**
 * Helper para obtener el intervalo de la semana (Lunes-Domingo).
 * @param {Date} date - Una fecha dentro de la semana deseada.
 * @returns {{start: Date, end: Date}} Objeto con las fechas de inicio y fin de la semana.
 */
const getWeekInterval = (date: Date): { start: Date; end: Date } => {
  const start = startOfWeek(date, { weekStartsOn: 1 }); 
  const end = endOfWeek(date, { weekStartsOn: 1 }); 
  return { start, end };
};

/**
 * Página principal para la planificación semanal de comidas.
 * Muestra una vista de calendario semanal en escritorio y una vista diaria con selector en móvil.
 * Permite añadir, editar y eliminar comidas planificadas (recetas o personalizadas).
 * @component
 */
const PlanningPage: React.FC = (): JSX.Element => { // Asegurar tipo de retorno explícito
  // --- Estados del Componente ---
  /** @state {Date} currentDate - Fecha utilizada para determinar la semana mostrada/seleccionada. */
  const [currentDate, setCurrentDate] = useState(new Date());
  /** @state {Date} selectedDate - Fecha del día seleccionado actualmente (relevante en vista móvil). */
  const [selectedDate, setSelectedDate] = useState(new Date()); 
  /** @state {PlannedMeal[]} plannedMeals - Array de todas las comidas planificadas para la semana actual. */
  const [plannedMeals, setPlannedMeals] = useState<PlannedMeal[]>([]);
  /** @state {boolean} isLoading - Indica si se están cargando los datos iniciales (comidas, recetas). */
  const [isLoading, setIsLoading] = useState(true);
  /** @state {string | null} error - Mensaje de error general de la página. */
  const [error, setError] = useState<string | null>(null);
  /** @state {Recipe[]} userRecipes - Lista de todas las recetas del usuario (para el modal). */
  // const [userRecipes, setUserRecipes] = useState<Recipe[]>([]); // Comentado - Funcionalidad de recetas eliminada temporalmente
  const userRecipes: any[] = []; // Placeholder para evitar errores en el prop del modal
  /** @state {UserProfile | null} userProfile - Perfil del usuario (para sugerencias futuras). */
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  /** @state {boolean} showModal - Controla la visibilidad del modal de añadir/editar comida. */
  const [showModal, setShowModal] = useState(false);
  /** @state {MealType | null} selectedMealType - Tipo de comida seleccionado al abrir el modal. */
  const [selectedMealType, setSelectedMealType] = useState<MealType | null>(null);
  /** @state {PlannedMeal | null} editingMeal - Comida que se está editando actualmente en el modal. */
  const [editingMeal, setEditingMeal] = useState<PlannedMeal | null>(null);
  /** @state {boolean} isAutocompleting - Indica si se está ejecutando la generación automática de recetas. */
  const [isAutocompleting, setIsAutocompleting] = useState(false);
  /** @state {string | null} autocompleteError - Mensaje de error específico de la función de autocompletar. */
  const [autocompleteError, setAutocompleteError] = useState<string | null>(null);
  
  /** @constant {AuthContextValue} user - Información del usuario autenticado. */
  const { user } = useAuth();
  /** @constant {'mobile' | 'tablet' | 'desktop'} breakpoint - Breakpoint actual detectado. */
  const breakpoint = useBreakpoint();
  /** @constant {boolean} isDesktop - Indica si la vista actual es tablet o desktop. */
  const isDesktop = breakpoint !== 'mobile'; 

  /** @constant {{start: Date, end: Date}} weekInterval - Fechas de inicio y fin de la semana actual. */
  const { start: weekStart, end: weekEnd } = getWeekInterval(currentDate);
  /** @constant {Date[]} weekDays - Array de objetos Date para cada día de la semana actual. */
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  /**
   * Agrupa las comidas planificadas por fecha y tipo de comida.
   * @function mealsByDay
   * @returns {Record<string, Record<MealType, PlannedMeal[]>>} Objeto anidado con comidas agrupadas.
   */
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

  // --- Funciones de Carga y Navegación ---
  /**
   * Carga las comidas planificadas y las recetas del usuario para el rango de fechas dado.
   * Estabilizada con useCallback para usarla como dependencia de efecto.
   * @async
   * @function loadWeekData
   */
  const loadWeekData = useCallback(async (start: Date, end: Date) => {
    setIsLoading(true);
    setError(null);
    try {
      const startDateStr = format(start, 'yyyy-MM-dd');
      const endDateStr = format(end, 'yyyy-MM-dd');
      // Modificado para no llamar a getRecipes
      const [meals /*, recipes */] = await Promise.all([
        getPlannedMeals(startDateStr, endDateStr),
        // getRecipes() // LLAMADA COMENTADA
        Promise.resolve([]) // Devolver array vacío para mantener estructura de Promise.all
      ]);
      setPlannedMeals(meals);
      // setUserRecipes(recipes); // LLAMADA COMENTADA
    } catch (err: any) {
      setError('Error al cargar datos de planificación o recetas.');
      console.error('[PlanningPage] Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []); // Sin dependencias internas, ya que usa setIsLoading, setError, etc. del scope del componente

  // --- Efectos ---
  /**
   * Carga los datos de planificación y recetas para la semana actual cuando cambia `currentDate`.
   * @effect loadWeekDataEffect
   */
  // Formatear las fechas de inicio y fin para usarlas como dependencias estables
  const weekStartStr = useMemo(() => format(weekStart, 'yyyy-MM-dd'), [weekStart]);
  const weekEndStr = useMemo(() => format(weekEnd, 'yyyy-MM-dd'), [weekEnd]);

  useEffect(() => {
    // Usar las fechas originales (Date objects) para la lógica interna
    loadWeekData(weekStart, weekEnd);
  }, [weekStartStr, weekEndStr, loadWeekData]); // Depender de las strings formateadas y loadWeekData

  /**
   * Carga el perfil del usuario al montar si está autenticado.
   * @effect loadProfileEffect
   */
  useEffect(() => {
    const loadProfile = async () => {
      if (user) {
        const profile = await getUserProfile(user.id); // Pasar userId
        setUserProfile(profile);
      }
    };
    loadProfile();
  }, [user]);

  // La definición de loadWeekData se movió antes del useEffect

  /** Navega a la semana anterior y actualiza la fecha seleccionada. */
  const goToPreviousWeek = () => {
    const newDate = subDays(currentDate, 7);
    setCurrentDate(newDate);
    const today = new Date();
    const startOfNewWeek = startOfWeek(newDate, { weekStartsOn: 1 });
    setSelectedDate(startOfNewWeek < today ? startOfNewWeek : (isToday(startOfNewWeek) ? today : startOfNewWeek));
  };

  /** Navega a la semana siguiente y actualiza la fecha seleccionada al lunes. */
  const goToNextWeek = () => {
    const newDate = addDays(currentDate, 7);
    setCurrentDate(newDate);
    setSelectedDate(startOfWeek(newDate, { weekStartsOn: 1 })); 
  };

  // --- Handlers para el Modal ---
  /**
   * Abre el modal para añadir una nueva comida.
   * @function handleOpenAddModal
   * @param {Date} date - Fecha para la nueva comida.
   * @param {MealType} mealType - Tipo de comida.
   */
  const handleOpenAddModal = (date: Date, mealType: MealType) => {
    setSelectedDate(date); 
    setSelectedMealType(mealType);
    setEditingMeal(null);
    setShowModal(true);
  };

  /**
   * Abre el modal para editar una comida existente.
   * @function handleOpenEditModal
   * @param {PlannedMeal} meal - La comida a editar.
   */
  const handleOpenEditModal = (meal: PlannedMeal) => {
    const mealDate = new Date(meal.plan_date + 'T00:00:00'); // Ajustar zona horaria si es necesario
    setSelectedDate(mealDate); 
    setSelectedMealType(meal.meal_type);
    setEditingMeal(meal);
    setShowModal(true);
  };

  /** Cierra el modal de añadir/editar comida. */
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingMeal(null);
    setSelectedMealType(null);
  };

  /**
   * Guarda una comida (nueva o editada) llamando al servicio y actualiza el estado local.
   * @async
   * @function handleSaveMeal
   * @param {UpsertPlannedMealData} data - Datos de la comida a guardar.
   * @param {string} [mealId] - ID de la comida si se está editando.
   * @returns {Promise<void>}
   * @throws {Error} Si ocurre un error durante el guardado.
   */
  const handleSaveMeal = async (data: UpsertPlannedMealData, mealId?: string) => {
    setError(null);
    try {
      const savedMeal = await upsertPlannedMeal(data, mealId);
      if (savedMeal) {
        const mealTypesOrder: MealType[] = ['Desayuno', 'Almuerzo', 'Merienda', 'Cena'];
        if (mealId) {
          // Actualizar comida existente en el estado
          setPlannedMeals(plannedMeals.map(m => m.id === mealId ? savedMeal : m));
        } else {
          // Añadir nueva comida y reordenar
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
      throw err; // Re-lanzar para que el modal sepa que hubo error
    }
  };

  /**
   * Elimina una comida planificada llamando al servicio y actualiza el estado local.
   * @async
   * @function handleDeleteMeal
   * @param {string} mealId - ID de la comida a eliminar.
   */
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

  /**
   * (Placeholder) Maneja la solicitud de alternativas de comida usando IA.
   * @async
   * @function handleRequestAlternatives
   * @param {MealAlternativeRequestContext} context - Contexto para la solicitud.
   * @returns {Promise<MealAlternative[] | null>} Alternativas o null.
   */
  /**
   * (Placeholder) Maneja la solicitud de alternativas de comida usando IA.
   * @async
   * @function handleRequestAlternatives
   * @param {MealAlternativeRequestContext} context - Contexto para la solicitud.
   * @returns {Promise<MealAlternative[] | null>} Alternativas o null.
   */
  const handleRequestAlternatives = async (context: MealAlternativeRequestContext): Promise<MealAlternative[] | null> => {
     console.log('[PlanningPage] Requesting alternatives for:', context);
     // const alternatives = await getMealAlternatives(context, userProfile);
     return null;
  };

  /**
   * Maneja la acción de autocompletar la semana con recetas generadas por IA.
   * @async
   */
  const handleAutocompleteWeek = async () => {
    if (!user?.id) {
      setAutocompleteError("Debes iniciar sesión para autocompletar la semana.");
      return;
    }

    setIsAutocompleting(true);
    setAutocompleteError(null);
    setError(null); // Limpiar error general también

    const recipesToGenerate = 7; // Generar 7 recetas (una cena por día)

    try {
      console.log(`[PlanningPage] Iniciando autocompletado para ${recipesToGenerate} recetas...`);
      const result: GenerateRecipesResult = await generateRecipesFromPantry(recipesToGenerate, user.id);
      console.log('[PlanningPage] Resultado de generación:', result);

      if (result.errors.length > 0) {
        // Mostrar el primer error de generación, o un mensaje genérico
        const firstErrorMsg = result.errors[0].message;
        setAutocompleteError(`Error generando recetas: ${firstErrorMsg}${result.errors.length > 1 ? ` (y ${result.errors.length - 1} más)` : ''}`);
        // Continuar para intentar añadir las recetas exitosas si las hay
      }

      if (result.successfulRecipes.length > 0) {
        console.log(`[PlanningPage] ${result.successfulRecipes.length} recetas generadas con éxito. Guardando en planificación...`);
        const mealTypeToAssign: MealType = 'Cena'; // Asignar a la cena por defecto
        const mealUpsertPromises: Promise<PlannedMeal | null>[] = [];

        // Mapear recetas a los días de la semana actual
        result.successfulRecipes.forEach((recipe, index) => {
          if (index < weekDays.length) { // Asegurar que no nos pasemos de días
            const targetDate = weekDays[index];
            const dateStr = format(targetDate, 'yyyy-MM-dd');

            const mealData: UpsertPlannedMealData = {
              plan_date: dateStr,
              meal_type: mealTypeToAssign,
              // Usar datos de la receta generada
              custom_meal_name: recipe.title, // Usar título como nombre
              notes: recipe.description, // Usar descripción como notas
              recipe_id: null, // No estamos guardando la receta completa aún
              // Podríamos añadir ingredientes/instrucciones a las notas si quisiéramos
            };

            console.log(`[PlanningPage] Preparando para guardar comida para ${dateStr} - ${mealTypeToAssign}: ${recipe.title}`);
            // Usamos upsert directamente, asumiendo que queremos sobrescribir si ya existe algo para esa cena
            // Podríamos añadir lógica para verificar si el slot está vacío antes
            mealUpsertPromises.push(upsertPlannedMeal(mealData));
          }
        });

        const settledUpserts = await Promise.allSettled(mealUpsertPromises);
        console.log('[PlanningPage] Resultados de guardar comidas:', settledUpserts);

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
          console.log(`[PlanningPage] ${newlyAddedMeals.length} comidas añadidas/actualizadas con éxito.`);
          // Actualizar estado local: añadir nuevas y filtrar posibles antiguas sobrescritas
          // Es más simple recargar los datos, pero intentaremos actualizar localmente
          const mealTypesOrder: MealType[] = ['Desayuno', 'Almuerzo', 'Merienda', 'Cena'];
          const updatedMeals = [
            // Mantener comidas que NO son las que acabamos de intentar añadir/sobrescribir
            ...plannedMeals.filter(meal => {
              const isTargetSlot = weekDays.some((day, idx) =>
                format(day, 'yyyy-MM-dd') === meal.plan_date &&
                meal.meal_type === mealTypeToAssign &&
                idx < result.successfulRecipes.length
              );
              return !isTargetSlot;
            }),
            // Añadir las nuevas comidas guardadas
            ...newlyAddedMeals
          ].sort((a, b) =>
            a.plan_date.localeCompare(b.plan_date) || mealTypesOrder.indexOf(a.meal_type) - mealTypesOrder.indexOf(b.meal_type)
          );
          setPlannedMeals(updatedMeals);
        }

        if (saveErrors > 0) {
          const currentError = autocompleteError ? `${autocompleteError}. ` : '';
          setAutocompleteError(`${currentError}Ocurrieron ${saveErrors} error(es) al guardar las comidas en el planificador.`);
        }

      } else if (result.errors.length === recipesToGenerate) {
        // Si todas las generaciones fallaron, el error ya se estableció arriba.
        console.log('[PlanningPage] No se generó ninguna receta con éxito.');
      }

    } catch (err: any) {
      console.error('[PlanningPage] Error inesperado durante el autocompletado:', err);
      setAutocompleteError(`Error inesperado: ${err.message || 'Error desconocido'}`);
    } finally {
      setIsAutocompleting(false);
      console.log('[PlanningPage] Proceso de autocompletado finalizado.');
    }
  };

  /** @constant {MealType[]} mealTypes - Array con los tipos de comida en orden. */
  const mealTypes: MealType[] = ['Desayuno', 'Almuerzo', 'Merienda', 'Cena'];
  /** @constant {string} selectedDateStr - Fecha seleccionada formateada. */
  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  /** @constant {Record<MealType, PlannedMeal[]>} selectedDayMeals - Comidas agrupadas para el día seleccionado (móvil). */
  const selectedDayMeals = mealsByDay ? (mealsByDay[selectedDateStr] || {}) : {}; 

  // --- Componentes de Layout Condicional ---
  /**
   * Renderiza el layout para pantallas móviles/tablets pequeñas.
   * @returns {React.ReactElement}
   */
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

  /**
   * Renderiza el layout de cuadrícula para pantallas de escritorio.
   * @returns {React.ReactElement}
   */
  const renderDesktopLayout = () => (
    <div className="overflow-x-auto w-full max-w-[1200px]"> {/* Contenedor para scroll horizontal */}
      <div className="grid grid-cols-7 grid-rows-[auto_repeat(4,auto)] gap-1 min-w-[900px] border border-border/20 rounded-lg overflow-hidden shadow-sm"> {/* Aumentado min-w */}
      {/* Encabezados */}
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
      {/* Celdas de Comida */}
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
   ); // Fin del renderDesktopLayout

  // --- Renderizado Principal ---
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
          {/* Botón Autocompletar Semana */} 
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={handleAutocompleteWeek} 
            disabled={isAutocompleting || isLoading}
            className="ml-4"
          >
            {isAutocompleting ? <Spinner size="sm" className="mr-2" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Autocompletar Semana
          </Button>
      </div>

      {error && <p className="mb-3 text-red-500 text-center text-sm">{error}</p>}

      {/* Contenido Principal (Carga o Layout Condicional) */}
      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
         // Usar directamente la comparación del breakpoint
         breakpoint === 'mobile' ? renderMobileLayout() : renderDesktopLayout()
      )}

      {/* Modal */}
      <MealFormModal
        isOpen={showModal}
        onClose={handleCloseModal}
        date={selectedDate}
        mealType={selectedMealType}
        mealToEdit={editingMeal}
        userRecipes={userRecipes} // userRecipes es ahora un array vacío constante
        onSave={handleSaveMeal}
        onRequestAlternatives={handleRequestAlternatives}
      />
    </div>
  );
}; // Fin de la definición del componente PlanningPage

export default PlanningPage; // Exportación por defecto