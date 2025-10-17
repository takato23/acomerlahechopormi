import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { PlannedMeal } from '../types';
import { MealCard } from './MealCard';

interface AlternativePreviewModalProps {
  isOpen: boolean;
  status: 'idle' | 'loading' | 'ready' | 'error';
  baseMeal: PlannedMeal | null;
  previewMeal: PlannedMeal | null;
  error: string | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

const formatMetric = (value: number | undefined | null, suffix: string) => {
  if (value === undefined || value === null) return `— ${suffix}`;
  return `${Math.round(value)} ${suffix}`;
};

export function AlternativePreviewModal({
  isOpen,
  status,
  baseMeal,
  previewMeal,
  error,
  onClose,
  onConfirm,
}: AlternativePreviewModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenChange = (open: boolean) => {
    if (!open && status !== 'loading' && !isSubmitting) {
      onClose();
    }
  };

  const handleConfirm = async () => {
    if (status !== 'ready' || !previewMeal) return;
    setIsSubmitting(true);
    try {
      await onConfirm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalTime = (meal: PlannedMeal | null) =>
    (meal?.prep_time_minutes ?? 0) + (meal?.cook_time_minutes ?? 0);
  const missingIngredients = (meal: PlannedMeal | null) =>
    meal?.ingredient_status?.filter((status) => !status.available).length ?? 0;

  const isReady = status === 'ready' && !!baseMeal && !!previewMeal;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Comparar alternativa generada</DialogTitle>
          <DialogDescription>
            Revisa la propuesta antes de reemplazar la comida planificada.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {status === 'loading' && (
            <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Generando alternativa personalizada…
            </div>
          )}

          {status === 'error' && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
              {error ?? 'No pudimos generar una alternativa. Intenta nuevamente más tarde.'}
            </div>
          )}

          {isReady && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Plan actual
                </h3>
                <MealCard meal={baseMeal} showActions={false} />
              </div>
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Propuesta generada
                </h3>
                <MealCard meal={previewMeal} showActions={false} />
              </div>
            </div>
          )}

          {isReady && (
            <div className="rounded-md border p-4 text-sm">
              <p className="font-medium text-gray-900">Comparativa rápida</p>
              <div className="mt-3 grid gap-3 text-xs text-muted-foreground sm:grid-cols-2">
                <div className="flex flex-col rounded-md border border-dashed p-3">
                  <span className="font-semibold text-gray-700">Calorías</span>
                  <span>
                    {formatMetric(baseMeal?.nutritional_info?.calories, 'kcal')} →{' '}
                    <strong className="text-gray-900">
                      {formatMetric(previewMeal.nutritional_info?.calories, 'kcal')}
                    </strong>
                  </span>
                </div>
                <div className="flex flex-col rounded-md border border-dashed p-3">
                  <span className="font-semibold text-gray-700">Tiempo total estimado</span>
                  <span>
                    {formatMetric(totalTime(baseMeal), 'min')} →{' '}
                    <strong className="text-gray-900">
                      {formatMetric(totalTime(previewMeal), 'min')}
                    </strong>
                  </span>
                </div>
                <div className="flex flex-col rounded-md border border-dashed p-3">
                  <span className="font-semibold text-gray-700">Proteínas</span>
                  <span>
                    {formatMetric(baseMeal?.nutritional_info?.protein, 'g')} →{' '}
                    <strong className="text-gray-900">
                      {formatMetric(previewMeal.nutritional_info?.protein, 'g')}
                    </strong>
                  </span>
                </div>
                <div className="flex flex-col rounded-md border border-dashed p-3">
                  <span className="font-semibold text-gray-700">Ingredientes faltantes</span>
                  <span>
                    {missingIngredients(baseMeal)} →{' '}
                    <strong className="text-gray-900">{missingIngredients(previewMeal)}</strong>
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={status === 'loading' || isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!isReady || isSubmitting}
          >
            {isSubmitting ? 'Aplicando…' : 'Reemplazar comida'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AlternativePreviewModal;
