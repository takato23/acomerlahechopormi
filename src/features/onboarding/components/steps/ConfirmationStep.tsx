import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { onboardingCopy } from '../../copy';
import type { OnboardingDraft } from '../../types';
import { confirmationSchema } from '../../validations';
import { Badge } from '@/components/ui/badge';

interface ConfirmationStepProps {
  draft: OnboardingDraft;
  onConfirm: () => Promise<void>;
  onBack: () => void;
  isProcessing: boolean;
  statusMessage?: string | null;
  errorMessage?: string | null;
}

interface FormValues {
  acceptTerms: boolean;
}

export function ConfirmationStep({
  draft,
  onConfirm,
  onBack,
  isProcessing,
  statusMessage,
  errorMessage
}: ConfirmationStepProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(confirmationSchema),
    defaultValues: {
      acceptTerms: false
    }
  });

  const submitting = isProcessing || isSubmitting;

  const summaryItems = [
    {
      label: 'Objetivo principal',
      value: humanizeGoal(draft.primaryGoal)
    },
    {
      label: 'Preferencias dietarias',
      value: draft.dietaryPreferences.join(', ') || 'Sin especificar'
    },
    {
      label: 'Alergias / restricciones',
      value: draft.allergies.join(', ') || 'Sin especificar'
    },
    {
      label: 'Ingredientes a evitar',
      value: draft.dislikedIngredients.join(', ') || 'Ninguno'
    },
    {
      label: 'Complejidad preferida',
      value: humanizeComplexity(draft.preferredComplexity)
    },
    {
      label: 'Máximo minutos',
      value: draft.maxCookingMinutes ? `${draft.maxCookingMinutes} min` : 'Flexible'
    },
    {
      label: 'Calorías objetivo',
      value: draft.quantitativeObjectives.calorieTarget
        ? `${draft.quantitativeObjectives.calorieTarget} kcal`
        : 'No definido'
    },
    {
      label: 'Presupuesto semanal',
      value: draft.quantitativeObjectives.weeklyBudget
        ? `$${draft.quantitativeObjectives.weeklyBudget}`
        : 'No definido'
    },
    {
      label: 'Personas en el hogar',
      value: draft.quantitativeObjectives.householdSize ?? 'No indicado'
    }
  ];

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={handleSubmit(async () => {
        await onConfirm();
      })}
    >
      <p className="text-sm text-muted-foreground">{onboardingCopy.confirmHelper}</p>

      <section className="grid gap-4 md:grid-cols-2">
        {summaryItems.map((item) => (
          <div key={item.label} className="rounded-md border border-border p-4">
            <p className="text-xs uppercase text-muted-foreground">{item.label}</p>
            <p className="mt-1 text-sm font-medium text-foreground">{item.value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-md border border-border p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-muted-foreground">Inventario inicial</h3>
          <Badge variant="outline">{draft.initialPantryItems.length} ingredientes</Badge>
        </div>
        {draft.initialPantryItems.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No añadiste ingredientes. Puedes cargarlos más adelante desde la despensa.
          </p>
        ) : (
          <ul className="mt-3 grid gap-2 md:grid-cols-2">
            {draft.initialPantryItems.map((item) => (
              <li key={item.id} className="rounded border border-border/70 bg-card px-3 py-2 text-sm">
                <p className="font-medium capitalize">{item.ingredient_name}</p>
                <p className="text-xs text-muted-foreground">
                  {item.quantity ?? '—'} {item.unit ?? ''}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <label className="flex items-start gap-2 rounded-md border border-border bg-muted/20 p-3">
        <Checkbox
          {...register('acceptTerms')}
          aria-invalid={errors.acceptTerms ? 'true' : 'false'}
          className="mt-1"
        />
        <div>
          <Label className="text-sm font-medium text-foreground">
            Entiendo que al confirmar se generará mi primer plan semanal y lista de compras.
          </Label>
          <p className="text-xs text-muted-foreground">
            Si algo no luce bien podrás ajustar el plan más tarde desde la sección de Planificación.
          </p>
          {errors.acceptTerms ? (
            <p className="text-xs text-destructive">{errors.acceptTerms.message}</p>
          ) : null}
        </div>
      </label>

      {statusMessage ? (
        <p className="flex items-center gap-2 text-sm text-emerald-600">
          <CheckCircle2 className="h-4 w-4" />
          {statusMessage}
        </p>
      ) : null}
      {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

      <div className="flex items-center justify-between">
        <Button type="button" variant="ghost" onClick={onBack} disabled={submitting}>
          {onboardingCopy.ctaBack}
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Generando...
            </span>
          ) : (
            onboardingCopy.ctaFinish
          )}
        </Button>
      </div>
    </form>
  );
}

function humanizeGoal(goal: OnboardingDraft['primaryGoal']) {
  switch (goal) {
    case 'eat_better':
      return 'Comer más saludable';
    case 'save_time':
      return 'Ahorrar tiempo';
    case 'save_money':
      return 'Optimizar presupuesto';
    case 'learn_cook':
      return 'Aprender nuevas recetas';
    case 'other':
      return 'Personalizado';
    default:
      return 'Sin definir';
  }
}

function humanizeComplexity(level: OnboardingDraft['preferredComplexity']) {
  switch (level) {
    case 'simple':
      return 'Recetas express';
    case 'medium':
      return 'Equilibradas';
    case 'complex':
      return 'Chef en casa';
    default:
      return 'Sin preferencia';
  }
}
