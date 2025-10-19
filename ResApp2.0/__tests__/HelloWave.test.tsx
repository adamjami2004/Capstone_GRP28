import { render } from '@testing-library/react-native';
import React from 'react';

// Mock react-native-reanimated completely
jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const { Text, View } = require('react-native');
  
  return {
    __esModule: true,
    default: {
      Text: (props: any) => <Text {...props}>{props.children}</Text>,
      View: (props: any) => <View {...props}>{props.children}</View>,
    },
  };
});

// Import after mock
import { HelloWave } from '../components/hello-wave';

describe('HelloWave', () => {
  it('renders wave emoji', () => {
    const { getByText } = render(<HelloWave />);
    
    expect(getByText('👋')).toBeTruthy();
  });

  it('renders without crashing', () => {
    const { root } = render(<HelloWave />);
    
    expect(root).toBeTruthy();
  });
});

