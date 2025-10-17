import { defineConfig, devices } from '@playwright/test';

// Polyfill TransformStream requerido por Playwright en Node.js
if (!globalThis.TransformStream) {
  try {
    const { TransformStream } = require('node:stream/web');
    globalThis.TransformStream = TransformStream;
  } catch {
    globalThis.TransformStream = class TransformStream {
      constructor() {
        throw new Error('TransformStream not implemented in this environment');
      }
    };
  }
}

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'VITE_USE_MOCK_AUTH=true npm run dev -- --host --port 5173',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
