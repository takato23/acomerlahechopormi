import { v4 as uuidv4 } from 'uuid';
import type {
  VisionActionRecommendation,
  VisionInsightNormalized,
  VisionInsightStatus,
  VisionIngredientInsight,
  VisionInsightCost,
} from '@/types/vision';

export const VISION_INSIGHT_SCHEMA = 'vision_insight_v1';

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const isNonEmptyString = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

const sanitizeIngredients = (input: unknown): VisionIngredientInsight[] => {
  if (!Array.isArray(input)) return [];
  return input
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const raw = item as Partial<VisionIngredientInsight & { name: unknown; confidence: unknown }>;
      const name = isNonEmptyString(raw.name) ? raw.name.trim() : null;
      if (!name) return null;
      const confidence = isFiniteNumber(raw.confidence) ? raw.confidence : 0.5;
      return {
        name,
        confidence,
        quantityLabel: isNonEmptyString(raw.quantityLabel) ? raw.quantityLabel.trim() : undefined,
        unit: isNonEmptyString(raw.unit) ? raw.unit.trim() : undefined,
        freshness: isNonEmptyString(raw.freshness)
          ? (['fresh', 'stale', 'unknown'].includes(raw.freshness) ? raw.freshness : 'unknown')
          : 'unknown',
        preparationHints: Array.isArray(raw.preparationHints)
          ? raw.preparationHints.filter(isNonEmptyString).map((hint) => hint.trim())
          : undefined,
        pantryMatchId: isNonEmptyString((raw as { pantryMatchId?: unknown }).pantryMatchId)
          ? (raw as { pantryMatchId: string }).pantryMatchId
          : undefined,
      } satisfies VisionIngredientInsight;
    })
    .filter(Boolean) as VisionIngredientInsight[];
};

const sanitizeActions = (input: unknown): VisionActionRecommendation[] => {
  if (!Array.isArray(input)) return [];
  return input
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const raw = item as Partial<VisionActionRecommendation & { label: unknown; type: unknown; confidence: unknown }>;
      const label = isNonEmptyString(raw.label) ? raw.label.trim() : null;
      const type = isNonEmptyString(raw.type) ? raw.type : null;
      if (!label || !type) return null;
      return {
        id: isNonEmptyString(raw.id) ? raw.id : uuidv4(),
        type: type as VisionActionRecommendation['type'],
        label,
        description: isNonEmptyString(raw.description) ? raw.description.trim() : undefined,
        confidence: isFiniteNumber(raw.confidence) ? raw.confidence : 0.5,
        suggestedMealType: isNonEmptyString(raw.suggestedMealType)
          ? (raw.suggestedMealType as VisionActionRecommendation['suggestedMealType'])
          : undefined,
      } satisfies VisionActionRecommendation;
    })
    .filter(Boolean) as VisionActionRecommendation[];
};

const sanitizeCost = (input: unknown): VisionInsightCost | undefined => {
  if (!input || typeof input !== 'object') return undefined;
  const raw = input as Partial<VisionInsightCost & { tokensIn: unknown; tokensOut: unknown; usd: unknown }>;
  const tokensIn = isFiniteNumber(raw.tokensIn) ? raw.tokensIn : 0;
  const tokensOut = isFiniteNumber(raw.tokensOut) ? raw.tokensOut : 0;
  const usd = isFiniteNumber(raw.usd) ? raw.usd : 0;
  const model = isNonEmptyString(raw.model) ? raw.model : 'gemini-1.5-flash';
  const promptVersion = isNonEmptyString(raw.promptVersion) ? raw.promptVersion : VISION_INSIGHT_SCHEMA;
  return {
    tokensIn,
    tokensOut,
    usd,
    model,
    promptVersion,
    cacheHit: raw.cacheHit,
  } satisfies VisionInsightCost;
};

export const normalizeInsight = (
  raw: Partial<VisionInsightNormalized> & { hash: string },
  overrides: Partial<VisionInsightNormalized> = {},
): VisionInsightNormalized => {
  const status: VisionInsightStatus = (isNonEmptyString(raw.status) ? raw.status : 'completed') as VisionInsightStatus;
  const id = isNonEmptyString(raw.id) ? raw.id : uuidv4();
  const capturedAt = isNonEmptyString(raw.capturedAt) ? raw.capturedAt : new Date().toISOString();

  return {
    id,
    hash: raw.hash,
    status,
    source: raw.source === 'fallback' ? 'fallback' : 'gemini',
    summary: isNonEmptyString(raw.summary) ? raw.summary.trim() : 'Sin resumen disponible.',
    ingredients: sanitizeIngredients(raw.ingredients),
    recommendedActions: sanitizeActions(raw.recommendedActions),
    capturedAt,
    latencyMs: isFiniteNumber(raw.latencyMs) ? raw.latencyMs : raw.cost?.cacheHit ? 0 : undefined,
    cost: sanitizeCost(raw.cost),
    fallbackReason: isNonEmptyString(raw.fallbackReason) ? raw.fallbackReason : overrides.fallbackReason,
    errorMessage: isNonEmptyString(raw.errorMessage) ? raw.errorMessage : overrides.errorMessage,
    rawResponse: raw.rawResponse ?? overrides.rawResponse,
    imageStoragePath: isNonEmptyString(raw.imageStoragePath) ? raw.imageStoragePath : overrides.imageStoragePath,
    imageExpiresAt: isNonEmptyString(raw.imageExpiresAt) ? raw.imageExpiresAt : overrides.imageExpiresAt,
    imageContentType: isNonEmptyString(raw.imageContentType) ? raw.imageContentType : overrides.imageContentType,
    imageBucket: isNonEmptyString(raw.imageBucket) ? raw.imageBucket : overrides.imageBucket,
    ...overrides,
  } satisfies VisionInsightNormalized;
};

export interface FallbackInsightParams {
  hash: string;
  summary: string;
  reason: string;
  ingredients: VisionIngredientInsight[];
  actions: VisionActionRecommendation[];
  errorMessage?: string;
  now?: string;
}

export const buildFallbackInsight = ({
  hash,
  summary,
  reason,
  ingredients,
  actions,
  errorMessage,
  now,
}: FallbackInsightParams): VisionInsightNormalized =>
  normalizeInsight(
    {
      hash,
      summary,
      ingredients,
      recommendedActions: actions,
      status: 'fallback',
      source: 'fallback',
      capturedAt: now ?? new Date().toISOString(),
      fallbackReason: reason,
      errorMessage,
    },
    {
      fallbackReason: reason,
      errorMessage,
    },
  );
