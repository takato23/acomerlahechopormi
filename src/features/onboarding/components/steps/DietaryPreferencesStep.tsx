import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { onboardingCopy } from '../../copy';
import { dietarySchema } from '../../validations';

const schema = dietarySchema.extend({
  dietaryPreferencesText: z.string().optional(),
  allergiesText: z.string().optional(),
  dislikedIngredientsText: z.string().optional()
});

type FormValues = {
  dietaryPreferencesText: string;
  allergiesText: string;
  dislikedIngredientsText: string;
};

interface DietaryPreferencesStepProps {
  dietaryPreferences: string[];
  allergies: string[];
  dislikedIngredients: string[];
  onComplete: (values: { dietaryPreferences: string[]; allergies: string[]; dislikedIngredients: string[] }) => Promise<void> | void;
  onBack: () => void;
  isSubmitting?: boolean;
}

function parseList(value: string): string[] {
  return value
    .split(/[\n,]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function DietaryPreferencesStep({
  dietaryPreferences,
  allergies,
  dislikedIngredients,
  onComplete,
  onBack,
  isSubmitting
}: DietaryPreferencesStepProps) {
  const defaultValues = useMemo<FormValues>(
    () => ({
      dietaryPreferencesText: dietaryPreferences.join('\n'),
      allergiesText: allergies.join('\n'),
      dislikedIngredientsText: dislikedIngredients.join('\n')
    }),
    [allergies, dietaryPreferences, dislikedIngredients]
  );

  const {
    handleSubmit,
    register,
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
          dietaryPreferences: parseList(values.dietaryPreferencesText),
          allergies: parseList(values.allergiesText),
          dislikedIngredients: parseList(values.dislikedIngredientsText)
        });
      })}
    >
      <p className="text-sm text-muted-foreground">{onboardingCopy.dietaryHelper}</p>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="dietaryPreferencesText">Preferencias dietarias</Label>
          <Textarea
            id="dietaryPreferencesText"
            rows={4}
            placeholder="Vegetariana, Mediterránea, Sin gluten..."
            {...register('dietaryPreferencesText')}
          />
          {errors.dietaryPreferencesText ? (
            <p className="text-xs text-destructive">{errors.dietaryPreferencesText.message}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="allergiesText">Alergias o restricciones</Label>
          <Textarea
            id="allergiesText"
            rows={4}
            placeholder="Maní, Lactosa, Mariscos..."
            {...register('allergiesText')}
          />
          {errors.allergiesText ? <p className="text-xs text-destructive">{errors.allergiesText.message}</p> : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="dislikedIngredientsText">Ingredientes que no quieres ver</Label>
        <Textarea
          id="dislikedIngredientsText"
          rows={3}
          placeholder="Incluye ingredientes que prefieres evitar"
          {...register('dislikedIngredientsText')}
        />
        {errors.dislikedIngredientsText ? (
          <p className="text-xs text-destructive">{errors.dislikedIngredientsText.message}</p>
        ) : null}
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
