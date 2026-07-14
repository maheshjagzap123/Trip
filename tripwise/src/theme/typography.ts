import { Platform } from 'react-native';

/**
 * Typography scale for TripWise.
 * Uses system fonts for performance. Custom fonts can be added later via expo-font.
 */

const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  default: 'System',
});

export const typography = {
  // Display
  displayLarge: {
    fontFamily,
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700' as const,
  },
  displayMedium: {
    fontFamily,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700' as const,
  },

  // Headings
  h1: {
    fontFamily,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700' as const,
  },
  h2: {
    fontFamily,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600' as const,
  },
  h3: {
    fontFamily,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600' as const,
  },

  // Body
  bodyLarge: {
    fontFamily,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
  },
  bodyMedium: {
    fontFamily,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as const,
  },
  bodySmall: {
    fontFamily,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as const,
  },

  // Labels
  labelLarge: {
    fontFamily,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600' as const,
  },
  labelMedium: {
    fontFamily,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500' as const,
  },
  labelSmall: {
    fontFamily,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500' as const,
  },

  // Caption
  caption: {
    fontFamily,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '400' as const,
  },
} as const;
