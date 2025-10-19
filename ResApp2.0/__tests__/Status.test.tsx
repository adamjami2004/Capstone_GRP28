import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import StatusScreen from '../app/(tabs)/status';

describe('StatusScreen', () => {
  test('renders initial status correctly', () => {
    const { getByText } = render(<StatusScreen />);

    // Printer should be online initially
    expect(getByText('● Online')).toBeTruthy();
    expect(getByText('Printer is working')).toBeTruthy();
    expect(getByText('Updated By:')).toBeTruthy();
    expect(getByText('Admin')).toBeTruthy();
  });

  test('toggles printer status when switch is pressed', () => {
    const { getByText, getByRole } = render(<StatusScreen />);

    const switchElement = getByRole('switch');

    // Initial state
    expect(getByText('● Online')).toBeTruthy();

    // Toggle switch
    fireEvent(switchElement, 'valueChange', false);

    // Updated state
    expect(getByText('● Offline')).toBeTruthy();
    expect(getByText('Printer is not working')).toBeTruthy();
    expect(getByText('Tachfine')).toBeTruthy();
  });
});
