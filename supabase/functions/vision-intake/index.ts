import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { encode as encodeBase64 } from 'https://deno.land/std@0.224.0/encoding/base64.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.0?dts';

interface VisionRequestMetadata {
  locale?: string;
  timezone?: string;
  householdSize?: number;
  dietaryTags?: string[];
  plannerGoal?: string | null;
  preferredMealTypes?: string[];
  pantrySnapshot?: Array<{ name: string; quantityLabel?: string; unit?: string }>;
  missionContext?: { activeMissionTitles: string[] };
  modelHint?: 'flash' | 'pro';
}

interface PricingModel {
  input: number;
  output: number;
}

interface PricingConfig {
  [model: string]: PricingModel;
}

const REQUIRED_ENV = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
const envCache = new Map<string, string>();

const getEnv = (key: string): string | undefined => {
  if (envCache.has(key)) return envCache.get(key);
  const value = Deno.env.get(key);
  if (value) envCache.set(key, value);
  return value;
};

for (const key of REQUIRED_ENV) {
  if (!getEnv(key)) {
    console.error(`[vision-intake] Missing required environment variable: ${key}`);
  }
}

const supabaseUrl = getEnv('SUPABASE_URL');
const serviceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');

const supabaseAdmin = supabaseUrl && serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

const DEFAULT_PRICING: PricingConfig = {
  'gemini-1.5-flash': { input: 0.0000025, output: 0.0000075 },
  'gemini-1.5-pro': { input: 0.0000075, output: 0.0000225 },
};

const PRICING_CONFIG: PricingConfig = (() => {
  try {
    const raw = getEnv('GEMINI_PRICING_JSON');
    if (!raw) return DEFAULT_PRICING;
    const parsed = JSON.parse(raw) as PricingConfig;
    return { ...DEFAULT_PRICING, ...parsed };
  } catch (error) {
    console.warn('[vision-intake] Invalid GEMINI_PRICING_JSON. Using defaults.', error);
    return DEFAULT_PRICING;
  }
})();

const GEMINI_API_KEY = getEnv('GEMINI_VISION_API_KEY') ?? getEnv('GEMINI_API_KEY');
const VISION_PIPELINE_ENABLED = (getEnv('VISION_PIPELINE_ENABLED') ?? 'true').toLowerCase() !== 'false';

const MAX_FILE_SIZE_BYTES = Number(getEnv('VISION_MAX_FILE_BYTES') ?? 4 * 1024 * 1024); // 4 MB por defecto
const ALLOWED_MIME_TYPES = (getEnv('VISION_ALLOWED_MIME_TYPES') ?? 'image/jpeg,image/png,image/webp,image/heic')
  .split(',')
  .map((item) => item.trim().toLowerCase())
  .filter(Boolean);
const CACHE_TTL_DAYS = Number(getEnv('VISION_CACHE_TTL_DAYS') ?? 30);
const VISION_STORAGE_BUCKET = getEnv('VISION_STORAGE_BUCKET') ?? 'vision-insights';
const VISION_STORAGE_TTL_DAYS = Number(getEnv('VISION_STORAGE_TTL_DAYS') ?? CACHE_TTL_DAYS);
const VISION_STORAGE_SIGNED_URL_SECONDS = Number(getEnv('VISION_STORAGE_SIGNED_URL_SECONDS') ?? 3600);
const VISION_STORAGE_PURGE_BATCH = Number(getEnv('VISION_STORAGE_PURGE_BATCH') ?? 5);
const POSTHOG_API_KEY = getEnv('POSTHOG_API_KEY') ?? getEnv('POSTHOG_SERVER_KEY');
const POSTHOG_HOST = getEnv('POSTHOG_HOST') ?? 'https://app.posthog.com';

const jsonResponse = (body: Record<string, unknown>, status = 200, extraHeaders: HeadersInit = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      ...extraHeaders,
    },
  });

const mimeTypeToExtension = (mimeType: string | null | undefined): string => {
  switch ((mimeType ?? '').toLowerCase()) {
    case 'image/jpeg':
    case 'image/jpg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/heic':
      return 'heic';
    case 'image/heif':
      return 'heif';
    default:
      return 'bin';
  }
};

