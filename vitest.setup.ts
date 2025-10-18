import { config } from 'dotenv';
import '@testing-library/jest-dom';
import { vi } from 'vitest';

config({ path: '.env.local', override: true });

class PointerEventPolyfill extends Event {
  constructor(type: string, params: PointerEventInit = {}) {
    super(type, params);
  }
}

if (typeof window !== 'undefined' && !('PointerEvent' in window)) {
  (window as unknown as { PointerEvent: typeof PointerEvent }).PointerEvent = PointerEventPolyfill;
}

if (typeof Element !== 'undefined') {
  const elementProto = Element.prototype as unknown as {
    hasPointerCapture?: (pointerId: number) => boolean;
    releasePointerCapture?: (pointerId: number) => void;
    setPointerCapture?: (pointerId: number) => void;
    scrollIntoView?: (arg?: boolean | ScrollIntoViewOptions) => void;
  };

  elementProto.hasPointerCapture = elementProto.hasPointerCapture ?? (() => false);
  elementProto.releasePointerCapture = elementProto.releasePointerCapture ?? (() => {});
  elementProto.setPointerCapture = elementProto.setPointerCapture ?? (() => {});
  elementProto.scrollIntoView = elementProto.scrollIntoView ?? (() => {});
}

if (typeof globalThis.import === 'undefined') {
  Object.defineProperty(globalThis, 'import', {
    value: {},
    configurable: true,
  });
}

Object.defineProperty(globalThis, 'import', {
  value: {
    meta: {
      env: {
        VITE_GEMINI_API_KEY: 'mock-api-key',
      },
    },
  },
  configurable: true,
});

if (typeof globalThis.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = await import('node:util');
  globalThis.TextEncoder = TextEncoder;
  globalThis.TextDecoder = TextDecoder as typeof globalThis.TextDecoder;
}

vi.mock('@/utils/getSupabaseEnv', () => ({
  getSupabaseUrl: () => 'http://localhost:54321',
  getSupabaseAnonKey: () => 'test-anon-key',
}));
