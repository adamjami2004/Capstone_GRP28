import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';
import { Collapsible } from '../components/ui/collapsible';

// Mock dependencies
jest.mock('@/components/themed-text', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    ThemedText: ({ children, ...props }: any) => <Text {...props}>{children}</Text>,
  };
});

jest.mock('@/components/themed-view', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    ThemedView: ({ children, ...props }: any) => <View {...props}>{children}</View>,
  };
});

jest.mock('@/components/ui/icon-symbol', () => ({
  IconSymbol: () => null,
}));

jest.mock('@/constants/theme', () => ({
  Colors: {
    light: { icon: '#000' },
    dark: { icon: '#FFF' },
  },
}));

jest.mock('@/hooks/use-color-scheme', () => ({
  useColorScheme: jest.fn(() => 'light'),
}));

describe('Collapsible', () => {
  it('renders title correctly', () => {
    const { getByText } = render(
      <Collapsible title="Test Title">
        <Text>Content</Text>
      </Collapsible>
    );
    
    expect(getByText('Test Title')).toBeTruthy();
  });

  it('starts in collapsed state', () => {
    const { queryByText } = render(
      <Collapsible title="Test Title">
        <Text>Hidden Content</Text>
      </Collapsible>
    );
    
    // Content should not be visible initially
    expect(queryByText('Hidden Content')).toBeNull();
  });

  it('expands when title is pressed', () => {
    const { getByText } = render(
      <Collapsible title="Test Title">
        <Text>Hidden Content</Text>
      </Collapsible>
    );
    
    const title = getByText('Test Title');
    fireEvent.press(title);
    
    // Content should now be visible
    expect(getByText('Hidden Content')).toBeTruthy();
  });

  it('collapses when title is pressed again', () => {
    const { getByText, queryByText } = render(
      <Collapsible title="Test Title">
        <Text>Hidden Content</Text>
      </Collapsible>
    );
    
    const title = getByText('Test Title');
    
    // Expand
    fireEvent.press(title);
    expect(getByText('Hidden Content')).toBeTruthy();
    
    // Collapse
    fireEvent.press(title);
    expect(queryByText('Hidden Content')).toBeNull();
  });

  it('renders multiple children when expanded', () => {
    const { getByText } = render(
      <Collapsible title="Test Title">
        <Text>First Child</Text>
        <Text>Second Child</Text>
      </Collapsible>
    );
    
    fireEvent.press(getByText('Test Title'));
    
    expect(getByText('First Child')).toBeTruthy();
    expect(getByText('Second Child')).toBeTruthy();
  });
});

