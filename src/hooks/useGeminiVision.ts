import { useCallback, useEffect, useMemo } from 'react';
import { useFeatureFlags } from '@/context/FeatureFlagsContext';
import { useGeminiVisionStore } from '@/stores/useGeminiVisionStore';
import type {
  CostTrackerState,
  FallbackStatsState,
} from '@/stores/useGeminiVisionStore';
import type { VisionInsightNormalized, VisionRequestMetadata, VisionUploadItem } from '@/types/vision';
import type {
  PantrySnapshotItem,
  PlannerContextSnapshot,
} from '@/features/planning/vision/fallbackEngine';

type TelemetryEmitter = (event: string, payload?: Record<string, unknown>) => void;

export interface UseGeminiVisionOptions {
  metadata?: Partial<VisionRequestMetadata>;
  pantrySnapshot?: PantrySnapshotItem[];
  plannerContext?: PlannerContextSnapshot;
  onInsight?: (insight: VisionInsightNormalized) => void;
  telemetry?: TelemetryEmitter;
  cacheBypass?: boolean;
}

export interface UseGeminiVisionResult {
  uploads: VisionUploadItem[];
  insights: VisionInsightNormalized[];
  isProcessing: boolean;
  error: string | null;
  costTracker: CostTrackerState;
  fallbackStats: FallbackStatsState;
  upload: (files: File[] | FileList) => Promise<void>;
  clearError: () => void;
  removeInsight: (id: string) => void;
  markOffline: (offline: boolean) => void;
  getInsightByHash: (hash: string) => VisionInsightNormalized | undefined;
}

const resolveTelemetry = (telemetry?: TelemetryEmitter): TelemetryEmitter | undefined => {
  if (telemetry) return telemetry;
  if (typeof window !== 'undefined' && (window as { posthog?: { capture?: TelemetryEmitter } }).posthog?.capture) {
    return (event: string, payload?: Record<string, unknown>) => {
      try {
        (window as { posthog?: { capture?: TelemetryEmitter } }).posthog?.capture?.(event, payload);
      } catch (error) {
        console.warn('[useGeminiVision] Failed to emit telemetry event', error);
      }
    };
  }
  return undefined;
};

export const useGeminiVision = (options: UseGeminiVisionOptions = {}): UseGeminiVisionResult => {
  const uploads = useGeminiVisionStore((state) => state.uploads);
  const insightOrder = useGeminiVisionStore((state) => state.insightOrder);
  const insightsById = useGeminiVisionStore((state) => state.insightsById);
  const isProcessing = useGeminiVisionStore((state) => state.isProcessing);
  const error = useGeminiVisionStore((state) => state.error);
  const costTracker = useGeminiVisionStore((state) => state.costTracker);
  const fallbackStats = useGeminiVisionStore((state) => state.fallbackStats);
  const uploadPhotos = useGeminiVisionStore((state) => state.uploadPhotos);
  const dismissError = useGeminiVisionStore((state) => state.dismissError);
  const removeInsight = useGeminiVisionStore((state) => state.removeInsight);
  const markOffline = useGeminiVisionStore((state) => state.markOffline);
  const getInsightByHash = useGeminiVisionStore((state) => state.getInsightByHash);

  const { visionPipelineEnabled, ready: flagsReady } = useFeatureFlags();

  const baseTelemetry = useMemo(() => resolveTelemetry(options.telemetry), [options.telemetry]);

  const telemetry = useMemo<TelemetryEmitter | undefined>(() => {
    if (!baseTelemetry) return undefined;
    return (event, payload) => {
      baseTelemetry(event, {
        ...payload,
        visionPipelineEnabled,
      });
    };
  }, [baseTelemetry, visionPipelineEnabled]);

  const insights = useMemo(
    () => insightOrder.map((id) => insightsById[id]).filter(Boolean),
    [insightOrder, insightsById],
  );

  useEffect(() => {
    markOffline(flagsReady && !visionPipelineEnabled);
  }, [flagsReady, visionPipelineEnabled, markOffline]);

  const metadataWithFlags = useMemo<Partial<VisionRequestMetadata>>(() => {
    const base = options.metadata ? { ...options.metadata } : {};
    return {
      ...base,
      featureFlags: {
        vision_pipeline_enabled: visionPipelineEnabled,
      },
    };
  }, [options.metadata, visionPipelineEnabled]);

  const handleUpload = useCallback(
    async (files: File[] | FileList) => {
      if (flagsReady && !visionPipelineEnabled) {
        console.warn('[useGeminiVision] Vision pipeline disabled, skipping upload.');
        return;
      }
      await uploadPhotos(files, {
        metadata: metadataWithFlags,
        pantrySnapshot: options.pantrySnapshot,
        plannerContext: options.plannerContext,
        onInsight: options.onInsight,
        telemetry,
        cacheBypass: options.cacheBypass,
      });
    },
    [flagsReady, visionPipelineEnabled, uploadPhotos, metadataWithFlags, options.pantrySnapshot, options.plannerContext, options.onInsight, telemetry, options.cacheBypass],
  );

  const clearError = useCallback(() => {
    dismissError();
  }, [dismissError]);

  return {
    uploads,
    insights,
    isProcessing,
    error,
    costTracker,
    fallbackStats,
    upload: handleUpload,
    clearError,
    removeInsight,
    markOffline,
    getInsightByHash,
  };
};
