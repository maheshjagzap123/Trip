import { Platform, PixelRatio, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Scale font based on screen width — base is 390px (iPhone 14)
// Clamped between 0.88x (very small phones) and 1.12x (tablets)
const scale = (size: number) => {
  const ratio = SCREEN_WIDTH / 390;
  const clamped = Math.max(0.88, Math.min(ratio, 1.12));
  const scaled = size * clamped;
  return Math.round(PixelRatio.roundToNearestPixel(scaled));
};

const fontFamily = Platform.select({
  ios:     'System',
  android: 'Roboto',
  web:     '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Segoe UI", Roboto, sans-serif',
  default: 'System',
});

/**
 * Premium typography scale — 8pt baseline grid.
 * All line heights use generous spacing for readability.
 * Font sizes use responsive scaling with min/max clamping.
 */
export const typography = {
  // Hero / Display — for splash/marketing screens only
  hero: {
    fontFamily,
    fontSize: scale(40),
    lineHeight: scale(48),
    fontWeight: '800' as const,
    letterSpacing: -1.5,
  },
  displayLarge: {
    fontFamily,
    fontSize: scale(32),
    lineHeight: scale(40),
    fontWeight: '700' as const,
    letterSpacing: -1.0,
  },
  displayMedium: {
    fontFamily,
    fontSize: scale(24),
    lineHeight: scale(32),
    fontWeight: '600' as const,
    letterSpacing: -0.5,
  },

  // Headings — Screen titles and section headers
  h1: {
    fontFamily,
    fontSize: scale(22),
    lineHeight: scale(30),
    fontWeight: '700' as const,
    letterSpacing: -0.4,
  },
  h2: {
    fontFamily,
    fontSize: scale(20),
    lineHeight: scale(28),
    fontWeight: '600' as const,
    letterSpacing: -0.3,
  },
  h3: {
    fontFamily,
    fontSize: scale(17),
    lineHeight: scale(24),
    fontWeight: '600' as const,
    letterSpacing: -0.2,
  },

  // Body — Main content with generous line height
  bodyLarge: {
    fontFamily,
    fontSize: scale(16),
    lineHeight: scale(26),
    fontWeight: '400' as const,
    letterSpacing: 0.1,
  },
  bodyMedium: {
    fontFamily,
    fontSize: scale(15),
    lineHeight: scale(24),
    fontWeight: '400' as const,
    letterSpacing: 0.1,
  },
  bodySmall: {
    fontFamily,
    fontSize: scale(13),
    lineHeight: scale(20),
    fontWeight: '400' as const,
    letterSpacing: 0.1,
  },

  // Labels — Interactive elements, navigation, form labels
  labelLarge: {
    fontFamily,
    fontSize: scale(15),
    lineHeight: scale(22),
    fontWeight: '600' as const,
    letterSpacing: 0.1,
  },
  labelMedium: {
    fontFamily,
    fontSize: scale(13),
    lineHeight: scale(20),
    fontWeight: '600' as const,
    letterSpacing: 0.1,
  },
  labelSmall: {
    fontFamily,
    fontSize: scale(12),
    lineHeight: scale(18),
    fontWeight: '600' as const,
    letterSpacing: 0.2,
  },

  // Caption / Overline — Supplementary info, timestamps
  caption: {
    fontFamily,
    fontSize: scale(12),
    lineHeight: scale(18),
    fontWeight: '400' as const,
    letterSpacing: 0.2,
  },
  overline: {
    fontFamily,
    fontSize: scale(11),
    lineHeight: scale(16),
    fontWeight: '700' as const,
    letterSpacing: 1.4,
    textTransform: 'uppercase' as const,
  },

  // Button text — optimized for touch targets
  buttonLarge: {
    fontFamily,
    fontSize: scale(16),
    lineHeight: scale(22),
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
  buttonMedium: {
    fontFamily,
    fontSize: scale(15),
    lineHeight: scale(20),
    fontWeight: '700' as const,
    letterSpacing: 0.2,
  },
  buttonSmall: {
    fontFamily,
    fontSize: scale(13),
    lineHeight: scale(18),
    fontWeight: '700' as const,
    letterSpacing: 0.2,
  },

  // Number — For stats, prices, amounts (tabular feel)
  numberLarge: {
    fontFamily,
    fontSize: scale(32),
    lineHeight: scale(38),
    fontWeight: '800' as const,
    letterSpacing: -0.8,
  },
  numberMedium: {
    fontFamily,
    fontSize: scale(22),
    lineHeight: scale(28),
    fontWeight: '700' as const,
    letterSpacing: -0.4,
  },
  numberSmall: {
    fontFamily,
    fontSize: scale(16),
    lineHeight: scale(22),
    fontWeight: '600' as const,
    letterSpacing: -0.2,
  },
} as const;
