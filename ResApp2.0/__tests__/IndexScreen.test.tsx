import { render } from '@testing-library/react-native';
import React from 'react';
import LandingPage from '../app/index';

// Mock Firebase
jest.mock('../firebase', () => ({
  initializeApp: jest.fn(),
  getAuth: jest.fn(),
  getFirestore: jest.fn(),
  getStorage: jest.fn(),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('LandingPage', () => {
  it('renders without crashing', () => {
    const { getByTestId } = render(<LandingPage />);
    expect(getByTestId('root')).toBeTruthy();
  });

  it('component is defined', () => {
    expect(LandingPage).toBeDefined();
  });

  it('renders landing page', () => {
    const { root } = render(<LandingPage />);
    expect(root).toBeTruthy();
  });
});

