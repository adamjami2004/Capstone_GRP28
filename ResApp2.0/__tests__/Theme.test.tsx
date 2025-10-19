import { Colors } from '../constants/theme';

describe('Theme Constants', () => {
  it('defines light theme colors', () => {
    expect(Colors.light).toBeDefined();
    expect(Colors.light.text).toBeDefined();
    expect(Colors.light.background).toBeDefined();
  });

  it('defines dark theme colors', () => {
    expect(Colors.dark).toBeDefined();
    expect(Colors.dark.text).toBeDefined();
    expect(Colors.dark.background).toBeDefined();
  });

  it('light theme has required properties', () => {
    expect(Colors.light).toHaveProperty('text');
    expect(Colors.light).toHaveProperty('background');
    expect(Colors.light).toHaveProperty('tint');
    expect(Colors.light).toHaveProperty('icon');
    expect(Colors.light).toHaveProperty('tabIconDefault');
    expect(Colors.light).toHaveProperty('tabIconSelected');
  });

  it('dark theme has required properties', () => {
    expect(Colors.dark).toHaveProperty('text');
    expect(Colors.dark).toHaveProperty('background');
    expect(Colors.dark).toHaveProperty('tint');
    expect(Colors.dark).toHaveProperty('icon');
    expect(Colors.dark).toHaveProperty('tabIconDefault');
    expect(Colors.dark).toHaveProperty('tabIconSelected');
  });

  it('colors are strings', () => {
    expect(typeof Colors.light.text).toBe('string');
    expect(typeof Colors.dark.text).toBe('string');
  });
});

