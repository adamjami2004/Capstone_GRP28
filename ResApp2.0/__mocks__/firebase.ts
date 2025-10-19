// __mocks__/firebase.ts
export const initializeApp = jest.fn(() => ({}));
export const getAuth = jest.fn(() => ({
  signInWithEmailAndPassword: jest.fn(),
}));
export const getFirestore = jest.fn(() => ({}));
export const getStorage = jest.fn(() => ({}));

// Optional Firestore helpers that your HomeScreen/Profile use:
export const collection = jest.fn();
export const query = jest.fn();
export const where = jest.fn();
export const getDocs = jest.fn(async () => ({
  docs: [{ id: '1', data: () => ({ firstName: 'John' }) }],
}));

// Mock your firebaseConfig so tests don’t break
export const firebaseConfig = {
  apiKey: 'fake-api-key',
  authDomain: 'fake-auth-domain',
  projectId: 'fake-project-id',
  storageBucket: 'fake-storage-bucket',
  messagingSenderId: 'fake-messaging-id',
  appId: 'fake-app-id',
};