const isStorageMetadataValid = (expiresAt: string | null | undefined) => {
  if (!expiresAt) return false;
  const expiry = new Date(expiresAt);
  if (Number.isNaN(expiry.getTime())) return false;
  return expiry.getTime() > Date.now();
};

const storeVisionImage = async (params: {
  userId: string;
  hash: string;
  buffer: Uint8Array;
  mimeType?: string;
  existingPath?: string | null;
}): Promise<{ path: string; expiresAt: string; contentType: string } | null> => {
  if (!supabaseAdmin) return null;
  try {
    const contentType = params.mimeType && params.mimeType.trim().length > 0
      ? params.mimeType
      : 'application/octet-stream';
    const storagePath = params.existingPath && params.existingPath.length > 0
      ? params.existingPath
      : `${params.userId}/${params.hash}.${mimeTypeToExtension(params.mimeType)}`;
    const { error } = await supabaseAdmin.storage
      .from(VISION_STORAGE_BUCKET)
      .upload(storagePath, params.buffer, {
        contentType,
        upsert: true,
        cacheControl: String(VISION_STORAGE_TTL_DAYS * 24 * 60 * 60),
      });

    if (error) {
      console.warn('[vision-intake] Unable to upload image to storage', error);
      return null;
    }

    const expiresAt = new Date(Date.now() + (VISION_STORAGE_TTL_DAYS * 24 * 60 * 60 * 1000)).toISOString();
    return { path: storagePath, expiresAt, contentType };
  } catch (error) {
    console.warn('[vision-intake] Unexpected error uploading image to storage', error);
    return null;
  }
};

const purgeExpiredVisionImages = async (userId: string) => {
  if (!supabaseAdmin) return;
  try {
    const nowIso = new Date().toISOString();
    const { data, error } = await supabaseAdmin
      .from('vision_insights')
      .select('id, image_storage_path')
      .eq('user_id', userId)
      .lt('image_expires_at', nowIso)
      .not('image_storage_path', 'is', null)
      .limit(VISION_STORAGE_PURGE_BATCH);

    if (error) {
      console.warn('[vision-intake] Unable to fetch expired vision images', error);
      return;
    }

    if (!data?.length) {
      return;
    }

    const paths = data
      .map((row) => row.image_storage_path)
      .filter((path): path is string => typeof path === 'string' && path.length > 0);

    if (paths.length) {
      const { error: storageError } = await supabaseAdmin.storage
        .from(VISION_STORAGE_BUCKET)
        .remove(paths);
      if (storageError) {
        console.warn('[vision-intake] Unable to remove expired storage objects', storageError);
      }
    }

    const ids = data.map((row) => row.id);
    const { error: updateError } = await supabaseAdmin
      .from('vision_insights')
      .update({
        image_storage_path: null,
        image_expires_at: null,
        image_content_type: null,
      })
      .in('id', ids);
    if (updateError) {
      console.warn('[vision-intake] Unable to reset expired image metadata', updateError);
    }
  } catch (error) {
    console.warn('[vision-intake] Error purging expired vision images', error);
  }
};

const toInsightPayload = (row: Record<string, unknown>) => {
  const normalized = (row.normalized_insight as Record<string, unknown>) ?? {};
  const costUsd = typeof row.cost_usd === 'number' ? row.cost_usd : Number(row.cost_usd ?? 0);
  const imageStoragePath = typeof row.image_storage_path === 'string' ? row.image_storage_path : undefined;
  const imageExpiresAt = typeof row.image_expires_at === 'string' ? row.image_expires_at : undefined;
  const imageContentType = typeof row.image_content_type === 'string' ? row.image_content_type : undefined;
  return {
    id: row.id,
    hash: row.image_hash,
    status: row.status,
    source: row.status === 'fallback' ? 'fallback' : 'gemini',
    summary: normalized.summary ?? 'Sin resumen disponible.',
    ingredients: normalized.ingredients ?? [],
    recommendedActions: normalized.recommendedActions ?? [],
    capturedAt: row.processed_at ?? row.created_at,
    latencyMs: row.latency_ms ?? undefined,
    cost: row.cost_tokens_in || row.cost_tokens_out || costUsd
      ? {
          tokensIn: row.cost_tokens_in ?? 0,
          tokensOut: row.cost_tokens_out ?? 0,
          usd: costUsd,
          model: row.model ?? 'gemini-1.5-flash',
          promptVersion: row.prompt_version ?? 'vision_insight_v1',
          cacheHit: row.cache_hit ?? false,
        }
      : undefined,
    fallbackReason: normalized.fallbackReason ?? row.error_message ?? undefined,
    errorMessage: row.error_message ?? undefined,
    rawResponse: row.raw_response ?? undefined,
    imageStoragePath,
    imageExpiresAt,
    imageContentType,
    imageBucket: imageStoragePath ? VISION_STORAGE_BUCKET : undefined,
  };
};

