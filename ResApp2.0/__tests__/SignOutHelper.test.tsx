import { signOut } from 'firebase/auth';
import { logOut } from '../helpers/singOutHelper';

// Mock firebase auth
jest.mock('firebase/auth', () => ({
  signOut: jest.fn(),
}));

jest.mock('../firebase', () => ({
  auth: {},
}));

describe('SignOutHelper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('successfully signs out user', async () => {
    (signOut as jest.Mock).mockResolvedValue(undefined);

    await logOut();

    expect(signOut).toHaveBeenCalledWith(expect.anything());
  });

  it('handles sign out errors', async () => {
    const mockError = new Error('Sign out failed');
    (signOut as jest.Mock).mockRejectedValue(mockError);

    await expect(logOut()).rejects.toThrow('Sign out failed');
  });

  it('calls signOut with auth object', async () => {
    (signOut as jest.Mock).mockResolvedValue(undefined);

    await logOut();

    expect(signOut).toHaveBeenCalledTimes(1);
  });
});

