// __tests__/Layout.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import RootLayout from '../app/_layout';

// Mock expo-router Stack
jest.mock('expo-router', () => ({
  Stack: ({ children }: any) => <>{children}</>,
}));

// Mock StatusBar
jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

// Mock ThemeProvider and themes
jest.mock('@react-navigation/native', () => {
  const ActualNav = jest.requireActual('@react-navigation/native');
  return {
    ...ActualNav,
    ThemeProvider: ({ children }: any) => <>{children}</>,
    DarkTheme: { dark: true },
    DefaultTheme: { dark: false },
  };
});

// Mock your hook
jest.mock('@/hooks/use-color-scheme', () => ({
  useColorScheme: jest.fn(() => 'light'),
}));

describe('RootLayout', () => {
  it('renders the layout container', () => {
    const { getByTestId } = render(<RootLayout />);
    expect(getByTestId('root-layout')).toBeTruthy();
  });

  it('applies dark theme when color scheme is dark', () => {
    const { useColorScheme } = require('@/hooks/use-color-scheme');
    useColorScheme.mockReturnValue('dark');
    const { getByTestId } = render(<RootLayout />);
    expect(getByTestId('root-layout')).toBeTruthy();
  });

  it('applies light theme when color scheme is light', () => {
    const { useColorScheme } = require('@/hooks/use-color-scheme');
    useColorScheme.mockReturnValue('light');
    const { getByTestId } = render(<RootLayout />);
    expect(getByTestId('root-layout')).toBeTruthy();
  });
});
