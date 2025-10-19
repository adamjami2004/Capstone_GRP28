import { render } from '@testing-library/react-native';
import React from 'react';
import { ThemedText } from '../components/themed-text';

// Mock the theme color hook
jest.mock('@/hooks/use-theme-color', () => ({
  useThemeColor: jest.fn(() => '#000000'),
}));

describe('ThemedText', () => {
  it('renders default text type', () => {
    const { getByText } = render(<ThemedText>Default Text</ThemedText>);
    
    expect(getByText('Default Text')).toBeTruthy();
  });

  it('renders title text type', () => {
    const { getByText } = render(<ThemedText type="title">Title Text</ThemedText>);
    
    expect(getByText('Title Text')).toBeTruthy();
  });

  it('renders subtitle text type', () => {
    const { getByText } = render(<ThemedText type="subtitle">Subtitle Text</ThemedText>);
    
    expect(getByText('Subtitle Text')).toBeTruthy();
  });

  it('renders link text type', () => {
    const { getByText } = render(<ThemedText type="link">Link Text</ThemedText>);
    
    expect(getByText('Link Text')).toBeTruthy();
  });

  it('renders defaultSemiBold text type', () => {
    const { getByText } = render(<ThemedText type="defaultSemiBold">Bold Text</ThemedText>);
    
    expect(getByText('Bold Text')).toBeTruthy();
  });

  it('accepts custom light and dark colors', () => {
    const { getByText } = render(
      <ThemedText lightColor="#FFFFFF" darkColor="#000000">
        Custom Color Text
      </ThemedText>
    );
    
    expect(getByText('Custom Color Text')).toBeTruthy();
  });

  it('applies custom styles', () => {
    const customStyle = { fontSize: 20 };
    const { getByText } = render(
      <ThemedText style={customStyle}>Styled Text</ThemedText>
    );
    
    const textElement = getByText('Styled Text');
    expect(textElement).toBeTruthy();
  });

  it('passes through additional props', () => {
    const { getByText } = render(
      <ThemedText testID="custom-text">Test Text</ThemedText>
    );
    
    expect(getByText('Test Text')).toBeTruthy();
  });
});

