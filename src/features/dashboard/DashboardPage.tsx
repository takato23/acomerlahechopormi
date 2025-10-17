import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { getPlannedMeals } from '@/features/planning/planningService';
import type { PlannedMeal } from '@/features/planning/types';
import { usePantryStore } from '@/stores/pantryStore';
import { useShoppingListStore } from '@/stores/shoppingListStore';
import { useDashboardData } from './hooks/useDashboardData';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Lightbulb,
  UtensilsCrossed,
  Clock,
  Users,
  AlertTriangle,
  Sparkles,
  CalendarDays,
  ShoppingCart,
  ChefHat,
  BarChart2,
  ShieldCheck,
  Zap
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { generateSingleRecipe } from '@/features/recipes/generationService';
import type { GeneratedRecipeData } from '@/types/recipeTypes';
import { TodayPlanWidget } from './components/TodayPlanWidget';
import { ShoppingListWidget } from './components/ShoppingListWidget';
import { FavoriteRecipesWidget } from './components/FavoriteRecipesWidget';
import { LowStockWidget } from './components/LowStockWidget';
import { Spinner } from '@/components/ui/Spinner';
import { format } from 'date-fns';
import { DashboardSkeleton } from './components/DashboardSkeleton';

/**
 * Helper para determinar el saludo según la hora del día
 */
const getGreeting = (date: Date): string => {
  const hour = date.getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 20) return "Buenas tardes";
  return "Buenas noches";
};

type Shortcut = {
  label: string;
  description: string;
  to: string;
  icon: LucideIcon;
  badge?: string;
  accent: 'mint' | 'lavender' | 'blush' | 'cream';
};

type HighlightItem = {
  id: string;
  title: string;
  value: string;
  detail: string;
};

/**
 * Página principal del Dashboard.
 */
