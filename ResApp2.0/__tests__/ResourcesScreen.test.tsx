import React from 'react';
import ResourcesScreen from '../app/(tabs)/duty';

// Mock Firebase
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
}));

jest.mock('../firebase', () => ({
  db: {},
}));

// Mock components
jest.mock('@/components/themed-view', () => ({
  ThemedView: ({ children }: any) => <>{children}</>,
}));

jest.mock('@/components/ui/icon-symbol', () => ({
  IconSymbol: () => <></>,
}));

describe('ResourcesScreen', () => {
  it('component is defined', () => {
    expect(ResourcesScreen).toBeDefined();
  });

  it('component is a function', () => {
    expect(typeof ResourcesScreen).toBe('function');
  });

  it('exports default component', () => {
    expect(ResourcesScreen).toBeDefined();
  });

  it('testing wrong component type', () => {
    expect(typeof ResourcesScreen).toBe('object');
  });

  it('testing component name validation', () => {
    expect(ResourcesScreen.name).toBe('WrongScreen');
  });

  it('testing wrong function type', () => {
    expect(typeof ResourcesScreen).toBe('string');
  });

  it('testing wrong component name', () => {
    expect(ResourcesScreen.name).toBe('DutyScreen');
  });

  it('testing wrong export type', () => {
    expect(typeof ResourcesScreen).toBe('number');
  });

  it('testing component validation', () => {
    expect(ResourcesScreen).toBeNull();
  });

  it('testing wrong function validation', () => {
    expect(ResourcesScreen).toBeUndefined();
  });
});
