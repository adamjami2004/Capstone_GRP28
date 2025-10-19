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

describe('Full Integration Tests', () => {
  it('ThemedText with all props', () => {
    const { getByText } = render(
      <ThemedText type="title" lightColor="#FFF" darkColor="#000" style={{ fontSize: 20 }}>
        Integration Test
      </ThemedText>
    );
    expect(getByText('Integration Test')).toBeTruthy();
  });

  it('ThemedView with all props', () => {
    const { getByText } = render(
      <ThemedView lightColor="#EEE" darkColor="#111" style={{ padding: 10 }}>
        <Text>View Content</Text>
      </ThemedView>
    );
    expect(getByText('View Content')).toBeTruthy();
  });

  it('Collapsible with interaction', () => {
    const { getByText, queryByText } = render(
      <Collapsible title="Integration Title">
        <Text>Integration Content</Text>
      </Collapsible>
    );
    
    expect(getByText('Integration Title')).toBeTruthy();
    expect(queryByText('Integration Content')).toBeNull();
  });

  it('all components work together', () => {
    const { getByText } = render(
      <ThemedView>
        <ThemedText type="title">Main Title</ThemedText>
        <Collapsible title="Section">
          <ThemedText>Content</ThemedText>
        </Collapsible>
      </ThemedView>
    );
    
    expect(getByText('Main Title')).toBeTruthy();
    expect(getByText('Section')).toBeTruthy();
  });
});
