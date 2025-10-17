/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'jsdom', // Cambiar a jsdom para simular entorno de navegador
  // Archivo que se ejecuta antes de las pruebas para cargar .env
  setupFilesAfterEnv: ['./jest.setup.ts'],
  moduleNameMapper: {
    '^@/lib/supabaseClient$': '<rootDir>/src/__mocks__/supabaseClient.ts',
    '^@/lib/errorTracking$': '<rootDir>/src/__mocks__/errorTracking.ts',
    // Mapear alias @/
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  // Especificar explícitamente que babel-jest transforme los archivos TS/TSX
  transform: {
    '^.+\\.(ts|tsx)$': 'babel-jest'
  },
  // Ignorar archivos de prueba de otros proyectos o runners
  testPathIgnorePatterns: ['/node_modules/', '/archivos otro proyecto/', '<rootDir>/tests/e2e/']
};

export default config;
