import { render } from '@testing-library/react-native';
import React from 'react';

// Mock all dependencies
jest.mock('@/firebase', () => ({
  auth: { currentUser: { email: 'test@example.com' } },
  db: {},
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue('test@example.com'),
}));

jest.mock('@/components/themed-view', () => ({
  ThemedView: ({ children, ...props }: any) => <>{children}</>,
}));

jest.mock('@/components/ui/icon-symbol', () => ({
  IconSymbol: () => null,
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn(() => Promise.resolve({ docs: [] })),
}));

// Import screens after mocks
import HomeScreen from '../app/(tabs)/index';
import ProfileScreen from '../app/(tabs)/profile';
import SidebarScreen from '../app/(tabs)/Sidebar';
import StatusScreen from '../app/(tabs)/status';

describe('Screens Integration', () => {
  it('HomeScreen renders', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Welcome back,')).toBeTruthy();
  });

  it('ProfileScreen renders', () => {
    const { getByText } = render(<ProfileScreen />);
    expect(getByText('Personal Information')).toBeTruthy();
  });

  it('StatusScreen renders', () => {
    const { getByText } = render(<StatusScreen />);
    expect(getByText('● Online')).toBeTruthy();
  });

  it('SidebarScreen renders', () => {
    const { getByText } = render(<SidebarScreen />);
    expect(getByText('More Features')).toBeTruthy();
  });

  it('all screens are defined', () => {
    expect(HomeScreen).toBeDefined();
    expect(ProfileScreen).toBeDefined();
    expect(StatusScreen).toBeDefined();
    expect(SidebarScreen).toBeDefined();
  });
});

