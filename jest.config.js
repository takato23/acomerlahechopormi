/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom', // Cambiar a jsdom para simular entorno de navegador
  // Archivo que se ejecuta antes de las pruebas para cargar .env
  setupFilesAfterEnv: ['./jest.setup.js'], 
  moduleNameMapper: {
    // Mapear alias @/
    '^@/(.*)$': '<rootDir>/src/$1',
    // Ya no necesitamos mapear supabaseClient, dotenv cargará las variables
    // '^@/lib/supabaseClient$': '<rootDir>/src/__mocks__/supabaseClient.ts', 
  },
  // Especificar explícitamente que babel-jest transforme los archivos TS/TSX
  transform: {
    '^.+\\.(ts|tsx)$': 'babel-jest',
  },
  // Ignorar archivos de prueba de otros proyectos o runners
  testPathIgnorePatterns: [
    '/node_modules/',
    '/archivos otro proyecto/', 
  ]
};