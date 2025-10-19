import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

// ----- MOCK Firebase module -----
const mockSignIn = jest.fn(async () => ({
  user: {
    uid: '12345',
    email: 'adamjam39@gmail.com',
    emailVerified: true,
    isAnonymous: false,
    metadata: {},
    providerData: [],
    phoneNumber: null,
    photoURL: null,
    refreshToken: 'fake-refresh-token',
    displayName: 'Test User',
  },
}));

jest.mock('../firebase', () => ({
  getAuth: jest.fn(() => ({
    signInWithEmailAndPassword: mockSignIn,
  })),
}));

// ----- MOCK AsyncStorage -----
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// ----- MOCK app.config.ts -----
jest.mock('../app.config', () => ({
  extra: {
    firebaseApiKey: 'dummy',
    firebaseAuthDomain: 'dummy',
    firebaseProjectId: 'dummy',
    firebaseStorageBucket: 'dummy',
  },
}));

// ----- MOCK authHelper.ts so it doesn't initialize Firebase -----
jest.mock('../helpers/authHelper', () => ({
  login: jest.fn(async (email: string, password: string) => ({
    uid: '12345',
    email,
  })),
}));

// Import the Login component after mocks
import LoginPage from '../app/login';
import { signIn } from '../helpers/authHelper';

describe('Login Function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('calls login function on login', async () => {
    const { getByPlaceholderText, getByText } = render(<LoginPage />);

    fireEvent.changeText(getByPlaceholderText('Username'), 'adamjam39@gmail.com');
    fireEvent.changeText(getByPlaceholderText('Password'), '1234');
    fireEvent.press(getByText('Login'));

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith('adamjam39@gmail.com', '1234');
    });
  });

  test('handles login errors', async () => {
    (signIn as jest.Mock).mockRejectedValueOnce(new Error('Invalid credentials'));

    const { getByPlaceholderText, getByText } = render(<LoginPage />);

    fireEvent.changeText(getByPlaceholderText('Username'), 'wrong@email.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'wrongpass');
    fireEvent.press(getByText('Login'));

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith('wrong@email.com', 'wrongpass');
    });
  });
});
