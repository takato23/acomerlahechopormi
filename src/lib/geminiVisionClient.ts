import type {
  VisionIntakeSuccessResponse,
  VisionIntakeErrorResponse,
  VisionInsightNormalized,
  VisionRequestMetadata,
} from '@/types/vision';

const DEFAULT_ENDPOINT = '/api/vision-intake';
const STORAGE_KEY = 'vision:lastSuccessfulInsight';

type RequestOptions = {
  hash: string;
  metadata: VisionRequestMetadata;
  file: File;
  cacheBypass?: boolean;
  signal?: AbortSignal;
};

type FetchOptions = {
  hash: string;
  signal?: AbortSignal;
};

const getAuthHeaders = (): Record<string, string> => {
  if (typeof window === 'undefined') {
    return {};
  }

  const token = window.localStorage?.getItem('sb-access-token');
  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
};

export const computeFileHash = async (file: File): Promise<string> => {
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle && crypto.subtle.digest) {
      const buffer = await file.arrayBuffer();
      const digest = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(digest));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (error) {
    console.warn('[geminiVisionClient] crypto.subtle digest failed, fallback hash in use.', error);
  }

  const fallback = `${file.name}-${file.size}-${file.lastModified ?? Date.now()}`;
  return fallback;
};

const persistLastInsight = (insight: VisionInsightNormalized) => {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage?.setItem(STORAGE_KEY, JSON.stringify({
      id: insight.id,
      hash: insight.hash,
      createdAt: insight.capturedAt,
    }));
  } catch (error) {
    console.warn('[geminiVisionClient] Unable to persist last insight metadata', error);
  }
};

class GeminiVisionClient {
  private endpoint: string;

  constructor(endpoint = DEFAULT_ENDPOINT) {
    this.endpoint = endpoint;
  }

  public setEndpoint(endpoint: string) {
    this.endpoint = endpoint;
  }

  public async requestInsight(options: RequestOptions): Promise<VisionIntakeSuccessResponse> {
    const formData = new FormData();
    formData.append('file', options.file, options.file.name);
    formData.append('hash', options.hash);
    formData.append('metadata', JSON.stringify(options.metadata));
    if (options.cacheBypass) {
      formData.append('cacheBypass', 'true');
    }

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        ...getAuthHeaders(),
      },
      body: formData,
      signal: options.signal,
    });

    if (!response.ok) {
      let errorPayload: VisionIntakeErrorResponse | undefined;
      try {
        errorPayload = await response.json();
      } catch (error) {
        console.error('[geminiVisionClient] Unable to parse error payload', error);
      }

      const error = new Error(errorPayload?.error ?? `Vision request failed with status ${response.status}`);
      (error as Error & { code?: string; fallback?: VisionInsightNormalized }).code = errorPayload?.code;
      if (errorPayload?.fallback) {
        (error as Error & { fallback?: VisionInsightNormalized }).fallback = errorPayload.fallback;
      }
      throw error;
    }

    const payload = (await response.json()) as VisionIntakeSuccessResponse;
    if (payload?.insight) {
      persistLastInsight(payload.insight);
    }
    return payload;
  }

  public async fetchInsightByHash(options: FetchOptions): Promise<VisionInsightNormalized | null> {
    const baseOrigin = (() => {
      if (typeof window !== 'undefined' && window.location?.origin) {
        return window.location.origin;
      }
      if (typeof globalThis !== 'undefined' && (globalThis as { location?: Location }).location?.origin) {
        return (globalThis as { location?: Location }).location!.origin;
      }
      return 'http://localhost';
    })();

    const url = new URL(this.endpoint, baseOrigin);
    url.searchParams.set('hash', options.hash);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...getAuthHeaders(),
      },
      signal: options.signal,
      cache: 'no-store',
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Vision cache lookup failed (${response.status})`);
    }

    const payload = (await response.json()) as VisionIntakeSuccessResponse;
    if (!payload?.insight) {
      return null;
    }

    persistLastInsight(payload.insight);
    return payload.insight;
  }
}

export const geminiVisionClient = new GeminiVisionClient();
