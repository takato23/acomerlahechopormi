import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  geminiVisionClient,
  computeFileHash,
} from '@/lib/geminiVisionClient';
import { normalizeInsight } from '@/features/planning/vision/normalizer';
import {
  buildFallbackVisionInsight,
  type PantrySnapshotItem,
  type PlannerContextSnapshot,
} from '@/features/planning/vision/fallbackEngine';
import type {
  VisionInsightNormalized,
  VisionUploadItem,
  VisionRequestMetadata,
} from '@/types/vision';

const STORAGE_KEY = 'vision:store:v1';

export interface CostTrackerState {
  tokensIn: number;
  tokensOut: number;
  usd: number;
  cacheHits: number;
  lastUpdated: string;
}

export interface FallbackStatsState {
  count: number;
  reasons: Record<string, number>;
}

type TelemetryEmitter = (event: string, payload?: Record<string, unknown>) => void;

type UploadOptions = {
  metadata?: Partial<VisionRequestMetadata>;
  pantrySnapshot?: PantrySnapshotItem[];
  plannerContext?: PlannerContextSnapshot;
  onInsight?: (insight: VisionInsightNormalized) => void;
  telemetry?: TelemetryEmitter;
  cacheBypass?: boolean;
};

interface GeminiVisionState {
  uploads: VisionUploadItem[];
  insightsById: Record<string, VisionInsightNormalized>;
  insightOrder: string[];
  cacheByHash: Record<string, string>;
  isProcessing: boolean;
  error: string | null;
  costTracker: CostTrackerState;
  fallbackStats: FallbackStatsState;
  offline: boolean;
  lastRequestId: string | null;

  uploadPhotos: (files: File[] | FileList, options?: UploadOptions) => Promise<void>;
  fetchInsightByHash: (hash: string) => Promise<VisionInsightNormalized | null>;
  removeInsight: (id: string) => void;
  dismissError: () => void;
  getInsightByHash: (hash: string) => VisionInsightNormalized | undefined;
  markOffline: (offline: boolean) => void;
  reset: () => void;
}

interface PersistedVisionState {
  insightsById: Record<string, VisionInsightNormalized>;
  insightOrder: string[];
  cacheByHash: Record<string, string>;
  costTracker: CostTrackerState;
  fallbackStats: FallbackStatsState;
}

const defaultCostTracker = (): CostTrackerState => ({
  tokensIn: 0,
  tokensOut: 0,
  usd: 0,
  cacheHits: 0,
  lastUpdated: new Date().toISOString(),
});

const defaultFallbackStats = (): FallbackStatsState => ({
  count: 0,
  reasons: {},
});

const readPersistedState = (): PersistedVisionState | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage?.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedVisionState;
    return parsed;
  } catch (error) {
    console.warn('[useGeminiVisionStore] Unable to read persisted state', error);
    return null;
  }
};

const writePersistedState = (state: PersistedVisionState) => {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage?.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('[useGeminiVisionStore] Unable to persist state', error);
  }
};

