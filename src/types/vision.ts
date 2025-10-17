export type VisionInsightStatus = 'processing' | 'completed' | 'failed' | 'fallback';

export type VisionMealType = 'Desayuno' | 'Almuerzo' | 'Merienda' | 'Cena';

export interface VisionInsightCost {
  tokensIn: number;
  tokensOut: number;
  usd: number;
  model: string;
  promptVersion: string;
  cacheHit?: boolean;
}

export interface VisionIngredientInsight {
  name: string;
  confidence: number;
  quantityLabel?: string;
  unit?: string;
  freshness?: 'fresh' | 'stale' | 'unknown';
  preparationHints?: string[];
  pantryMatchId?: string;
}

export type VisionActionType = 'plan_meal' | 'add_to_pantry' | 'create_mission' | 'batch_cook' | 'flag_spoilage';

export interface VisionActionRecommendation {
  id: string;
  type: VisionActionType;
  label: string;
  description?: string;
  confidence: number;
  suggestedMealType?: VisionMealType;
}

export interface VisionInsightNormalized {
  id: string;
  hash: string;
  status: VisionInsightStatus;
  source: 'gemini' | 'fallback';
  summary: string;
  ingredients: VisionIngredientInsight[];
  recommendedActions: VisionActionRecommendation[];
  capturedAt: string;
  latencyMs?: number;
  cost?: VisionInsightCost;
  fallbackReason?: string;
  errorMessage?: string;
  rawResponse?: unknown;
  imageStoragePath?: string;
  imageExpiresAt?: string;
  imageContentType?: string;
  imageBucket?: string;
}

export interface VisionUploadItem {
  id: string;
  hash: string;
  fileName: string;
  size: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
  previewUrl?: string;
  startedAt: number;
  completedAt?: number;
}

export interface VisionRequestMetadata {
  locale: string;
  timezone: string;
  householdSize?: number;
  dietaryTags?: string[];
  plannerGoal?: string | null;
  preferredMealTypes?: VisionMealType[];
  pantrySnapshot?: Array<{
    name: string;
    quantityLabel?: string;
    unit?: string;
  }>;
  missionContext?: {
    activeMissionTitles: string[];
  };
  modelHint?: 'flash' | 'pro';
  featureFlags?: Record<string, boolean>;
}

export interface VisionIntakeSuccessResponse {
  insight: VisionInsightNormalized;
  requestId: string;
  cacheHit?: boolean;
}

export interface VisionIntakeErrorResponse {
  error: string;
  code?: string;
  fallback?: VisionInsightNormalized;
}

export interface VisionTelemetryEvent {
  name: string;
  payload?: Record<string, unknown>;
}
