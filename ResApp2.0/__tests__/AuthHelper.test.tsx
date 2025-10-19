import { signInWithEmailAndPassword } from 'firebase/auth';
import { signIn } from '../helpers/authHelper';

// Mock firebase auth
jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn(),
}));

jest.mock('../firebase', () => ({
  auth: {},
}));

describe('AuthHelper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('successfully signs in with valid credentials', async () => {
    const mockUser = {
      uid: '12345',
      email: 'test@example.com',
    };

    (signInWithEmailAndPassword as jest.Mock).mockResolvedValue({
      user: mockUser,
    });

    const result = await signIn('test@example.com', 'password123');

    expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
      expect.anything(),
      'test@example.com',
      'password123'
    );
    expect(result).toEqual(mockUser);
  });

  it('throws error when sign in fails', async () => {
    const mockError = new Error('Invalid credentials');
    (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(mockError);

    await expect(signIn('wrong@example.com', 'wrongpass')).rejects.toThrow('Invalid credentials');
  });

  it('handles network errors', async () => {
    const networkError = new Error('Network error');
    (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(networkError);

    await expect(signIn('test@example.com', 'password')).rejects.toThrow('Network error');
  });

  it('handles empty credentials', async () => {
    const emptyError = new Error('Missing credentials');
    (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(emptyError);

    await expect(signIn('', '')).rejects.toThrow();
  });
});

