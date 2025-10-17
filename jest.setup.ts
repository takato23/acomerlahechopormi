// jest.setup.ts
// Cargar variables de entorno desde .env para las pruebas de Jest
import { config as loadEnv } from 'dotenv';
import '@testing-library/jest-dom';
import * as matchers from '@testing-library/jest-dom/matchers';
import { expect } from '@jest/globals';

loadEnv({ path: '.env.local' }); // Especificar el path correcto

const { default: _defaultMatcher, ...jestDomMatchers } = matchers as Record<string, any>;
expect.extend(jestDomMatchers);

// Silenciar logs ruidosos de tests sin ocultar errores reales
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

const suppressedPatterns = [
  /\[categoryInference\]/,
  /\[useSpeechRecognition\]/,
  /VoiceInput - speechIsSupported/,
  /React Router Future Flag Warning/,
  /No routes matched location/,
];

const shouldSuppress = (args: unknown[]): boolean => {
  const [message] = args;
  if (typeof message !== 'string') {
    return false;
  }
  return suppressedPatterns.some((pattern) => pattern.test(message));
};

console.error = (...args: unknown[]) => {
  if (shouldSuppress(args)) return;
  originalConsoleError(...args);
};

console.warn = (...args: unknown[]) => {
  if (shouldSuppress(args)) return;
  originalConsoleWarn(...args);
};

console.log = (...args: unknown[]) => {
  if (shouldSuppress(args)) return;
  originalConsoleLog(...args);
};

// Polyfill básico para Pointer Events API faltante en JSDOM (para Radix UI, etc.)
if (typeof window !== 'undefined' && !window.PointerEvent) {
  class PointerEventPolyfill extends Event {
    constructor(type: string, params: EventInit = {}) {
      super(type, params);
    }
  }

  // @ts-ignore asignar polyfill
  window.PointerEvent = PointerEventPolyfill;
}
if (typeof Element !== 'undefined' && !Element.prototype.hasPointerCapture) {
  // @ts-ignore // Ignorar error TS en archivo JS
  Element.prototype.hasPointerCapture = function (_pointerId: number) {
    return false;
  }; // Mock simple
  // @ts-ignore // Ignorar error TS en archivo JS
  Element.prototype.releasePointerCapture = function (_pointerId: number) {}; // Mock simple
  // @ts-ignore // Ignorar error TS en archivo JS
  Element.prototype.setPointerCapture = function (_pointerId: number) {}; // Mock simple
}
// Polyfill para scrollIntoView faltante en JSDOM
if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
  // @ts-ignore // Ignorar error TS en archivo JS
  Element.prototype.scrollIntoView = function () {}; // Mock simple, no hace nada
}

// Polyfill básico para ResizeObserver requerido por Radix UI y otros componentes en tests
if (typeof window !== 'undefined' && !('ResizeObserver' in window)) {
  class ResizeObserverPolyfill {
    private readonly callback: ResizeObserverCallback;

    constructor(callback: ResizeObserverCallback) {
      this.callback = callback;
    }

    observe(): void {
      // No-op
    }

    unobserve(): void {
      // No-op
    }

    disconnect(): void {
      // No-op
    }
  }

  // @ts-ignore asignar polyfill
  window.ResizeObserver = ResizeObserverPolyfill;
}

// Puedes añadir aquí otras configuraciones globales para Jest si es necesario
// Por ejemplo, configurar mocks globales, polyfills, etc.

export {};
