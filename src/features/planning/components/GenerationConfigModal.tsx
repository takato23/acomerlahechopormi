import { useEffect, useMemo, useState } from 'react';
import { addDays, format } from 'date-fns';
import { es as esLocale } from 'date-fns/locale';
import { CalendarDays, ChefHat, Check, Clock, Flame, Settings2, Sparkles, Utensils } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { MealType, GenerationRequest } from '@/features/planning/types';
import { usePlanningStore } from '@/stores/planningStore';
import { useShallow } from 'zustand/react/shallow';
import { notifyInfo } from '@/lib/notifications';

interface GenerationConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (request: GenerationRequest) => Promise<void> | void;
  currentWeekStart: Date;
}

const MEAL_TYPES: MealType[] = ['Desayuno', 'Almuerzo', 'Merienda', 'Cena'];
const OBJECTIVE_OPTIONS = ['Comer saludable', 'Ahorrar dinero', 'Ahorrar tiempo', 'Aprender a cocinar', 'Usar ingredientes de despensa'];
const EQUIPMENT_OPTIONS = ['Horno', 'Microondas', 'Airfryer', 'Batidora', 'Robot de cocina', 'Sartén', 'Olla a presión'];
const DIETARY_MODES = ['Omnívora', 'Vegetariana', 'Vegana', 'Sin gluten', 'Keto'];
const CUISINE_OPTIONS = ['Italiana', 'Mexicana', 'Asiática', 'Mediterránea', 'Argentina', 'Fusión'];

const MIN_CALORIES = 800;
const MAX_CALORIES = 5000;

