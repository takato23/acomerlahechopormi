import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { onboardingCopy } from '../../copy';
import { primaryGoalSchema } from '../../validations';
import type { PrimaryGoal } from '../../types';

const schema = primaryGoalSchema.extend({
  notes: z
    .string()
    .max(280, 'Máximo 280 caracteres')
    .optional()
});

type FormValues = z.infer<typeof schema>;

interface PrimaryGoalStepProps {
  initialGoal: PrimaryGoal | null;
  initialNotes: string | null;
  onComplete: (values: { primaryGoal: PrimaryGoal; notes?: string | null }) => Promise<void> | void;
  isSubmitting?: boolean;
}

const goalOptions: { value: PrimaryGoal; label: string; helper: string }[] = [
  {
    value: 'eat_better',
    label: 'Comer más saludable',
    helper: 'Diseñaremos planes equilibrados con énfasis en nutrientes.'
  },
  {
    value: 'save_time',
    label: 'Ahorrar tiempo',
    helper: 'Priorizaremos recetas rápidas y automatizaciones.'
  },
  {
    value: 'save_money',
    label: 'Optimizar presupuesto',
    helper: 'Aprovecharemos ofertas y combinaremos ingredientes base.'
  },
  {
    value: 'learn_cook',
    label: 'Aprender nuevas recetas',
    helper: 'Te mostraremos variedad y técnicas progresivas.'
  },
  {
    value: 'other',
    label: 'Otro objetivo',
    helper: 'Personalizaremos recomendaciones con base en tus notas.'
  }
];

export function PrimaryGoalStep({ initialGoal, initialNotes, onComplete, isSubmitting }: PrimaryGoalStepProps) {
  const defaultValues = useMemo<FormValues>(
    () => ({
      primaryGoal: initialGoal ?? 'eat_better',
      notes: initialNotes ?? undefined
    }),
    [initialGoal, initialNotes]
  );

  const {
    handleSubmit,
    register,
    setValue,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues
  });

  const submitting = Boolean(isSubmitting);

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={handleSubmit(async (values) => {
        await onComplete({
          primaryGoal: values.primaryGoal,
          notes: values.notes?.trim() ? values.notes.trim() : null
        });
      })}
    >
      <div className="space-y-2 text-sm text-muted-foreground">
        {onboardingCopy.primaryGoalHelper}
      </div>
      <RadioGroup
        defaultValue={defaultValues.primaryGoal}
        onValueChange={(value) => setValue('primaryGoal', value as PrimaryGoal, { shouldValidate: true })}
        className="grid gap-3 md:grid-cols-2"
      >
        <input type="hidden" {...register('primaryGoal')} />
        {goalOptions.map((option) => (
          <label
            key={option.value}
            className="flex cursor-pointer flex-col gap-1 rounded-lg border border-border p-4 hover:border-emerald-500 focus-within:border-emerald-500"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value={option.value} id={option.value} />
              <Label htmlFor={option.value} className="text-base font-medium">
                {option.label}
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">{option.helper}</p>
          </label>
        ))}
      </RadioGroup>
      {errors.primaryGoal ? (
        <p className="text-sm text-destructive">{errors.primaryGoal.message}</p>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="goal-notes">Notas opcionales</Label>
        <Textarea
          id="goal-notes"
          placeholder="Comparte cualquier contexto adicional..."
          {...register('notes')}
        />
        {errors.notes ? <p className="text-sm text-destructive">{errors.notes.message}</p> : null}
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Guardando...' : onboardingCopy.ctaNext}
        </Button>
      </div>
    </form>
  );
}
