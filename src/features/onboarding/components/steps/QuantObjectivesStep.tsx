import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { onboardingCopy } from '../../copy';
import { quantObjectivesSchema } from '../../validations';

type FormValues = {
  calorieTarget: number | null;
  weeklyBudget: number | null;
  householdSize: number | null;
};

interface QuantObjectivesStepProps {
  defaultValues: FormValues;
  onComplete: (values: FormValues) => Promise<void> | void;
  onBack: () => void;
  isSubmitting?: boolean;
}

export function QuantObjectivesStep({ defaultValues, onComplete, onBack, isSubmitting }: QuantObjectivesStepProps) {
  const initialValues = useMemo<FormValues>(
    () => ({
      calorieTarget: defaultValues.calorieTarget ?? null,
      weeklyBudget: defaultValues.weeklyBudget ?? null,
      householdSize: defaultValues.householdSize ?? 1
    }),
    [defaultValues]
  );

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(quantObjectivesSchema),
    defaultValues: initialValues
  });

  const submitting = Boolean(isSubmitting);

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={handleSubmit(async (values) => {
        await onComplete(values);
      })}
    >
      <p className="text-sm text-muted-foreground">{onboardingCopy.quantHelper}</p>

      <div className="grid gap-5 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="calorieTarget">Calorías objetivo / día</Label>
          <Input id="calorieTarget" type="number" min={1200} max={6000} {...register('calorieTarget')} />
          {errors.calorieTarget ? (
            <p className="text-xs text-destructive">{errors.calorieTarget.message as string}</p>
          ) : (
            <p className="text-xs text-muted-foreground">Usamos este dato para balancear tus planes semanales.</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="weeklyBudget">Presupuesto semanal</Label>
          <Input id="weeklyBudget" type="number" min={0} step={10} {...register('weeklyBudget')} />
          {errors.weeklyBudget ? (
            <p className="text-xs text-destructive">{errors.weeklyBudget.message as string}</p>
          ) : (
            <p className="text-xs text-muted-foreground">Puedes dejarlo vacío si prefieres definirlo luego.</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="householdSize">Personas en el hogar</Label>
          <Input id="householdSize" type="number" min={1} max={12} {...register('householdSize')} />
          {errors.householdSize ? (
            <p className="text-xs text-destructive">{errors.householdSize.message as string}</p>
          ) : (
            <p className="text-xs text-muted-foreground">Nos ayuda a ajustar porciones y lista de compras.</p>
          )}
        </div>
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
