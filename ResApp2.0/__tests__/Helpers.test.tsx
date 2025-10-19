import { signIn } from '../helpers/authHelper';
import { logOut } from '../helpers/singOutHelper';

// Mock Firebase
jest.mock('@/firebase', () => ({
  auth: {},
}));

jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
}));

describe('Helpers Integration', () => {
  it('authHelper signIn function exists', () => {
    expect(signIn).toBeDefined();
    expect(typeof signIn).toBe('function');
  });

  it('signOutHelper logOut function exists', () => {
    expect(logOut).toBeDefined();
    expect(typeof logOut).toBe('function');
  });

  it('helpers can be imported', () => {
    expect(() => require('../helpers/authHelper')).not.toThrow();
    expect(() => require('../helpers/singOutHelper')).not.toThrow();
  });
});
