import { render } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';
import { ThemedView } from '../components/themed-view';

// Mock the theme color hook
jest.mock('@/hooks/use-theme-color', () => ({
  useThemeColor: jest.fn(() => '#FFFFFF'),
}));

describe('ThemedView', () => {
  it('renders children correctly', () => {
    const { getByText } = render(
      <ThemedView>
        <Text>Child Content</Text>
      </ThemedView>
    );
    
    expect(getByText('Child Content')).toBeTruthy();
  });

  it('applies custom light color', () => {
    const { getByTestId } = render(
      <ThemedView testID="themed-view" lightColor="#EEEEEE">
        <Text>Content</Text>
      </ThemedView>
    );
    
    expect(getByTestId('themed-view')).toBeTruthy();
  });

  it('applies custom dark color', () => {
    const { getByTestId } = render(
      <ThemedView testID="themed-view" darkColor="#111111">
        <Text>Content</Text>
      </ThemedView>
    );
    
    expect(getByTestId('themed-view')).toBeTruthy();
  });

  it('applies custom styles', () => {
    const customStyle = { padding: 20 };
    const { getByTestId } = render(
      <ThemedView testID="themed-view" style={customStyle}>
        <Text>Content</Text>
      </ThemedView>
    );
    
    expect(getByTestId('themed-view')).toBeTruthy();
  });

  it('renders multiple children', () => {
    const { getByText } = render(
      <ThemedView>
        <Text>First Child</Text>
        <Text>Second Child</Text>
        <Text>Third Child</Text>
      </ThemedView>
    );
    
    expect(getByText('First Child')).toBeTruthy();
    expect(getByText('Second Child')).toBeTruthy();
    expect(getByText('Third Child')).toBeTruthy();
  });

  it('passes through additional View props', () => {
    const { getByTestId } = render(
      <ThemedView testID="custom-view" accessible={true}>
        <Text>Content</Text>
      </ThemedView>
    );
    
    expect(getByTestId('custom-view')).toBeTruthy();
  });
});

