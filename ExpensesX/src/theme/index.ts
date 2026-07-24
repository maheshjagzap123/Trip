export { palette, lightColors, darkColors } from './colors';
export type { Colors } from './colors';
export { typography } from './typography';
export { spacing, borderRadius, shadows, hitSlop, layout } from './spacing';

import { lightColors, darkColors } from './colors';
import type { Colors } from './colors';
import { useThemeStore } from '../stores/themeStore';

export function useThemeColors(): Colors {
  const resolvedScheme = useThemeStore((s) => s.resolvedScheme);
  return (resolvedScheme === 'dark' ? darkColors : lightColors) as Colors;
}
