import { useCallback, useEffect, useMemo, useState } from 'react';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { Sparkles, CalendarPlus, BookmarkPlus, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/Spinner';
import { useSuggestionStore } from '../stores/suggestionStore';
import { usePantryStore } from '@/stores/pantryStore';
import { useRecipeStore } from '@/stores/recipeStore';
import { usePlanningStore } from '@/stores/planningStore';
import { useAuth } from '@/features/auth/AuthContext';
import { toast } from 'sonner';
import type { MealType } from '@/features/planning/types';
import type { RecipeSuggestion } from '../types';
import { featureFlags } from '@/config/featureFlags';

const mealTypes: MealType[] = ['Desayuno', 'Almuerzo', 'Merienda', 'Cena'];

const SuggestionsPage = () => {
  const [selectedMealType, setSelectedMealType] = useState<MealType>('Almuerzo');
  const [selectedDate, setSelectedDate] = useState<string>(() => format(new Date(), 'yyyy-MM-dd'));
  const [maxTime, setMaxTime] = useState<string>('');
  const [isInitializing, setIsInitializing] = useState(true);

  const { user } = useAuth();

  const pantryItems = usePantryStore((state) => state.items);
  const fetchPantryItems = usePantryStore((state) => state.fetchItems);
  const pantryIsLoading = usePantryStore((state) => state.isLoading);

  const recipes = useRecipeStore((state) => state.recipes);
  const loadRecipes = useRecipeStore((state) => state.loadRecipes);
  const toggleRecipeFavorite = useRecipeStore((state) => state.toggleFavorite);
  const recipesAreLoading = useRecipeStore((state) => state.isLoading);

  const plannedMeals = usePlanningStore((state) => state.plannedMeals);
  const loadPlannedMeals = usePlanningStore((state) => state.loadPlannedMeals);
  const addPlannedMeal = usePlanningStore((state) => state.addPlannedMeal);
  const planningIsLoading = usePlanningStore((state) => state.isLoading);

  const suggestions = useSuggestionStore((state) => state.suggestions);
  const suggestionsAreLoading = useSuggestionStore((state) => state.isLoading);
  const suggestionsError = useSuggestionStore((state) => state.error);
  const lastUpdated = useSuggestionStore((state) => state.lastUpdated);
  const requestSuggestions = useSuggestionStore((state) => state.getSuggestions);
  const clearSuggestionsError = useSuggestionStore((state) => state.clearError);

  const recipesById = useMemo(
    () => new Map(recipes.map((recipe) => [recipe.id, recipe])),
    [recipes],
  );

  const weekWindow = useMemo(() => {
    const baseDate = selectedDate ? new Date(selectedDate) : new Date();
    const start = startOfWeek(baseDate, { weekStartsOn: 1 });
    const end = endOfWeek(baseDate, { weekStartsOn: 1 });
    return {
      start: format(start, 'yyyy-MM-dd'),
      end: format(end, 'yyyy-MM-dd'),
    };
  }, [selectedDate]);

  useEffect(() => {
    if (!featureFlags.aiSuggestions) {
      return;
    }
    if (user) {
      fetchPantryItems();
    }
  }, [user, fetchPantryItems]);

  useEffect(() => {
    if (!featureFlags.aiSuggestions) {
      return;
    }
    if (user?.id && recipes.length === 0 && !recipesAreLoading) {
      loadRecipes(user.id, true);
    }
  }, [user?.id, recipes.length, recipesAreLoading, loadRecipes]);

  useEffect(() => {
    if (!featureFlags.aiSuggestions) {
      return;
    }
    if (user && weekWindow.start && weekWindow.end) {
      loadPlannedMeals(weekWindow.start, weekWindow.end);
    }
  }, [user, weekWindow.start, weekWindow.end, loadPlannedMeals]);

  useEffect(() => {
    if (!featureFlags.aiSuggestions) {
      return;
    }
    if (!pantryIsLoading && !recipesAreLoading && !planningIsLoading) {
      setIsInitializing(false);
    }
  }, [pantryIsLoading, recipesAreLoading, planningIsLoading]);

  useEffect(() => {
    if (suggestionsError) {
      toast.error(suggestionsError);
    }
  }, [suggestionsError]);

  const handleGenerateSuggestions = useCallback(async () => {
    clearSuggestionsError();
    const maxTimeNumber = maxTime ? Number(maxTime) : undefined;
    await requestSuggestions({
      mealType: selectedMealType,
      maxTime: Number.isFinite(maxTimeNumber) ? maxTimeNumber : undefined,
      targetDate: selectedDate,
      context: {
        pantryItems,
        recipes,
        plannedMeals,
      },
    });
  }, [
    clearSuggestionsError,
    maxTime,
    requestSuggestions,
    selectedMealType,
    selectedDate,
    pantryItems,
    recipes,
    plannedMeals,
  ]);

  const handleAddToPlan = useCallback(
    async (suggestion: RecipeSuggestion) => {
      try {
        const planDate = selectedDate || format(new Date(), 'yyyy-MM-dd');
        const payload = suggestion.id
          ? {
              plan_date: planDate,
              meal_type: selectedMealType,
              recipe_id: suggestion.id,
              notes: suggestion.reason ?? suggestion.description ?? undefined,
            }
          : {
              plan_date: planDate,
              meal_type: selectedMealType,
              custom_meal_name: suggestion.title ?? suggestion.name ?? 'Sugerencia IA',
              notes: suggestion.reason ?? suggestion.description ?? undefined,
            };
        const result = await addPlannedMeal(payload);
        if (result) {
          toast.success('Sugerencia añadida al plan semanal');
        } else {
          toast.error('No se pudo añadir la sugerencia al plan');
        }
      } catch (error) {
        console.error('Error añadiendo sugerencia al plan', error);
        toast.error('Ocurrió un error al añadir la sugerencia');
      }
    },
    [addPlannedMeal, selectedDate, selectedMealType],
  );

  const handleToggleFavorite = useCallback(
    async (suggestion: RecipeSuggestion) => {
      if (!suggestion.id) {
        toast.info('Guarda la receta en tu biblioteca para marcarla como favorita.');
        return;
      }
      const recipe = recipesById.get(suggestion.id);
      if (!recipe) {
        toast.error('La receta no está disponible en tu biblioteca.');
        return;
      }
      try {
        await toggleRecipeFavorite(suggestion.id, !recipe.is_favorite);
        toast.success(
          !recipe.is_favorite ? 'Receta marcada como favorita' : 'Receta removida de favoritos',
        );
      } catch (error) {
        console.error('Error actualizando favorito', error);
        toast.error('No se pudo actualizar el estado de favorito');
      }
    },
    [recipesById, toggleRecipeFavorite],
  );

  if (!featureFlags.aiSuggestions) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <PageHeader
          title="Sugerencias con IA"
          description="Activa la bandera de características para habilitar las recomendaciones inteligentes."
          icon={<Sparkles className="h-6 w-6" />}
        />
        <Alert>
          <AlertTitle>Funcionalidad en pruebas</AlertTitle>
          <AlertDescription>
            El experimento de sugerencias con IA está desactivado. Contacta al equipo de producto
            para habilitarlo.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[320px] space-y-4">
        <Spinner size="lg" />
        <p className="text-sm text-muted-foreground">
          Preparando tu contexto de recetas e inventario…
        </p>
      </div>
    );
  }

  const lastUpdatedLabel = lastUpdated
    ? `${format(lastUpdated, 'HH:mm')} hs`
    : 'Aún no has generado sugerencias';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sugerencias con IA"
        description="Combina tu despensa, recetas y plan actual para descubrir qué cocinar hoy."
        icon={<Sparkles className="h-6 w-6 text-primary" />}
      />

      <Card>
        <CardHeader>
          <CardTitle>Configura tu búsqueda</CardTitle>
          <CardDescription>
            Ajusta los parámetros para personalizar las sugerencias generadas.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="target-date">Fecha objetivo</Label>
            <Input
              id="target-date"
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="meal-type">Tipo de comida</Label>
            <Select
              value={selectedMealType}
              onValueChange={(value) => setSelectedMealType(value as MealType)}
            >
              <SelectTrigger id="meal-type">
                <SelectValue placeholder="Selecciona el tipo de comida" />
              </SelectTrigger>
              <SelectContent>
                {mealTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="max-time">Tiempo máximo (minutos)</Label>
            <Input
              id="max-time"
              type="number"
              min={0}
              placeholder="Opcional"
              value={maxTime}
              onChange={(event) => setMaxTime(event.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-muted-foreground">{lastUpdatedLabel}</div>
          <Button
            onClick={handleGenerateSuggestions}
            disabled={suggestionsAreLoading}
            className="inline-flex items-center gap-2"
          >
            {suggestionsAreLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Generar sugerencias
          </Button>
        </CardFooter>
      </Card>

      {suggestionsAreLoading && (
        <div className="flex items-center justify-center py-12">
          <Spinner size="md" />
        </div>
      )}

      {!suggestionsAreLoading && suggestions.length === 0 && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Sin sugerencias todavía</CardTitle>
            <CardDescription>
              Genera sugerencias para ver recomendaciones basadas en tu despensa y tu plan semanal.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {suggestions.map((suggestion) => (
          <Card
            key={suggestion.id ?? suggestion.title ?? suggestion.name}
            className="h-full flex flex-col"
          >
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>{suggestion.title ?? suggestion.name}</CardTitle>
                  {suggestion.reason && (
                    <p className="mt-2 text-sm text-muted-foreground">{suggestion.reason}</p>
                  )}
                </div>
                <Badge variant="secondary">IA</Badge>
              </div>
              {suggestion.estimatedTime && (
                <CardDescription>Listo en {suggestion.estimatedTime}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              {suggestion.description && (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {suggestion.description}
                </p>
              )}
              {suggestion.ingredients?.length ? (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Ingredientes clave
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {suggestion.ingredients.slice(0, 6).map((ingredient) => (
                      <li key={ingredient} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        {ingredient}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </CardContent>
            <CardFooter className="flex flex-col gap-2 sm:flex-row">
              <Button
                className="flex-1"
                onClick={() => handleAddToPlan(suggestion)}
                variant="default"
              >
                <CalendarPlus className="mr-2 h-4 w-4" /> Añadir al plan
              </Button>
              <Button
                className="flex-1"
                onClick={() => handleToggleFavorite(suggestion)}
                variant="outline"
              >
                <BookmarkPlus className="mr-2 h-4 w-4" /> Favorita
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SuggestionsPage;
