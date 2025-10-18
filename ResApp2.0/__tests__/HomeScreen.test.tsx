import React from 'react';
import { render } from '@testing-library/react-native';
import HomeScreen from '../app/(tabs)/index';

// Mock AsyncStorage (optional, if your component reads from it)
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
}));

// Mock Firebase completely
jest.mock('@/firebase', () => ({
  initializeApp: jest.fn(),
  getAuth: jest.fn(),
  getFirestore: jest.fn(),
  getStorage: jest.fn(),
}));

// Mock UI components
jest.mock('@/components/themed-view', () => ({
  ThemedView: ({ children }: any) => <>{children}</>,
}));

jest.mock('@/components/ui/icon-symbol', () => ({
  IconSymbol: () => <></>,
}));

describe('HomeScreen UI', () => {
  it('renders static texts and buttons', () => {
    const { getByText } = render(<HomeScreen />);

    // Check static texts
    expect(getByText('Welcome back,')).toBeTruthy();
    expect(getByText('Quick Access')).toBeTruthy();
    expect(getByText('Operations')).toBeTruthy();

    // Check buttons / quick access items
    expect(getByText('Duty Calendar')).toBeTruthy();
    expect(getByText('To-Do List')).toBeTruthy();
  });
});
