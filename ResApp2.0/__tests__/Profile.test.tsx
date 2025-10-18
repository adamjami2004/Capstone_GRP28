import { render } from '@testing-library/react-native';
import ProfileScreen from '../app/(tabs)/profile';

jest.mock('@/firebase', () => ({
  auth: { currentUser: { email: 'test@example.com' } },
  db: {},
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue('test@example.com'),
}));

describe('ProfileScreen UI', () => {
  it('renders personal info labels', () => {
    const { getByText } = render(<ProfileScreen />);
    expect(getByText('Full Name')).toBeTruthy();
    expect(getByText('Email')).toBeTruthy();
    expect(getByText('Position')).toBeTruthy();
    expect(getByText('Residence')).toBeTruthy();
  });

  it('renders log out button', () => {
    const { getByText } = render(<ProfileScreen />);
    expect(getByText('Log Out')).toBeTruthy();
  });
});
