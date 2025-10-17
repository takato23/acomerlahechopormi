import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { VisionUploadPanel } from '../VisionUploadPanel';
import type { UseGeminiVisionResult } from '@/hooks/useGeminiVision';
import type { VisionInsightNormalized } from '@/types/vision';

jest.mock('@/hooks/useGeminiVision', () => ({
  useGeminiVision: jest.fn(),
}));

jest.mock('@/context/FeatureFlagsContext', () => ({
  useFeatureFlags: jest.fn(),
}));

jest.mock('lucide-react', () => {
  const createIcon = (name: string) => (props: React.SVGAttributes<SVGSVGElement>) => (
    <svg aria-hidden="true" data-testid={`icon-${name}`} {...props} />
  );

  return {
    Camera: createIcon('camera'),
    CheckCircle2: createIcon('check-circle2'),
    UploadCloud: createIcon('upload-cloud'),
    CloudUpload: createIcon('cloud-upload'),
    Image: createIcon('image'),
    Info: createIcon('info'),
    Loader2: createIcon('loader2'),
    ShieldAlert: createIcon('shield-alert'),
    Sparkles: createIcon('sparkles'),
    Trash2: createIcon('trash2'),
    AlertTriangle: createIcon('alert-triangle'),
  };
});

jest.mock('framer-motion', () => {
  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: new Proxy(
      {},
      {
        get: () => ({ children, layout: _layout, transition: _transition, ...rest }: any) => (
          <div {...rest}>{children}</div>
        ),
      },
    ),
    useReducedMotion: () => true,
  };
});

jest.mock('@/stores/planningStore', () => {
  const state = {
    plannedMeals: [],
    preferences: null,
  };

  const hook = (selector: (state: any) => unknown) => selector(state);
  hook.getState = () => state;
  return { usePlanningStore: hook };
});

jest.mock('@/stores/pantryStore', () => {
  const state = { items: [] };
  const hook = (selector: (state: any) => unknown) => selector(state);
  hook.getState = () => state;
  return { usePantryStore: hook };
});

const mockUseGeminiVision = jest.requireMock('@/hooks/useGeminiVision').useGeminiVision as jest.MockedFunction<() => UseGeminiVisionResult>;
const mockUseFeatureFlags = jest.requireMock('@/context/FeatureFlagsContext').useFeatureFlags as jest.MockedFunction<
  () => { ready: boolean; visionPipelineEnabled: boolean; client: null; track: jest.Mock }
>;

const baseInsight: VisionInsightNormalized = {
  id: 'insight-1',
  hash: 'hash-1',
  status: 'completed',
  source: 'gemini',
  summary: 'Pollo con verduras detectado',
  ingredients: [{ name: 'Pollo', confidence: 0.9 }],
  recommendedActions: [
    {
      id: 'action-1',
      type: 'plan_meal',
      label: 'Planificar comida con pollo',
      confidence: 0.8,
    },
  ],
  capturedAt: new Date().toISOString(),
};

const buildHookReturn = (overrides?: Partial<UseGeminiVisionResult>): UseGeminiVisionResult => ({
  uploads: [],
  insights: [],
  isProcessing: false,
  error: null,
  costTracker: {
    tokensIn: 0,
    tokensOut: 0,
    usd: 0,
    cacheHits: 0,
    lastUpdated: new Date().toISOString(),
  },
  fallbackStats: {
    count: 0,
    reasons: {},
  },
  upload: jest.fn(),
  clearError: jest.fn(),
  removeInsight: jest.fn(),
  markOffline: jest.fn(),
  getInsightByHash: jest.fn(),
  ...overrides,
});

describe('VisionUploadPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseFeatureFlags.mockReturnValue({
      ready: true,
      visionPipelineEnabled: true,
      client: null,
      track: jest.fn(),
    });
  });

  it('renders upload call-to-action and cost summary', () => {
    mockUseGeminiVision.mockReturnValue(buildHookReturn());
    render(<VisionUploadPanel />);

    expect(screen.getByText(/sube una foto/i)).toBeInTheDocument();
    expect(screen.getByText(/Coste estimado/i)).toBeInTheDocument();
  });

  it('invokes onApplyInsight when the action button is clicked', () => {
    const onApplyInsight = jest.fn();
    mockUseGeminiVision.mockReturnValue(
      buildHookReturn({
        insights: [baseInsight],
      }),
    );

    render(<VisionUploadPanel onApplyInsight={onApplyInsight} />);

    const applyButton = screen.getByRole('button', { name: /Aplicar al plan/i });
    fireEvent.click(applyButton);

    expect(onApplyInsight).toHaveBeenCalledWith(expect.objectContaining({ id: 'insight-1' }));
  });

  it('disables uploads when the feature flag is off', () => {
    const uploadSpy = jest.fn();
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    try {
      mockUseFeatureFlags.mockReturnValue({
        ready: true,
        visionPipelineEnabled: false,
        client: null,
        track: jest.fn(),
      });
      mockUseGeminiVision.mockReturnValue(
        buildHookReturn({
          upload: uploadSpy,
        }),
      );

      render(<VisionUploadPanel />);

      expect(screen.getByText(/mantenimiento del pipeline/i)).toBeInTheDocument();
      const chooseButton = screen
        .getAllByRole('button', { name: /Elegir archivo/i })
        .find((element): element is HTMLButtonElement => element.tagName === 'BUTTON');

      expect(chooseButton).toBeDefined();
      expect(chooseButton).toBeDisabled();
      fireEvent.click(chooseButton!);
      expect(uploadSpy).not.toHaveBeenCalled();
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });
});