const capturePosthogEvent = async (distinctId: string, event: string, properties: Record<string, unknown>) => {
  if (!POSTHOG_API_KEY) return;
  try {
    await fetch(`${POSTHOG_HOST.replace(/\/$/, '')}/capture/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: POSTHOG_API_KEY,
        event,
        distinct_id: distinctId,
        properties: {
          ...properties,
          $lib: 'vision-edge',
        },
      }),
    });
  } catch (error) {
    console.warn('[vision-intake] Failed to emit PostHog event', error);
  }
};

const ensureSupabase = () => {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not configured');
  }
  return supabaseAdmin;
};

const assertAuth = async (req: Request) => {
  const authHeader = req.headers.get('authorization') ?? req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: jsonResponse({ error: 'Missing or invalid authorization header' }, 401) };
  }

  const token = authHeader.slice('Bearer '.length);
  const supabase = ensureSupabase();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    console.warn('[vision-intake] Invalid token', error?.message);
    return { error: jsonResponse({ error: 'Unauthorized' }, 401) };
  }

  return { user: data.user };
};

const isCacheValid = (createdAt: string | null | undefined) => {
  if (!createdAt) return false;
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return false;
  const diffMs = Date.now() - created.getTime();
  const ttlMs = CACHE_TTL_DAYS * 24 * 60 * 60 * 1000;
  return diffMs <= ttlMs;
};

const calculateCost = (model: string, tokensIn: number, tokensOut: number) => {
  const pricing = PRICING_CONFIG[model] ?? DEFAULT_PRICING['gemini-1.5-flash'];
  return Number(((tokensIn * pricing.input) + (tokensOut * pricing.output)).toFixed(4));
};

const parseMetadata = (raw: FormDataEntryValue | null): VisionRequestMetadata => {
  if (!raw) return {};
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as VisionRequestMetadata;
    } catch (error) {
      console.warn('[vision-intake] Invalid metadata JSON', error);
      return {};
    }
  }
  return {};
};

const buildPrompt = (metadata: VisionRequestMetadata) => {
  const parts: string[] = [];
  parts.push('Analiza la imagen de ingredientes/preparación. Devuelve JSON estrictamente con campos summary, ingredients[], recommendedActions[].');
  if (metadata.dietaryTags?.length) {
    parts.push(`Restricciones: ${metadata.dietaryTags.join(', ')}.`);
  }
  if (metadata.plannerGoal) {
    parts.push(`Objetivo del planificador: ${metadata.plannerGoal}.`);
  }
  if (metadata.preferredMealTypes?.length) {
    parts.push(`Momentos preferidos: ${metadata.preferredMealTypes.join(', ')}.`);
  }
  if (metadata.pantrySnapshot?.length) {
    parts.push('Pantry snapshot disponible para sugerencias.');
  }
  parts.push('Responde en español neutro.');
  return parts.join(' ');
};

const parseGeminiResponse = (rawResponse: Record<string, unknown>) => {
  const candidate = (rawResponse?.candidates as Array<Record<string, unknown>> | undefined)?.[0];
  const content = candidate?.content as { parts?: Array<Record<string, unknown>> } | undefined;
  const textParts = content?.parts?.map((part) => (part.text as string | undefined) ?? '').filter(Boolean) ?? [];
  const joined = textParts.join('\n');

  let parsed: Record<string, unknown> | undefined;
  if (joined) {
    const trimmed = joined.trim().replace(/```json|```/g, '');
    try {
      parsed = JSON.parse(trimmed) as Record<string, unknown>;
    } catch (error) {
      console.warn('[vision-intake] Unable to parse Gemini JSON payload. Returning raw text.', error);
    }
  }

  const ingredientsCandidate = parsed?.ingredients ?? parsed?.detectedIngredients ?? parsed?.ingredientes;
  const ingredients = Array.isArray(ingredientsCandidate) ? ingredientsCandidate : [];

  const actionsCandidate = parsed?.recommendedActions
    ?? parsed?.recommended_actions
    ?? parsed?.accionesRecomendadas;
  const recommendedActions = Array.isArray(actionsCandidate) ? actionsCandidate : [];

  const summary = typeof parsed?.summary === 'string' && parsed.summary.trim().length > 0
    ? parsed.summary.trim()
    : joined.slice(0, 180) || 'Resumen no disponible.';

  return {
    summary,
    ingredients,
    recommendedActions,
    rawText: joined,
  };
};

const fetchExistingInsight = async (userId: string, hash: string) => {
  const supabase = ensureSupabase();
  const { data, error } = await supabase
    .from('vision_insights')
    .select('*')
    .eq('user_id', userId)
    .eq('image_hash', hash)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    console.error('[vision-intake] Error fetching existing insight', error);
    throw error;
  }

  return data ?? null;
};

const upsertInsight = async (
  payload: {
    id?: string;
    userId: string;
    hash: string;
    status: string;
    model: string;
    promptVersion: string;
    rawResponse: Record<string, unknown> | null;
    normalized: Record<string, unknown> | null;
    costTokensIn: number;
    costTokensOut: number;
    costUsd: number;
    latencyMs: number | null;
    cacheHit: boolean;
    errorMessage?: string | null;
    imageStoragePath?: string | null;
    imageExpiresAt?: string | null;
    imageContentType?: string | null;
  },
) => {
  const supabase = ensureSupabase();
  const { data, error } = await supabase
    .from('vision_insights')
    .upsert({
      id: payload.id,
      user_id: payload.userId,
      image_hash: payload.hash,
      status: payload.status,
      model: payload.model,
      prompt_version: payload.promptVersion,
      raw_response: payload.rawResponse,
      normalized_insight: payload.normalized,
      cost_tokens_in: payload.costTokensIn,
      cost_tokens_out: payload.costTokensOut,
      cost_usd: payload.costUsd,
      latency_ms: payload.latencyMs,
      cache_hit: payload.cacheHit,
      error_message: payload.errorMessage ?? null,
      processed_at: new Date().toISOString(),
      image_storage_path: payload.imageStoragePath ?? null,
      image_expires_at: payload.imageExpiresAt ?? null,
      image_content_type: payload.imageContentType ?? null,
    }, { onConflict: 'user_id,image_hash' })
    .select('*')
    .single();

  if (error) {
    console.error('[vision-intake] Error upserting insight', error);
    throw error;
  }

  return data;
};

const updateInsightImageMetadata = async (payload: {
  id: string;
  imageStoragePath?: string | null;
  imageExpiresAt?: string | null;
  imageContentType?: string | null;
}) => {
  const supabase = ensureSupabase();
  const { data, error } = await supabase
    .from('vision_insights')
    .update({
      image_storage_path: payload.imageStoragePath ?? null,
      image_expires_at: payload.imageExpiresAt ?? null,
      image_content_type: payload.imageContentType ?? null,
      processed_at: new Date().toISOString(),
    })
    .eq('id', payload.id)
    .select('*')
    .single();

  if (error) {
    console.warn('[vision-intake] Unable to update image metadata', error);
    return null;
  }

  return data;
};

const buildPipelineDisabledResponse = () =>
  jsonResponse({
    error: 'Vision pipeline disabled',
    code: 'pipeline_disabled',
    fallbackHint: 'Usa heurística local o reintenta más tarde.',
  }, 503);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!VISION_PIPELINE_ENABLED) {
      return buildPipelineDisabledResponse();
    }

    if (!supabaseAdmin) {
      return jsonResponse({ error: 'Service not configured' }, 500);
    }

    if (!GEMINI_API_KEY) {
      console.error('[vision-intake] Missing Gemini API key');
      return jsonResponse({ error: 'Gemini API key not configured' }, 500);
    }

    const { user, error } = await assertAuth(req);
    if (error || !user) {
      return error ?? jsonResponse({ error: 'Unauthorized' }, 401);
    }

    await purgeExpiredVisionImages(user.id);

    const url = new URL(req.url);

    if (req.method === 'GET') {
      const hash = url.searchParams.get('hash');
      if (!hash) {
        return jsonResponse({ error: 'Missing hash parameter' }, 400);
      }

      const existing = await fetchExistingInsight(user.id, hash);
      if (!existing || !isCacheValid(existing.created_at as string)) {
        return jsonResponse({ error: 'Not found' }, 404);
      }

      const insightPayload = toInsightPayload(existing as Record<string, unknown>);
      return jsonResponse({ insight: insightPayload, requestId: crypto.randomUUID(), cacheHit: true });
    }

    if (req.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    const contentType = req.headers.get('content-type') ?? '';
    if (!contentType.includes('multipart/form-data')) {
      return jsonResponse({ error: 'Unsupported content type' }, 415);
    }

    const formData = await req.formData();
    const file = formData.get('file');
    const hash = (formData.get('hash') as string | null)?.trim();
    const cacheBypass = (formData.get('cacheBypass') as string | null)?.toLowerCase() === 'true';
    const metadata = parseMetadata(formData.get('metadata'));

    if (!(file instanceof File) || !hash) {
      return jsonResponse({ error: 'Invalid payload. Expecting file upload and hash.' }, 400);
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return jsonResponse({ error: 'File too large', maxBytes: MAX_FILE_SIZE_BYTES }, 413);
    }

    const mimeType = (file.type ?? '').toLowerCase();
    if (mimeType && !ALLOWED_MIME_TYPES.includes(mimeType)) {
      return jsonResponse({ error: `Unsupported file type: ${mimeType}` }, 415);
    }

    const buffer = new Uint8Array(await file.arrayBuffer());
    const existing = await fetchExistingInsight(user.id, hash);
    const existingRecord = existing as (Record<string, unknown> & {
      image_storage_path?: string | null;
      image_expires_at?: string | null;
      image_content_type?: string | null;
      created_at?: string | null;
      status?: string;
      id?: string;
    }) | null;

    let imageStoragePath = typeof existingRecord?.image_storage_path === 'string'
      ? existingRecord.image_storage_path
      : null;
    let imageExpiresAt = typeof existingRecord?.image_expires_at === 'string'
      ? existingRecord.image_expires_at
      : null;
    let imageContentType = typeof existingRecord?.image_content_type === 'string'
      ? existingRecord.image_content_type
      : (mimeType || 'application/octet-stream');

    if (cacheBypass || !imageStoragePath || !isStorageMetadataValid(imageExpiresAt)) {
      const storedImage = await storeVisionImage({
        userId: user.id,
        hash,
        buffer,
        mimeType,
        existingPath: imageStoragePath ?? undefined,
      });
      if (storedImage) {
        imageStoragePath = storedImage.path;
        imageExpiresAt = storedImage.expiresAt;
        imageContentType = storedImage.contentType;
      }
    }

    if (existingRecord && !cacheBypass && existingRecord.status === 'completed' && isCacheValid(existingRecord.created_at ?? null)) {
      let enrichedExisting = existingRecord as Record<string, unknown>;
      const metadataChanged = imageStoragePath !== existingRecord.image_storage_path
        || imageExpiresAt !== existingRecord.image_expires_at
        || imageContentType !== existingRecord.image_content_type;

      if (metadataChanged && existingRecord.id) {
        const updated = await updateInsightImageMetadata({
          id: existingRecord.id as string,
          imageStoragePath,
          imageExpiresAt,
          imageContentType,
        });
        if (updated) {
          enrichedExisting = updated as Record<string, unknown>;
        } else {
          enrichedExisting = {
            ...enrichedExisting,
            image_storage_path: imageStoragePath ?? existingRecord.image_storage_path,
            image_expires_at: imageExpiresAt ?? existingRecord.image_expires_at,
            image_content_type: imageContentType ?? existingRecord.image_content_type,
          };
        }
      }

      const payload = toInsightPayload(enrichedExisting);
      void capturePosthogEvent(user.id, 'vision_edge_cache_hit', {
        hash,
        cacheHit: true,
        latencyMs: 0,
        imagePath: payload.imageStoragePath ?? null,
        expiresAt: payload.imageExpiresAt ?? null,
      });
      return jsonResponse({ insight: payload, requestId: crypto.randomUUID(), cacheHit: true });
    }

    const base64Data = encodeBase64(buffer);

    const model = metadata.modelHint === 'pro' ? 'gemini-1.5-pro' : 'gemini-1.5-flash';
    const prompt = buildPrompt(metadata);
    const started = performance.now();

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              prompt ? { text: prompt } : { text: 'Analiza la imagen y devuelve JSON estructurado.' },
              {
                inline_data: {
                  mime_type: mimeType || 'image/jpeg',
                  data: base64Data,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          topP: 0.95,
          topK: 32,
          maxOutputTokens: 768,
        },
      }),
    });

    const latency = Math.round(performance.now() - started);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[vision-intake] Gemini API error', response.status, errorText);
      await upsertInsight({
        id: existingRecord?.id,
        userId: user.id,
        hash,
        status: 'failed',
        model,
        promptVersion: 'vision_insight_v1',
        rawResponse: null,
        normalized: null,
        costTokensIn: 0,
        costTokensOut: 0,
        costUsd: 0,
        latencyMs: latency,
        cacheHit: false,
        errorMessage: `Gemini error ${response.status}`,
        imageStoragePath,
        imageExpiresAt,
        imageContentType,
      });
      void capturePosthogEvent(user.id, 'vision_edge_failed', {
        hash,
        model,
        latencyMs: latency,
        statusCode: response.status,
      });
      return jsonResponse({
        error: 'Gemini vision request failed',
        code: 'gemini_error',
      }, 502);
    }

    const rawJson = await response.json() as Record<string, unknown>;
    const usage = rawJson.usageMetadata as Record<string, number> | undefined;
    const tokensIn = usage?.promptTokenCount ?? 0;
    const tokensOut = usage?.candidatesTokenCount ?? usage?.totalTokenCount ?? 0;
    const costUsd = calculateCost(model, tokensIn, tokensOut);
    const parsed = parseGeminiResponse(rawJson);

    const normalized: Record<string, unknown> = {
      summary: parsed.summary,
      ingredients: parsed.ingredients,
      recommendedActions: parsed.recommendedActions,
      rawText: parsed.rawText,
      generatedAt: new Date().toISOString(),
      metadata,
    };

    if (imageStoragePath) {
      normalized.imageStoragePath = imageStoragePath;
    }
    if (imageExpiresAt) {
      normalized.imageExpiresAt = imageExpiresAt;
    }
    if (imageContentType) {
      normalized.imageContentType = imageContentType;
    }

    const record = await upsertInsight({
      id: existingRecord?.id,
      userId: user.id,
      hash,
      status: 'completed',
      model,
      promptVersion: 'vision_insight_v1',
      rawResponse: rawJson,
      normalized,
      costTokensIn: tokensIn,
      costTokensOut: tokensOut,
      costUsd,
      latencyMs: latency,
      cacheHit: false,
      imageStoragePath,
      imageExpiresAt,
      imageContentType,
    });

    void capturePosthogEvent(user.id, 'vision_edge_completed', {
      hash,
      model,
      latencyMs: latency,
      tokensIn,
      tokensOut,
      costUsd,
      cacheHit: false,
      imageStored: Boolean(imageStoragePath),
    });

    console.log(JSON.stringify({
      event: 'vision_insight_completed',
      userId: user.id,
      hash,
      model,
      tokensIn,
      tokensOut,
      costUsd,
      latency,
    }));

    const payload = toInsightPayload(record as Record<string, unknown>);
    return jsonResponse({ insight: payload, requestId: crypto.randomUUID(), cacheHit: false });
  } catch (error) {
    console.error('[vision-intake] Unexpected error', error);
    return jsonResponse({ error: 'Unexpected error processing request' }, 500);
  }
});
