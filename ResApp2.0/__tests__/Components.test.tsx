import { render } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

// Mock all dependencies
jest.mock('@/hooks/use-theme-color', () => ({
  useThemeColor: jest.fn(() => '#000'),
}));

jest.mock('@/hooks/use-color-scheme', () => ({
  useColorScheme: jest.fn(() => 'light'),
}));

jest.mock('@/constants/theme', () => ({
  Colors: {
    light: { icon: '#000', text: '#000', background: '#FFF' },
    dark: { icon: '#FFF', text: '#FFF', background: '#000' },
  },
}));

jest.mock('@/components/ui/icon-symbol', () => ({
  IconSymbol: () => null,
}));

// Import components after mocks
import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';
import { Collapsible } from '../components/ui/collapsible';

describe('Components Integration', () => {
  it('ThemedText is defined', () => {
    expect(ThemedText).toBeDefined();
  });

  it('ThemedView is defined', () => {
    expect(ThemedView).toBeDefined();
  });

  it('Collapsible is defined', () => {
    expect(Collapsible).toBeDefined();
  });

  it('ThemedText renders with children', () => {
    const { getByText } = render(<ThemedText>Test</ThemedText>);
    expect(getByText('Test')).toBeTruthy();
  });

  it('ThemedView renders with children', () => {
    const { getByText } = render(
      <ThemedView>
        <Text>Content</Text>
      </ThemedView>
    );
    expect(getByText('Content')).toBeTruthy();
  });
});

