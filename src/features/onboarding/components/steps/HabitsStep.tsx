import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { onboardingCopy } from '../../copy';
import { habitsSchema } from '../../validations';
import type { MealTimeKey, ComplexityLevel } from '../../types';

type FormValues = {
  preferredMealTimes: Partial<Record<MealTimeKey, string>>;
  preferredComplexity: ComplexityLevel;
  maxCookingMinutes: number | null;
};

const complexityCopy: Record<ComplexityLevel, { title: string; helper: string }> = {
  simple: {
    title: 'Recetas express',
    helper: 'Preparaciones de pocos pasos, ideales para el día a día.'
  },
  medium: {
    title: 'Equilibradas',
    helper: 'Combinan variedad y técnicas moderadas.'
  },
  complex: {
    title: 'Chef en casa',
    helper: 'Para experimentar y dedicar más tiempo a la cocina.'
  }
};

interface HabitsStepProps {
  mealTimes: Partial<Record<MealTimeKey, string>>;
  complexity: ComplexityLevel | null;
  maxCookingMinutes: number | null;
  onComplete: (values: FormValues) => Promise<void> | void;
  onBack: () => void;
  isSubmitting?: boolean;
}

const mealLabels: Record<MealTimeKey, string> = {
  breakfast: 'Desayuno',
  lunch: 'Almuerzo',
  snack: 'Merienda',
  dinner: 'Cena'
};

export function HabitsStep({
  mealTimes,
  complexity,
  maxCookingMinutes,
  onComplete,
  onBack,
  isSubmitting
}: HabitsStepProps) {
  const defaultValues = useMemo<FormValues>(
    () => ({
      preferredMealTimes: mealTimes ?? {},
      preferredComplexity: complexity ?? 'medium',
      maxCookingMinutes: maxCookingMinutes ?? null
    }),
    [complexity, maxCookingMinutes, mealTimes]
  );

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(habitsSchema),
    defaultValues
  });

  const submitting = Boolean(isSubmitting);

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={handleSubmit(async (values) => {
        await onComplete(values);
      })}
    >
      <p className="text-sm text-muted-foreground">{onboardingCopy.habitsHelper}</p>
      <div className="grid gap-4 md:grid-cols-2">
        {(Object.keys(mealLabels) as MealTimeKey[]).map((mealKey) => (
          <div key={mealKey} className="space-y-2">
            <Label htmlFor={`meal-${mealKey}`}>{mealLabels[mealKey]}</Label>
            <Input
              id={`meal-${mealKey}`}
              type="time"
              step={300}
              defaultValue={defaultValues.preferredMealTimes[mealKey] ?? ''}
              {...register(`preferredMealTimes.${mealKey}`)}
            />
          </div>
        ))}
      </div>
      {errors.preferredMealTimes ? (
        <p className="text-xs text-destructive">{errors.preferredMealTimes.message as string}</p>
      ) : null}

      <div className="space-y-3">
        <Label>Nivel de complejidad preferido</Label>
        <RadioGroup
          defaultValue={defaultValues.preferredComplexity}
          onValueChange={(value) => setValue('preferredComplexity', value as ComplexityLevel, { shouldDirty: true })}
          className="grid gap-3 md:grid-cols-3"
        >
          {(Object.keys(complexityCopy) as ComplexityLevel[]).map((level) => (
            <label
              key={level}
              className="flex cursor-pointer flex-col gap-1 rounded-lg border border-border p-4 hover:border-emerald-500 focus-within:border-emerald-500"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value={level} id={`complexity-${level}`} />
                <Label htmlFor={`complexity-${level}`} className="font-medium">
                  {complexityCopy[level].title}
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">{complexityCopy[level].helper}</p>
            </label>
          ))}
        </RadioGroup>
        <input type="hidden" {...register('preferredComplexity')} />
        {errors.preferredComplexity ? (
          <p className="text-xs text-destructive">{errors.preferredComplexity.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="maxCookingMinutes">Máximo de minutos que quieres dedicar (opcional)</Label>
        <Input
          id="maxCookingMinutes"
          type="number"
          min={5}
          max={240}
          placeholder="Ej: 45"
          {...register('maxCookingMinutes')}
        />
        {errors.maxCookingMinutes ? (
          <p className="text-xs text-destructive">
            {typeof errors.maxCookingMinutes.message === 'string' ? errors.maxCookingMinutes.message : 'Valor inválido'}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Usaremos este límite como guía para recetas y recordatorios.
          </p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <Button type="button" variant="ghost" onClick={onBack}>
          {onboardingCopy.ctaBack}
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Guardando...' : onboardingCopy.ctaNext}
        </Button>
      </div>
    </form>
  );
}
