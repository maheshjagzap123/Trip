/**
 * TripWise color palette.
 * Primary: A warm teal for trust and travel.
 * All colors have light and dark variants.
 */

export const palette = {
  // Primary brand
  teal50: '#E6FAF5',
  teal100: '#B3F0E0',
  teal200: '#80E6CC',
  teal300: '#4DDCB7',
  teal400: '#26D4A8',
  teal500: '#00C896', // Primary
  teal600: '#00A87E',
  teal700: '#008866',
  teal800: '#00684E',
  teal900: '#004836',

  // Neutral
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',

  // Semantic
  red500: '#EF4444',
  red600: '#DC2626',
  orange500: '#F97316',
  yellow500: '#EAB308',
  green500: '#22C55E',
  blue500: '#3B82F6',

  // Base
  white: '#FFFFFF',
  black: '#000000',
} as const;

export const lightColors = {
  // Backgrounds
  background: palette.white,
  surface: palette.gray50,
  surfaceElevated: palette.white,

  // Text
  textPrimary: palette.gray900,
  textSecondary: palette.gray600,
  textTertiary: palette.gray400,
  textInverse: palette.white,

  // Brand
  primary: palette.teal500,
  primaryDark: palette.teal700,
  primaryLight: palette.teal100,

  // Borders
  border: palette.gray200,
  borderFocused: palette.teal500,

  // Status
  error: palette.red500,
  errorBackground: '#FEF2F2',
  success: palette.green500,
  successBackground: '#F0FDF4',
  warning: palette.orange500,
  warningBackground: '#FFFBEB',
  info: palette.blue500,
  infoBackground: '#EFF6FF',

  // Components
  inputBackground: palette.gray50,
  cardBackground: palette.white,
  skeletonBase: palette.gray200,
  skeletonHighlight: palette.gray100,
  overlay: 'rgba(0, 0, 0, 0.5)',
  tabBarBackground: palette.white,
  tabBarBorder: palette.gray200,
} as const;

export const darkColors = {
  // Backgrounds
  background: palette.gray900,
  surface: palette.gray800,
  surfaceElevated: palette.gray700,

  // Text
  textPrimary: palette.gray50,
  textSecondary: palette.gray400,
  textTertiary: palette.gray500,
  textInverse: palette.gray900,

  // Brand
  primary: palette.teal400,
  primaryDark: palette.teal300,
  primaryLight: palette.teal900,

  // Borders
  border: palette.gray700,
  borderFocused: palette.teal400,

  // Status
  error: '#F87171',
  errorBackground: '#1C1917',
  success: '#4ADE80',
  successBackground: '#052E16',
  warning: '#FB923C',
  warningBackground: '#1C1917',
  info: '#60A5FA',
  infoBackground: '#172554',

  // Components
  inputBackground: palette.gray800,
  cardBackground: palette.gray800,
  skeletonBase: palette.gray700,
  skeletonHighlight: palette.gray600,
  overlay: 'rgba(0, 0, 0, 0.7)',
  tabBarBackground: palette.gray900,
  tabBarBorder: palette.gray700,
} as const;

export type Colors = {
  [K in keyof typeof lightColors]: string;
};
