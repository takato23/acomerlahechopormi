module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['./jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      { useESM: true }
    ],
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '/archivos otro proyecto/',
  ],
};