export const GenerationConfigModal = ({ isOpen, onClose, onGenerate, currentWeekStart }: GenerationConfigModalProps) => {
  const { generationConfig, lastGenerationRequest, plannedMeals, saveGenerationConfig } = usePlanningStore(
    useShallow((state) => ({
      generationConfig: state.generationConfig,
      lastGenerationRequest: state.lastGenerationRequest,
      plannedMeals: state.plannedMeals,
      saveGenerationConfig: state.saveGenerationConfig,
    })),
  );
  const aiStatus = usePlanningStore((state) => state.aiStatus);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, index) => {
      const date = addDays(currentWeekStart, index);
      return {
        value: format(date, 'yyyy-MM-dd'),
        label: format(date, "EEE d 'de' MMM", { locale: esLocale }),
      };
    });
  }, [currentWeekStart]);

  const plannedByDay = useMemo(() => {
    return plannedMeals.reduce<Record<string, number>>((acc, meal) => {
      acc[meal.plan_date] = (acc[meal.plan_date] ?? 0) + 1;
      return acc;
    }, {});
  }, [plannedMeals]);

  const [selectedDays, setSelectedDays] = useState<string[]>(weekDays.map((day) => day.value));
  const [selectedMealTypes, setSelectedMealTypes] = useState<MealType[]>(generationConfig?.defaultMealTypes ?? MEAL_TYPES);
  const [calorieTarget, setCalorieTarget] = useState<number | undefined>(generationConfig?.defaultCalorieTarget);
  const [specificObjective, setSpecificObjective] = useState<string>(generationConfig?.defaultSpecificObjective ?? 'Comer saludable');
  const [prioritizeIngredients, setPrioritizeIngredients] = useState<string[]>(lastGenerationRequest?.prioritizeIngredients ?? []);
  const [avoidIngredients, setAvoidIngredients] = useState<string[]>(lastGenerationRequest?.avoidIngredients ?? []);
  const [maxPrepTime, setMaxPrepTime] = useState<number>(lastGenerationRequest?.maxPrepTime ?? 45);
  const [requireEquipment, setRequireEquipment] = useState<string[]>(lastGenerationRequest?.requireEquipment ?? []);
  const [dietaryMode, setDietaryMode] = useState<string>(lastGenerationRequest?.dietaryMode ?? '');
  const [prioritizeInput, setPrioritizeInput] = useState('');
  const [avoidInput, setAvoidInput] = useState('');
  const [balanceMacrosAutomatically, setBalanceMacrosAutomatically] = useState<boolean>(lastGenerationRequest?.balanceMacrosAutomatically ?? true);
  const [autoUsePantryOnly, setAutoUsePantryOnly] = useState<boolean>(lastGenerationRequest?.autoUsePantryOnly ?? true);
  const [creativityLevel, setCreativityLevel] = useState<number>(lastGenerationRequest?.creativityLevel ?? 50);
  const [avoidRepeatingIngredients, setAvoidRepeatingIngredients] = useState<boolean>(lastGenerationRequest?.avoidRepeatingMainIngredients ?? true);
  const [considerSeason, setConsiderSeason] = useState<boolean>(lastGenerationRequest?.considerSeason ?? true);
  const [autoAddMissingIngredients, setAutoAddMissingIngredients] = useState<boolean>(generationConfig?.autoAddMissingIngredients ?? true);
  const [groupByCategory, setGroupByCategory] = useState<boolean>(generationConfig?.groupByCategory ?? true);
  const [estimateCosts, setEstimateCosts] = useState<boolean>(generationConfig?.estimateCosts ?? false);
  const [cuisineVariety, setCuisineVariety] = useState<string[]>(lastGenerationRequest?.cuisineVariety ?? []);
  const [maxBudgetLevel, setMaxBudgetLevel] = useState<'low' | 'medium' | 'high'>(lastGenerationRequest?.maxBudgetLevel ?? 'medium');

  const requiresAiKey = !aiStatus.hasKey;

  const aiBannerClasses = requiresAiKey
    ? 'border-amber-200 bg-amber-50 text-amber-700'
    : 'border-emerald-200 bg-emerald-50 text-emerald-700';

  const aiBannerMessage = requiresAiKey
    ? 'Necesitás agregar una clave de Gemini para generar planes automáticamente.'
    : aiStatus.source === 'user'
      ? 'Las propuestas se generarán con tu clave personal de Gemini.'
      : 'Las propuestas usan la clave del equipo de Gemini como fallback.';

  useEffect(() => {
    if (!isOpen) return;
    if (lastGenerationRequest) {
      setSelectedDays(lastGenerationRequest.selectedDays ?? weekDays.map((day) => day.value));
      setSelectedMealTypes(lastGenerationRequest.selectedMealTypes ?? MEAL_TYPES);
      setCalorieTarget(lastGenerationRequest.calorieTarget);
      setSpecificObjective(lastGenerationRequest.specificObjective ?? 'Comer saludable');
      setPrioritizeIngredients(lastGenerationRequest.prioritizeIngredients ?? []);
      setAvoidIngredients(lastGenerationRequest.avoidIngredients ?? []);
      setMaxPrepTime(lastGenerationRequest.maxPrepTime ?? 45);
      setRequireEquipment(lastGenerationRequest.requireEquipment ?? []);
      setDietaryMode(lastGenerationRequest.dietaryMode ?? '');
      setBalanceMacrosAutomatically(lastGenerationRequest.balanceMacrosAutomatically ?? true);
      setAutoUsePantryOnly(lastGenerationRequest.autoUsePantryOnly ?? true);
      setCreativityLevel(lastGenerationRequest.creativityLevel ?? 50);
      setAvoidRepeatingIngredients(lastGenerationRequest.avoidRepeatingMainIngredients ?? true);
      setConsiderSeason(lastGenerationRequest.considerSeason ?? true);
      setCuisineVariety(lastGenerationRequest.cuisineVariety ?? []);
      setMaxBudgetLevel(lastGenerationRequest.maxBudgetLevel ?? 'medium');
    } else {
      setSelectedDays(weekDays.map((day) => day.value));
      setSelectedMealTypes(generationConfig?.defaultMealTypes ?? MEAL_TYPES);
      setCalorieTarget(generationConfig?.defaultCalorieTarget);
      setSpecificObjective(generationConfig?.defaultSpecificObjective ?? 'Comer saludable');
      setPrioritizeIngredients([]);
      setAvoidIngredients([]);
      setMaxPrepTime(45);
      setRequireEquipment([]);
      setDietaryMode('');
      setBalanceMacrosAutomatically(true);
      setAutoUsePantryOnly(true);
      setCreativityLevel(50);
      setAvoidRepeatingIngredients(true);
      setConsiderSeason(true);
      setCuisineVariety([]);
      setMaxBudgetLevel('medium');
    }
    setAutoAddMissingIngredients(generationConfig?.autoAddMissingIngredients ?? true);
    setGroupByCategory(generationConfig?.groupByCategory ?? true);
    setEstimateCosts(generationConfig?.estimateCosts ?? false);
    setPrioritizeInput('');
    setAvoidInput('');
  }, [generationConfig, isOpen, lastGenerationRequest, weekDays]);

  const toggleDay = (value: string) => {
    setSelectedDays((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value].sort(),
    );
  };

  const toggleMealType = (mealType: MealType) => {
    setSelectedMealTypes((prev) =>
      prev.includes(mealType) ? prev.filter((item) => item !== mealType) : [...prev, mealType],
    );
  };

  const toggleEquipment = (equipment: string) => {
    setRequireEquipment((prev) =>
      prev.includes(equipment) ? prev.filter((item) => item !== equipment) : [...prev, equipment],
    );
  };

  const toggleCuisine = (cuisine: string) => {
    setCuisineVariety((prev) =>
      prev.includes(cuisine) ? prev.filter((item) => item !== cuisine) : [...prev, cuisine],
    );
  };

  const addPrioritizedIngredient = () => {
    if (!prioritizeInput.trim()) return;
    setPrioritizeIngredients((prev) => Array.from(new Set([...prev, prioritizeInput.trim()])));
    setPrioritizeInput('');
  };

  const addAvoidIngredient = () => {
    if (!avoidInput.trim()) return;
    setAvoidIngredients((prev) => Array.from(new Set([...prev, avoidInput.trim()])));
    setAvoidInput('');
  };

  const caloriesOutOfRange =
    calorieTarget !== undefined && (calorieTarget < MIN_CALORIES || calorieTarget > MAX_CALORIES);
  const missingSelections = selectedDays.length === 0 || selectedMealTypes.length === 0;

  const totalMealsPlanned = selectedDays.length * selectedMealTypes.length;

  const handleSaveConfig = () => {
    saveGenerationConfig({
      defaultMealTypes: selectedMealTypes,
      defaultCalorieTarget: calorieTarget,
      defaultSpecificObjective: specificObjective,
      autoAddMissingIngredients,
      groupByCategory,
      estimateCosts,
      autoGenerateOnSunday: generationConfig?.autoGenerateOnSunday ?? false,
      notifyMissingIngredients: generationConfig?.notifyMissingIngredients ?? true,
      defaultDietaryMode: dietaryMode || undefined,
    });
  };

  const handleGenerate = async () => {
    if (missingSelections || caloriesOutOfRange) return;
    if (requiresAiKey) {
      notifyInfo('Agregá una clave de Gemini en Perfil > Preferencias para generar tu plan.');
      return;
    }
    const request: GenerationRequest = {
      selectedDays: [...selectedDays].sort(),
      selectedMealTypes,
      calorieTarget,
      specificObjective,
      prioritizeIngredients,
      avoidIngredients,
      maxPrepTime,
      requireEquipment,
      dietaryMode: dietaryMode || undefined,
      autoUsePantryOnly,
      balanceMacrosAutomatically,
      creativityLevel,
      avoidRepeatingMainIngredients: avoidRepeatingIngredients,
      considerSeason,
      cuisineVariety,
      maxBudgetLevel,
    };
    await onGenerate(request);
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <ChefHat className="h-6 w-6 text-primary" />
            Generación personalizada
          </DialogTitle>
          <DialogDescription>
            Configurá tus preferencias para generar un plan holístico que use tus objetivos, despensa y restricciones actuales.
          </DialogDescription>
          <div className={`mt-3 flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium ${aiBannerClasses}`}>
            <Sparkles className="h-4 w-4" />
            <span>{aiBannerMessage}</span>
          </div>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CalendarDays className="h-5 w-5" />
                  Días y comidas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => setSelectedDays(weekDays.map((day) => day.value))}>
                    Toda la semana
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setSelectedDays(weekDays.filter((_day, index) => index < 5).map((day) => day.value))
                    }
                  >
                    Días laborales
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setSelectedDays(weekDays.filter((_day, index) => index >= 5).map((day) => day.value))
                    }
                  >
                    Fin de semana
                  </Button>
                </div>

                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {weekDays.map((day) => {
                    const isSelected = selectedDays.includes(day.value);
                    const plannedCount = plannedByDay[day.value] ?? 0;
                    return (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleDay(day.value)}
                        className={cn(
                          'flex flex-col rounded-lg border p-3 text-left transition focus:outline-none focus:ring-2 focus:ring-primary',
                          isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted/60',
                        )}
                      >
                        <span className="text-sm font-semibold">{day.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {plannedCount > 0 ? `${plannedCount} comidas planificadas` : 'Sin plan actual'}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <Separator />

                <div className="flex flex-wrap gap-2">
                  {MEAL_TYPES.map((mealType) => {
                    const isActive = selectedMealTypes.includes(mealType);
                    return (
                      <Button
                        key={mealType}
                        variant={isActive ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleMealType(mealType)}
                        className="capitalize"
                      >
                        {isActive && <Check className="mr-2 h-4 w-4" />}
                        {mealType}
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Flame className="h-5 w-5" />
                  Objetivos y restricciones
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="calorieTarget">Calorías objetivo (kcal)</Label>
                    <Input
                      id="calorieTarget"
                      type="number"
                      min={MIN_CALORIES}
                      max={MAX_CALORIES}
                      value={calorieTarget ?? ''}
                      onChange={(event) =>
                        setCalorieTarget(event.target.value ? Number(event.target.value) : undefined)
                      }
                      placeholder="Ej: 2000"
                    />
                    {caloriesOutOfRange && (
                      <p className="text-xs text-destructive">
                        El objetivo debe estar entre {MIN_CALORIES} y {MAX_CALORIES} kcal.
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="objective">Objetivo principal</Label>
                    <div className="grid gap-2">
                      {OBJECTIVE_OPTIONS.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setSpecificObjective(option)}
                          className={cn(
                            'rounded-md border px-3 py-2 text-left text-sm transition',
                            specificObjective === option
                              ? 'border-primary bg-primary/5'
                              : 'hover:bg-muted/60',
                          )}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="prepTime">Tiempo máximo de preparación (min)</Label>
                    <div className="mt-2 flex items-center gap-3">
                      <Input
                        id="prepTime"
                        type="range"
                        min={15}
                        max={180}
                        step={5}
                        value={maxPrepTime}
                        onChange={(event) => setMaxPrepTime(Number(event.target.value))}
                      />
                      <span className="w-10 text-sm font-semibold">{maxPrepTime}</span>
                    </div>
                  </div>
                  <div>
                    <Label>Modo dietético</Label>
                    <div className="mt-2 grid gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDietaryMode('')}
                        className={cn({ 'border-primary bg-primary/5': !dietaryMode })}
                      >
                        Libre
                      </Button>
                      {DIETARY_MODES.map((mode) => (
                        <Button
                          key={mode}
                          variant="outline"
                          size="sm"
                          onClick={() => setDietaryMode(mode)}
                          className={cn('justify-start', {
                            'border-primary bg-primary/5': dietaryMode === mode,
                          })}
                        >
                          {mode}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                <Accordion type="multiple" className="w-full">
                  <AccordionItem value="macros">
                    <AccordionTrigger>Configuración nutricional</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-2">
                      <div className="flex items-center justify-between">
                        <Label>Balance automático de macros</Label>
                        <Switch
                          checked={balanceMacrosAutomatically}
                          onCheckedChange={setBalanceMacrosAutomatically}
                        />
                      </div>
                      <div className="grid gap-2 text-xs text-muted-foreground">
                        <span>
                          Cuando está activo, el motor equilibrará proteínas, carbohidratos y grasas de forma automática.
                        </span>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="advanced">
                    <AccordionTrigger>Opciones avanzadas</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-2">
                      <div className="flex items-center justify-between">
                        <Label>Nivel de creatividad</Label>
                        <span className="text-sm font-semibold">{creativityLevel}</span>
                      </div>
                      <Input
                        type="range"
                        min={0}
                        max={100}
                        value={creativityLevel}
                        onChange={(event) => setCreativityLevel(Number(event.target.value))}
                      />

                      <div className="flex items-center justify-between">
                        <Label>Evitar repetir ingredientes principales</Label>
                        <Switch
                          checked={avoidRepeatingIngredients}
                          onCheckedChange={setAvoidRepeatingIngredients}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label>Considerar estación del año</Label>
                        <Switch checked={considerSeason} onCheckedChange={setConsiderSeason} />
                      </div>

                      <div className="space-y-2">
                        <Label>Variedad de cocinas</Label>
                        <div className="flex flex-wrap gap-2">
                          {CUISINE_OPTIONS.map((cuisine) => {
                            const active = cuisineVariety.includes(cuisine);
                            return (
                              <Badge
                                key={cuisine}
                                variant={active ? 'default' : 'outline'}
                                className="cursor-pointer select-none"
                                onClick={() => toggleCuisine(cuisine)}
                              >
                                {cuisine}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Presupuesto máximo</Label>
                        <div className="flex gap-2">
                          {(['low', 'medium', 'high'] as const).map((level) => (
                            <Button
                              key={level}
                              size="sm"
                              variant={maxBudgetLevel === level ? 'default' : 'outline'}
                              onClick={() => setMaxBudgetLevel(level)}
                            >
                              {level === 'low' ? 'Bajo' : level === 'medium' ? 'Medio' : 'Alto'}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Utensils className="h-5 w-5" />
                  Preferencias de ingredientes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Priorizar ingredientes</Label>
                    <div className="flex gap-2">
                      <Input
                        value={prioritizeInput}
                        onChange={(event) => setPrioritizeInput(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault();
                            addPrioritizedIngredient();
                          }
                        }}
                        placeholder="Ej: garbanzos"
                      />
                      <Button type="button" onClick={addPrioritizedIngredient}>
                        Añadir
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {prioritizeIngredients.map((ingredient) => (
                        <Badge
                          key={ingredient}
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() =>
                            setPrioritizeIngredients((prev) => prev.filter((item) => item !== ingredient))
                          }
                        >
                          {ingredient}
                        </Badge>
                      ))}
                      {!prioritizeIngredients.length && (
                        <span className="text-xs text-muted-foreground">Sin prioridades aún</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Evitar ingredientes</Label>
                    <div className="flex gap-2">
                      <Input
                        value={avoidInput}
                        onChange={(event) => setAvoidInput(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault();
                            addAvoidIngredient();
                          }
                        }}
                        placeholder="Ej: frutos secos"
                      />
                      <Button type="button" variant="destructive" onClick={addAvoidIngredient}>
                        Añadir
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {avoidIngredients.map((ingredient) => (
                        <Badge
                          key={ingredient}
                          variant="outline"
                          className="cursor-pointer border-destructive text-destructive"
                          onClick={() =>
                            setAvoidIngredients((prev) => prev.filter((item) => item !== ingredient))
                          }
                        />
                      ))}
                      {!avoidIngredients.length && (
                        <span className="text-xs text-muted-foreground">Sin ingredientes a evitar</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right sidebar - Summary */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resumen de configuración</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Semana</Label>
                  <p className="text-sm text-muted-foreground">
                    {format(currentWeekStart, "dd/MM/yyyy", { locale: esLocale })} - {format(addDays(currentWeekStart, 6), "dd/MM/yyyy", { locale: esLocale })}
                  </p>
                </div>
                <Separator />
                <div>
                  <Label className="text-sm font-medium">Comidas por día</Label>
                  <p className="text-sm text-muted-foreground">{selectedMealTypes.length}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Objetivos nutricionales</Label>
                  <p className="text-sm text-muted-foreground">{specificObjective}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Ingredientes prioritarios</Label>
                  <p className="text-sm text-muted-foreground">{prioritizeIngredients.length}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Ingredientes a evitar</Label>
                  <p className="text-sm text-muted-foreground">{avoidIngredients.length}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {requiresAiKey && (
          <p className="mt-4 text-xs text-amber-600">
            Agregá una clave de Gemini en Perfil &gt; Preferencias para habilitar esta generación.
          </p>
        )}

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleGenerate} disabled={requiresAiKey || missingSelections || caloriesOutOfRange}>
            <ChefHat className="h-4 w-4 mr-2" />
            Generar plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
