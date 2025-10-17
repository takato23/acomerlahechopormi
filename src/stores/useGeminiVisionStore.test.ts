import { act } from '@testing-library/react';
import { useGeminiVisionStore } from './useGeminiVisionStore';
import type { VisionInsightNormalized } from '@/types/vision';

jest.mock('@/lib/geminiVisionClient', () => {
  const original = jest.requireActual('@/lib/geminiVisionClient');
  return {
    ...original,
    geminiVisionClient: {
      requestInsight: jest.fn(),
      fetchInsightByHash: jest.fn(),
    },
    computeFileHash: jest.fn(),
  };
});

const { geminiVisionClient, computeFileHash } = jest.requireMock('@/lib/geminiVisionClient') as {
  geminiVisionClient: {
    requestInsight: jest.Mock;
    fetchInsightByHash: jest.Mock;
  };
  computeFileHash: jest.Mock;
};

describe('useGeminiVisionStore', () => {
  beforeAll(() => {
    Object.defineProperty(global.URL, 'createObjectURL', {
      writable: true,
      value: jest.fn(() => 'blob:mock'),
    });
    Object.defineProperty(global.URL, 'revokeObjectURL', {
      writable: true,
      value: jest.fn(),
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    act(() => {
      useGeminiVisionStore.getState().reset();
    });
  });

  it('stores new insights and updates cache after successful upload', async () => {
    const now = new Date().toISOString();
    computeFileHash.mockResolvedValue('hash-test-1');
    geminiVisionClient.fetchInsightByHash.mockResolvedValue(null);
    const insight: VisionInsightNormalized = {
      id: 'insight-1',
      hash: 'hash-test-1',
      status: 'completed',
      source: 'gemini',
      summary: 'Detectamos pollo y verduras frescas',
      ingredients: [
        { name: 'Pollo', confidence: 0.9 },
        { name: 'Zanahoria', confidence: 0.8 },
      ],
      recommendedActions: [],
      capturedAt: now,
      cost: {
        tokensIn: 1500,
        tokensOut: 600,
        usd: 0.0072,
        model: 'gemini-1.5-flash',
        promptVersion: 'vision_insight_v1',
        cacheHit: false,
      },
    };

    geminiVisionClient.requestInsight.mockResolvedValue({
      insight,
      requestId: 'req-123',
      cacheHit: false,
    });

    const file = new File(['mock'], 'pollo.jpg', { type: 'image/jpeg' });
    const onInsight = jest.fn();

    await act(async () => {
      await useGeminiVisionStore.getState().uploadPhotos([file], { onInsight });
    });

    const state = useGeminiVisionStore.getState();
    expect(state.insightOrder).toContain('insight-1');
    expect(state.cacheByHash['hash-test-1']).toBe('insight-1');
    expect(state.costTracker.tokensIn).toBe(1500);
    expect(onInsight).toHaveBeenCalledWith(expect.objectContaining({ id: 'insight-1' }));
  });

  it('falls back to heuristic insight when Gemini request fails', async () => {
    computeFileHash.mockResolvedValue('hash-fallback');
    geminiVisionClient.fetchInsightByHash.mockResolvedValue(null);
    geminiVisionClient.requestInsight.mockRejectedValue(new Error('Service unavailable'));

    const file = new File(['mock'], 'despensa.jpg', { type: 'image/jpeg' });

    await act(async () => {
      await useGeminiVisionStore.getState().uploadPhotos([file]);
    });

    const state = useGeminiVisionStore.getState();
    expect(state.fallbackStats.count).toBeGreaterThan(0);
    const savedInsight = state.insightOrder.map((id) => state.insightsById[id])[0];
    expect(savedInsight.source).toBe('fallback');
    expect(savedInsight.summary).toMatch(/heurística/i);
  });
});
