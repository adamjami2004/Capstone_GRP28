import type { Config } from 'jest';

const config: Config = {
  preset: 'jest-expo', 
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],

  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native' +
      '|@react-native' +
      '|@react-navigation' +
      '|expo(nent)?' +
      '|@expo(nent)?' +
      '|@expo-google-fonts' +
      '|react-clone-referenced-element' +
      '|@react-native-community' +
      '|@react-native-picker' +
      '|@testing-library)',
  ],

  testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/'],

  collectCoverage: true,
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    '!**/node_modules/**',
  ],
  coverageDirectory: 'coverage',

  testEnvironment: 'jsdom', 
};

export default config;