export function DashboardPage() {
  const { user, profile } = useAuth(); // Obtener user y profile

  // Datos agregados del dashboard para métricas y alertas globales
  const dashboardData = useDashboardData();

  // Estados existentes (para compatibilidad con dashboard actual)
  const [todayMeals, setTodayMeals] = useState<PlannedMeal[]>([]);
  const [isLoadingMeals, setIsLoadingMeals] = useState(true);
  const [errorMeals, setErrorMeals] = useState<string | null>(null);
  const { lowStockItems, isLoadingLowStock, errorLowStock, fetchLowStockItems, items: allPantryItems } = usePantryStore();
  const { items: shoppingListItems, isLoading: isLoadingShoppingList, error: errorShoppingList, fetchItems: fetchShoppingListItems } = useShoppingListStore();
  // Placeholders recetas
  const allRecipes: any[] = [];
  const isLoadingRecipes = false;
  const errorRecipes = null;

  const [suggestion, setSuggestion] = useState<GeneratedRecipeData | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [hasRequestedSuggestion, setHasRequestedSuggestion] = useState(false);
  const [autoLowStockEnabled, setAutoLowStockEnabled] = useState(true);
  const [autoSuggestWeeklyEnabled, setAutoSuggestWeeklyEnabled] = useState(false);

  const today = new Date();
  const todayDateStr = format(today, 'yyyy-MM-dd');
  const greeting = getGreeting(today);

  const pantryIngredientNames = useMemo(
    () =>
      allPantryItems
        .map((item: any) => item?.ingredient?.name || item?.ingredient_name || item?.name || '')
        .map((name: string) => name.trim())
        .filter((name: string) => name.length > 0),
    [allPantryItems],
  );

  const profilePreferences = useMemo(() => {
    const rawProfile = (profile ?? null) as Record<string, any> | null;
    const toStringList = (value: unknown): string[] => {
      if (!value) return [];
      if (Array.isArray(value)) {
        return value
          .map((item) => (typeof item === 'string' ? item.trim() : ''))
          .filter((item): item is string => Boolean(item));
      }
      if (typeof value === 'string') {
        return value
          .split(',')
          .map((item) => item.trim())
          .filter((item) => item.length > 0);
      }
      return [];
    };

    const resolveNumber = (value: unknown): number | undefined =>
      typeof value === 'number' ? value : undefined;

    return {
      dietaryMode:
        (rawProfile?.dietary_preference as string | undefined) ??
        (rawProfile?.dietaryPreference as string | undefined) ??
        undefined,
      maxPrepTime:
        resolveNumber(rawProfile?.max_prep_time) ?? resolveNumber(rawProfile?.maxPrepTime),
      allergies: toStringList(
        rawProfile?.allergies ??
          rawProfile?.allergies_restrictions ??
          rawProfile?.allergiesRestrictions ??
          rawProfile?.dietaryRestrictions,
      ),
      excludedIngredients: toStringList(
        rawProfile?.excluded_ingredients ??
          rawProfile?.excludedIngredients ??
          rawProfile?.dislikedIngredients,
      ),
      cuisinePreferences: toStringList(
        rawProfile?.cuisine_preferences ??
          rawProfile?.cuisinePreferences ??
          rawProfile?.preferredCuisines,
      ),
      availableEquipment: toStringList(
        rawProfile?.available_equipment ?? rawProfile?.availableEquipment,
      ),
    };
  }, [profile]);

  const metrics = dashboardData.metrics;
  const completionRate = metrics.totalMealsPlanned > 0
    ? Math.round((metrics.completedMeals / metrics.totalMealsPlanned) * 100)
    : 0;

  const highlightItems = useMemo<HighlightItem[]>(() => (
    [
      {
        id: 'progress',
        title: 'Progreso semanal',
        value: metrics.totalMealsPlanned > 0 ? `${completionRate}%` : 'Sin plan',
        detail: metrics.totalMealsPlanned > 0
          ? `${metrics.completedMeals} de ${metrics.totalMealsPlanned} comidas confirmadas`
          : 'Genera tu plan semanal para activar seguimiento.',
      },
      {
        id: 'pantry',
        title: 'Ingredientes sensibles',
        value: metrics.expiringItems > 0 ? `${metrics.expiringItems}` : '0',
        detail: `${metrics.lowStockItems} con stock bajo detectado`,
      },
      {
        id: 'shopping',
        title: 'Lista de compras',
        value: metrics.totalShoppingItems > 0 ? `${metrics.totalShoppingItems}` : '0',
        detail: `${shoppingListItems.length} ítems sincronizados`,
      },
    ]
  ), [metrics.totalMealsPlanned, metrics.completedMeals, metrics.expiringItems, metrics.lowStockItems, metrics.totalShoppingItems, completionRate, shoppingListItems.length]);

  const shortcuts = useMemo<Shortcut[]>(() => (
    [
      {
        label: 'Planificación',
        description: 'Organiza tu semana y ajusta recetas',
        to: '/app/planning',
        icon: CalendarDays,
        badge: todayMeals.length ? `${todayMeals.length} comidas hoy` : 'Sin comidas',
        accent: 'mint',
      },
      {
        label: 'Despensa',
        description: 'Controla stock y evita desperdicio',
        to: '/app/pantry',
        icon: ShieldCheck,
        badge: lowStockItems.length ? `${lowStockItems.length} low-stock` : 'Stock estable',
        accent: 'lavender',
      },
      {
        label: 'Compras',
        description: 'Prepara la próxima compra inteligente',
        to: '/app/shopping-list',
        icon: ShoppingCart,
        badge: shoppingListItems.length ? `${shoppingListItems.length} ítems` : 'Sin pendientes',
        accent: 'blush',
      },
      {
        label: 'Recetas',
        description: 'Favoritos y recomendaciones IA',
        to: '/app/recipes',
        icon: ChefHat,
        badge: 'Explorar',
        accent: 'cream',
      },
    ]
  ), [todayMeals.length, lowStockItems.length, shoppingListItems.length]);

  const criticalAlerts = useMemo(() => {
    const alerts: Array<{ id: string; title: string; message: string }> = [];

    if (errorMeals) {
      alerts.push({ id: 'error-meals', title: 'Planificación', message: errorMeals });
    }

    if (errorLowStock) {
      alerts.push({ id: 'error-low-stock', title: 'Despensa', message: errorLowStock });
    }

    if (errorShoppingList) {
      alerts.push({ id: 'error-shopping', title: 'Compras', message: errorShoppingList });
    }

    if (dashboardData.error) {
      alerts.push({ id: 'error-dashboard', title: 'Dashboard', message: dashboardData.error });
    }

    if (!errorLowStock && metrics.lowStockItems > 0) {
      alerts.push({
        id: 'low-stock-summary',
        title: 'Despensa',
        message: `${metrics.lowStockItems} ingredientes necesitan reposición`,
      });
    }

    if (metrics.expiringItems > 0) {
      alerts.push({
        id: 'expiring-items',
        title: 'Caducidad',
        message: `${metrics.expiringItems} ingredientes vencen en 7 días`,
      });
    }

    if (dashboardData.pantryAlerts.length > 0) {
      dashboardData.pantryAlerts.slice(0, 3).forEach((item: any, index: number) => {
        alerts.push({
          id: `pantry-alert-${item.id ?? index}`,
          title: 'Despensa',
          message: `${item.name ?? 'Ingrediente'} está por agotarse`,
        });
      });
    }

    return alerts;
  }, [errorMeals, errorLowStock, errorShoppingList, dashboardData.error, dashboardData.pantryAlerts, metrics.lowStockItems, metrics.expiringItems]);

  const hasAlerts = criticalAlerts.length > 0;

  const automationOptions = useMemo(
    () => [
      {
        id: 'auto-low-stock',
        label: 'Autocompletar low-stock',
        description: 'Añade automáticamente faltantes detectados a tu lista de compras.',
        checked: autoLowStockEnabled,
        onCheckedChange: setAutoLowStockEnabled,
        icon: ShieldCheck,
      },
      {
        id: 'auto-suggest-plan',
        label: 'Sugerir plan semanal',
        description: 'Recibe una propuesta IA cada lunes con base en tu despensa y preferencias.',
        checked: autoSuggestWeeklyEnabled,
        onCheckedChange: setAutoSuggestWeeklyEnabled,
        icon: Zap,
      },
    ],
    [autoLowStockEnabled, autoSuggestWeeklyEnabled],
  );

  const shortcutAccentClass: Record<Shortcut['accent'], string> = useMemo(
    () => ({
      mint: 'tint-primary',
      lavender: 'tint-secondary',
      blush: 'tint-accent',
      cream: 'tint-cream',
    }),
    [],
  );

  // --- Effects ---
  useEffect(() => {
    setIsLoadingMeals(true);
    setErrorMeals(null);
    getPlannedMeals(todayDateStr, todayDateStr)
      .then(meals => setTodayMeals(meals))
      .catch(err => {
        console.error("Error loading today's meals:", err);
        setErrorMeals("Error al cargar plan de hoy.");
      })
      .finally(() => setIsLoadingMeals(false));
  }, [todayDateStr]);

  useEffect(() => {
    if (allPantryItems.length === 0 && !isLoadingLowStock) {
      fetchLowStockItems();
    } else if (allPantryItems.length > 0 && lowStockItems.length === 0 && !isLoadingLowStock) {
      fetchLowStockItems(); // Recargar si hay items pero no low stock (puede haber cambiado el threshold)
    }
  }, [allPantryItems.length, lowStockItems.length, isLoadingLowStock, fetchLowStockItems]);

  useEffect(() => {
    if (shoppingListItems.length === 0 && !isLoadingShoppingList) {
      fetchShoppingListItems();
    }
  }, [shoppingListItems.length, isLoadingShoppingList, fetchShoppingListItems]);

  // --- Memos ---
  const favoriteRecipes = useMemo(() => [], []); // Siempre vacío por ahora

  // --- Handlers ---
  const handleSuggestRecipe = useCallback(async () => {
    if (isSuggesting) return;
    setHasRequestedSuggestion(true);

    if (!user?.id) {
      setSuggestionError('Necesitás iniciar sesión para obtener una sugerencia.');
      setSuggestion(null);
      return;
    }

    if (pantryIngredientNames.length === 0) {
      setSuggestionError('Añadí ingredientes a tu despensa para generar una propuesta.');
      setSuggestion(null);
      return;
    }

    try {
      setIsSuggesting(true);
      setSuggestionError(null);

      const result = await generateSingleRecipe({
        userId: user.id,
        pantryIngredients: pantryIngredientNames,
        prioritizeIngredients: [],
        expiringIngredients: [],
        creativityLevel: 60,
        maxPrepTime: profilePreferences.maxPrepTime,
        cuisinePreferences: profilePreferences.cuisinePreferences,
        avoidIngredients: profilePreferences.excludedIngredients,
        availableEquipment: profilePreferences.availableEquipment,
        allergies: profilePreferences.allergies,
        dietaryMode: profilePreferences.dietaryMode,
        autoUsePantryOnly: true,
      });

      if ('error' in result) {
        setSuggestion(null);
        setSuggestionError(result.error ?? 'No pudimos generar la receta.');
        return;
      }

      setSuggestion(result);
    } catch (error) {
      console.error('Error generando receta sugerida:', error);
      setSuggestionError('Ocurrió un error inesperado al generar la receta.');
      setSuggestion(null);
    } finally {
      setIsSuggesting(false);
    }
  }, [
    isSuggesting,
    user?.id,
    pantryIngredientNames,
    profilePreferences.maxPrepTime,
    profilePreferences.cuisinePreferences,
    profilePreferences.excludedIngredients,
    profilePreferences.availableEquipment,
    profilePreferences.allergies,
    profilePreferences.dietaryMode,
  ]);

  const handleSuggestAnother = useCallback(() => {
    handleSuggestRecipe();
  }, [handleSuggestRecipe]);

  const renderSuggestionDetails = () => {
    if (!suggestion) return null;

    const totalMinutes =
      (suggestion.prepTimeMinutes ?? 0) + (suggestion.cookTimeMinutes ?? 0) || null;
    const displayIngredients = suggestion.ingredients.slice(0, 5);
    const hasMoreIngredients = suggestion.ingredients.length > displayIngredients.length;
    const displayInstructions = suggestion.instructions.slice(0, 3);
    const hasMoreInstructions = suggestion.instructions.length > displayInstructions.length;

    return (
      <div className="w-full rounded-2xl card-pastel dark:card-pastel-dark border border-white/50 dark:border-white/10 p-5 space-y-4 shadow-custom-md">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-primary">
            <UtensilsCrossed className="h-5 w-5" />
            <h3 className="text-xl font-semibold">{suggestion.title}</h3>
          </div>
          {suggestion.description && (
            <p className="text-sm text-muted-foreground">{suggestion.description}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground/90">
          {totalMinutes ? (
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1">
              <Clock className="h-4 w-4 text-primary" aria-hidden="true" />
              <span>{totalMinutes} min</span>
            </div>
          ) : null}
          {suggestion.servings ? (
            <div className="inline-flex items-center gap-2 rounded-full bg-secondary/30 px-3 py-1">
              <Users className="h-4 w-4 text-secondary-foreground" aria-hidden="true" />
              <span>{suggestion.servings} porciones</span>
            </div>
          ) : null}
          {suggestion.difficultyLevel ? (
            <div className="inline-flex items-center gap-2 rounded-full bg-accent/25 px-3 py-1">
              <Lightbulb className="h-4 w-4 text-accent-foreground" aria-hidden="true" />
              <span>Dificultad {suggestion.difficultyLevel}</span>
            </div>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-foreground/90">
              Ingredientes clave
            </h4>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              {displayIngredients.map((ingredient, index) => (
                <li key={`${ingredient.name}-${index}`} className="flex gap-2">
                  <span className="shrink-0 text-primary">•</span>
                  <span>
                    {ingredient.quantity
                      ? `${ingredient.quantity}${ingredient.unit ? ` ${ingredient.unit}` : ''} `
                      : ''}
                    {ingredient.name}
                  </span>
                </li>
              ))}
              {hasMoreIngredients && (
                <li className="text-xs italic text-muted-foreground/70">
                  + {suggestion.ingredients.length - displayIngredients.length} ingredientes más
                </li>
              )}
            </ul>
          </div>
          <div>
            <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-foreground/90">
              Pasos iniciales
            </h4>
            <ol className="list-decimal list-inside space-y-1.5 text-sm text-muted-foreground">
              {displayInstructions.map((step, index) => (
                <li key={`${index}-${step.slice(0, 10)}`}>{step}</li>
              ))}
              {hasMoreInstructions && (
                <li className="text-xs italic text-muted-foreground/70">
                  Continúa con {suggestion.instructions.length} pasos en total.
                </li>
              )}
            </ol>
          </div>
        </div>
      </div>
    );
  };

  const isInitialLoading =
    isLoadingMeals &&
    isLoadingLowStock &&
    isLoadingShoppingList &&
    dashboardData.isLoading &&
    todayMeals.length === 0 &&
    lowStockItems.length === 0 &&
    shoppingListItems.length === 0;

  if (isInitialLoading) {
    return (
      <div className="relative min-h-screen pb-12">
        <div className="absolute inset-0 bg-gradient-subtle" aria-hidden="true" />
        <div className="relative container-custom py-10">
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  // --- Render ---
  return (
    <div className="relative min-h-screen pb-12">
      <div className="absolute inset-0 bg-gradient-subtle" aria-hidden="true" />
      <div className="relative container-custom py-8 lg:py-10 space-y-8">
        <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="relative overflow-hidden rounded-3xl card-pastel dark:card-pastel-dark shadow-card-pastel px-6 sm:px-8 py-7">
            <div className="absolute inset-0 bg-gradient-primary opacity-60" aria-hidden="true" />
            <div className="absolute right-6 -top-10 h-32 w-32 rounded-full bg-white/40 blur-3xl" aria-hidden="true" />
            <div className="relative flex flex-col gap-6">
              <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-muted-foreground/80 shadow-custom-sm">
                    <Sparkles className="h-3.5 w-3.5" /> Smart Hub
                  </div>
                  <div className="space-y-2">
                    <h1 className="text-3xl sm:text-4xl font-semibold text-foreground leading-tight">
                      {greeting}, {profile?.username || 'Chef'}
                    </h1>
                    <p className="text-sm sm:text-base text-muted-foreground max-w-xl">
                      Resume tu semana culinaria, prioriza alertas y activa automatizaciones para cocinar sin fricciones.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="badge-urgent border-0 px-3 py-1 text-xs font-medium uppercase tracking-wide">
                      Urgente · {hasAlerts ? `${criticalAlerts.length} alertas` : 'al día'}
                    </Badge>
                    <Badge className="badge-health border-0 px-3 py-1 text-xs font-medium uppercase tracking-wide">
                      Salud · {profilePreferences.dietaryMode ?? 'Libre'}
                    </Badge>
                    <Badge className="badge-savings border-0 px-3 py-1 text-xs font-medium uppercase tracking-wide">
                      Ahorro · {metrics.totalShoppingItems} ítems
                    </Badge>
                  </div>
                </div>
                <div className="w-full max-w-sm rounded-2xl bg-white/75 dark:bg-background/70 border border-white/50 dark:border-white/10 shadow-custom-sm p-4 space-y-4">
                  <h2 className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground flex items-center gap-2">
                    Automatizaciones
                  </h2>
                  <div className="space-y-4">
                    {automationOptions.map((automation) => (
                      <label key={automation.id} className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <automation.icon className="h-4 w-4 text-primary/70" />
                            {automation.label}
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {automation.description}
                          </p>
                        </div>
                        <Switch
                          checked={automation.checked}
                          onCheckedChange={automation.onCheckedChange}
                          aria-label={automation.label}
                        />
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {shortcuts.map((shortcut) => (
                  <Link
                    key={shortcut.label}
                    to={shortcut.to}
                    className="group relative overflow-hidden rounded-2xl card-pastel dark:card-pastel-dark border border-white/50 dark:border-white/10 shadow-custom-sm px-4 py-4 hover-float focus-ring"
                    aria-label={`Ir a ${shortcut.label}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`flex h-10 w-10 items-center justify-center rounded-2xl shadow-pill ${shortcutAccentClass[shortcut.accent]}`}>
                        <shortcut.icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground leading-tight">{shortcut.label}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{shortcut.description}</p>
                      </div>
                    </div>
                    {shortcut.badge ? (
                      <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary">
                        {shortcut.badge}
                      </span>
                    ) : null}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl card-pastel dark:card-pastel-dark shadow-card-pastel border border-white/50 dark:border-white/10 p-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                Highlights diarios
              </div>
              <div className="mt-4 space-y-4">
                {highlightItems.map((item) => (
                  <div key={item.id} className="rounded-2xl bg-white/65 dark:bg-background/70 border border-white/50 dark:border-white/10 px-4 py-3 shadow-custom-sm">
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{item.title}</p>
                    <p className="mt-1 text-2xl font-semibold text-foreground">{item.value}</p>
                    <p className="text-sm text-muted-foreground">{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="rounded-3xl card-pastel dark:card-pastel-dark shadow-card-pastel border border-white/50 dark:border-white/10 p-6"
              role="region"
              aria-live="polite"
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                Alertas críticas
              </div>
              <div className="mt-4 space-y-3">
                {hasAlerts ? (
                  criticalAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="rounded-2xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive shadow-custom-sm"
                    >
                      <p className="font-semibold">{alert.title}</p>
                      <p className="text-destructive/80">{alert.message}</p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl bg-primary/10 border border-primary/20 px-4 py-4 text-sm text-primary shadow-custom-sm">
                    No hay alertas pendientes. ¡Buen trabajo!
                  </div>
                )}
              </div>
            </div>
          </aside>
        </section>

        <Card className="relative overflow-hidden rounded-3xl border-0 card-pastel dark:card-pastel-dark shadow-card-pastel">
          <div className="absolute inset-0 bg-gradient-secondary opacity-40" aria-hidden="true" />
          <CardHeader className="relative border-none pb-0">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl tint-accent shadow-pill">
                  <Lightbulb className="h-5 w-5" />
                </span>
                <div className="space-y-1">
                  <CardTitle className="text-2xl font-semibold text-foreground">¿Qué cocino hoy?</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Usa tus ingredientes y preferencias guardadas para inspirarte con una propuesta IA.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={handleSuggestRecipe} disabled={isSuggesting}>
                  {isSuggesting ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Pensando...
                    </>
                  ) : (
                    'Generar con mi despensa'
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSuggestAnother}
                  disabled={isSuggesting || !suggestion}
                >
                  Probar otra
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative space-y-6 pt-4">
            {suggestionError ? (
              <div className="rounded-2xl bg-destructive/10 border border-destructive/20 px-4 py-4 text-sm text-destructive shadow-custom-sm">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">{suggestionError}</span>
                </div>
              </div>
            ) : null}

            {isSuggesting ? (
              <div className="flex flex-col items-center justify-center gap-3 p-10 text-center">
                <Spinner />
                <p className="text-sm text-muted-foreground">
                  Generando una propuesta deliciosa basada en tu despensa...
                </p>
              </div>
            ) : suggestion ? (
              renderSuggestionDetails()
            ) : hasRequestedSuggestion ? (
              <div className="rounded-2xl border border-dashed border-border/40 bg-muted/10 p-6 text-center text-sm text-muted-foreground">
                No se generó ninguna receta. Ajustá tus ingredientes o probá nuevamente con más variedad.
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border/50 bg-muted/10 p-6 text-center text-sm text-muted-foreground">
                Tocá "Generar con mi despensa" para recibir una sugerencia utilizando tus ingredientes actuales.
              </div>
            )}
          </CardContent>
        </Card>

        <section className="grid gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          <div className="h-full">
            {isLoadingMeals ? (
              <div className="flex h-full min-h-[220px] items-center justify-center rounded-3xl card-pastel dark:card-pastel-dark border border-white/50 dark:border-white/10 shadow-card-pastel">
                <Spinner />
              </div>
            ) : (
              <TodayPlanWidget meals={todayMeals} today={today} />
            )}
          </div>
          <div className="h-full">
            <ShoppingListWidget
              itemCount={shoppingListItems.length}
              isLoading={isLoadingShoppingList}
              error={errorShoppingList}
            />
          </div>
          <div className="h-full">
            <LowStockWidget
              lowStockItems={lowStockItems}
              isLoading={isLoadingLowStock}
              error={errorLowStock}
            />
          </div>
          <div className="lg:col-span-2 xl:col-span-3 h-full">
            <FavoriteRecipesWidget
              favoriteRecipes={favoriteRecipes}
              isLoading={isLoadingRecipes}
              error={errorRecipes}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
