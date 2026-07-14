export { palette, lightColors, darkColors } from './colors';
export type { Colors } from './colors';
export { typography } from './typography';
export { spacing, borderRadius } from './spacing';

import { useColorScheme } from 'react-native';
import { lightColors, darkColors } from './colors';
import type { Colors } from './colors';

/**
 * Hook to get the current theme colors based on system preference.
 */
export function useThemeColors(): Colors {
  const colorScheme = useColorScheme();
  return (colorScheme === 'dark' ? darkColors : lightColors) as Colors;
}
