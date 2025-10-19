import { render } from '@testing-library/react-native';
import React from 'react';

// Mock expo-web-browser
jest.mock('expo-web-browser', () => ({
  openBrowserAsync: jest.fn(() => Promise.resolve({})),
  WebBrowserPresentationStyle: {
    AUTOMATIC: 'automatic',
  },
}));

// Mock expo-router Link component
jest.mock('expo-router', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Link: ({ children, ...props }: any) => <Text>{children}</Text>,
  };
});

// Import after mocks
import { ExternalLink } from '../components/external-link';

describe('ExternalLink', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set non-web environment
    process.env.EXPO_OS = 'ios';
  });

  it('renders with text content', () => {
    const { getByText } = render(
      <ExternalLink href="https://example.com">
        Click here
      </ExternalLink>
    );
    
    expect(getByText('Click here')).toBeTruthy();
  });

  it('renders with URL href', () => {
    const { root } = render(
      <ExternalLink href="https://example.com">
        Open Link
      </ExternalLink>
    );
    
    expect(root).toBeTruthy();
  });

  it('handles external URLs', () => {
    const { getByText } = render(
      <ExternalLink href="https://expo.dev">
        Expo Website
      </ExternalLink>
    );
    
    expect(getByText('Expo Website')).toBeTruthy();
  });

  it('renders without crashing', () => {
    const { root } = render(
      <ExternalLink href="https://example.com">
        Link Text
      </ExternalLink>
    );
    
    expect(root).toBeTruthy();
  });
});

