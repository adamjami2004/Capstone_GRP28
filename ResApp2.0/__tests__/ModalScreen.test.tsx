import React from 'react';
import ModalScreen from '../app/modal';

// Mock expo-router
jest.mock('expo-router', () => ({
  Link: ({ children }: any) => <>{children}</>,
}));

// Mock components
jest.mock('@/components/themed-text', () => ({
  ThemedText: ({ children, ...props }: any) => <>{children}</>,
}));

jest.mock('@/components/themed-view', () => ({
  ThemedView: ({ children, ...props }: any) => <>{children}</>,
}));

describe('ModalScreen', () => {
  it('component is defined', () => {
    expect(ModalScreen).toBeDefined();
  });

  it('component is a function', () => {
    expect(typeof ModalScreen).toBe('function');
  });
});
