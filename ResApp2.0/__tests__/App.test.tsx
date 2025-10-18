import React from 'react';
import { render } from '@testing-library/react-native';

// MOCK Firebase
jest.mock('../firebase', () => ({
  initializeApp: jest.fn(),
  getAuth: jest.fn(),
  getFirestore: jest.fn(),
  getStorage: jest.fn(),
}));

// MOCK AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Import App after mocks
import LandingPage from '../app/index';

test('App renders without crashing', () => {
  const { getByTestId } = render(<LandingPage />);
  expect(getByTestId('root')).toBeTruthy();
});
