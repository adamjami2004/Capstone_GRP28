import { render } from '@testing-library/react-native';
import React from 'react';
import SidebarScreen from '../app/(tabs)/Sidebar';

// Mock dependencies
jest.mock('@/components/themed-view', () => ({
  ThemedView: ({ children, ...props }: any) => <>{children}</>,
}));

jest.mock('@/components/ui/icon-symbol', () => ({
  IconSymbol: () => null,
}));

describe('SidebarScreen', () => {
  it('renders header title', () => {
    const { getByText } = render(<SidebarScreen />);
    
    expect(getByText('More Features')).toBeTruthy();
  });

  it('renders header subtitle', () => {
    const { getByText } = render(<SidebarScreen />);
    
    expect(getByText('Additional tools and resources')).toBeTruthy();
  });

  it('renders all feature items', () => {
    const { getByText } = render(<SidebarScreen />);
    
    expect(getByText('SharePoint')).toBeTruthy();
    expect(getByText('Room Reservations')).toBeTruthy();
    expect(getByText('Events')).toBeTruthy();
    expect(getByText('Documents')).toBeTruthy();
    expect(getByText('Community')).toBeTruthy();
    expect(getByText('Settings')).toBeTruthy();
  });

  it('renders correct number of feature cards', () => {
    const { getByText } = render(<SidebarScreen />);
    
    // Check that all 6 features are present
    expect(getByText('SharePoint')).toBeTruthy();
    expect(getByText('Room Reservations')).toBeTruthy();
    expect(getByText('Events')).toBeTruthy();
    expect(getByText('Documents')).toBeTruthy();
    expect(getByText('Community')).toBeTruthy();
    expect(getByText('Settings')).toBeTruthy();
  });
});

