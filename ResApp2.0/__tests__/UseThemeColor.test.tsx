import { renderHook } from '@testing-library/react-native';
import { useThemeColor } from '../hooks/use-theme-color';

// Mock useColorScheme
jest.mock('../hooks/use-color-scheme', () => ({
  useColorScheme: jest.fn(() => 'light'),
}));

describe('useThemeColor hook', () => {
  it('returns light color when theme is light', () => {
    const { result } = renderHook(() =>
      useThemeColor({ light: '#FFFFFF', dark: '#000000' }, 'background')
    );
    expect(result.current).toBe('#FFFFFF');
  });

  it('returns theme color for valid key', () => {
    const { result } = renderHook(() =>
      useThemeColor({ light: '#000', dark: '#FFF' }, 'text')
    );
    expect(result.current).toBeDefined();
  });

  it('handles custom colors', () => {
    const { result } = renderHook(() =>
      useThemeColor({ light: '#FF0000', dark: '#00FF00' }, 'tint')
    );
    expect(result.current).toBeDefined();
  });

  it('hook is defined', () => {
    expect(useThemeColor).toBeDefined();
  });
});

