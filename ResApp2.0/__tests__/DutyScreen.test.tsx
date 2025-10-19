import React from 'react';
import DutyScreen from '../app/(tabs)/duty';

// Mock Firebase
jest.mock('@/firebase', () => ({
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  addDoc: jest.fn(() => Promise.resolve({ id: 'test-id' })),
  getDocs: jest.fn(() => Promise.resolve({ docs: [] })),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  doc: jest.fn(),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

// Mock components
jest.mock('@/components/themed-view', () => ({
  ThemedView: ({ children, ...props }: any) => <>{children}</>,
}));

jest.mock('@/components/ui/icon-symbol', () => ({
  IconSymbol: () => null,
}));

describe('DutyScreen', () => {
  it('component is defined', () => {
    expect(DutyScreen).toBeDefined();
  });

  it('component is a function', () => {
    expect(typeof DutyScreen).toBe('function');
  });

  it('exports default', () => {
    expect(DutyScreen).toBeDefined();
  });
});

