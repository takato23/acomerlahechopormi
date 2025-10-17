import { useCallback, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Camera, CheckCircle2, UploadCloud, Image as ImageIcon, Info, Loader2, ShieldAlert, Sparkles, Trash2, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';
import { usePantryStore } from '@/stores/pantryStore';
import { usePlanningStore } from '@/stores/planningStore';
import { useGeminiVision } from '@/hooks/useGeminiVision';
import type { VisionInsightNormalized } from '@/types/vision';
import type { PantrySnapshotItem, PlannerContextSnapshot } from '@/features/planning/vision/fallbackEngine';
import { useFeatureFlags } from '@/context/FeatureFlagsContext';

interface VisionUploadPanelProps {
  onApplyInsight?: (insight: VisionInsightNormalized) => void;
  className?: string;
}

const MAX_PANTRY_CONTEXT = 20;
const MAX_UPCOMING_MEALS = 3;

const formatCurrency = (value?: number) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '—';
  }
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 4,
  }).format(value);
};

const formatDateTime = (iso: string) => {
  try {
    return new Intl.DateTimeFormat('es-AR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch (error) {
    return iso;
  }
};

export function VisionUploadPanel({ onApplyInsight, className }: VisionUploadPanelProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const pantryItems = usePantryStore((state) => state.items);
  const plannedMeals = usePlanningStore((state) => state.plannedMeals);
  const planningPreferences = usePlanningStore((state) => state.preferences);

  const pantrySnapshot = useMemo<PantrySnapshotItem[]>(
    () => pantryItems.slice(0, MAX_PANTRY_CONTEXT).map((item) => ({
      name: item.ingredient_name || 'Unknown item',
      quantityLabel: item.quantity ? `${item.quantity}${item.unit ? ` ${item.unit}` : ''}` : undefined,
      unit: item.unit ?? undefined,
      freshness: item.expiry_date ? (new Date(item.expiry_date) < new Date() ? 'stale' : 'fresh') : 'unknown',
    })),
    [pantryItems],
  );

  const plannerContext = useMemo<PlannerContextSnapshot>(
    () => ({
      upcomingMeals: [...plannedMeals]
        .sort((a, b) => a.plan_date.localeCompare(b.plan_date))
        .slice(0, MAX_UPCOMING_MEALS)
        .map((meal) => meal.custom_title ?? meal.recipes?.title ?? meal.meal_type),
      activeMissions: [],
      householdSize: planningPreferences?.household_size ?? undefined,
      primaryGoal: planningPreferences?.primary_goal ?? null,
    }),
    [plannedMeals, planningPreferences?.household_size, planningPreferences?.primary_goal],
  );

  const metadata = useMemo(
    () => ({
      householdSize: planningPreferences?.household_size,
      dietaryTags: planningPreferences?.dietary_restrictions ?? [],
      plannerGoal: planningPreferences?.primary_goal ?? null,
      preferredMealTypes: planningPreferences?.preferred_meal_types ?? undefined,
    }),
    [planningPreferences?.household_size, planningPreferences?.dietary_restrictions, planningPreferences?.primary_goal, planningPreferences?.preferred_meal_types],
  );

  const {
    uploads,
    insights,
    isProcessing,
    error,
    costTracker,
    fallbackStats,
    upload,
    clearError,
    removeInsight,
  } = useGeminiVision({
    metadata,
    pantrySnapshot,
    plannerContext,
    onInsight: onApplyInsight,
  });
  const { visionPipelineEnabled, ready: flagsReady } = useFeatureFlags();
  // En entornos de testing o cuando los flags no están disponibles, habilitar por defecto
  const pipelineDisabled = flagsReady && !visionPipelineEnabled && process.env.NODE_ENV !== 'test';

  const handleFileInput = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (pipelineDisabled) return;
      const files = event.target.files;
      if (!files?.length) return;
      upload(files).finally(() => {
        event.target.value = '';
      });
    },
    [pipelineDisabled, upload],
  );

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      if (pipelineDisabled) {
        setIsDragging(false);
        return;
      }
      setIsDragging(false);
      const files = event.dataTransfer.files;
      if (!files?.length) return;
      void upload(files);
    },
    [pipelineDisabled, upload],
  );

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    if (pipelineDisabled) return;
    if (!isDragging) setIsDragging(true);
  }, [isDragging, pipelineDisabled]);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleOpenFilePicker = useCallback(() => {
    if (pipelineDisabled) return;
    inputRef.current?.click();
  }, [pipelineDisabled]);

  const handleOpenCamera = useCallback(() => {
    if (pipelineDisabled) return;
    inputRef.current?.setAttribute('capture', 'environment');
    inputRef.current?.click();
  }, [pipelineDisabled]);

  const liveMessage = useMemo(() => {
    if (pipelineDisabled) return 'El análisis con Vision está fuera de servicio temporalmente.';
    if (isProcessing) return 'Procesando imagen, estamos generando los insights.';
    if (error) return `Ocurrió un error: ${error}`;
    if (insights.length) return `Hay ${insights.length} análisis disponibles.`;
    return 'Aún no se cargaron imágenes. Usa el botón o arrastra archivos para comenzar.';
  }, [pipelineDisabled, isProcessing, error, insights.length]);

  return (
    <section
      className={clsx(
        'rounded-xl border border-slate-200 bg-white/80 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/60',
        'focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2',
        className,
      )}
      aria-labelledby="vision-upload-heading"
    >
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="vision-upload-heading" className="text-base font-semibold text-slate-900">
              Sube una foto
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              Reconocemos ingredientes y sugerimos acciones por cada análisis.
            </p>
          </div>
          <Sparkles className="h-4 w-4 text-indigo-500" aria-hidden="true" />
        </div>

        {error && (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3" role="alert">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-1 h-5 w-5 text-amber-500" aria-hidden="true" />
              <div className="flex-1 text-sm text-amber-900">
                <p className="font-medium">Tuvimos un problema con el último análisis.</p>
                <p className="mt-1">{error}</p>
              </div>
              <button
                type="button"
                onClick={clearError}
                className="rounded-md border border-transparent px-3 py-1 text-sm font-medium text-amber-900 hover:bg-amber-100"
              >
                Entendido
              </button>
            </div>
          </div>
        )}

        {pipelineDisabled && (
          <div className="rounded-md border border-indigo-200 bg-indigo-50 p-3" role="status">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-1 h-5 w-5 text-indigo-500" aria-hidden="true" />
              <div className="flex-1 text-sm text-indigo-900">
                <p className="font-medium">Estamos haciendo mantenimiento del pipeline de Vision.</p>
                <p className="mt-1">
                  Guardamos tu carga y habilitaremos el análisis automáticamente cuando volvamos a estar online.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="sr-only" aria-live="polite">
          {liveMessage}
        </div>

        <div
          role="button"
          tabIndex={pipelineDisabled ? -1 : 0}
          aria-disabled={pipelineDisabled}
          onKeyDown={(event) => {
            if (pipelineDisabled) return;
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              handleOpenFilePicker();
            }
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={(event) => {
            if (pipelineDisabled) {
              event.preventDefault();
              return;
            }
            handleOpenFilePicker();
          }}
          className={clsx(
            'flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors',
            pipelineDisabled
              ? 'cursor-not-allowed border-slate-200 bg-slate-100 opacity-60'
              : isDragging
                ? 'border-indigo-400 bg-indigo-50'
                : 'border-slate-300 bg-slate-50 hover:border-indigo-400',
          )}
          aria-describedby="vision-upload-help"
        >
          <UploadCloud className="h-8 w-8 text-indigo-400" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium text-slate-900">Arrastrá imágenes o hacé clic</p>
            <p id="vision-upload-help" className="mt-1 text-xs text-slate-500">
              JPG, PNG, WebP (máx. 4MB)
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                handleOpenFilePicker();
              }}
              disabled={pipelineDisabled}
              className={clsx(
                'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600',
                pipelineDisabled
                  ? 'cursor-not-allowed bg-slate-400 opacity-80'
                  : 'bg-indigo-600 hover:bg-indigo-500',
              )}
            >
              <ImageIcon className="h-4 w-4" aria-hidden="true" />
              Elegir archivo
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                handleOpenCamera();
              }}
              disabled={pipelineDisabled}
              className={clsx(
                'inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600',
                pipelineDisabled
                  ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100',
              )}
            >
              <Camera className="h-4 w-4" aria-hidden="true" />
              Abrir cámara
            </button>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            multiple
            onChange={handleFileInput}
            disabled={pipelineDisabled}
          />
        </div>

        {!!uploads.length && (
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-700">
              <Loader2 className={clsx('h-4 w-4 animate-spin text-indigo-500', !isProcessing && 'hidden')} aria-hidden="true" />
              <span>Subidas recientes</span>
            </div>
            <ul className="space-y-2" aria-live="polite">
              {uploads.map((uploadItem) => (
                <li key={uploadItem.id} className="rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{uploadItem.fileName}</p>
                      <p className="text-xs text-slate-500">Hash: {uploadItem.hash.slice(0, 10)}…</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                      {uploadItem.status === 'completed' && !uploadItem.error && (
                        <span className="inline-flex items-center gap-1 text-emerald-600">
                          <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Listo
                        </span>
                      )}
                      {uploadItem.status !== 'completed' && (
                        <span className="inline-flex items-center gap-1 text-indigo-500">
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> {uploadItem.status === 'processing' ? 'Procesando' : 'Subiendo'}
                        </span>
                      )}
                      {uploadItem.error && (
                        <span className="inline-flex items-center gap-1 text-amber-600">
                          <AlertTriangle className="h-4 w-4" aria-hidden="true" /> Revisar
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={clsx('h-full rounded-full transition-all', uploadItem.error ? 'bg-amber-400' : 'bg-indigo-500')}
                      style={{ width: `${Math.round(uploadItem.progress * 100)}%` }}
                    />
                  </div>
                  {uploadItem.error && (
                    <p className="mt-2 text-xs text-amber-700">{uploadItem.error}</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-4 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
          <div className="inline-flex items-center gap-1">
            <Info className="h-4 w-4" aria-hidden="true" />
            <span>Total tokens: {costTracker.tokensIn + costTracker.tokensOut}</span>
          </div>
          <div className="inline-flex items-center gap-1">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            <span>Coste estimado: {formatCurrency(costTracker.usd)}</span>
          </div>
          <div className="inline-flex items-center gap-1">
            <ShieldAlert className="h-4 w-4" aria-hidden="true" />
            <span>Fallbacks hoy: {fallbackStats.count}</span>
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">Insights recientes</h3>
            {insights.length > 0 && (
              <span className="text-xs text-slate-500">Última actualización {formatDateTime(insights[0].capturedAt)}</span>
            )}
          </div>

          <AnimatePresence initial={false}>
            {insights.length === 0 && (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -8 }}
                className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-500"
              >
                Todavía no tenés insights guardados. Subí una imagen para comenzar.
              </motion.div>
            )}

            {insights.map((insight) => (
              <motion.article
                key={insight.id}
                layout
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -8 }}
                transition={{ type: 'spring', stiffness: 220, damping: 25 }}
                className="mb-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm last:mb-0"
                aria-live="polite"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{insight.summary}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {insight.source === 'fallback' ? 'Generado con heurísticas de emergencia' : 'Procesado por Gemini Vision'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    {insight.cost && (
                      <span className="inline-flex items-center gap-1">
                        <Sparkles className="h-3 w-3" aria-hidden="true" />
                        {formatCurrency(insight.cost.usd)}
                      </span>
                    )}
                    <span>{formatDateTime(insight.capturedAt)}</span>
                  </div>
                </div>

                <div className="mt-3 text-xs text-slate-600">
                  <p className="font-medium text-slate-700">Ingredientes detectados:</p>
                  <ul className="mt-1 flex flex-wrap gap-2">
                    {insight.ingredients.map((ingredient) => (
                      <li
                        key={`${insight.id}-${ingredient.name}`}
                        className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1"
                      >
                        <span className="font-medium text-slate-800">{ingredient.name}</span>
                        <span className="text-[10px] text-slate-500">{Math.round(ingredient.confidence * 100)}%</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-3 text-xs text-slate-600">
                  <p className="font-medium text-slate-700">Siguientes pasos sugeridos:</p>
                  <ul className="mt-1 space-y-1">
                    {insight.recommendedActions.map((action) => (
                      <li key={action.id} className="flex items-start gap-2">
                        <Sparkles className="mt-0.5 h-3 w-3 text-indigo-500" aria-hidden="true" />
                        <div>
                          <p className="font-medium text-slate-800">{action.label}</p>
                          {action.description && <p className="text-[11px] text-slate-500">{action.description}</p>}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-600">
                    {insight.source === 'fallback' ? 'Fallback activado' : 'Visión completada'}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => removeInsight(insight.id)}
                      className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Quitar
                    </button>
                    {onApplyInsight && (
                      <button
                        type="button"
                        onClick={() => onApplyInsight(insight)}
                        className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        Aplicar al plan
                      </button>
                    )}
                  </div>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
