import { useCallback, useMemo, useState } from 'react';
import { addDays, parseISO, startOfWeek } from 'date-fns';
import {
  BarChart3,
  Calendar,
  ChefHat,
  ClipboardList,
  List,
  Loader2,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Repeat,
  Settings,
  ShoppingBasket,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { notifyError, notifyInfo, notifySuccess } from '@/lib/notifications';
import { useShallow } from 'zustand/react/shallow';
import { GenerationConfigModal } from './GenerationConfigModal';
import { TemplatePanel } from './TemplatePanel';
import { usePlanningStore } from '@/stores/planningStore';
import { calculateWeeklyNutrition, compareWithGoals } from '@/features/planning/utils/nutritionalCalculations';
import type { GenerationRequest, MealType, PlanningMode, PlanningView } from '../types';

interface PlanningToolbarProps {
  onAddMeal?: () => void;
  onShowTemplates?: () => void;
  onShowStats?: () => void;
  onShowSettings?: () => void;
  userId?: string;
}

const MEAL_TYPES: MealType[] = ['Desayuno', 'Almuerzo', 'Merienda', 'Cena'];

export function PlanningToolbar({ onAddMeal, onShowTemplates, onShowStats, onShowSettings, userId }: PlanningToolbarProps) {
  const [showTemplatePanel, setShowTemplatePanel] = useState(false);
  const [showGenerationModal, setShowGenerationModal] = useState(false);

  const {
    ui,
    generation,
    stats,
    currentRange,
    setView,
    setMode,
    refreshCurrentRange,
    clearCurrentWeek,
    generateCustomMeals,
    repeatLastGeneration,
    generateShoppingListFromCurrentPlan,
    lastGenerationRequest,
    isLoading,
    applyTemplate,
  } = usePlanningStore(
    useShallow((state) => ({
      ui: state.ui,
      generation: state.generation,
      stats: state.stats,
      currentRange: state.currentRange,
      setView: state.setView,
      setMode: state.setMode,
      refreshCurrentRange: state.refreshCurrentRange,
      clearCurrentWeek: state.clearCurrentWeek,
      generateCustomMeals: state.generateCustomMeals,
      repeatLastGeneration: state.repeatLastGeneration,
      generateShoppingListFromCurrentPlan: state.generateShoppingListFromCurrentPlan,
      lastGenerationRequest: state.lastGenerationRequest,
      isLoading: state.isLoading,
      applyTemplate: state.applyTemplate,
    })),
  );

  // Get additional data for calculations
  const plannedMeals = usePlanningStore((state) => state.plannedMeals);
  const nutritionalGoals = usePlanningStore((state) => state.nutritionalGoals);
  const aiStatus = usePlanningStore((state) => state.aiStatus);

  // Calculate derived values with proper memoization
  const missingIngredientsCount = useMemo(
    () =>
      plannedMeals
        .flatMap((meal) => meal.ingredient_status ?? [])
        .filter((status) => !status.available).length,
    [plannedMeals],
  );

  const goalProgress = useMemo(() => {
    if (!nutritionalGoals) return null;
    const weeklyNutrition = calculateWeeklyNutrition(plannedMeals);
    return compareWithGoals(weeklyNutrition.averages, nutritionalGoals);
  }, [plannedMeals, nutritionalGoals]);

  const weeklyNutrition = useMemo(() => {
    return calculateWeeklyNutrition(plannedMeals);
  }, [plannedMeals]);

  const resolvedUserId = userId ?? 'current-user';

  const requiresAiKey = !aiStatus.hasKey;

  const weekStartDate = useMemo(() => {
    if (currentRange.start) {
      return parseISO(`${currentRange.start}T00:00:00`);
    }
    return startOfWeek(new Date(), { weekStartsOn: 1 });
  }, [currentRange.start]);

  const buildWeekDays = useCallback(
    (filter: 'full' | 'weekdays' | 'weekend' = 'full') => {
      const days = Array.from({ length: 7 }).map((_, index) => addDays(weekStartDate, index));
      if (filter === 'weekdays') {
        return days.slice(0, 5).map((day) => day.toISOString().split('T')[0]);
      }
      if (filter === 'weekend') {
        return days.slice(5).map((day) => day.toISOString().split('T')[0]);
      }
      return days.map((day) => day.toISOString().split('T')[0]);
    },
    [weekStartDate],
  );

  const isGenerating = ['analyzing', 'generating', 'optimizing'].includes(generation.status);

  const handleGeneratePlan = () => {
    if (requiresAiKey) {
      notifyInfo('Agregá una clave de Gemini en tu perfil para generar planes automáticos.');
      return;
    }
    setShowGenerationModal(true);
  };

  const handleModalGenerate = async (request: GenerationRequest) => {
    if (requiresAiKey) {
      notifyInfo('Necesitás una clave de Gemini para generar planes.');
      return;
    }
    const result = await generateCustomMeals({ userId: resolvedUserId, request });
    if (result) {
      notifySuccess('Plan generado exitosamente');
    } else {
      notifyError('No se pudo generar el plan');
    }
  };

  const handleQuickGenerate = async (mode: 'full' | 'weekdays' | 'weekend') => {
    if (requiresAiKey) {
      notifyInfo('Configura una clave de Gemini para usar la generación rápida.');
      return;
    }
    const selectedDays = buildWeekDays(mode);
    const request: GenerationRequest = {
      selectedDays,
      selectedMealTypes: MEAL_TYPES,
      autoUsePantryOnly: true,
      balanceMacrosAutomatically: true,
      considerSeason: true,
      creativityLevel: 50,
      specificObjective: mode === 'weekend' ? 'Aprender a cocinar' : 'Comer saludable',
      maxPrepTime: mode === 'weekend' ? 90 : 45,
    };
    const result = await generateCustomMeals({ userId: resolvedUserId, request });
    if (result) {
      notifySuccess('Plan generado con configuración rápida');
    } else {
      notifyError('Ocurrió un problema al generar el plan');
    }
  };

  const handleRepeatGeneration = async () => {
    if (requiresAiKey) {
      notifyInfo('Necesitás una clave de Gemini para repetir la última generación.');
      return;
    }
    if (!lastGenerationRequest) {
      notifyInfo('Aún no hay una generación previa');
      return;
    }
    await repeatLastGeneration(resolvedUserId);
    notifySuccess('Se repitió la última generación');
  };

  const handleGenerateShoppingList = async () => {
    try {
      const result = await generateShoppingListFromCurrentPlan();
      if (result?.length) {
        notifySuccess(`Se añadieron ${result.length} ingredientes a tu lista de compras`);
      } else {
        notifyInfo('Todo listo', {
          description: 'No se detectaron ingredientes faltantes.',
        });
      }
    } catch (error) {
      notifyError('No se pudo generar la lista de compras');
    }
  };

  const handleApplyTemplate = useCallback(
    async (templateId: string): Promise<boolean> => {
      try {
        const success = await applyTemplate(templateId);
        if (success) {
          notifySuccess('Plantilla aplicada correctamente');
          setShowTemplatePanel(false);
          return true;
        } else {
          notifyError('No se pudo aplicar la plantilla seleccionada');
          return false;
        }
      } catch (error) {
        notifyError('Error inesperado al aplicar la plantilla');
        return false;
      }
    },
    [applyTemplate],
  );

  const generationStatusBadge = useMemo(() => {
    switch (generation.status) {
      case 'analyzing':
      case 'generating':
      case 'optimizing':
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            {generation.current_step}
          </Badge>
        );
      case 'complete':
        return (
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
            <ChefHat className="mr-1 h-3 w-3" />
            Plan listo
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-700">
            Error en la generación
          </Badge>
        );
      default:
        return null;
    }
  }, [generation]);

  const handleOpenTemplates = () => {
    setShowTemplatePanel(true);
    onShowTemplates?.();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-border bg-muted/50 p-1">
            <Button
              size="sm"
              variant={ui.currentView === 'week' ? 'default' : 'ghost'}
              onClick={() => setView('week')}
              className="h-9 rounded-md"
            >
              <Calendar className="mr-2 h-4 w-4" />
              Semana
            </Button>
            <Button
              size="sm"
              variant={ui.currentView === 'day' ? 'default' : 'ghost'}
              onClick={() => setView('day')}
              className="h-9 rounded-md"
            >
              <List className="mr-2 h-4 w-4" />
              Día
            </Button>
            <Button
              size="sm"
              variant={ui.currentView === 'dashboard' ? 'default' : 'ghost'}
              onClick={() => setView('dashboard' as PlanningView)}
              className="h-9 rounded-md"
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </div>

          <Button
            size="sm"
            variant={ui.currentMode === 'edit' ? 'default' : 'outline'}
            onClick={() => setMode(ui.currentMode === 'edit' ? ('view' as PlanningMode) : ('edit' as PlanningMode))}
            className="h-9"
          >
            {ui.currentMode === 'edit' ? '✏️ Editar' : '👁️ Ver'}
          </Button>
        </div>

        <div className="flex items-center gap-3">
          {generationStatusBadge}
          {stats && (
            <Badge variant="outline">
              ✅ {stats.total_executed}/{stats.total_planned}
            </Badge>
          )}
          {missingIngredientsCount > 0 && (
            <Badge variant="destructive">
              🛒 {missingIngredientsCount} faltantes
            </Badge>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={handleGeneratePlan}
            disabled={isGenerating || isLoading || requiresAiKey}
            className="h-11 px-6"
          >
            {isGenerating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ChefHat className="mr-2 h-4 w-4" />
            )}
            {isGenerating ? 'Generando...' : 'Generar plan'}
          </Button>

          {!aiStatus.hasKey && (
            <div className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 px-4 py-2 text-sm text-amber-700 shadow-sm">
              <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></div>
              Agregá tu clave de Gemini en Perfil para habilitar la generación automática.
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleGenerateShoppingList}
            >
              <ShoppingBasket className="mr-2 h-4 w-4" />
              Lista de compras
            </Button>

            {onAddMeal && (
              <Button
                variant="outline"
                onClick={onAddMeal}
              >
                <Plus className="mr-2 h-4 w-4" />
                Añadir
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {weeklyNutrition && (
            <Badge variant="outline">
              🔥 {Math.round(weeklyNutrition.averages.calories ?? 0)} kcal
            </Badge>
          )}

          {onShowStats && (
            <Button
              variant="outline"
              onClick={onShowStats}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Stats
            </Button>
          )}
        </div>
      </div>

      {generation.status !== 'idle' && (
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${generation.progress}%` }}
          />
        </div>
      )}

      <TemplatePanel
        isOpen={showTemplatePanel}
        onClose={() => setShowTemplatePanel(false)}
        onApplyTemplate={handleApplyTemplate}
      />

      <GenerationConfigModal
        isOpen={showGenerationModal}
        onClose={() => setShowGenerationModal(false)}
        onGenerate={handleModalGenerate}
        currentWeekStart={weekStartDate}
      />
    </div>
  );
}

export default PlanningToolbar;