const buildMetadata = (
  base: Partial<VisionRequestMetadata> | undefined,
  pantrySnapshot: PantrySnapshotItem[] | undefined,
  plannerContext: PlannerContextSnapshot | undefined,
): VisionRequestMetadata => {
  const locale = base?.locale
    ?? (typeof navigator !== 'undefined' && navigator.language ? navigator.language : 'es-ES');
  const timezone = base?.timezone
    ?? (typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC' : 'UTC');

  return {
    locale,
    timezone,
    householdSize: base?.householdSize ?? plannerContext?.householdSize,
    dietaryTags: base?.dietaryTags ?? [],
    plannerGoal: base?.plannerGoal ?? plannerContext?.primaryGoal ?? null,
    preferredMealTypes: base?.preferredMealTypes,
    pantrySnapshot: base?.pantrySnapshot ?? pantrySnapshot,
    missionContext: base?.missionContext ?? {
      activeMissionTitles: plannerContext?.activeMissions ?? [],
    },
    modelHint: base?.modelHint,
    featureFlags: base?.featureFlags,
  } satisfies VisionRequestMetadata;
};

const updateUploads = (uploads: VisionUploadItem[], id: string, updates: Partial<VisionUploadItem>): VisionUploadItem[] =>
  uploads.map((item) => (item.id === id ? { ...item, ...updates } : item));

const revokePreview = (upload: VisionUploadItem) => {
  if (upload.previewUrl && typeof URL !== 'undefined' && URL.revokeObjectURL) {
    URL.revokeObjectURL(upload.previewUrl);
  }
};

const addOrUpdateInsight = (
  state: GeminiVisionState,
  insight: VisionInsightNormalized,
  persist = true,
): GeminiVisionState => {
  const { insightsById, insightOrder, cacheByHash } = state;
  const nextInsightsById = { ...insightsById, [insight.id]: insight };
  const nextCacheByHash = { ...cacheByHash, [insight.hash]: insight.id };
  const nextInsightOrder = insightOrder.includes(insight.id)
    ? insightOrder
    : [insight.id, ...insightOrder].slice(0, 20);

  const nextCostTracker = { ...state.costTracker };
  if (insight.source === 'gemini' && insight.cost) {
    nextCostTracker.tokensIn += insight.cost.tokensIn;
    nextCostTracker.tokensOut += insight.cost.tokensOut;
    nextCostTracker.usd = parseFloat((nextCostTracker.usd + insight.cost.usd).toFixed(4));
    if (insight.cost.cacheHit) {
      nextCostTracker.cacheHits += 1;
    }
    nextCostTracker.lastUpdated = new Date().toISOString();
  }

  const nextState: GeminiVisionState = {
    ...state,
    insightsById: nextInsightsById,
    insightOrder: nextInsightOrder,
    cacheByHash: nextCacheByHash,
    costTracker: nextCostTracker,
  };

  if (persist) {
    writePersistedState({
      insightsById: nextInsightsById,
      insightOrder: nextInsightOrder,
      cacheByHash: nextCacheByHash,
      costTracker: nextCostTracker,
      fallbackStats: nextState.fallbackStats,
    });
  }

  return nextState;
};

const persistFallbackStats = (state: GeminiVisionState) => {
  writePersistedState({
    insightsById: state.insightsById,
    insightOrder: state.insightOrder,
    cacheByHash: state.cacheByHash,
    costTracker: state.costTracker,
    fallbackStats: state.fallbackStats,
  });
};

export const useGeminiVisionStore = create<GeminiVisionState>((set, get) => {
  const persisted = readPersistedState();

  const initialState: GeminiVisionState = {
    uploads: [],
    insightsById: persisted?.insightsById ?? {},
    insightOrder: persisted?.insightOrder ?? [],
    cacheByHash: persisted?.cacheByHash ?? {},
    isProcessing: false,
    error: null,
    costTracker: persisted?.costTracker ?? defaultCostTracker(),
    fallbackStats: persisted?.fallbackStats ?? defaultFallbackStats(),
    offline: false,
    lastRequestId: null,

    async uploadPhotos(files, options) {
      const list = Array.isArray(files) ? files : Array.from(files);
      if (!list.length) return;

      const telemetry = options?.telemetry;
      const metadataBuilder = options?.metadata;

      set((state) => ({ ...state, isProcessing: true, error: null }));

      for (const file of list) {
        const hash = await computeFileHash(file);
        const existingId = get().cacheByHash[hash];
        const now = Date.now();
        const uploadId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? (crypto as Crypto).randomUUID()
          : uuidv4();
        const previewUrl = typeof URL !== 'undefined' && URL.createObjectURL ? URL.createObjectURL(file) : undefined;

        telemetry?.('vision_upload_started', {
          hash,
          size: file.size,
          name: file.name,
        });

        set((state) => {
          const nextUploads: VisionUploadItem[] = [
            {
              id: uploadId,
              hash,
              fileName: file.name,
              size: file.size,
              status: existingId ? 'completed' as const : 'uploading' as const,
              progress: existingId ? 1 : 0.1,
              startedAt: now,
              previewUrl,
              completedAt: existingId ? now : undefined,
            },
            ...state.uploads,
          ];

          if (nextUploads.length > 10) {
            const removed = nextUploads.splice(10);
            removed.forEach(revokePreview);
          }

          return {
            ...state,
            uploads: nextUploads,
          };
        });

        if (existingId) {
          const cachedInsight = get().insightsById[existingId];
          if (cachedInsight) {
            options?.onInsight?.(cachedInsight);
          }
          continue;
        }

        try {
          // Check remote cache first
          let insight = await get().fetchInsightByHash(hash);
          if (!insight) {
            set((state) => ({
              ...state,
              uploads: updateUploads(state.uploads, uploadId, {
                status: 'processing',
                progress: 0.4,
              }),
            }));

            const metadata = buildMetadata(metadataBuilder, options?.pantrySnapshot, options?.plannerContext);
            const { insight: freshInsight, requestId, cacheHit } = await geminiVisionClient.requestInsight({
              file,
              hash,
              metadata,
              cacheBypass: options?.cacheBypass,
            });

            insight = normalizeInsight({
              ...freshInsight,
              hash,
              cost: freshInsight.cost,
              latencyMs: freshInsight.latencyMs,
            });

            set((state) => ({ ...state, lastRequestId: requestId }));

            if (cacheHit) {
              telemetry?.('vision_cache_hit', { hash });
            }
          }

          if (insight) {
            const normalized = normalizeInsight({ ...insight, hash });
            set((state) => addOrUpdateInsight(state, normalized));
            options?.onInsight?.(normalized);
            telemetry?.('vision_insight_ready', {
              hash,
              status: normalized.status,
              latency: normalized.latencyMs,
              usd: normalized.cost?.usd,
              tokensIn: normalized.cost?.tokensIn,
              tokensOut: normalized.cost?.tokensOut,
              cacheHit: normalized.cost?.cacheHit ?? false,
              source: normalized.source,
            });
            telemetry?.('vision_latency_sample', {
              hash,
              latencyMs: normalized.latencyMs,
              cacheHit: normalized.cost?.cacheHit ?? false,
              source: normalized.source,
            });
            const snapshot = get();
            telemetry?.('vision_cost_snapshot', {
              usd: snapshot.costTracker.usd,
              tokensIn: snapshot.costTracker.tokensIn,
              tokensOut: snapshot.costTracker.tokensOut,
              cacheHits: snapshot.costTracker.cacheHits,
              fallbackCount: snapshot.fallbackStats.count,
              updatedAt: snapshot.costTracker.lastUpdated,
            });
            set((state) => ({
              ...state,
              uploads: updateUploads(state.uploads, uploadId, {
                status: 'completed',
                progress: 1,
                completedAt: Date.now(),
              }),
            }));
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Error desconocido al procesar la imagen';
          console.error('[useGeminiVisionStore] Vision request failed', error);

          const fallback = buildFallbackVisionInsight({
            hash,
            fileName: file.name,
            pantryItems: options?.pantrySnapshot,
            plannerContext: options?.plannerContext,
            reason: 'vision_request_failed',
            errorMessage: message,
            now: new Date().toISOString(),
          });

          set((state) => {
            const nextFallbackStats: FallbackStatsState = {
              count: state.fallbackStats.count + 1,
              reasons: {
                ...state.fallbackStats.reasons,
                vision_request_failed: (state.fallbackStats.reasons.vision_request_failed ?? 0) + 1,
              },
            };

            const nextState = addOrUpdateInsight({
              ...state,
              fallbackStats: nextFallbackStats,
            }, fallback, false);

            persistFallbackStats({
              ...nextState,
              fallbackStats: nextFallbackStats,
            });

            const updatedUploads = updateUploads(nextState.uploads, uploadId, {
              status: 'completed',
              progress: 1,
              error: message,
              completedAt: Date.now(),
            });
            return {
              ...nextState,
              uploads: updatedUploads,
              error: message,
            };
          });

          options?.onInsight?.(fallback);
          telemetry?.('vision_fallback_triggered', {
            hash,
            reason: 'vision_request_failed',
            message,
          });
          const snapshot = get();
          telemetry?.('vision_cost_snapshot', {
            usd: snapshot.costTracker.usd,
            tokensIn: snapshot.costTracker.tokensIn,
            tokensOut: snapshot.costTracker.tokensOut,
            cacheHits: snapshot.costTracker.cacheHits,
            fallbackCount: snapshot.fallbackStats.count,
            updatedAt: snapshot.costTracker.lastUpdated,
          });
        }
      }

      set((state) => ({
        ...state,
        isProcessing: false,
      }));
    },

    async fetchInsightByHash(hash) {
      const cachedId = get().cacheByHash[hash];
      if (cachedId) {
        return get().insightsById[cachedId];
      }

      try {
        const remote = await geminiVisionClient.fetchInsightByHash({ hash });
        if (!remote) return null;
        const normalized = normalizeInsight({ ...remote, hash });
        set((state) => addOrUpdateInsight(state, normalized));
        return normalized;
      } catch (error) {
        console.warn('[useGeminiVisionStore] Remote cache lookup failed', error);
        return null;
      }
    },

    removeInsight(id) {
      set((state) => {
        const { [id]: removed, ...rest } = state.insightsById;
        if (!removed) return state;
        const nextCache = { ...state.cacheByHash };
        if (removed.hash in nextCache) {
          delete nextCache[removed.hash];
        }
        const nextOrder = state.insightOrder.filter((existingId) => existingId !== id);
        const nextState: GeminiVisionState = {
          ...state,
          insightsById: rest,
          insightOrder: nextOrder,
          cacheByHash: nextCache,
        };
        writePersistedState({
          insightsById: rest,
          insightOrder: nextOrder,
          cacheByHash: nextCache,
          costTracker: state.costTracker,
          fallbackStats: state.fallbackStats,
        });
        return nextState;
      });
    },

    dismissError() {
      set((state) => ({ ...state, error: null }));
    },

    getInsightByHash(hash) {
      const cacheId = get().cacheByHash[hash];
      return cacheId ? get().insightsById[cacheId] : undefined;
    },

    markOffline(offline) {
      set((state) => ({ ...state, offline }));
    },

    reset() {
      set((state) => {
        state.uploads.forEach(revokePreview);
        if (typeof window !== 'undefined') {
          window.sessionStorage?.removeItem(STORAGE_KEY);
        }
        return {
          uploads: [],
          insightsById: {},
          insightOrder: [],
          cacheByHash: {},
          isProcessing: false,
          error: null,
          costTracker: defaultCostTracker(),
          fallbackStats: defaultFallbackStats(),
          offline: false,
          lastRequestId: null,
          uploadPhotos: get().uploadPhotos,
          fetchInsightByHash: get().fetchInsightByHash,
          removeInsight: get().removeInsight,
          dismissError: get().dismissError,
          getInsightByHash: get().getInsightByHash,
          markOffline: get().markOffline,
          reset: get().reset,
        } as GeminiVisionState;
      });
    },
  };

  return initialState;
});
