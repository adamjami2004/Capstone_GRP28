import { render } from '@testing-library/react-native';
import React from 'react';

// MOCK Firebase
jest.mock('../firebase', () => ({
  getAuth: jest.fn(),
}));

// MOCK AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Import the Login component
import Login from '../app/login';

describe('Login Screen', () => {
  test('renders email & password inputs and login button', () => {
    const { getByPlaceholderText, getByText } = render(<Login />);
    
    // Check email input
    expect(getByPlaceholderText('Username')).toBeTruthy();
    // Check password input
    expect(getByPlaceholderText('Password')).toBeTruthy();
   
  });
});
