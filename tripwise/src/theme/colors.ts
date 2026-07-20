import { Platform } from 'react-native';

export const palette = {
  // Primary — Deep Travel Blue
  blue50:  '#EFF6FF',
  blue100: '#DBEAFE',
  blue200: '#BFDBFE',
  blue300: '#93C5FD',
  blue400: '#60A5FA',
  blue500: '#3B82F6',
  blue600: '#2563EB',
  blue700: '#1D4ED8',
  blue800: '#1E40AF',
  blue900: '#1E3A8A',

  // Secondary — Violet
  violet50:  '#F5F3FF',
  violet100: '#EDE9FE',
  violet400: '#A78BFA',
  violet500: '#8B5CF6',
  violet600: '#7C3AED',

  // Accent — Emerald
  emerald50:  '#ECFDF5',
  emerald100: '#D1FAE5',
  emerald400: '#34D399',
  emerald500: '#10B981',
  emerald600: '#059669',

  // Amber
  amber400: '#FBBF24',
  amber500: '#F59E0B',

  // Rose
  rose400: '#FB7185',
  rose500: '#F43F5E',

  // Neutral
  gray50:  '#F8FAFC',
  gray100: '#F1F5F9',
  gray150: '#EEF2F7',
  gray200: '#E2E8F0',
  gray300: '#CBD5E1',
  gray400: '#94A3B8',
  gray500: '#64748B',
  gray600: '#475569',
  gray700: '#334155',
  gray800: '#1E293B',
  gray850: '#172033',
  gray900: '#0F172A',
  gray950: '#080E1A',

  // Base
  white: '#FFFFFF',
  black: '#000000',

  // Brand gradient stops
  brandStart: '#3B82F6',
  brandEnd:   '#8B5CF6',
} as const;

export const lightColors = {
  // Backgrounds
  background:       palette.gray50,
  backgroundAlt:    palette.white,
  surface:          palette.white,
  surfaceElevated:  palette.white,
  surfaceOverlay:   'rgba(255,255,255,0.85)',

  // Text
  textPrimary:   palette.gray900,
  textSecondary: palette.gray600,
  textTertiary:  palette.gray400,
  textInverse:   palette.white,
  textOnBrand:   palette.white,

  // Brand
  primary:      palette.blue600,
  primaryDark:  palette.blue800,
  primaryLight: palette.blue50,
  secondary:    palette.violet500,
  accent:       palette.emerald500,

  // Gradients (stored as string tuples for LinearGradient)
  gradientPrimary:   '#3B82F6',
  gradientSecondary: '#8B5CF6',

  // Borders
  border:        palette.gray200,
  borderLight:   palette.gray100,
  borderFocused: palette.blue500,

  // Status
  error:             palette.rose500,
  errorBackground:   '#FFF1F2',
  success:           palette.emerald500,
  successBackground: '#ECFDF5',
  warning:           palette.amber500,
  warningBackground: '#FFFBEB',
  info:              palette.blue500,
  infoBackground:    palette.blue50,

  // Components
  inputBackground:    palette.gray50,
  cardBackground:     palette.white,
  cardBackgroundAlt:  palette.gray50,
  skeletonBase:       palette.gray200,
  skeletonHighlight:  palette.gray100,
  overlay:            'rgba(15,23,42,0.55)',
  tabBarBackground:   palette.white,
  tabBarBorder:       palette.gray100,
  shimmer:            'rgba(255,255,255,0.6)',
} as const;

export const darkColors = {
  // Backgrounds
  background:       palette.gray950,
  backgroundAlt:    palette.gray900,
  surface:          palette.gray900,
  surfaceElevated:  palette.gray850,
  surfaceOverlay:   'rgba(15,23,42,0.9)',

  // Text
  textPrimary:   '#F1F5F9',
  textSecondary: '#94A3B8',
  textTertiary:  '#64748B',
  textInverse:   palette.gray900,
  textOnBrand:   palette.white,

  // Brand
  primary:      palette.blue400,
  primaryDark:  palette.blue300,
  primaryLight: 'rgba(59,130,246,0.15)',
  secondary:    palette.violet400,
  accent:       palette.emerald400,

  // Gradients
  gradientPrimary:   '#60A5FA',
  gradientSecondary: '#A78BFA',

  // Borders
  border:        palette.gray800,
  borderLight:   'rgba(255,255,255,0.06)',
  borderFocused: palette.blue400,

  // Status
  error:             '#FB7185',
  errorBackground:   'rgba(244,63,94,0.12)',
  success:           '#34D399',
  successBackground: 'rgba(16,185,129,0.12)',
  warning:           '#FBBF24',
  warningBackground: 'rgba(245,158,11,0.12)',
  info:              '#60A5FA',
  infoBackground:    'rgba(59,130,246,0.12)',

  // Components
  inputBackground:    palette.gray850,
  cardBackground:     palette.gray900,
  cardBackgroundAlt:  palette.gray850,
  skeletonBase:       palette.gray800,
  skeletonHighlight:  palette.gray700,
  overlay:            'rgba(0,0,0,0.75)',
  tabBarBackground:   palette.gray950,
  tabBarBorder:       'rgba(255,255,255,0.06)',
  shimmer:            'rgba(255,255,255,0.08)',
} as const;

export type Colors = typeof lightColors;
