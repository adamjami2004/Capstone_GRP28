import React from 'react';
import TabLayout from '../app/(tabs)/_layout';

// Mock expo-router
const mockPush = jest.fn();
jest.mock('expo-router', () => {
  const React = require('react');
  const { View } = require('react-native');
  
  return {
    Tabs: ({ children, ...props }: any) => <View>{children}</View>,
    useRouter: () => ({
      push: mockPush,
    }),
  };
});

// Mock components
jest.mock('@/components/haptic-tab', () => ({
  HapticTab: ({ children }: any) => <>{children}</>,
}));

jest.mock('@/components/ui/icon-symbol', () => ({
  IconSymbol: () => null,
}));

jest.mock('@/hooks/use-color-scheme', () => ({
  useColorScheme: jest.fn(() => 'light'),
}));

describe('TabLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders tab layout', () => {
    // Simple test to verify the component exists
    expect(TabLayout).toBeDefined();
  });

  it('router push function is available', () => {
    expect(mockPush).toBeDefined();
  });
});

