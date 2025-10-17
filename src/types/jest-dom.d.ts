import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';

declare global {
  namespace jest {
    interface Matchers<R = void, T = unknown> extends TestingLibraryMatchers<T, R> {}
    interface Expect extends jest.Expect {}
    interface InverseAsymmetricMatchers extends jest.InverseAsymmetricMatchers {}
  }

  namespace Expect {
    interface Matchers<R = void, T = unknown> extends TestingLibraryMatchers<T, R> {}
  }
}

export {};
