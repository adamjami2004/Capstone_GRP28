import { renderHook } from '@testing-library/react-native';
import { useColorScheme } from '../hooks/use-color-scheme';
import { useThemeColor } from '../hooks/use-theme-color';

// Mock useColorScheme
jest.mock('../hooks/use-color-scheme', () => ({
  useColorScheme: jest.fn(() => 'light'),
}));

describe('Hooks Integration', () => {
  it('useThemeColor hook works', () => {
    const { result } = renderHook(() =>
      useThemeColor({ light: '#FFFFFF', dark: '#000000' }, 'background')
    );
    expect(result.current).toBeDefined();
  });

  it('useColorScheme hook works', () => {
    const { result } = renderHook(() => useColorScheme());
    expect(result.current).toBeDefined();
  });

  it('hooks are defined', () => {
    expect(useThemeColor).toBeDefined();
    expect(useColorScheme).toBeDefined();
  });
});
