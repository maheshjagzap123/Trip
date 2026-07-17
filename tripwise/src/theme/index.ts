export { palette, lightColors, darkColors } from './colors';
export type { Colors } from './colors';
export { typography } from './typography';
export { spacing, borderRadius } from './spacing';

import { lightColors, darkColors } from './colors';
import type { Colors } from './colors';
import { useThemeStore } from '../stores/themeStore';

/**
 * Hook to get the current theme colors based on user preference.
 * Reads from the theme store (persisted to AsyncStorage + Supabase).
 */
export function useThemeColors(): Colors {
  const resolvedScheme = useThemeStore((s) => s.resolvedScheme);
  return (resolvedScheme === 'dark' ? darkColors : lightColors) as Colors;
}
