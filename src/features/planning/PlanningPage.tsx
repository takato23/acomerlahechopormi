import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { addWeeks, endOfWeek, format, startOfWeek } from 'date-fns';
import { useAuth } from '@/features/auth/AuthContext';
import { usePlanningStore } from '@/stores/planningStore';
import { getUserProfile } from '@/features/user/userService';
import { usePlanningPantrySync } from '@/hooks/usePlanningPantrySync';
import { notifyError, notifyInfo, notifySuccess } from '@/lib/notifications';
import { DayView } from './components/DayView';
import MobileDayView from './components/MobileDayView';
import { NutritionalDashboard } from './components/NutritionalDashboard';
import { AddMealModal } from './components/AddMealModal';
import { useShoppingListIntegration } from './hooks/useShoppingListIntegration';
import type { GenerationRequest, MealType, PlannedMeal } from './types';
import { AlternativePreviewModal } from './components/AlternativePreviewModal';
import { VisionUploadCollapsible } from './components/VisionUploadCollapsible';
import { es } from 'date-fns/locale';
import { AlertTriangle, BarChart3, ChefHat, ChevronLeft, ChevronRight, Settings, Sparkles, CalendarDays, Plus, PanelLeft, PanelLeftOpen } from 'lucide-react';
import type { VisionInsightNormalized } from '@/types/vision';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlanningSkeleton } from '@/components/common/PlanningSkeleton';
import { TemplatePanel } from './components/TemplatePanel';
import PlanningStatsDialog from './components/PlanningStatsDialog';
import { GenerationConfigModal } from './components/GenerationConfigModal';
import { WeekPlannerGrid } from './components/WeekPlannerGrid';
import { InsightsDock } from './components/InsightsDock';

interface MealModalState {
  open: boolean;
  date: Date;
  mealType: MealType;
  mode: 'create' | 'edit';
  mealId?: string;
  initialName?: string;
  prepTime?: number;
  cookTime?: number;
  difficulty?: 'Fácil' | 'Medio' | 'Difícil';
  notes?: string;
}

interface ManualMealPayload {
  date: string;
  mealType: MealType;
  name: string;
  mode: 'create' | 'edit';
  mealId?: string;
  prepTime?: number;
  cookTime?: number;
  difficulty?: 'Fácil' | 'Medio' | 'Difícil';
  notes?: string;
}


