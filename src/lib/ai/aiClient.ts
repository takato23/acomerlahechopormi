import type { SuggestionResponse } from '@/features/suggestions/types';

export type AiProviderName = 'mock' | 'proxy';

export interface AiClientOptions {
  provider?: AiProviderName;
  proxyUrl?: string;
  defaultHeaders?: Record<string, string>;
}

export interface AiStructuredRequest<T> {
  prompt: string;
  context?: Record<string, unknown>;
  fallback: T;
  signal?: AbortSignal;
}

interface AiProvider {
  generateStructuredResponse<T>(request: AiStructuredRequest<T>): Promise<T>;
}

class MockAiProvider implements AiProvider {
  async generateStructuredResponse<T>(request: AiStructuredRequest<T>): Promise<T> {
    const mockResponse = request.context?.mockResponse as T | undefined;
    return mockResponse ?? request.fallback;
  }
}

class ProxyAiProvider implements AiProvider {
  private proxyUrl?: string;
  private defaultHeaders: Record<string, string>;

  constructor(options: AiClientOptions) {
    this.proxyUrl = options.proxyUrl;
    this.defaultHeaders = options.defaultHeaders ?? {};
  }

  async generateStructuredResponse<T>(request: AiStructuredRequest<T>): Promise<T> {
    if (!this.proxyUrl) {
      throw new Error('AI proxy URL is not configured.');
    }

    const response = await fetch(this.proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.defaultHeaders,
      },
      body: JSON.stringify({
        prompt: request.prompt,
        context: request.context,
      }),
      signal: request.signal,
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(`AI proxy request failed: ${message || response.statusText}`);
    }

    const data = (await response.json()) as T;
    return data;
  }
}

export class ConfigurableAiClient {
  private provider: AiProvider;
  private options: AiClientOptions;

  constructor(options: AiClientOptions = {}) {
    this.options = options;
    this.provider = this.createProvider(options);
  }

  setProvider(provider: AiProviderName, options: Partial<AiClientOptions> = {}): void {
    this.options = { ...this.options, provider, ...options };
    this.provider = this.createProvider(this.options);
  }

  async generateStructuredResponse<T>(request: AiStructuredRequest<T>): Promise<T> {
    try {
      return await this.provider.generateStructuredResponse(request);
    } catch (error) {
      console.warn('[aiClient] Falling back to provided data due to provider error:', error);
      return request.fallback;
    }
  }

  private createProvider(options: AiClientOptions): AiProvider {
    switch (options.provider) {
      case 'proxy':
        return new ProxyAiProvider(options);
      case 'mock':
      default:
        return new MockAiProvider();
    }
  }
}

const providerFromEnv = (import.meta.env.VITE_AI_PROVIDER as AiProviderName | undefined) ?? 'mock';
const proxyUrlFromEnv = import.meta.env.VITE_AI_PROXY_URL as string | undefined;
const defaultHeaders: Record<string, string> = {};

export const aiClient = new ConfigurableAiClient({
  provider: providerFromEnv,
  proxyUrl: proxyUrlFromEnv,
  defaultHeaders,
});

export async function generateSuggestionsWithFallback(
  request: AiStructuredRequest<SuggestionResponse>,
): Promise<SuggestionResponse> {
  return aiClient.generateStructuredResponse<SuggestionResponse>(request);
}
