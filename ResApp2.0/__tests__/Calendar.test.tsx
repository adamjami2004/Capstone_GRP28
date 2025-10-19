import { render } from '@testing-library/react-native';
import React from 'react';
import CalendarScreen from '../app/(tabs)/calendar';

// Mock dependencies
jest.mock('@/components/themed-view', () => ({
  ThemedView: ({ children, ...props }: any) => <>{children}</>,
}));

jest.mock('@/components/ui/icon-symbol', () => ({
  IconSymbol: () => null,
}));

describe('CalendarScreen', () => {
  it('renders calendar header and title', () => {
    const { getByText } = render(<CalendarScreen />);
    
    expect(getByText('Your Schedule')).toBeTruthy();
    expect(getByText('Calendar')).toBeTruthy();
  });

  it('displays current month and year', () => {
    const { getByText } = render(<CalendarScreen />);
    
    // Default date is April 2025
    expect(getByText('April 2025')).toBeTruthy();
  });

  it('displays all day headers', () => {
    const { getByText } = render(<CalendarScreen />);
    
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    days.forEach(day => {
      expect(getByText(day)).toBeTruthy();
    });
  });

  it('renders add event button', () => {
    const { getByText } = render(<CalendarScreen />);
    
    expect(getByText('Add a new event')).toBeTruthy();
  });

  it('renders calendar days', () => {
    const { getByText } = render(<CalendarScreen />);
    
    // Check if calendar renders days
    expect(getByText('1')).toBeTruthy();
    expect(getByText('15')).toBeTruthy();
    expect(getByText('30')).toBeTruthy();
  });
});
