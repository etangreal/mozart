module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  displayName: 'infra',
  preset: '../../jest.preset.js',
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.spec.json',
    }
  },
  transform: {
    '^.+\\.[tj]s$':  'ts-jest' 
  },
    moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/infra'
};
