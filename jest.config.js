/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: [
    '<rootDir>/tests',
    '<rootDir>/shared'
  ],
  testMatch: [
    '**/tests/**/*.test.ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  // Strip .js extensions from imports for Jest since it runs on .ts files directly.
  // TypeScript requires .js extensions for ES module imports, but Jest needs to
  // resolve the actual .ts source files during testing.
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  collectCoverageFrom: [
    'shared/**/*.ts',
    '!shared/**/*.test.ts',
    '!shared/**/*.d.ts'
  ],
  coverageDirectory: 'coverage',
  moduleFileExtensions: [
    'ts',
    'js',
    'json'
  ]
};
