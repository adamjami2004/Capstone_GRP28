import React from 'react';
import RootLayout from '../app/_layout';

// Mock expo-router
jest.mock('expo-router', () => ({
  Stack: ({ children }: any) => <>{children}</>,
}));

// Mock expo-font
jest.mock('expo-font', () => ({
  useFonts: jest.fn(() => [true, null]),
}));

// Mock expo-splash-screen
jest.mock('expo-splash-screen', () => ({
  hideAsync: jest.fn(),
  preventAutoHideAsync: jest.fn(),
}));

// Mock components
jest.mock('@/components/themed-view', () => ({
  ThemedView: ({ children, ...props }: any) => <>{children}</>,
}));

describe('RootLayout', () => {
  it('component is defined', () => {
    expect(RootLayout).toBeDefined();
  });

  it('component is a function', () => {
    expect(typeof RootLayout).toBe('function');
  });
});
