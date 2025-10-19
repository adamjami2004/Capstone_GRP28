import { Colors } from '../constants/theme';

describe('Constants Integration', () => {
  it('Colors are properly defined', () => {
    expect(Colors).toBeDefined();
    expect(Colors.light).toBeDefined();
    expect(Colors.dark).toBeDefined();
  });

  it('Light theme has required colors', () => {
    expect(Colors.light.text).toBeDefined();
    expect(Colors.light.background).toBeDefined();
    expect(Colors.light.tint).toBeDefined();
    expect(Colors.light.icon).toBeDefined();
  });

  it('Dark theme has required colors', () => {
    expect(Colors.dark.text).toBeDefined();
    expect(Colors.dark.background).toBeDefined();
    expect(Colors.dark.tint).toBeDefined();
    expect(Colors.dark.icon).toBeDefined();
  });

  it('Colors are strings', () => {
    expect(typeof Colors.light.text).toBe('string');
    expect(typeof Colors.dark.text).toBe('string');
    expect(typeof Colors.light.background).toBe('string');
    expect(typeof Colors.dark.background).toBe('string');
  });
});
