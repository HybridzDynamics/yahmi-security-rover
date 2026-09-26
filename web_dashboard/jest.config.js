module.exports = {
  testEnvironment: 'node',
  verbose: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'models/**/*.js',
    'server.js',
    '!**/node_modules/**',
    '!**/uploads/**',
    '!**/coverage/**',
    '!**/dist/**',
  ],
  testMatch: [
    '**/tests/**/*.test.js',
    '**/__tests__/**/*.js',
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
  testTimeout: 15000,
};
