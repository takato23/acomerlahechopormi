// jest.setup.js
// Cargar variables de entorno desde .env para las pruebas de Jest
require('dotenv').config({ path: '.env.local' }); // Especificar el path correcto

// Importar matchers de jest-dom para React Testing Library (usando require para compatibilidad con Jest setup)
require('@testing-library/jest-dom');

// Polyfill básico para Pointer Events API faltante en JSDOM (para Radix UI, etc.)
if (typeof window !== 'undefined' && !window.PointerEvent) {
    // @ts-ignore // Ignorar error TS en archivo JS
    class PointerEvent extends Event { constructor(type, params = {}) { super(type, params); } }
    // @ts-ignore // Ignorar error TS en archivo JS
    window.PointerEvent = PointerEvent;
}
if (typeof Element !== 'undefined' && !Element.prototype.hasPointerCapture) {
    // @ts-ignore // Ignorar error TS en archivo JS
    Element.prototype.hasPointerCapture = function(pointerId) { return false; }; // Mock simple
    // @ts-ignore // Ignorar error TS en archivo JS
    Element.prototype.releasePointerCapture = function(pointerId) {}; // Mock simple
    // @ts-ignore // Ignorar error TS en archivo JS
    Element.prototype.setPointerCapture = function(pointerId) {}; // Mock simple
}
// Polyfill para scrollIntoView faltante en JSDOM
if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
    // @ts-ignore // Ignorar error TS en archivo JS
    Element.prototype.scrollIntoView = function() {}; // Mock simple, no hace nada
}


// Puedes añadir aquí otras configuraciones globales para Jest si es necesario
// Por ejemplo, configurar mocks globales, polyfills, etc.

// Mock para import.meta.env (Vite)
if (!global.import) {
  global.import = {};
}
Object.defineProperty(global, 'import', {
  value: {
    meta: {
      env: {
        VITE_GEMINI_API_KEY: 'mock-api-key',
      }
    }
  },
  configurable: true
});

// Polyfill para TextEncoder/TextDecoder en Node
if (typeof global.TextEncoder === "undefined") {
  const { TextEncoder, TextDecoder } = require("util");
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Mock para getSupabaseEnv en tests
jest.mock('@/utils/getSupabaseEnv', () => ({
  getSupabaseUrl: () => 'http://localhost:54321',
  getSupabaseAnonKey: () => 'test-anon-key',
}));
