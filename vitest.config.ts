import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./vitest.setup.ts'],
      include: [
        'src/features/**/__tests__/**/*.{test,spec}.{ts,tsx}',
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
      ],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html', 'lcov'],
        reportsDirectory: 'coverage',
        exclude: [
          'src/**/*.d.ts',
          'src/**/__tests__/**',
          'src/**/__mocks__/**',
          'src/**/*.stories.{ts,tsx}',
        ],
      },
    },
  }),
);