function PlanningPage() {
  const { user } = useAuth();
  const [referenceDate, setReferenceDate] = useState(new Date());
  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [addMealModal, setAddMealModal] = useState<MealModalState>(() => ({
    open: false,
    date: new Date(),
    mealType: 'Almuerzo',
    mode: 'create',
    initialName: '',
    prepTime: undefined,
    cookTime: undefined,
    difficulty: undefined,
    notes: '',
  }));
  const { addMissingIngredients } = useShoppingListIntegration();

  const [showTemplatePanel, setShowTemplatePanel] = useState(false);
  const [showStatsDialog, setShowStatsDialog] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Detectar si es mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Use individual selectors to avoid caching issues
  const ui = usePlanningStore((state) => state.ui);
  const plannedMeals = usePlanningStore((state) => state.plannedMeals);
  const error = usePlanningStore((state) => state.error);
  const nutritionalGoals = usePlanningStore((state) => state.nutritionalGoals);
  const currentRange = usePlanningStore((state) => state.currentRange);
  const preview = usePlanningStore((state) => state.preview);
  const aiStatus = usePlanningStore((state) => state.aiStatus);
  const isLoading = usePlanningStore((state) => state.isLoading);
  const weeklyReport = usePlanningStore((state) => state.weeklyReport);

  // Get functions
  const loadWeek = usePlanningStore((state) => state.loadWeek);
  const syncWithPantry = usePlanningStore((state) => state.syncWithPantry);
  const syncWithRecipes = usePlanningStore((state) => state.syncWithRecipes);
  const setUserProfile = usePlanningStore((state) => state.setUserProfile);
  const addMeal = usePlanningStore((state) => state.addMeal);
  const updateMeal = usePlanningStore((state) => state.updateMeal);
  const deleteMeal = usePlanningStore((state) => state.deleteMeal);
  const markMealExecuted = usePlanningStore((state) => state.markMealExecuted);
  const markMealSkipped = usePlanningStore((state) => state.markMealSkipped);
  const applyVisionInsight = usePlanningStore((state) => state.applyVisionInsight);
  const generateAlternativePreview = usePlanningStore((state) => state.generateAlternativePreview);
  const confirmAlternativePreview = usePlanningStore((state) => state.confirmAlternativePreview);
  const cancelAlternativePreview = usePlanningStore((state) => state.cancelAlternativePreview);
  const applyTemplate = usePlanningStore((state) => state.applyTemplate);
  const loadTemplates = usePlanningStore((state) => state.loadTemplates);
  const generateCustomMeals = usePlanningStore((state) => state.generateCustomMeals);
  const generateStatsStore = usePlanningStore((state) => state.generateStats);
  const generateWeeklyReportStore = usePlanningStore((state) => state.generateWeeklyReport);
  const estimatedWeeklyCost = usePlanningStore((state) => state.estimatedWeeklyCost());
  const goalProgress = usePlanningStore((state) => state.goalProgress());
  const setSelectedDateStore = usePlanningStore((state) => state.setSelectedDate);

  const aiBannerMessage = aiStatus.hasKey
    ? aiStatus.source === 'user'
      ? 'Las propuestas usan IA (Gemini) con tu clave personal.'
      : 'Las propuestas usan IA (Gemini) con la clave del equipo como fallback.'
    : 'Las propuestas usan IA (Gemini). Cargá tu clave en Perfil > Preferencias para habilitar la generación.';

  const selectedDate = ui.selectedDate ?? referenceDate;

  const weeklySummary = useMemo(() => {
    const total = plannedMeals.length;
    const executed = plannedMeals.filter((meal) => meal.status === 'executed').length;
    const missing = plannedMeals.reduce(
      (acc, meal) => acc + (meal.ingredient_status?.filter((item) => !item.available).length ?? 0),
      0,
    );
    const calories = plannedMeals.reduce(
      (acc, meal) => acc + (meal.nutritional_info?.calories ?? 0),
      0,
    );

    return {
      total,
      executed,
      pending: Math.max(total - executed, 0),
      missing,
      calories,
      completion: total ? Math.round((executed / total) * 100) : 0,
    };
  }, [plannedMeals]);

  // Sincronización automática con pantry
  usePlanningPantrySync();

  const handleAddMealRequest = (date?: Date, mealType: MealType = 'Almuerzo') => {
    setAddMealModal({
      open: true,
      date: date ?? referenceDate,
      mealType,
      mode: 'create',
      mealId: undefined,
      initialName: '',
    });
  };

  const handleEditMeal = (meal: PlannedMeal) => {
    setAddMealModal({
      open: true,
      date: new Date(`${meal.plan_date}T00:00:00`),
      mealType: meal.meal_type,
      mode: 'edit',
      mealId: meal.id,
      initialName: meal.custom_title ?? meal.recipes?.title ?? '',
      prepTime: meal.prep_time_minutes,
      cookTime: meal.cook_time_minutes,
      difficulty: meal.difficulty as 'Fácil' | 'Medio' | 'Difícil',
      notes: meal.notes || undefined,
    });
  };

  const handleConfirmAddMeal = async ({ date, mealType, name, mode, mealId, prepTime, cookTime, difficulty, notes }: ManualMealPayload): Promise<boolean> => {
    if (mode === 'edit' && mealId) {
      const existingMeal = plannedMeals.find((item) => item.id === mealId);
      if (!existingMeal) {
        notifyError('No encontramos la comida que querés editar');
        return false;
      }

      try {
        const updated = await updateMeal(mealId, {
          plan_date: date,
          meal_type: mealType,
          recipe_id: existingMeal.recipe_id ?? null,
          custom_title: existingMeal.recipe_id ? undefined : name,
          notes: notes || existingMeal.notes || undefined,
          status: existingMeal.status,
          difficulty: difficulty as any || existingMeal.difficulty,
          prep_time_minutes: prepTime ?? existingMeal.prep_time_minutes,
          cook_time_minutes: cookTime ?? existingMeal.cook_time_minutes,
          nutritional_info: existingMeal.nutritional_info,
        });

        if (updated) {
          notifySuccess('Actualizamos la comida en tu plan');
          return true;
        }

        notifyError('No pudimos actualizar la comida');
        return false;
      } catch (error) {
        console.error('[PlanningPage] Error editando comida', error);
        notifyError('No pudimos actualizar la comida');
        return false;
      }
    }

    try {
      const created = await addMeal({
        plan_date: date,
        meal_type: mealType,
        custom_title: name,
        status: 'confirmed',
        prep_time_minutes: prepTime,
        cook_time_minutes: cookTime,
        difficulty: difficulty as any,
        notes: notes,
      });

      if (created) {
        notifySuccess('Comida añadida al plan');
        return true;
      }
    } catch (error) {
      console.error('[PlanningPage] Error agregando comida', error);
    }

    notifyError('No se pudo registrar la comida. Intenta nuevamente.');
    return false;
  };

  const handleAddMissingIngredients = async (mealId: string) => {
    const meal = plannedMeals.find((item) => item.id === mealId);
    if (!meal) return;
    const missing = meal.ingredient_status?.filter((status) => !status.available) ?? [];
    if (missing.length === 0) {
      notifyInfo('Esta comida ya tiene todos los ingredientes disponibles');
      return;
    }
    try {
      await addMissingIngredients(mealId);
      notifySuccess('Añadimos los faltantes de esa comida a tu lista');
    } catch (error) {
      notifyError('No se pudieron añadir los ingredientes faltantes');
    }
  };

  const handleGenerateAlternative = async (mealId: string) => {
    if (!aiStatus.hasKey) {
      notifyInfo('Agregá tu clave de Gemini en tu perfil para generar alternativas');
      return;
    }

    if (!user?.id) {
      notifyError('Necesitás iniciar sesión para generar alternativas');
      return;
    }

    const meal = plannedMeals.find((item) => item.id === mealId);
    if (!meal) {
      notifyError('No encontramos esa comida en tu plan actual');
      return;
    }

    const result = await generateAlternativePreview({
      userId: user.id,
      mealId,
    });

    if (result) {
      notifySuccess(
        `Propuesta lista para ${meal.recipes?.title ?? meal.custom_title ?? meal.meal_type}`,
      );
    } else {
      const { preview: previewState } = usePlanningStore.getState();
      notifyError(previewState.error ?? 'No se pudo generar una alternativa');
    }
  };

  const handleClosePreview = () => {
    cancelAlternativePreview();
  };

  const handleConfirmPreview = async () => {
    if (!user?.id) {
      notifyError('Iniciá sesión para aplicar la alternativa');
      return;
    }

    const success = await confirmAlternativePreview({ userId: user.id });
    if (success) {
      notifySuccess('Actualizamos la comida con la alternativa seleccionada');
    } else {
      const { preview: previewState } = usePlanningStore.getState();
      notifyError(previewState.error ?? 'No se pudo aplicar la alternativa');
    }
  };

  const closeAddMealModal = () => {
    setAddMealModal((modal) => ({
      ...modal,
      open: false,
      mode: 'create',
      mealId: undefined,
      initialName: '',
      prepTime: undefined,
      cookTime: undefined,
      difficulty: undefined,
      notes: '',
    }));
  };

  const weekRangeLabel = useMemo(() => {
    const start = currentRange.start
      ? new Date(`${currentRange.start}T00:00:00`)
      : startOfWeek(referenceDate, { weekStartsOn: 1 });
    const end = currentRange.end
      ? new Date(`${currentRange.end}T00:00:00`)
      : endOfWeek(referenceDate, { weekStartsOn: 1 });

    return `${format(start, "d 'de' MMMM", { locale: es })} – ${format(end, "d 'de' MMMM yyyy", { locale: es })}`;
  }, [currentRange.end, currentRange.start, referenceDate]);

  const handleDeleteMeal = async (mealId: string) => {
    const success = await deleteMeal(mealId);
    if (success) {
      notifySuccess('Eliminamos la comida del plan');
    } else {
      notifyError('No se pudo eliminar la comida seleccionada');
    }
  };

  const handleToggleMeal = async (mealId: string) => {
    const meal = plannedMeals.find(m => m.id === mealId);
    if (!meal) return;

    const success = meal.status === 'executed'
      ? await markMealSkipped(mealId)
      : await markMealExecuted(mealId);

    if (success) {
      notifySuccess(
        meal.status === 'executed'
          ? 'Comida marcada como pendiente'
          : '¡Comida completada!'
      );
    } else {
      notifyError('No se pudo actualizar el estado de la comida');
    }
  };

  useEffect(() => {
    setAddMealModal((modal) =>
      modal.mode === 'create'
        ? { ...modal, date: referenceDate }
        : modal,
    );
  }, [referenceDate]);

  // Cargar datos iniciales
  useEffect(() => {
    if (!user?.id) return;
    loadWeek(referenceDate).catch((loadError) => {
      console.error('[PlanningPage] Error loading week', loadError);
      notifyError('Error al cargar el plan semanal');
    });
  }, [user?.id, referenceDate, loadWeek]);

  // Cargar perfil de usuario
  useEffect(() => {
    if (!user?.id) return;
    getUserProfile(user.id)
      .then((fetchedProfile) => {
        setUserProfile(fetchedProfile);
      })
      .catch((profileError) => {
        console.warn('[PlanningPage] No se pudo cargar el perfil', profileError);
      });
  }, [setUserProfile, user?.id]);

  useEffect(() => {
    if (showTemplatePanel) {
      loadTemplates();
    }
  }, [loadTemplates, showTemplatePanel]);

  useEffect(() => {
    if (showStatsDialog) {
      generateStatsStore();
      generateWeeklyReportStore();
    }
  }, [generateStatsStore, generateWeeklyReportStore, showStatsDialog]);

  // Sincronizar con recipes (pantry se maneja automáticamente con usePlanningPantrySync)
  useEffect(() => {
    syncWithRecipes();
  }, [syncWithRecipes]);

  // Forzar vista de día en mobile
  const effectiveView = isMobile ? 'day' : ui.currentView;

  const handleDateSelect = (date: Date) => {
    setReferenceDate(date);
    setSelectedDateStore(date);
  };

  const handleAddMeal = () => {
    handleAddMealRequest(selectedDate);
  };

  const handleShowTemplates = () => {
    setShowTemplatePanel(true);
  };

  const handleShowStats = () => {
    setShowStatsDialog(true);
  };

  const handleShowSettings = () => {
    setShowConfigModal(true);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const updated = addWeeks(referenceDate, direction === 'prev' ? -1 : 1);
    setReferenceDate(updated);
    setSelectedDateStore(updated);
  };

  const handleGoToday = () => {
    const today = new Date();
    setReferenceDate(today);
    setSelectedDateStore(today);
  };

  const handleApplyVisionInsight = async (insight: VisionInsightNormalized) => {
    const result = await applyVisionInsight({ insight, date: referenceDate });
    if (result) {
      notifySuccess('Insight aplicado al plan. Podés ajustarlo ahora.');
      handleEditMeal(result);
    } else {
      notifyError('No pudimos aplicar el insight al plan. Intenta nuevamente.');
    }
  };

  const handleApplyTemplate = useCallback(async (templateId: string) => {
    return applyTemplate(templateId);
  }, [applyTemplate]);

  const handleGenerateFromConfig = useCallback(async (request: GenerationRequest) => {
    if (!aiStatus.hasKey) {
      notifyInfo('Agregá una clave de Gemini en tu perfil para generar planes automáticos.');
      return;
    }

    const userId = user?.id ?? 'current-user';
    const result = await generateCustomMeals({ userId, request });
    if (result) {
      notifySuccess('Plan generado con la configuración seleccionada');
    } else {
      notifyError('No se pudo generar el plan con los parámetros indicados');
    }
  }, [aiStatus.hasKey, generateCustomMeals, user?.id]);

  if (isLoading && plannedMeals.length === 0) {
    return (
      <div className="mx-auto w-full max-w-6xl">
        <PlanningSkeleton />
      </div>
    );
  }

  const visionSection = (
    <VisionUploadCollapsible
      onApplyInsight={handleApplyVisionInsight}
      className="mt-0 border-none pt-0"
    />
  );

  return (
    <div className="container-custom py-6 sm:py-8">
      <div className={`grid gap-6 lg:grid-cols-12 lg:min-h-[calc(100vh-8rem)] ${isSidebarCollapsed ? 'lg:grid-cols-1' : ''}`}>
        <section className={`order-2 space-y-6 lg:order-1 lg:self-start ${isSidebarCollapsed ? 'lg:col-span-1' : 'lg:col-span-10'}`}>
          <div className="rounded-custom border border-border/60 bg-gradient-to-br from-background via-background to-muted/20 p-6 shadow-custom space-y-5">
            {/* Header principal con título y acciones principales */}
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="space-y-1">
                <h1 className="text-3xl font-bold text-foreground bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                  🍽️ Planificador semanal
                </h1>
                <p className="text-base text-muted-foreground font-medium">
                  📅 {weekRangeLabel}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                {/* Acción principal */}
                <Button variant="gradient" onClick={handleAddMeal} className="gap-2">
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Añadir comida
                </Button>

                {/* Acciones rápidas */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground hidden sm:inline">
                    Acciones:
                  </span>
                  <Button variant="outline" onClick={handleShowTemplates} className="gap-2">
                    <ChefHat className="h-4 w-4" aria-hidden="true" />
                    Plantillas
                  </Button>
                  <Button variant="outline" onClick={handleShowStats} className="gap-2">
                    <BarChart3 className="h-4 w-4" aria-hidden="true" />
                    Resumen
                  </Button>
                  <Button variant="outline" onClick={handleShowSettings} className="gap-2">
                    <Settings className="h-4 w-4" aria-hidden="true" />
                    Preferencias
                  </Button>
                  <div className="hidden lg:block h-6 w-px bg-border/60 mx-2" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    className="hidden lg:flex gap-2 px-3"
                    aria-label={isSidebarCollapsed ? 'Expandir panel lateral' : 'Colapsar panel lateral'}
                  >
                    {isSidebarCollapsed ? (
                      <PanelLeft className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
                    )}
                    <span className="hidden xl:inline">
                      {isSidebarCollapsed ? 'Mostrar' : 'Ocultar'}
                    </span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Barra de navegación y métricas */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-muted/30 border border-border/40">
              {/* Navegación de semanas */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground mr-2">Navegar:</span>
                <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-background/50 px-1 py-1 shadow-sm">
                  <Button variant="ghost" size="sm" className="h-8 w-8 hover:bg-primary/10" onClick={() => navigateWeek('prev')}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="h-4 w-px bg-border/60 mx-1" />
                  <Button variant="ghost" size="sm" className="h-8 gap-2 px-3 hover:bg-primary/10" onClick={handleGoToday}>
                    <CalendarDays className="h-4 w-4" />
                    Hoy
                  </Button>
                  <div className="h-4 w-px bg-border/60 mx-1" />
                  <Button variant="ghost" size="sm" className="h-8 w-8 hover:bg-primary/10" onClick={() => navigateWeek('next')}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Métricas del progreso */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span className="font-medium">{weeklySummary.executed}/{weeklySummary.total || 0}</span>
                    <span className="text-muted-foreground">completadas</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                    <span className="font-medium">{weeklySummary.calories}</span>
                    <span className="text-muted-foreground">kcal</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="font-medium">{weeklySummary.missing}</span>
                    <span className="text-muted-foreground">faltantes</span>
                  </div>
                </div>

                {/* Barra de progreso visual */}
                <div className="flex items-center gap-2 min-w-[120px]">
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${weeklySummary.completion}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">{weeklySummary.completion}%</span>
                </div>
              </div>
            </div>

            {!aiStatus.hasKey && (
              <div className="flex items-start gap-3 rounded-lg border border-amber-200/60 bg-gradient-to-r from-amber-50/80 to-orange-50/40 px-4 py-3 text-sm">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                    <Sparkles className="h-3.5 w-3.5 text-white" />
                  </div>
                </div>
                <div className="flex-1 space-y-1">
                  <p className="font-medium text-amber-800">🤖 Potencia tu planificación con IA</p>
                  <p className="text-amber-700/90 leading-relaxed">
                    Agregá tu clave de Gemini en <span className="font-medium">Perfil → Preferencias</span> para generar planes automáticos y alternativas inteligentes.
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 rounded-custom border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {effectiveView === 'week' && isMobile && (
              <MobileDayView
                selectedDate={selectedDate}
                onDateChange={handleDateSelect}
                onAddMeal={handleAddMealRequest}
                onEditMeal={handleEditMeal}
                onDeleteMeal={handleDeleteMeal}
                onToggleMeal={handleToggleMeal}
                meals={plannedMeals}
              />
            )}

            {effectiveView === 'week' && !isMobile && (
              <WeekPlannerGrid
                referenceDate={referenceDate}
                selectedDate={selectedDate}
                meals={plannedMeals}
                onSelectDate={handleDateSelect}
                onAddMeal={handleAddMealRequest}
                onToggleMeal={handleToggleMeal}
                onAddMissingIngredients={handleAddMissingIngredients}
                onGenerateAlternative={handleGenerateAlternative}
                onEditMeal={handleEditMeal}
                onDeleteMeal={handleDeleteMeal}
              />
            )}

            {effectiveView === 'day' && isMobile && (
              <MobileDayView
                selectedDate={selectedDate}
                onDateChange={handleDateSelect}
                onAddMeal={handleAddMealRequest}
                onEditMeal={handleEditMeal}
                onDeleteMeal={handleDeleteMeal}
                onToggleMeal={handleToggleMeal}
                meals={plannedMeals}
              />
            )}

            {effectiveView === 'day' && !isMobile && (
              <DayViewMemo
                selectedDate={selectedDate}
                onDateChange={handleDateSelect}
                onAddMeal={handleAddMealRequest}
                onAddMissingIngredients={handleAddMissingIngredients}
                onGenerateAlternative={handleGenerateAlternative}
                onEditMeal={handleEditMeal}
                onDeleteMeal={handleDeleteMeal}
              />
            )}

            {effectiveView === 'dashboard' && (
              <NutritionalDashboardMemo
                meals={plannedMeals}
                goals={nutritionalGoals}
                dateRange={{
                  start: currentRange.start ? new Date(`${currentRange.start}T00:00:00`) : referenceDate,
                  end: currentRange.end ? new Date(`${currentRange.end}T00:00:00`) : referenceDate,
                }}
              />
            )}
          </div>
        </section>

        {!isSidebarCollapsed && (
          <InsightsDock
            className="order-1 space-y-2 text-sm lg:order-2 lg:col-span-2 lg:sticky lg:top-24 lg:self-start"
            aiStatus={aiStatus}
            aiBannerMessage={aiBannerMessage}
            estimatedCost={estimatedWeeklyCost}
            goalProgress={goalProgress}
            weeklyReport={weeklyReport}
            visionContent={visionSection}
          />
        )}
      </div>

      <AddMealModal
        isOpen={addMealModal.open}
        onClose={closeAddMealModal}
        onConfirm={handleConfirmAddMeal}
        defaultDate={addMealModal.date}
        defaultMealType={addMealModal.mealType}
        mode={addMealModal.mode}
        mealId={addMealModal.mealId}
        defaultName={addMealModal.initialName ?? ''}
        prepTime={addMealModal.prepTime}
        cookTime={addMealModal.cookTime}
        difficulty={addMealModal.difficulty}
        notes={addMealModal.notes}
      />

      <AlternativePreviewModal
        isOpen={preview.isOpen}
        status={preview.status}
        baseMeal={preview.baseMeal}
        previewMeal={preview.previewMeal}
        error={preview.error}
        onClose={handleClosePreview}
        onConfirm={handleConfirmPreview}
      />

      <TemplatePanel
        isOpen={showTemplatePanel}
        onClose={() => setShowTemplatePanel(false)}
        onApplyTemplate={handleApplyTemplate}
      />

      <PlanningStatsDialog
        isOpen={showStatsDialog}
        onClose={() => setShowStatsDialog(false)}
        stats={null}
        weeklyReport={weeklyReport}
        estimatedCost={estimatedWeeklyCost}
        goalProgress={goalProgress}
      />

      <GenerationConfigModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        onGenerate={handleGenerateFromConfig}
        currentWeekStart={startOfWeek(referenceDate, { weekStartsOn: 1 })}
      />
    </div>
  );
}

// Memoized components to prevent unnecessary re-renders
const DayViewMemo = memo(DayView);
const NutritionalDashboardMemo = memo(NutritionalDashboard);

// Memoized main component
export default memo(PlanningPage);
